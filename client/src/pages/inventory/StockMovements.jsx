import React, { useState, useEffect, useContext } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { 
  RefreshCcw, ArrowUpCircle, ArrowDownCircle, 
  Search, Filter, Calendar, Package 
} from "lucide-react";

export default function StockMovements() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [movements, setMovements] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, IN, OUT

  useEffect(() => {
    if (authLoading || !user?.uid) return;

    // Movements collection se data fetch ho raha hai
    const q = query(
      collection(db, "users", user.uid, "movements"), 
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMovements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDataLoading(false);
    });

    return () => unsub();
  }, [user, authLoading]);

  // Search aur Type ke basis pe filter
  const filteredMovements = movements.filter(mv => {
    const matchesSearch = mv.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          mv.itemid?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || mv.type === filterType;
    return matchesSearch && matchesType;
  });

  if (authLoading || dataLoading) {
    return (
      <div className="bg-[#f8fafc] min-h-screen flex items-center justify-center">
        <p className="font-black text-slate-400 animate-pulse">LOADING MOVEMENT LEDGER...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Header Section */}
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <RefreshCcw className="text-indigo-600" /> Stock Movement Page
              </h2>
              <p className="text-slate-500 font-medium mt-1">
                Track every single IN and OUT movement for Raw Materials & Finished Goods.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase">Total entries</p>
                <p className="text-xl font-black text-emerald-700">{movements.length}</p>
              </div>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] flex items-center bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                placeholder="Search by SKU or Product Name..." 
                className="bg-transparent border-none outline-none ml-3 w-full text-sm font-bold text-slate-700"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border">
              <button 
                onClick={() => setFilterType("ALL")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterType === 'ALL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterType("IN")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterType === 'IN' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400'}`}
              >
                Stock In
              </button>
              <button 
                onClick={() => setFilterType("OUT")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filterType === 'OUT' ? 'bg-red-500 text-white shadow-md' : 'text-slate-400'}`}
              >
                Stock Out
              </button>
            </div>
          </div>

          {/* Movement Table */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  <th className="px-8 py-5">Date & Time</th>
                  <th className="px-8 py-5">Product Details</th>
                  <th className="px-8 py-5 text-center">Movement</th>
                  <th className="px-8 py-5 text-center">Quantity</th>
                  <th className="px-8 py-5">Reason / Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMovements.length > 0 ? (
                  filteredMovements.map((mv) => (
                    <tr key={mv.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-slate-300" />
                          <span className="text-xs font-bold text-slate-500 font-mono">
                            {mv.timestamp?.toDate().toLocaleString() || 'Syncing...'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-lg text-slate-400"><Package size={16}/></div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{mv.name}</p>
                            <p className="text-[10px] font-black text-indigo-500 uppercase">SKU: {mv.itemid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ${
                          mv.type === 'IN' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {mv.type === 'IN' ? <ArrowUpCircle size={12}/> : <ArrowDownCircle size={12}/>}
                          {mv.type}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <p className="text-sm font-black text-slate-900">{mv.quantity}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-slate-600">{mv.reason || "General Update"}</p>
                        <p className="text-[9px] text-slate-400 uppercase mt-0.5 italic">By: {mv.user?.split('@')[0]}</p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-24 text-center">
                      <div className="flex flex-col items-center opacity-20">
                        <RefreshCcw size={48} className="mb-4" />
                        <p className="font-black uppercase tracking-widest text-sm">No movements found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}