import React, { useState, useEffect, useContext } from "react";
import { db } from "../../config/firebase";
import { 
  collection, getDocs, addDoc, query, where, 
  doc, updateDoc, increment, serverTimestamp, getDoc 
} from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import Select from "react-select";
import { 
  Package, Play, CheckCircle, Calendar, 
  Clock, X, ClipboardList, AlertCircle 
} from "lucide-react";
import toast from "react-hot-toast";

const ManufacturingOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ productId: "", quantity: 1, startDate: "", endDate: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dailyProgress, setDailyProgress] = useState({});
  const [scrapQty, setScrapQty] = useState({});

  useEffect(() => {
    if (user?.uid) {
      fetchOrders();
      fetchProducts();
    }
  }, [user?.uid]);

  const fetchProducts = async () => {
    // ✅ Added adminId filter for multi-tenancy
    const q = query(
      collection(db, "inventory"), 
      where("adminId", "==", user.uid)
    );
    const snap = await getDocs(q);
    setProducts(snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(i => i.type === "Finished Good")
      .map(i => ({ value: i.id, label: i.name }))
    );
  };

  const fetchOrders = async () => {
    if (!user?.uid) return;
    // ✅ Added adminId filter for multi-tenancy
    const q = query(
      collection(db, "manufacturing_orders"), 
      where("adminId", "==", user.uid)
    );
    const snap = await getDocs(q);
    setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.productId || !newOrder.startDate || !newOrder.endDate) {
      return toast.error("Please fill all schedule details (Start & End dates).");
    }
    setIsSubmitting(true);
    try {
      const selectedProd = products.find(p => p.value === newOrder.productId);
      
      // ✅ Included adminId in the new document
      await addDoc(collection(db, "manufacturing_orders"), {
        ...newOrder,
        adminId: user.uid, 
        productName: selectedProd.label,
        status: "Planned",
        completedQty: 0,
        scrapQty: 0,
        createdAt: serverTimestamp()
      });

      toast.success("Work Order Created!");
      setShowModal(false);
      setNewOrder({ productId: "", quantity: 1, startDate: "", endDate: "" });
      fetchOrders();
    } catch (err) {
      toast.error("Order Creation Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartProduction = async (order) => {
    const toastId = toast.loading("Validating BOM & Raw Material Stock...");
    try {
      // ✅ Added adminId filter to BOM search
      const q = query(
        collection(db, "boms"), 
        where("productId", "==", order.productId),
        where("adminId", "==", user.uid)
      );
      const bomSnap = await getDocs(q);
      
      if (bomSnap.empty) return toast.error("No BOM found for this product!", { id: toastId });
      
      const bom = bomSnap.docs[0].data();

      // Check stock for all ingredients
      for (const ing of bom.ingredients) {
        const totalRequired = Number(ing.quantity) * Number(order.quantity);
        const stockRef = doc(db, "users", user.uid, "stocks", ing.materialId);
        const stockSnap = await getDoc(stockRef);

        if (!stockSnap.exists() || Number(stockSnap.data().quantity || 0) < totalRequired) {
          return toast.error(`Insufficient Stock for: ${ing.name}`, { id: toastId });
        }
      }

      // Deduct stock automatically
      for (const ing of bom.ingredients) {
        const totalDeduct = Number(ing.quantity) * Number(order.quantity);
        await updateDoc(doc(db, "users", user.uid, "stocks", ing.materialId), {
          quantity: increment(-totalDeduct)
        });
      }

      await updateDoc(doc(db, "manufacturing_orders", order.id), { status: "In-Progress" });
      toast.success("Production Started & Raw Materials Deducted!", { id: toastId });
      fetchOrders();
    } catch (err) { 
      toast.error("Process Failed: " + err.message, { id: toastId }); 
    }
  };

  const handleUpdateProgress = async (order) => {
    const doneAmount = Number(dailyProgress[order.id] || 0);
    const rejectedAmount = Number(scrapQty[order.id] || 0);
    const totalCurrent = Number(order.completedQty || 0) + Number(order.scrapQty || 0);
    
    if (doneAmount <= 0 && rejectedAmount <= 0) return toast.error("Enter some quantity to log.");
    if (totalCurrent + doneAmount + rejectedAmount > Number(order.quantity)) {
      return toast.error("Total output cannot exceed target quantity!");
    }

    try {
      const orderRef = doc(db, "manufacturing_orders", order.id);
      const isFinished = (totalCurrent + doneAmount + rejectedAmount) === Number(order.quantity);

      await updateDoc(orderRef, {
        completedQty: increment(doneAmount),
        scrapQty: increment(rejectedAmount),
        status: isFinished ? "Completed" : "In-Progress",
        updatedAt: serverTimestamp()
      });

      // Send to Quality Control if Good units are logged
      if (doneAmount > 0) {
        // ✅ Included adminId in quality inspections
        await addDoc(collection(db, "quality_inspections"), {
          adminId: user.uid,
          orderId: order.id,
          productName: order.productName,
          quantity: doneAmount,
          status: "Pending Inspection",
          timestamp: serverTimestamp()
        });
      }

      toast.success("Production Progress Logged!");
      setDailyProgress({ ...dailyProgress, [order.id]: "" });
      setScrapQty({ ...scrapQty, [order.id]: "" });
      fetchOrders();
    } catch (err) { 
      toast.error("Failed to log progress"); 
    }
  };

  return (
    <div className="p-8 space-y-8 text-left animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic flex items-center gap-3">
            <Package className="text-indigo-600" /> Manufacturing <span className="text-indigo-600">Orders</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 ml-1">Control Shop Floor & Track Work Orders</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
        >
          + Create Work Order
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
            <tr>
              <th className="px-8 py-6">Job Info</th>
              <th className="px-8 py-6">Timeline (Start → End)</th>
              <th className="px-8 py-6 text-center">Status</th>
              <th className="px-8 py-6 text-center">Output (Good/Scrap)</th>
              <th className="px-8 py-6">Live Logging</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-6">
                  <p className="font-black text-slate-800 text-sm uppercase">{order.productName}</p>
                  <p className="text-[9px] font-bold text-indigo-500">MO-ID: {order.id.slice(-8)}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1">
                      <Calendar size={12} /> Start: {order.startDate}
                    </span>
                    <span className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-1">
                      <Clock size={12} /> Deadline: {order.endDate}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border ${
                    order.status === "Planned" ? "bg-amber-50 text-amber-600 border-amber-100" : 
                    order.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                    "bg-indigo-50 text-indigo-600 border-indigo-100"
                  }`}>{order.status}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <p className="text-sm font-black text-slate-800">{order.completedQty || 0} G / {order.scrapQty || 0} S</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Target: {order.quantity}</p>
                </td>
                <td className="px-8 py-6">
                  {order.status === "In-Progress" && (
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={dailyProgress[order.id] || ""} 
                        onChange={(e) => setDailyProgress({...dailyProgress, [order.id]: e.target.value})} 
                        placeholder="Good" 
                        className="w-16 p-2 bg-slate-50 border border-emerald-100 rounded-xl text-xs font-bold outline-none" 
                      />
                      <input 
                        type="number" 
                        value={scrapQty[order.id] || ""} 
                        onChange={(e) => setScrapQty({...scrapQty, [order.id]: e.target.value})} 
                        placeholder="Scrap" 
                        className="w-16 p-2 bg-slate-50 border border-rose-100 rounded-xl text-xs font-bold outline-none" 
                      />
                      <button onClick={() => handleUpdateProgress(order)} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-indigo-600 transition-all shadow-md"><CheckCircle size={16}/></button>
                    </div>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  {order.status === "Planned" && (
                    <button 
                      onClick={() => handleStartProduction(order)} 
                      className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Play size={14} fill="currentColor"/> Start Job
                    </button>
                  )}
                  {order.status === "Completed" && <div className="text-emerald-500 font-black uppercase text-[10px] flex items-center justify-end gap-1"><CheckCircle size={16}/> Finished</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE ORDER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-12 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 uppercase italic">Plan Production</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={28}/></button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Finished Product</label>
                <Select 
                  options={products} 
                  onChange={(opt) => setNewOrder({...newOrder, productId: opt.value})} 
                  className="font-bold text-sm"
                  placeholder="Select Item..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Batch Quantity</label>
                <input 
                  type="number" 
                  value={newOrder.quantity} 
                  onChange={(e) => setNewOrder({...newOrder, quantity: e.target.value})}
                  className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Production Start</label>
                  <input type="date" value={newOrder.startDate} onChange={(e) => setNewOrder({...newOrder, startDate: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-xs"/>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Target Deadline</label>
                  <input type="date" value={newOrder.endDate} onChange={(e) => setNewOrder({...newOrder, endDate: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-xs"/>
                </div>
              </div>
              <button disabled={isSubmitting} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-indigo-600 transition-all mt-4">
                {isSubmitting ? "PLANNING..." : "Generate Manufacturing Order"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturingOrders;