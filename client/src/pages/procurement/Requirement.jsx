import React, { useState, useEffect, useContext, useMemo } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import { ClipboardList, AlertCircle, ShoppingCart, PackageCheck, RefreshCw, ArrowRight, Truck } from "lucide-react";
import toast from "react-hot-toast";

export default function Requirement() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [bomData, setBomData] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [bomSnap, stockSnap, orderSnap] = await Promise.all([
        getDocs(collection(db, "boms")),
        getDocs(collection(db, "users", user.uid, "stocks")),
        getDocs(collection(db, "manufacturing_orders"))
      ]);
      setBomData(bomSnap.docs.map(d => d.data()));
      setStocks(stockSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setOrders(orderSnap.docs.map(d => d.data()));
      setLoading(false);
    } catch (err) {
      toast.error("Supply Chain Sync Failed");
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const requirementReport = useMemo(() => {
    const report = {};
    // Filtering Planned and Rework orders for material calculation
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
              id: key,
              preferredSupplier: productBOM.preferredSupplier || "Market Source" // BOM se supplier uthana
            };
          }
          report[key].grossRequired += grossRequired;
        });
      }
    });

    return Object.values(report).map(item => ({
      ...item,
      netRequirement: Math.max(0, item.grossRequired - item.currentStock),
      status: item.currentStock < item.grossRequired ? "Shortage" : "Available"
    }));
  }, [orders, bomData, stocks]);

  const handleConvertToPO = async (item) => {
    const toastId = toast.loading(`Drafting PO for ${item.name}...`);
    try {
      await addDoc(collection(db, "reorders"), {
        adminUID: user.uid,
        itemid: item.id,
        name: item.name,
        requestedQty: item.netRequirement,
        status: 'pending',
        supplierName: item.preferredSupplier,
        source: "MRP Auto-Requirement",
        createdAt: serverTimestamp()
      });
      
      toast.success("Added to Procurement Queue!", { id: toastId });
      fetchData();
    } catch (err) {
      toast.error("Automation error: PO creation failed", { id: toastId });
    }
  };

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
      <RefreshCw className="animate-spin text-indigo-600" size={40} />
      <p className="font-black text-slate-400 uppercase tracking-widest italic">Calculating Material Demand...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase flex items-center gap-3">
            <ClipboardList className="text-indigo-600" /> MRP Matrix
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Material Requirement Planning based on Planned Orders</p>
        </div>
        <button onClick={fetchData} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all border border-slate-100 shadow-sm">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items at Risk</p>
          <div className="flex justify-between items-end">
            <h4 className="text-3xl font-black text-red-600">{requirementReport.filter(r => r.netRequirement > 0).length}</h4>
            <AlertCircle className="text-red-200" size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Demand</p>
          <div className="flex justify-between items-end">
            <h4 className="text-3xl font-black text-indigo-600">
              {requirementReport.reduce((acc, curr) => acc + curr.grossRequired, 0)} <span className="text-sm">Units</span>
            </h4>
            <ShoppingCart className="text-indigo-200" size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ready to Start</p>
          <div className="flex justify-between items-end">
            <h4 className="text-3xl font-black text-emerald-600">{requirementReport.filter(r => r.netRequirement === 0).length}</h4>
            <PackageCheck className="text-emerald-200" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
            <tr>
              <th className="px-8 py-6">Material Component</th>
              <th className="px-8 py-6 text-center">On-Hand</th>
              <th className="px-8 py-6 text-center">Gross Demand</th>
              <th className="px-8 py-6 text-center">Status / Gap</th>
              <th className="px-8 py-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requirementReport.length > 0 ? (
              requirementReport.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-all">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Truck size={10} className="text-slate-400" />
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Vendor: {item.preferredSupplier}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-slate-500">{item.currentStock}</td>
                  <td className="px-8 py-5 text-center font-bold text-slate-900">{item.grossRequired}</td>
                  <td className="px-8 py-5 text-center">
                    {item.netRequirement > 0 ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-xl text-[9px] font-black uppercase italic border border-red-100">
                          Shortage: {item.netRequirement}
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-500 text-[9px] font-black uppercase flex items-center justify-center gap-1">
                        <PackageCheck size={12} /> Adequate
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    {item.netRequirement > 0 && (
                      <button 
                        onClick={() => handleConvertToPO(item)} 
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-600 transition-all shadow-sm flex items-center gap-2 ml-auto group"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">Procure</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-24 text-center">
                  <div className="flex flex-col items-center opacity-20">
                    <ClipboardList size={48} className="mb-2" />
                    <p className="font-black uppercase tracking-[0.2em] text-sm italic">Clear - No Material Shortages</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}