import React, { useState, useEffect, useContext } from "react";
import { db } from "../../config/firebase";
import { 
  collection, getDocs, addDoc, query, where, 
  doc, updateDoc, increment, serverTimestamp 
} from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import Select from "react-select";
import { Package, Play, Loader2, ClipboardList } from "lucide-react";
import toast from "react-hot-toast";

const ManufacturingOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ productId: "", quantity: 1, deadline: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ✅ Feature: Auto-Deduction logic on Production Start
  const handleStartProduction = async (order) => {
    const toastId = toast.loading("Processing automated stock deduction...");
    try {
      // 1. Get the BOM for this product
      const bomSnap = await getDocs(query(collection(db, "boms"), where("productId", "==", order.productId)));
      
      if (bomSnap.empty) {
        return toast.error("No BOM found for this product!", { id: toastId });
      }
      
      const bom = bomSnap.docs[0].data();
      
      // 2. Automated Inventory Deduction for each ingredient
      for (const ing of bom.ingredients) {
        const totalDeduct = Number(ing.quantity) * Number(order.quantity);
        
        // Stock Update
        await updateDoc(doc(db, "users", user.uid, "stocks", ing.materialId), {
          quantity: increment(-totalDeduct)
        });

        // Movement Log
        await addDoc(collection(db, "users", user.uid, "movements"), {
          itemid: ing.itemid,
          name: ing.name,
          type: "OUT",
          quantity: totalDeduct,
          reason: `Production for: ${order.productName}`,
          timestamp: serverTimestamp(),
          user: user.email
        });
      }

      // 3. Update Order Status
      await updateDoc(doc(db, "manufacturing_orders", order.id), { status: "In-Progress" });
      
      toast.success("Production started & Materials deducted!", { id: toastId });
      fetchOrders();
    } catch (err) {
      toast.error("Automation error: " + err.message, { id: toastId });
    }
  };

  const handleCreateOrder = async () => {
    if (!newOrder.productId || !newOrder.deadline) {
      toast.error("Please fill all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "manufacturing_orders"), {
        ...newOrder,
        productName: products.find(p => p.value === newOrder.productId)?.label,
        status: "Planned",
        createdAt: serverTimestamp(),
      });

      toast.success("Manufacturing Order Created");
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      toast.error("Error creating order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 text-left animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <Package className="text-indigo-600" /> Production Control
        </h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
        >
          + Plan Production
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
            <tr>
              <th className="px-8 py-5">Order ID</th>
              <th className="px-8 py-5">Target Product</th>
              <th className="px-8 py-5 text-center">Qty</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Execute</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-5 font-mono text-[10px] text-slate-400">{order.id.slice(0, 8)}</td>
                <td className="px-8 py-5 font-bold text-slate-800">{order.productName}</td>
                <td className="px-8 py-5 text-center font-black">{order.quantity}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${
                    order.status === "Planned" 
                    ? "bg-amber-50 text-amber-600 border-amber-100" 
                    : "bg-indigo-50 text-indigo-600 border-indigo-100"
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  {order.status === "Planned" && (
                    <button 
                      onClick={() => handleStartProduction(order)}
                      className="p-3 bg-slate-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm group-hover:scale-105"
                    >
                      <Play size={16} fill="currentColor"/>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-slate-100 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-800 uppercase mb-6 italic">Plan Production Job</h3>
            <div className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Choose Product</label>
                <Select 
                  options={products} 
                  onChange={(opt) => setNewOrder({...newOrder, productId: opt.value})}
                  placeholder="Select Finished Good..."
                  className="text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Production Quantity</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  onChange={(e) => setNewOrder({...newOrder, quantity: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Deadline Date</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold outline-none text-slate-400"
                  onChange={(e) => setNewOrder({...newOrder, deadline: e.target.value})}
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setShowModal(false)} className="flex-1 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                <button 
                  onClick={handleCreateOrder} 
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : "Confirm Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturingOrders;