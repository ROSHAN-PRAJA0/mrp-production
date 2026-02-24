import React, { useEffect, useState, useContext, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { AuthContext } from "../routes/AuthProvider";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { 
  Package, Plus, Search, Filter, 
  MoreVertical, Download, Archive, 
  AlertTriangle, Activity,IndianRupee
} from "lucide-react"; 
import { useNavigate } from "react-router-dom";

// Summary Card Component
const StatCard = ({ icon, title, value, color }) => (
  <div className={`flex items-center p-5 bg-white rounded-3xl shadow-sm border-l-4 ${color} border border-slate-100 transition-transform hover:scale-105`}>
    <div className="p-3 rounded-2xl bg-slate-50 mr-4">{icon}</div>
    <div>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{title}</p>
      <p className="text-xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

export default function Inventory() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stockItems, setStockItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Real-time Database Sync
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "stocks"), (snap) => {
      setStockItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Dynamic Search Engine
  const filteredStocks = useMemo(() => stockItems.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemid?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [stockItems, searchTerm]);

  return (
    <div className="bg-[#f8fafc] min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Header Section like Odoo */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory</h2>
              <nav className="flex gap-2 text-xs font-bold text-indigo-600 mt-1 uppercase tracking-wider">
                <span className="cursor-pointer hover:underline">Overview</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-400">Products</span>
              </nav>
            </div>
            <div className="flex gap-3">
              <button className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm">
                Export CSV
              </button>
              <button 
                onClick={() => navigate("/add-stock")}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Plus size={20} /> New Product
              </button>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<Package className="text-blue-500"/>} title="On Hand" value={filteredStocks.length} color="border-blue-500"/>
            <StatCard icon={<AlertTriangle className="text-red-500"/>} title="Low Stock" value={filteredStocks.filter(i => Number(i.quantity) <= 10).length} color="border-red-500"/>
            <StatCard icon={<Activity className="text-indigo-500"/>} title="WIP Units" value="0" color="border-indigo-500"/>
            <StatCard icon={<IndianRupee className="text-emerald-500"/>} title="Inventory Value" value={`₹${filteredStocks.reduce((acc, i) => acc + (Number(i.quantity) * Number(i.actualPrice || 0)), 0).toLocaleString()}`} color="border-emerald-500"/>
          </div>

          {/* Search Engine UI */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 items-center">
             <div className="flex-1 flex items-center bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <Search size={18} className="text-slate-400" />
                <input 
                  placeholder="Search by Product Name or Item ID..." 
                  className="bg-transparent border-none outline-none ml-3 w-full text-sm font-bold text-slate-700" 
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <button className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600">
                <Filter size={20} />
             </button>
          </div>

          {/* Odoo Style Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  <th className="px-8 py-5">Product Details</th>
                  <th className="px-8 py-5">Category</th>
                  <th className="px-8 py-5 text-center">Qty On Hand</th>
                  <th className="px-8 py-5">Cost Price</th>
                  <th className="px-8 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="p-20 text-center font-bold text-slate-400">Loading Warehouse...</td></tr>
                ) : filteredStocks.length > 0 ? (
                  filteredStocks.map((item) => (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-all cursor-pointer group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-100 p-3 rounded-2xl text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all"><Archive size={20}/></div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">REF: {item.itemid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs font-black text-slate-500 uppercase">{item.category || "General"}</td>
                      <td className="px-8 py-5 text-center font-black text-slate-800">
                        {item.quantity} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">{item.unit || "pcs"}</span>
                      </td>
                      <td className="px-8 py-5 font-bold text-slate-800">₹{Number(item.actualPrice || 0).toLocaleString()}</td>
                      <td className="px-8 py-5 text-right">
                         <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase inline-flex items-center gap-1.5 ${
                           Number(item.quantity) <= 10 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                         }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${Number(item.quantity) <= 10 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                           {Number(item.quantity) <= 10 ? 'Low Stock' : 'In Stock'}
                         </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="p-20 text-center font-bold text-slate-400 italic">No matching products found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}