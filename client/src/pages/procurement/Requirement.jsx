import React, { useState, useEffect, useContext, useMemo } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import { ClipboardList, AlertCircle, ShoppingCart, Loader2, PackageCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function Requirement() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [bomData, setBomData] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        // 1. BOMs, Stocks, aur Production Orders fetch karein
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
        toast.error("Data loading failed");
      }
    };
    fetchData();
  }, [user]);

  // MRP Calculation Logic (MRPeasy Style)
  const requirementReport = useMemo(() => {
    const report = {};

    // Production Orders se requirement calculate karein
    orders.filter(o => o.status === "Planned").forEach(order => {
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

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /> Calculating Requirements...</div>;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3">
          <ClipboardList className="text-indigo-600" /> Procurement Planning
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-red-500 uppercase">Critical Shortages</p>
            <h4 className="text-2xl font-black">{requirementReport.filter(r => r.netRequirement > 0).length} Items</h4>
          </div>
          <AlertCircle className="text-red-500" size={32} />
        </div>
        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase">Production Ready</p>
            <h4 className="text-2xl font-black">{requirementReport.filter(r => r.netRequirement === 0).length} Materials</h4>
          </div>
          <PackageCheck className="text-emerald-500" size={32} />
        </div>
      </div>

      {/* Requirement Table */}
      <div className="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400">
            <tr>
              <th className="px-8 py-5">Raw Material</th>
              <th className="px-8 py-5 text-center">On Hand</th>
              <th className="px-8 py-5 text-center">Gross Demand</th>
              <th className="px-8 py-5 text-center">Shortage</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {requirementReport.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5">
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-[10px] text-indigo-500 font-black">SKU: {item.itemid}</p>
                </td>
                <td className="px-8 py-5 text-center font-bold text-slate-600">{item.currentStock}</td>
                <td className="px-8 py-5 text-center font-bold text-slate-900">{item.grossRequired}</td>
                <td className="px-8 py-5 text-center">
                  {item.netRequirement > 0 ? (
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black italic">
                      -{item.netRequirement} SHORT
                    </span>
                  ) : (
                    <span className="text-emerald-500 text-[10px] font-black italic">FULLY STOCKED</span>
                  )}
                </td>
                <td className="px-8 py-5 text-right">
                  {item.netRequirement > 0 && (
                    <button className="bg-slate-900 text-white p-2 rounded-xl hover:bg-indigo-600 transition-all">
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