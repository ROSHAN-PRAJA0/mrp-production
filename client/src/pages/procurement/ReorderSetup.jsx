import React, { useEffect, useState, useContext } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import { Send, AlertCircle, CheckCircle, Loader, Info } from 'lucide-react';
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
    if (authLoading || !user?.uid) return;

    const unsubStock = onSnapshot(collection(db, "users", user.uid, "stocks"), (snap) => {
      // Threshold set to 100 as per your previous logic
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => Number(i.quantity) < 100);
      setLowStockItems(items);
      setDataLoading(false);
    });

    const unsubSuppliers = onSnapshot(collection(db, "users", user.uid, "suppliers"), (snap) => {
      setSuppliers(snap.docs.map(doc => ({
        id: doc.id,
        label: `${doc.data().name} (${doc.data().email || "No Email"})`,
        value: doc.id,
        ...doc.data()
      })));
    });

    return () => { unsubStock(); unsubSuppliers(); };
  }, [user, authLoading]);

  const handleQtyChange = (id, qty) => {
    setQuantities({ ...quantities, [id]: qty });
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) return toast.error("Please select a supplier first.");

    // FILTER: Only items where a quantity was actually entered
    const ordersToPlace = lowStockItems.filter(
      (item) => quantities[item.id] && Number(quantities[item.id]) > 0
    );

    if (ordersToPlace.length === 0) return toast.error("Please enter a reorder quantity for at least one item.");

    setIsSubmitting(true);
    const toastId = toast.loading('Saving purchase orders...');

    try {
        // Step 1: Save each order to Firestore
        for (const item of ordersToPlace) {
            await addDoc(collection(db, "reorders"), {
                adminUID: user.uid,
                supplierId: selectedSupplier.id,
                supplierName: selectedSupplier.name,
                itemid: item.itemid || "N/A",
                name: item.name,
                requestedQty: Number(quantities[item.id]),
                status: 'pending',
                createdAt: serverTimestamp()
            });
        }
        
        // Step 2: Format Email Body (Same logic as your upload folder)
        const subject = "Urgent Stock Reorder Request";
        let body = `Hello ${selectedSupplier.name},\n\nPlease find the purchase order for the following items:\n\n`;
        
        ordersToPlace.forEach(item => {
          body += `- Item: ${item.name}\n`;
          body += `  Item ID/SKU: ${item.itemid || "N/A"}\n`;
          body += `  Quantity Requested: ${quantities[item.id]}\n\n`;
        });
        
        body += "Please confirm the receipt of this order and provide an estimated delivery date.\n\nThank you,\nInventory Management System";

        // Step 3: Trigger Email Client (Outlook)
        const mailtoLink = `mailto:${selectedSupplier.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        toast.success('Orders saved! Opening email client...', { id: toastId });
        
        setTimeout(() => {
            window.location.href = mailtoLink;
            setQuantities({});
            setSelectedSupplier(null);
        }, 1500);

    } catch (error) {
        console.error(error);
        toast.error("Failed to create reorder request.", { id: toastId });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (authLoading || dataLoading) return <div className="p-10 text-center font-bold text-slate-400 italic">Connecting to Reorder Hub...</div>;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      <h2 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3"><AlertCircle className="text-indigo-500"/> Reorder Hub</h2>
      
      {lowStockItems.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed flex flex-col items-center">
          <CheckCircle size={48} className="text-emerald-500 mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest">Warehouse healthy (All > 100)</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr><th className="px-6 py-4">Item Name</th><th className="px-6 py-4 text-center">Available</th><th className="px-6 py-4 text-right">Order Qty</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lowStockItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] font-black text-indigo-500 uppercase">SKU: {item.itemid}</p>
                    </td>
                    <td className="px-6 py-5 text-center font-black text-red-500">{item.quantity}</td>
                    <td className="px-6 py-5 text-right">
                      <input 
                        type="number" 
                        value={quantities[item.id] || ""}
                        onChange={(e) => handleQtyChange(item.id, e.target.value)} 
                        className="w-24 p-2 bg-slate-50 border rounded-xl text-center font-black outline-none focus:ring-2 focus:ring-indigo-500" 
                        placeholder="0" 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border space-y-4">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                    <Info size={14} className="text-indigo-500"/> Procurement Setup
                </h3>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Choose Supplier</label>
                    <Select 
                        options={suppliers} 
                        onChange={setSelectedSupplier} 
                        value={selectedSupplier}
                        placeholder="Select Vendor..."
                        className="text-sm font-bold" 
                    />
                </div>
                
                {selectedSupplier && (
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                        <p className="text-[10px] font-black text-indigo-400 uppercase">Contacting</p>
                        <p className="text-xs font-bold text-indigo-700 truncate">{selectedSupplier.email}</p>
                    </div>
                )}

                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !selectedSupplier} 
                    className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-50 disabled:hover:bg-slate-900"
                >
                    {isSubmitting ? <Loader className="animate-spin" /> : <Send size={18}/>} 
                    SAVE & SEND EMAIL
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}