import React, { useState, useEffect, useContext } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import { 
  CheckCircle, Package, ArrowUpRight, 
  TrendingUp, History, Search 
} from "lucide-react";

export default function FinishedGoods() {
  const { user } = useContext(AuthContext);
  const [finishedItems, setFinishedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;

    // Sirf wahi items fetch honge jinka category "Finished Goods" hai
    // Manufacturing module se jab product ready hoga, toh wo is category mein save hona chahiye
    const q = query(
      collection(db, "users", user.uid, "stocks"), 
      where("category", "==", "Finished Goods")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFinishedItems(items);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const filteredGoods = finishedItems.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMarketValue = filteredGoods.reduce((acc, item) => 
    acc + (Number(item.quantity || 0) * Number(item.sellingPrice || 0)), 0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left">
      
      {/* Stats Section for Finished Goods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Ready Units</p>
            <h4 className="text-2xl font-black text-slate-800">{filteredGoods.length}</h4>
          </div>
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Package size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Value (Est.)</p>
            <h4 className="text-2xl font-black text-emerald-600">₹ {totalMarketValue.toLocaleString()}</h4>
          </div>
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><TrendingUp size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Production Status</p>
            <h4 className="text-2xl font-black text-indigo-600">Ready for Sale</h4>
          </div>
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><CheckCircle size={24}/></div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="flex-1 flex items-center bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
            placeholder="Search finished products..." 
            className="bg-transparent border-none outline-none ml-3 w-full text-sm font-bold text-slate-700" 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Finished Goods Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <th className="px-8 py-5">Product Details</th>
              <th className="px-8 py-5 text-center">Ready Quantity</th>
              <th className="px-8 py-5">Selling Price</th>
              <th className="px-8 py-5 text-right">Inventory Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="4" className="p-20 text-center font-bold text-slate-400 italic text-sm">Verifying finished stock levels...</td></tr>
            ) : filteredGoods.length > 0 ? (
              filteredGoods.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Package size={20}/></div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter mt-0.5">REF: {item.itemid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-slate-800">
                    <span className="bg-slate-100 px-3 py-1 rounded-xl text-[10px]">{item.quantity} {item.unit || "units"}</span>
                  </td>
                  <td className="px-8 py-5 font-bold text-emerald-600 italic text-sm">₹ {Number(item.sellingPrice || 0).toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase bg-green-50 text-green-600 border border-green-100 inline-flex items-center gap-1.5">
                      <CheckCircle size={10} /> Quality Passed
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-24 text-center">
                  <Package className="mx-auto text-slate-200 mb-4" size={48} />
                  <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No finished goods in warehouse</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}