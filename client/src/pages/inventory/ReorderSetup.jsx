import React, { useEffect, useState, useContext } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import { Send, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from "react-select";

export default function ReorderSetup() {
  const { user, loading: authLoading } = useContext(AuthContext); 
  const [lowStockItems, setLowStockItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // FIX: Only fetch if auth is complete and user ID exists
    if (authLoading || !user?.uid) return;

    const unsubStock = onSnapshot(collection(db, "users", user.uid, "stocks"), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => Number(i.quantity) < 100);
      setLowStockItems(items);
      setDataLoading(false);
    });

    const unsubSuppliers = onSnapshot(collection(db, "users", user.uid, "suppliers"), (snap) => {
      setSuppliers(snap.docs.map(doc => ({
        id: doc.id,
        label: `${doc.data().name} (${doc.data().description || "General"})`,
        value: doc.id,
        ...doc.data()
      })));
    });

    return () => { unsubStock(); unsubSuppliers(); };
  }, [user, authLoading]);

  const handleSubmit = async () => {
    if (!selectedSupplier) return toast.error("Select a supplier.");
    const orders = lowStockItems.filter(item => quantities[item.id] > 0);
    if (orders.length === 0) return toast.error("Enter order quantity.");

    setIsSubmitting(true);
    try {
      for (const item of orders) {
        await addDoc(collection(db, "reorders"), {
          adminUID: user.uid,
          supplierName: selectedSupplier.name,
          name: item.name,
          requestedQty: Number(quantities[item.id]),
          status: 'pending',
          createdAt: serverTimestamp()
        });
      }
      toast.success("Orders Placed!");
      setQuantities({});
    } catch (e) { toast.error("Error saving orders"); } 
    finally { setIsSubmitting(false); }
  };

  if (authLoading || dataLoading) return <div className="p-10 text-center font-bold text-slate-400">Loading Reorder Hub...</div>;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      <h2 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3"><AlertCircle className="text-red-500"/> Reorder Hub</h2>
      
      {lowStockItems.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed flex flex-col items-center">
          <CheckCircle size={48} className="text-emerald-500 mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest">Warehouse healthy (All > 100)</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400">
                <tr><th className="px-6 py-4">Item</th><th className="px-6 py-4 text-center">Available</th><th className="px-6 py-4 text-right">Order Qty</th></tr>
              </thead>
              <tbody className="divide-y">
                {lowStockItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-5 font-bold">{item.name}</td>
                    <td className="px-6 py-5 text-center font-black text-red-500">{item.quantity}</td>
                    <td className="px-6 py-5 text-right">
                      <input type="number" onChange={(e)=>setQuantities({...quantities, [item.id]: e.target.value})} className="w-20 p-2 border rounded-xl text-center font-black outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border space-y-4">
            <h3 className="font-bold text-slate-800 uppercase text-xs">Choose Supplier</h3>
            <Select options={suppliers} onChange={setSelectedSupplier} className="text-sm font-bold" />
            <button onClick={handleSubmit} disabled={isSubmitting || !selectedSupplier} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
              {isSubmitting ? <Loader className="animate-spin" /> : <Send size={18}/>} SUBMIT REORDER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}