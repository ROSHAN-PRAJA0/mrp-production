import React, { useState, useEffect, useContext } from "react";
import { db } from "../../config/firebase";
import { 
  collection, getDocs, addDoc, query, where, 
  doc, updateDoc, increment, serverTimestamp, getDoc 
} from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import Select from "react-select";
import { Package, Play, Loader2, CheckCircle, Calendar } from "lucide-react";
import toast from "react-hot-toast";

const ManufacturingOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  // Updated state to include startDate and endDate
  const [newOrder, setNewOrder] = useState({ productId: "", quantity: 1, startDate: "", endDate: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dailyProgress, setDailyProgress] = useState({});

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const snap = await getDocs(collection(db, "inventory"));
    setProducts(snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(i => i.type === "Finished Good")
      .map(i => ({ value: i.id, label: i.name }))
    );
  };

  const fetchOrders = async () => {
    const snap = await getDocs(collection(db, "manufacturing_orders"));
    setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // ✅ Updated Feature: Stock Validation before Starting Production
  const handleStartProduction = async (order) => {
    const toastId = toast.loading("Validating material stock...");
    try {
      const bomSnap = await getDocs(query(collection(db, "boms"), where("productId", "==", order.productId)));
      if (bomSnap.empty) return toast.error("No BOM found for this product!", { id: toastId });
      
      const bom = bomSnap.docs[0].data();

      // 1. Check if sufficient stock exists for ALL ingredients
      for (const ing of bom.ingredients) {
        const totalRequired = Number(ing.quantity) * Number(order.quantity);
        const stockRef = doc(db, "users", user.uid, "stocks", ing.materialId);
        const stockSnap = await getDoc(stockRef);

        if (!stockSnap.exists() || Number(stockSnap.data().quantity || 0) < totalRequired) {
          return toast.error(`Insufficient Stock: ${ing.name} (Need: ${totalRequired})`, { id: toastId });
        }
      }

      // 2. If stock is sufficient, deduct materials
      for (const ing of bom.ingredients) {
        const totalDeduct = Number(ing.quantity) * Number(order.quantity);
        await updateDoc(doc(db, "users", user.uid, "stocks", ing.materialId), {
          quantity: increment(-totalDeduct)
        });
        await addDoc(collection(db, "users", user.uid, "movements"), {
          itemid: ing.itemid, name: ing.name, type: "OUT", quantity: totalDeduct,
          reason: `Production for: ${order.productName}`, timestamp: serverTimestamp(), user: user.email
        });
      }

      await updateDoc(doc(db, "manufacturing_orders", order.id), { status: "In-Progress", completedQty: 0 });
      toast.success("Stock validated & Production started!", { id: toastId });
      fetchOrders();
    } catch (err) { toast.error("Automation error: " + err.message, { id: toastId }); }
  };

  const handleUpdateProgress = async (order) => {
    const doneAmount = Number(dailyProgress[order.id]);
    const currentCompleted = Number(order.completedQty || 0);
    const totalTarget = Number(order.quantity);

    if (!doneAmount || doneAmount <= 0) return toast.error("Please enter valid quantity");
    if (currentCompleted + doneAmount > totalTarget) return toast.error("Quantity exceeds total order target!");

    const toastId = toast.loading("Logging daily progress...");
    try {
      const orderRef = doc(db, "manufacturing_orders", order.id);
      const isFinished = (currentCompleted + doneAmount) === totalTarget;

      await updateDoc(orderRef, {
        completedQty: increment(doneAmount),
        status: isFinished ? "Completed" : "In-Progress"
      });

      await addDoc(collection(db, "quality_inspections"), {
        orderId: order.id,
        productName: order.productName,
        productId: order.productId,
        quantity: doneAmount,
        status: "Pending Inspection",
        adminUID: user.uid,
        timestamp: serverTimestamp()
      });

      toast.success(`${doneAmount} units sent to Quality Control!`, { id: toastId });
      setDailyProgress({ ...dailyProgress, [order.id]: "" });
      fetchOrders();
    } catch (err) { toast.error("Update failed: " + err.message, { id: toastId }); }
  };

  const handleCreateOrder = async () => {
    if (!newOrder.productId || !newOrder.startDate || !newOrder.endDate) return toast.error("Please fill all fields");
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "manufacturing_orders"), {
        ...newOrder,
        productName: products.find(p => p.value === newOrder.productId)?.label,
        status: "Planned",
        completedQty: 0,
        createdAt: serverTimestamp(),
      });
      toast.success("Manufacturing Order Created");
      setShowModal(false);
      fetchOrders();
    } catch (error) { toast.error("Error creating order"); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-8 space-y-8 text-left animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-800 uppercase flex items-center gap-3">
          <Package className="text-indigo-600" /> Production Control
        </h2>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all">+ Plan Production</button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
            <tr>
              <th className="px-8 py-5">Product Details</th>
              <th className="px-8 py-5">Schedule (Start - End)</th>
              <th className="px-8 py-5 text-center">Status</th>
              <th className="px-8 py-5 text-center">Progress</th>
              <th className="px-8 py-5">Daily Log</th>
              <th className="px-8 py-5 text-right">Execute</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-5">
                  <p className="font-bold text-slate-800">{order.productName}</p>
                  <p className="text-[9px] font-mono text-slate-400 uppercase">Order ID: {order.id.slice(0, 8)}</p>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                    <Calendar size={14} className="text-indigo-500"/>
                    <span>{order.startDate}</span>
                    <span className="text-slate-300">→</span>
                    <span>{order.endDate}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${order.status === "Planned" ? "bg-amber-50 text-amber-600 border-amber-100" : order.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"}`}>{order.status}</span>
                </td>
                <td className="px-8 py-5 text-center font-black text-sm">
                  {order.completedQty || 0} / {order.quantity}
                </td>
                <td className="px-8 py-5">
                  {order.status === "In-Progress" && (
                    <div className="flex items-center gap-2">
                      <input type="number" value={dailyProgress[order.id] || ""} onChange={(e) => setDailyProgress({...dailyProgress, [order.id]: e.target.value})} placeholder="Qty" className="w-20 p-2 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button onClick={() => handleUpdateProgress(order)} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-indigo-600 transition-all"><CheckCircle size={14}/></button>
                    </div>
                  )}
                </td>
                <td className="px-8 py-5 text-right">
                  {order.status === "Planned" && (
                    <button onClick={() => handleStartProduction(order)} className="p-3 bg-slate-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm group-hover:scale-105" title="Start Production"><Play size={16} fill="currentColor"/></button>
                  )}
                  {order.status === "Completed" && <CheckCircle size={24} className="text-emerald-500 ml-auto" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-200 text-left">
            <h3 className="text-2xl font-black text-slate-800 uppercase mb-6 italic">Plan Production Job</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Choose Product</label>
                <Select options={products} onChange={(opt) => setNewOrder({...newOrder, productId: opt.value})} placeholder="Select Finished Good..." className="text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Start Date</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold outline-none text-slate-600 text-sm" onChange={(e) => setNewOrder({...newOrder, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">End Date</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold outline-none text-slate-600 text-sm" onChange={(e) => setNewOrder({...newOrder, endDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Total Quantity</label>
                <input type="number" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => setNewOrder({...newOrder, quantity: e.target.value})} placeholder="0" />
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setShowModal(false)} className="flex-1 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                <button onClick={handleCreateOrder} disabled={isSubmitting} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={16}/> : "Confirm Plan"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturingOrders;