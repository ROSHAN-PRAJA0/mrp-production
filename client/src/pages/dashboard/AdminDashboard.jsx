import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../config/firebase";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Activity, 
  AlertTriangle,
  Factory,
  CheckCircle2,
  Clock
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from "recharts";

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [stats, setStats] = useState({
    totalInventoryValue: 0,
    activeOrders: 0,
    lowStockAlerts: 0,
    completedToday: 0
  });
  const [recentMovements, setRecentMovements] = useState([]);

  useEffect(() => {
    // Live Stock Data for Inventory Value and Alerts
    const unsubStocks = onSnapshot(collection(db, "users", user.uid, "stocks"), (snap) => {
      const items = snap.docs.map(d => d.data());
      const value = items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.actualPrice || 0)), 0);
      const alerts = items.filter(item => Number(item.quantity) < 100).length;
      setStats(prev => ({ ...prev, totalInventoryValue: value, lowStockAlerts: alerts }));
    });

    // Live Manufacturing Orders
    const unsubOrders = onSnapshot(collection(db, "manufacturing_orders"), (snap) => {
      const orders = snap.docs.map(d => d.data());
      const active = orders.filter(o => o.status === "In-Progress" || o.status === "Planned").length;
      const completed = orders.filter(o => o.status === "Completed").length;
      setStats(prev => ({ ...prev, activeOrders: active, completedToday: completed }));
    });

    // Recent Movements for the chart/list
    const qMovements = query(collection(db, "users", user.uid, "movements"), orderBy("timestamp", "desc"), limit(6));
    const unsubMove = onSnapshot(qMovements, (snap) => {
      setRecentMovements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubStocks(); unsubOrders(); unsubMove(); };
  }, [user.uid]);

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        
        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Welcome Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Welcome, {user.name || "Admin"}
              </h2>
              <p className="text-slate-500 font-medium">Factory production and inventory overview.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-black text-[10px] uppercase tracking-widest">
              <Activity size={14} /> System Live
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Inventory Value" 
              value={`₹${stats.totalInventoryValue.toLocaleString()}`} 
              icon={<Package />} 
              trend="+4.2%" 
              color="indigo" 
            />
            <MetricCard 
              title="Active Work Orders" 
              value={stats.activeOrders} 
              icon={<Factory />} 
              trend="Steady" 
              color="blue" 
            />
            <MetricCard 
              title="Low Stock Alerts" 
              value={stats.lowStockAlerts} 
              icon={<AlertTriangle />} 
              trend={stats.lowStockAlerts > 0 ? "Action Required" : "Healthy"} 
              color={stats.lowStockAlerts > 0 ? "red" : "emerald"} 
            />
            <MetricCard 
              title="Completed Units" 
              value={stats.completedToday} 
              icon={<CheckCircle2 />} 
              trend="+12%" 
              color="emerald" 
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Efficiency Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={20}/> 
                  Production Efficiency
                </h3>
                <select className="bg-slate-50 border-none text-[10px] font-black uppercase p-2 rounded-lg outline-none">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="output" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity Ledger */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Clock className="text-indigo-600" size={20}/> 
                Live Activity
              </h3>
              <div className="space-y-4">
                {recentMovements.length > 0 ? recentMovements.map((move) => (
                  <div key={move.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm truncate max-w-[120px]">{move.name}</span>
                      <span className="text-[9px] font-black text-indigo-500 uppercase">{move.type} • {move.quantity} Units</span>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                      move.type === "IN" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    }`}>
                      {move.type === "IN" ? "+ STOCK" : "- STOCK"}
                    </span>
                  </div>
                )) : (
                  <p className="text-center py-10 text-slate-400 font-bold italic text-sm">No recent movements</p>
                )}
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
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-red-50 text-red-600 border-red-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100"
  };

  return (
    <div className={`p-6 rounded-[2rem] border shadow-sm ${colors[color]} flex flex-col gap-4 relative overflow-hidden group`}>
      <div className="bg-white/80 p-3 rounded-2xl shadow-sm w-fit z-10">{icon}</div>
      <div className="z-10">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</p>
        <h4 className="text-2xl font-black">{value}</h4>
      </div>
      <div className="text-[9px] font-black uppercase tracking-tighter opacity-60 z-10">{trend}</div>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { size: 80 })}
      </div>
    </div>
  );
}

const mockChartData = [
  { day: "Mon", output: 45 },
  { day: "Tue", output: 52 },
  { day: "Wed", output: 48 },
  { day: "Thu", output: 61 },
  { day: "Fri", output: 55 },
  { day: "Sat", output: 67 },
  { day: "Sun", output: 40 },
];