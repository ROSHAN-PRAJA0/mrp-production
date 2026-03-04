import React, { useState, useEffect, useContext, useMemo } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import { ClipboardList, AlertCircle, ShoppingCart, Loader2, PackageCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function Requirement() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [bomData, setBomData] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchData = async () => {
    if (!user) return;
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
      toast.error("Sync failed");
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const requirementReport = useMemo(() => {
    const report = {};
    orders.filter(o => o.status === "Planned").forEach(order => {
      const productBOM = bomData.find(b => b.productId === order.productId);
      if (productBOM) {
        productBOM.ingredients.forEach(ing => {
          const key = ing.materialId;
          const grossRequired = Number(ing.quantity) * Number(order.quantity);
          if (!report[key]) {
            const currentStock = stocks.find(s => s.id === key);
            report[key] = { name: ing.name, itemid: ing.itemid, currentStock: Number(currentStock?.quantity || 0), grossRequired: 0, id: key };
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

  // Integration: Auto-convert shortage to Purchase Order Draft
  const handleConvertToPO = async (item) => {
    const toastId = toast.loading(`Automating PO for ${item.name}...`);
    try {
      await addDoc(collection(db, "reorders"), {
        adminUID: user.uid,
        itemid: item.itemid,
        name: item.name,
        requestedQty: item.netRequirement,
        status: 'pending',
        supplierName: "Pending Assignment",
        createdAt: serverTimestamp()
      });
      toast.success("Shortage moved to Reorder Hub!", { id: toastId });
    } catch (err) {
      toast.error("Automation error", { id: toastId });
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-slate-400 italic">Analyzing Supply Chain...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 uppercase flex items-center gap-3">
          <ClipboardList className="text-indigo-600" /> MRP Requirement Matrix
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Active Shortages</p>
            <h4 className="text-3xl font-black text-red-700">{requirementReport.filter(r => r.netRequirement > 0).length} Items</h4>
          </div>
          <AlertCircle className="text-red-600" size={36} />
        </div>
        <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Stock Ready</p>
            <h4 className="text-3xl font-black text-emerald-700">{requirementReport.filter(r => r.netRequirement === 0).length} Items</h4>
          </div>
          <PackageCheck className="text-emerald-600" size={36} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
            <tr>
              <th className="px-8 py-5">Component</th>
              <th className="px-8 py-5 text-center">In-House</th>
              <th className="px-8 py-5 text-center">Gross Demand</th>
              <th className="px-8 py-5 text-center">Gap</th>
              <th className="px-8 py-5 text-right">Procure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requirementReport.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-5">
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-[10px] text-indigo-500 font-black italic">SKU: {item.itemid}</p>
                </td>
                <td className="px-8 py-5 text-center font-bold text-slate-500">{item.currentStock}</td>
                <td className="px-8 py-5 text-center font-bold text-slate-900">{item.grossRequired}</td>
                <td className="px-8 py-5 text-center">
                  {item.netRequirement > 0 ? (
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-xl text-[9px] font-black uppercase italic italic">-{item.netRequirement} Unit Shortage</span>
                  ) : (
                    <span className="text-emerald-500 text-[9px] font-black uppercase">Sufficient</span>
                  )}
                </td>
                <td className="px-8 py-5 text-right">
                  {item.netRequirement > 0 && (
                    <button onClick={() => handleConvertToPO(item)} className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-indigo-600 transition-all shadow-md group-hover:scale-105">
                      <ShoppingCart size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}