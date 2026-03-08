import React, { useState, useEffect, useContext, useMemo } from "react";
import { db } from "../../config/firebase";
import { 
  collection, getDocs, addDoc, serverTimestamp, 
  query, where, onSnapshot 
} from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import { 
  ClipboardList, AlertCircle, ShoppingCart, PackageCheck, 
  RefreshCw, ArrowRight, Truck, Send, Loader, X, Mail, History 
} from "lucide-react";
import Select from "react-select";
import toast from "react-hot-toast";

export default function Requirement() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [bomData, setBomData] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [activeReorders, setActiveReorders] = useState([]); // ✅ Track existing POs
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [bomSnap, stockSnap, orderSnap, supplierSnap] = await Promise.all([
        getDocs(collection(db, "boms")),
        getDocs(collection(db, "users", user.uid, "stocks")),
        getDocs(collection(db, "manufacturing_orders")),
        getDocs(collection(db, "users", user.uid, "suppliers"))
      ]);

      setBomData(bomSnap.docs.map(d => d.data()));
      setStocks(stockSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setOrders(orderSnap.docs.map(d => d.data()));
      setSuppliers(supplierSnap.docs.map(doc => ({
        id: doc.id,
        label: `${doc.data().name} (${doc.data().email || "No Email"})`,
        value: doc.id,
        ...doc.data()
      })));

      setLoading(false);
    } catch (err) {
      toast.error("Supply Chain Sync Failed");
      setLoading(false);
    }
  };

  // ✅ Real-time listener for Reorders to move items down instantly
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "reorders"), where("adminUID", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setActiveReorders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    fetchData();
    return () => unsub();
  }, [user]);

  const requirementReport = useMemo(() => {
    const report = {};
    orders.filter(o => ["Planned", "Rework Required"].includes(o.status)).forEach(order => {
      const productBOM = bomData.find(b => b.productId === order.productId);
      if (productBOM) {
        productBOM.ingredients.forEach(ing => {
          const key = ing.materialId;
          const grossRequired = Number(ing.quantity) * Number(order.quantity);
          if (!report[key]) {
            const currentStock = stocks.find(s => s.id === key);
            report[key] = { 
              name: ing.name, 
              itemid: ing.itemid, 
              currentStock: Number(currentStock?.quantity || 0), 
              grossRequired: 0, 
              id: key
            };
          }
          report[key].grossRequired += grossRequired;
        });
      }
    });

    return Object.values(report).map(item => {
      const netRequirement = Math.max(0, item.grossRequired - item.currentStock);
      // ✅ Check if this item is already being procured
      const isAlreadyOrdered = activeReorders.some(r => r.itemid === item.itemid && r.status === "pending");
      
      return {
        ...item,
        netRequirement,
        isOrdered: isAlreadyOrdered,
        status: item.currentStock < item.grossRequired ? "Shortage" : "Available"
      };
    });
  }, [orders, bomData, stocks, activeReorders]);

  const handleFinalProcure = async () => {
    if (!selectedSupplier) return toast.error("Please select a supplier.");
    setIsSubmitting(true);
    const toastId = toast.loading(`Drafting Order for ${selectedItem.name}...`);
    
    try {
      await addDoc(collection(db, "reorders"), {
        adminUID: user.uid,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        itemid: selectedItem.itemid || "N/A",
        name: selectedItem.name,
        requestedQty: Number(selectedItem.netRequirement),
        status: 'pending',
        source: "MRP Auto-Requirement",
        createdAt: serverTimestamp()
      });

      const subject = `Urgent Stock Reorder: ${selectedItem.name}`;
      let body = `Hello ${selectedSupplier.name},\n\nPlease find the purchase order for the following item:\n\n- Item: ${selectedItem.name}\n- SKU: ${selectedItem.itemid}\n- Qty: ${selectedItem.netRequirement}\n\nSmartMRP System`;
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${selectedSupplier.email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      toast.success("PO Generated Successfully!", { id: toastId });
      window.open(gmailUrl, '_blank');
      
      setSelectedItem(null);
      setSelectedSupplier(null);
    } catch (err) {
      toast.error("Process Failed", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center justify-center gap-4 italic">
      <RefreshCw className="animate-spin text-indigo-600" size={40} />
      <p className="font-black text-slate-400 uppercase tracking-widest">Syncing Demand...</p>
    </div>
  );

  return (
    <div className="space-y-12 text-left">
      {/* 1. MAIN REQUIREMENT TABLE (Only shows items NOT yet ordered) */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-black text-slate-800 uppercase italic flex items-center gap-2">
            <AlertCircle className="text-red-500" /> Pending Shortages
          </h3>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-5">Material</th>
                <th className="text-center">Required</th>
                <th className="text-center">Gap</th>
                <th className="text-right px-8">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requirementReport.filter(i => i.netRequirement > 0 && !i.isOrdered).map((item, idx) => (
                <tr key={idx} className="hover:bg-red-50/30 transition-all">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">SKU: {item.itemid}</p>
                  </td>
                  <td className="text-center font-bold text-slate-600">{item.grossRequired}</td>
                  <td className="text-center"><span className="text-red-600 font-black italic">-{item.netRequirement}</span></td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => setSelectedItem(item)} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600">Procure</button>
                  </td>
                </tr>
              ))}
              {requirementReport.filter(i => i.netRequirement > 0 && !i.isOrdered).length === 0 && (
                <tr><td colSpan="4" className="py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">No New Shortages Detected</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. TRACKED ORDERS (Items that are already in "pending" status) */}
      <div className="space-y-4 opacity-80">
        <h3 className="text-xl font-black text-slate-800 uppercase italic flex items-center gap-2">
          <History className="text-indigo-600" /> Tracked / Ordered Materials
        </h3>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm border-dashed">
          <table className="w-full text-left">
            <thead className="bg-indigo-50/50 border-b text-[10px] uppercase font-black text-indigo-400 tracking-widest">
              <tr>
                <th className="px-8 py-5">Material Name</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ordered Qty</th>
                <th className="text-right px-8">Expected In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeReorders.filter(r => r.status === "pending").map((order, idx) => (
                <tr key={idx} className="bg-slate-50/50 italic">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-500">{order.name}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase italic">From: {order.supplierName}</p>
                  </td>
                  <td className="text-center">
                    <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">On Order</span>
                  </td>
                  <td className="text-center font-bold text-slate-400">{order.requestedQty}</td>
                  <td className="text-right px-8 text-[10px] font-black text-slate-400 uppercase">Awaiting Delivery</td>
                </tr>
              ))}
              {activeReorders.filter(r => r.status === "pending").length === 0 && (
                <tr><td colSpan="4" className="py-10 text-center text-slate-300 font-bold uppercase text-[10px]">No Active Orders in Pipeline</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Procurement Modal (Same as before) */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase italic flex items-center gap-2"><Truck className="text-indigo-600"/> Order Execution</h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-rose-500"><X size={24}/></button>
            </div>
            <div className="space-y-6">
              <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Procuring Material</p>
                <h4 className="text-xl font-black text-slate-800 mt-1">{selectedItem.name}</h4>
                <p className="text-xs font-bold text-slate-500 mt-2 italic">Deficit to fill: <span className="text-red-500">{selectedItem.netRequirement} Units</span></p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Select Supplier</label>
                <Select options={suppliers} onChange={setSelectedSupplier} value={selectedSupplier} placeholder="Choose Vendor..." className="text-sm font-bold" />
              </div>
              <button onClick={handleFinalProcure} disabled={isSubmitting || !selectedSupplier} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                {isSubmitting ? <Loader className="animate-spin" /> : <Send size={18}/>} GENERATE PO & MOVE TO TRACKING
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}