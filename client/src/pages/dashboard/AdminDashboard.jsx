import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { 
  TrendingUp, 
  Package, 
  Activity, 
  AlertTriangle,
  Factory,
  CheckCircle2,
  Clock,
  DollarSign,
  BarChart3
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [stats, setStats] = useState({
    totalRawMaterialCost: 0,
    estimatedRevenue: 0,
    netProfit: 0,
    activeOrders: 0,
    lowStockAlerts: 0,
    completedToday: 0
  });
  const [recentMovements, setRecentMovements] = useState([]);
  const [forecastSummary, setForecastSummary] = useState([]);

  useEffect(() => {
    if (!user.uid) return;

    // ✅ Combined Financial Logic: Revenue, Cost & Profit
    const unsubStocks = onSnapshot(collection(db, "users", user.uid, "stocks"), (snap) => {
      const items = snap.docs.map(d => d.data());
      
      let rawMaterialCost = 0;
      let finishedGoodsRevenue = 0;
      let alerts = 0;

      items.forEach(item => {
        const qty = Number(item.quantity || 0);
        if (item.category === "Finished Goods") {
          // Finished Goods ki value selling price (MRP) se calculate hogi
          finishedGoodsRevenue += (qty * Number(item.sellingPrice || 0));
        } else {
          // Raw Material ki value actual purchase price se calculate hogi
          rawMaterialCost += (qty * Number(item.actualPrice || 0));
          if (qty < 100) alerts++;
        }
      });

      setStats(prev => ({ 
        ...prev, 
        totalRawMaterialCost: rawMaterialCost,
        estimatedRevenue: finishedGoodsRevenue,
        netProfit: finishedGoodsRevenue - rawMaterialCost, // Profit = Revenue - Cost
        lowStockAlerts: alerts 
      }));
    });

    // Live Manufacturing Orders
    const unsubOrders = onSnapshot(collection(db, "manufacturing_orders"), (snap) => {
      const orders = snap.docs.map(d => d.data());
      const active = orders.filter(o => o.status === "In-Progress" || o.status === "Planned").length;
      const completed = orders.filter(o => o.status === "Completed").length;
      setStats(prev => ({ ...prev, activeOrders: active, completedToday: completed }));
    });

    // Recent Movements
    const qMovements = query(collection(db, "users", user.uid, "movements"), orderBy("timestamp", "desc"), limit(5));
    const unsubMove = onSnapshot(qMovements, (snap) => {
      setRecentMovements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Simple Forecasting Summary for Dashboard
    const fetchForecast = async () => {
      const crmSnap = await getDocs(collection(db, "customer_requests"));
      setForecastSummary(crmSnap.docs.length); // Kitne inquiries pending hain
    };
    fetchForecast();

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
              <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">
                {user.name || "Admin"}'s Command Center
              </h2>
              <p className="text-slate-500 font-medium">Real-time Financial & Production Intelligence.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-black text-[10px] uppercase tracking-widest">
              <Activity size={14} className="animate-pulse" /> System Active
            </div>
          </div>

          {/* ✅ New Financial Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Raw Material Value" 
              value={`₹${stats.totalRawMaterialCost.toLocaleString()}`} 
              icon={<Package />} 
              trend="Current Assets" 
              color="indigo" 
            />
            <MetricCard 
              title="Estimated Revenue" 
              value={`₹${stats.estimatedRevenue.toLocaleString()}`} 
              icon={<TrendingUp />} 
              trend="Market Value" 
              color="blue" 
            />
            <MetricCard 
              title="Net Profit" 
              value={`₹${stats.netProfit.toLocaleString()}`} 
              icon={<DollarSign />} 
              trend={stats.netProfit >= 0 ? "Surplus" : "Deficit"} 
              color={stats.netProfit >= 0 ? "emerald" : "red"} 
            />
            <MetricCard 
              title="Active Production" 
              value={stats.activeOrders} 
              icon={<Factory />} 
              trend={`${forecastSummary} CRM Needs`} 
              color="orange" 
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Efficiency Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                  <BarChart3 className="text-indigo-600" size={20}/> 
                  Output Performance
                </h3>
                <div className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
                  Live Analytics
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="output" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity Ledger */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                <Clock className="text-indigo-600" size={20}/> 
                Live Activity
              </h3>
              <div className="space-y-4">
                {recentMovements.map((move) => (
                  <div key={move.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm truncate max-w-[110px]">{move.name}</span>
                      <span className="text-[9px] font-black text-indigo-500 uppercase">{move.type} • {move.quantity} Units</span>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                      move.type === "IN" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    }`}>
                      {move.type === "IN" ? "+ STOCK" : "- STOCK"}
                    </span>
                  </div>
                ))}
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
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100"
  };

  return (
    <div className={`p-6 rounded-[2.5rem] border shadow-sm ${colors[color]} flex flex-col gap-4 relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
      <div className="bg-white/90 p-3 rounded-2xl shadow-sm w-fit z-10">{icon}</div>
      <div className="z-10">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</p>
        <h4 className="text-2xl font-black italic">{value}</h4>
      </div>
      <div className="text-[9px] font-black uppercase tracking-tighter bg-white/50 w-fit px-2 py-1 rounded-lg z-10">{trend}</div>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { size: 100 })}
      </div>
    </div>
  );
}

const mockChartData = [
  { day: "Mon", output: 45 }, { day: "Tue", output: 52 },
  { day: "Wed", output: 48 }, { day: "Thu", output: 61 },
  { day: "Fri", output: 55 }, { day: "Sat", output: 67 },
  { day: "Sun", output: 40 },
];