import React, { useState, useEffect, useContext } from "react";
import { db } from "../../config/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import DashboardCards from "../../components/DashboardCards";
import { AlertCircle, ArrowUpRight, CheckCircle2, Factory, PackageSearch, Zap } from "lucide-react";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    activeOrders: 0,
    pendingQC: 0,
    lowStock: []
  });

  useEffect(() => {
    if (!user?.uid) return;

    // 1. Fetch Active Manufacturing Orders (In-Progress)
    const qOrders = query(collection(db, "manufacturing_orders"), where("status", "==", "In-Progress"));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setStats(prev => ({ ...prev, activeOrders: snap.docs.length }));
    });

    // 2. Fetch Pending Quality Inspections
    const unsubQC = onSnapshot(collection(db, "quality_inspections"), (snap) => {
      setStats(prev => ({ ...prev, pendingQC: snap.docs.length }));
    });

    // 3. Fetch Real-time Low Stock Alerts (Stock < 10)
    const qStock = query(collection(db, "users", user.uid, "stocks"), where("quantity", "<", 10));
    const unsubStock = onSnapshot(qStock, (snap) => {
      const lowItems = snap.docs.map(d => ({ name: d.data().name, quantity: d.data().quantity }));
      setStats(prev => ({ ...prev, lowStock: lowItems }));
    });

    return () => {
      unsubOrders();
      unsubQC();
      unsubStock();
    };
  }, [user]);

  return (
    <div className="bg-[#f8fafc] min-h-screen text-left">
      <Sidebar />
      <div className="ml-64 transition-all duration-300">
        <Topbar title="Managerial Insights" />
        
        <main className="p-8 space-y-8 animate-in fade-in duration-700">
          {/* Header Section */}
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight italic">Operations Control</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                <Zap size={12} className="text-amber-500 fill-amber-500" /> Real-time Shop Floor Monitoring
              </p>
            </div>
            <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
              Download Ops Report
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><Factory size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Production</p>
                <h4 className="text-2xl font-black text-slate-800">{stats.activeOrders} MOs</h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><CheckCircle2 size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting QC</p>
                <h4 className="text-2xl font-black text-slate-800">{stats.pendingQC} Batches</h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-rose-50 p-4 rounded-2xl text-rose-600"><PackageSearch size={24} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Critical Shortage</p>
                <h4 className="text-2xl font-black text-slate-800">{stats.lowStock.length} SKUs</h4>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Efficiency Chart Placeholder */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest italic">Production Velocity</h3>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">+12% vs LW</span>
              </div>
              <div className="h-64 bg-slate-50 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-100">
                <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.3em]">OEE Chart Visualization</p>
              </div>
            </div>

            {/* Dynamic Stock Alerts */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest italic mb-6">Inventory Health</h3>
              <div className="space-y-3">
                {stats.lowStock.length > 0 ? (
                  stats.lowStock.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-rose-50/50 rounded-2xl border border-rose-100 group hover:bg-rose-50 transition-all">
                      <div className="flex items-center gap-3">
                        <AlertCircle size={16} className="text-rose-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">{item.name}</p>
                          <p className="text-[9px] font-black text-rose-400 uppercase">Stock: {item.quantity}</p>
                        </div>
                      </div>
                      <ArrowUpRight size={14} className="text-rose-300 group-hover:text-rose-500 transition-colors" />
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center flex flex-col items-center">
                    <CheckCircle2 size={32} className="text-emerald-200 mb-2" />
                    <p className="text-[10px] font-black text-slate-300 uppercase italic">Stock Levels Optimal</p>
                  </div>
                )}
              </div>
              
              <button className="w-full mt-6 py-4 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-400 transition-all">
                View All Inventory
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}