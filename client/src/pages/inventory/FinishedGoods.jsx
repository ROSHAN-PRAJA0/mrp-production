import React, { useState, useEffect, useContext } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import { CheckCircle, Package, TrendingUp, Search, Calculator } from "lucide-react";

export default function FinishedGoods() {
  const { user } = useContext(AuthContext);
  const [finishedItems, setFinishedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "stocks"), where("category", "==", "Finished Goods"));
    const unsub = onSnapshot(q, (snapshot) => {
      setFinishedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredGoods = finishedItems.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || item.itemid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMarketValue = filteredGoods.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.sellingPrice || 0)), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Ready Units</p><h4 className="text-2xl font-black text-slate-800">{filteredGoods.reduce((a, b) => a + Number(b.quantity), 0)}</h4></div>
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Package size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inventory Value</p><h4 className="text-2xl font-black text-emerald-600">₹ {totalMarketValue.toLocaleString()}</h4></div>
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><TrendingUp size={24}/></div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center bg-slate-50 px-5 py-3 rounded-2xl border">
          <Search size={18} className="text-slate-400" /><input placeholder="Search finished products..." className="bg-transparent outline-none ml-3 w-full text-sm font-bold" onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <th className="px-8 py-5">Product Details</th>
              <th className="px-8 py-5 text-center">Ready Qty</th>
              <th className="px-8 py-5 text-center">Unit Cost (MRP)</th>
              <th className="px-8 py-5 text-center">Total Value</th>
              <th className="px-8 py-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="5" className="p-20 text-center font-bold text-slate-400 italic">Verifying finished stock...</td></tr>
            ) : filteredGoods.length > 0 ? (
              filteredGoods.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Package size={20}/></div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                        <p className="text-[9px] font-black text-indigo-500 uppercase">SKU: {item.itemid?.slice(0,10)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-slate-800">{item.quantity}</td>
                  <td className="px-8 py-5 text-center font-bold text-slate-600">₹ {Number(item.sellingPrice || 0).toLocaleString()}</td>
                  <td className="px-8 py-5 text-center font-black text-indigo-600">₹ {(Number(item.quantity) * Number(item.sellingPrice || 0)).toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase bg-green-50 text-green-600 border border-green-100">Quality Passed</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="p-24 text-center text-slate-400 font-bold uppercase italic tracking-widest">Warehouse Empty</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}