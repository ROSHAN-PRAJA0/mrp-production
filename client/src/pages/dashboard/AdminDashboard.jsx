import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { 
  TrendingUp, Package, Activity, AlertTriangle, Factory, 
  Clock, DollarSign, BarChart3, ShoppingCart, CheckCircle2, ClipboardList 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from "recharts";

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [stats, setStats] = useState({
    stockValue: 0,
    netProfit: 0,
    totalSales: 0,
    activeOrders: 0,
    materialShortage: 0,
    todayJobs: 0
  });
  const [todayWork, setTodayWork] = useState([]);
  const [shortageItems, setShortageItems] = useState([]);

  useEffect(() => {
    if (!user.uid) return;

    // 1. Inventory & Shortage Logic
    const unsubStocks = onSnapshot(collection(db, "users", user.uid, "stocks"), (snap) => {
      const items = snap.docs.map(d => d.data());
      let value = 0;
      let short = 0;
      const shorts = [];

      items.forEach(item => {
        value += (Number(item.quantity || 0) * Number(item.actualPrice || 0));
        if (Number(item.quantity) < 50) { // Threshold 50 units
          short++;
          shorts.push(item);
        }
      });
      setShortageItems(shorts.slice(0, 4));
      setStats(prev => ({ ...prev, stockValue: value, materialShortage: short }));
    });

    // 2. Sales & Net Profit Logic
    const unsubMovements = onSnapshot(collection(db, "users", user.uid, "movements"), (snap) => {
      const moves = snap.docs.map(d => d.data());
      let sales = 0;
      let profit = 0;

      moves.forEach(m => {
        if (m.type === "OUT" && m.reason?.includes("Order Fulfilled")) {
          const sPrice = Number(m.sellingPrice || 0);
          const cPrice = Number(m.costPrice || 0);
          const qty = Number(m.quantity || 0);
          sales += (qty * sPrice);
          profit += (qty * (sPrice - cPrice));
        }
      });
      setStats(prev => ({ ...prev, totalSales: sales, netProfit: profit }));
    });

    // 3. Today's Work Schedule
    const todayStr = new Date().toISOString().split('T')[0];
    const qOrders = query(collection(db, "manufacturing_orders"), where("startDate", "<=", todayStr));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const active = orders.filter(o => o.status !== "Completed");
      setTodayWork(active.slice(0, 5));
      setStats(prev => ({ ...prev, activeOrders: active.length, todayJobs: active.length }));
    });

    return () => { unsubStocks(); unsubMovements(); unsubOrders(); };
  }, [user.uid]);

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left font-sans">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        
        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Factory Command Center</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Live Material & Financial Oversight</p>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase">System Integrity</p>
                  <p className="text-xs font-bold text-emerald-500 flex items-center gap-1 justify-end"><CheckCircle2 size={12}/> Secure & Syncing</p>
               </div>
            </div>
          </div>

          {/* Key Metrics - PROFIT & SALES FOCUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Net Profit" value={`₹${stats.netProfit.toLocaleString()}`} icon={<TrendingUp />} trend="Live Earnings" color="emerald" />
            <MetricCard title="Total Sales" value={`₹${stats.totalSales.toLocaleString()}`} icon={<DollarSign />} trend="Gross Revenue" color="blue" />
            <MetricCard title="Material Shortage" value={stats.materialShortage} icon={<AlertTriangle />} trend="Action Required" color="orange" />
            <MetricCard title="Work Orders" value={stats.activeOrders} icon={<Factory />} trend="On Shop Floor" color="indigo" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Today's Schedule Section */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Clock className="text-indigo-600" size={18}/> Today's Production Priority
                  </h3>
                  <div className="space-y-4">
                    {todayWork.length > 0 ? todayWork.map(job => (
                      <div key={job.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="bg-white p-3 rounded-2xl shadow-sm text-indigo-600"><Activity size={20}/></div>
                           <div>
                              <p className="font-black text-slate-800 text-sm uppercase">{job.productName}</p>
                              <p className="text-[9px] font-bold text-slate-400">TARGET: {job.quantity} UNITS | STATUS: {job.status}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">Due: {job.endDate}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="py-10 text-center text-slate-400 italic font-bold">No active jobs for today.</div>
                    )}
                  </div>
               </div>

               {/* Chart Placeholder */}
               <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                    <BarChart3 size={16} /> Weekly Performance Output
                  </h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockChartData}>
                        <Bar dataKey="val" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>

            {/* Side Alerts - SHORTAGE & ASSETS */}
            <div className="space-y-8">
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <AlertTriangle className="text-rose-500" size={18}/> Critical Shortages
                  </h3>
                  <div className="space-y-4">
                    {shortageItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                         <div>
                            <p className="text-xs font-bold text-slate-800">{item.name}</p>
                            <p className="text-[9px] font-black text-rose-500 uppercase">Stock: {item.quantity}</p>
                         </div>
                         <button className="text-[9px] font-black bg-white px-3 py-2 rounded-xl border border-rose-200 text-rose-600 uppercase">Procure</button>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total Warehouse Value</p>
                  <h4 className="text-3xl font-black mt-2 italic">₹{stats.stockValue.toLocaleString()}</h4>
                  <div className="mt-6 pt-6 border-t border-indigo-500 flex items-center gap-3">
                     <Package className="text-indigo-200" size={24}/>
                     <p className="text-[9px] font-bold uppercase leading-tight text-indigo-100">Asset value includes raw materials and finished goods on hand.</p>
                  </div>
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, color }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100"
  };
  return (
    <div className={`p-6 rounded-[2.5rem] border shadow-sm ${colors[color]} flex flex-col gap-4 group hover:scale-[1.03] transition-all`}>
      <div className="bg-white p-3 rounded-2xl shadow-sm w-fit">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
        <h4 className="text-2xl font-black italic">{value}</h4>
      </div>
      <div className="text-[9px] font-black uppercase bg-white/50 w-fit px-3 py-1 rounded-full">{trend}</div>
    </div>
  );
}

const mockChartData = [
  { val: 400 }, { val: 700 }, { val: 500 }, { val: 900 }, { val: 600 }, { val: 800 }, { val: 450 }
];