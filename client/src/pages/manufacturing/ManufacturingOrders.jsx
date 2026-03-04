import React, { useState, useEffect, useContext } from "react";
import { db } from "../../config/firebase";
import { 
  collection, getDocs, addDoc, query, where, 
  doc, updateDoc, increment, serverTimestamp, getDoc 
} from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import Select from "react-select";
import { Package, Play, Loader2, CheckCircle, Calendar, AlertOctagon, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const ManufacturingOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ productId: "", quantity: 1, startDate: "", endDate: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dailyProgress, setDailyProgress] = useState({});
  const [scrapQty, setScrapQty] = useState({}); // New: Scrap units tracking

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

  const handleStartProduction = async (order) => {
    const toastId = toast.loading("Validating material stock...");
    try {
      const bomSnap = await getDocs(query(collection(db, "boms"), where("productId", "==", order.productId)));
      if (bomSnap.empty) return toast.error("No BOM found for this product!", { id: toastId });
      
      const bom = bomSnap.docs[0].data();

      for (const ing of bom.ingredients) {
        const totalRequired = Number(ing.quantity) * Number(order.quantity);
        const stockRef = doc(db, "users", user.uid, "stocks", ing.materialId);
        const stockSnap = await getDoc(stockRef);

        if (!stockSnap.exists() || Number(stockSnap.data().quantity || 0) < totalRequired) {
          return toast.error(`Insufficient Stock: ${ing.name}`, { id: toastId });
        }
      }

      for (const ing of bom.ingredients) {
        const totalDeduct = Number(ing.quantity) * Number(order.quantity);
        await updateDoc(doc(db, "users", user.uid, "stocks", ing.materialId), {
          quantity: increment(-totalDeduct)
        });
        await addDoc(collection(db, "users", user.uid, "movements"), {
          itemid: ing.itemid, name: ing.name, type: "OUT", quantity: totalDeduct,
          reason: `Production Start: ${order.productName}`, timestamp: serverTimestamp(), user: user.email
        });
      }

      await updateDoc(doc(db, "manufacturing_orders", order.id), { status: "In-Progress", completedQty: 0, scrapQty: 0 });
      toast.success("Production started!", { id: toastId });
      fetchOrders();
    } catch (err) { toast.error("Start failed: " + err.message, { id: toastId }); }
  };

  const handleUpdateProgress = async (order) => {
    const doneAmount = Number(dailyProgress[order.id] || 0);
    const rejectedAmount = Number(scrapQty[order.id] || 0);
    const currentCompleted = Number(order.completedQty || 0);
    const currentScrap = Number(order.scrapQty || 0);
    const totalTarget = Number(order.quantity);

    if (doneAmount <= 0 && rejectedAmount <= 0) return toast.error("Enter valid quantity");
    if (currentCompleted + currentScrap + doneAmount + rejectedAmount > totalTarget) {
      return toast.error("Total units exceed order target!");
    }

    const toastId = toast.loading("Logging progress...");
    try {
      const orderRef = doc(db, "manufacturing_orders", order.id);
      const isFinished = (currentCompleted + currentScrap + doneAmount + rejectedAmount) === totalTarget;

      await updateDoc(orderRef, {
        completedQty: increment(doneAmount),
        scrapQty: increment(rejectedAmount),
        status: isFinished ? "Completed" : "In-Progress",
        updatedAt: serverTimestamp()
      });

      // Log to Quality Control only the successful units
      if (doneAmount > 0) {
        await addDoc(collection(db, "quality_inspections"), {
          orderId: order.id,
          productName: order.productName,
          productId: order.productId,
          quantity: doneAmount,
          status: "Pending Inspection",
          adminUID: user.uid,
          timestamp: serverTimestamp()
        });
      }

      // Log Scrap movement
      if (rejectedAmount > 0) {
        await addDoc(collection(db, "users", user.uid, "movements"), {
          itemid: order.productId,
          name: `${order.productName} (Scrap)`,
          type: "OUT",
          quantity: rejectedAmount,
          reason: `Production Rejection: ${order.id}`,
          timestamp: serverTimestamp(),
          user: user.email
        });
      }

      toast.success("Progress logged successfully!", { id: toastId });
      setDailyProgress({ ...dailyProgress, [order.id]: "" });
      setScrapQty({ ...scrapQty, [order.id]: "" });
      fetchOrders();
    } catch (err) { toast.error("Update failed", { id: toastId }); }
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
              <th className="px-8 py-5">Schedule</th>
              <th className="px-8 py-5 text-center">Status</th>
              <th className="px-8 py-5 text-center">Good / Scrap / Total</th>
              <th className="px-8 py-5">Production Log</th>
              <th className="px-8 py-5 text-right">Execute</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-5">
                  <p className="font-bold text-slate-800">{order.productName}</p>
                  <p className="text-[9px] font-mono text-slate-400 uppercase">MO: {order.id.slice(0, 8)}</p>
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
                  <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${
                    order.status === "Planned" ? "bg-amber-50 text-amber-600 border-amber-100" : 
                    order.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                    "bg-indigo-50 text-indigo-600 border-indigo-100"
                  }`}>{order.status}</span>
                </td>
                <td className="px-8 py-5 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-slate-800">{order.completedQty || 0} / {order.scrapQty || 0}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Target: {order.quantity}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  {order.status === "In-Progress" && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          value={dailyProgress[order.id] || ""} 
                          onChange={(e) => setDailyProgress({...dailyProgress, [order.id]: e.target.value})} 
                          placeholder="Good" 
                          className="w-16 p-2 bg-slate-50 border rounded-xl text-xs font-bold outline-none border-green-100" 
                        />
                        <input 
                          type="number" 
                          value={scrapQty[order.id] || ""} 
                          onChange={(e) => setScrapQty({...scrapQty, [order.id]: e.target.value})} 
                          placeholder="Scrap" 
                          className="w-16 p-2 bg-slate-50 border rounded-xl text-xs font-bold outline-none border-red-100" 
                        />
                        <button onClick={() => handleUpdateProgress(order)} className="bg-slate-900 text-white p-2 rounded-xl hover:bg-indigo-600 transition-all"><CheckCircle size={14}/></button>
                      </div>
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
      {/* Modal remains same as your original code for order creation */}
    </div>
  );
};

export default ManufacturingOrders;