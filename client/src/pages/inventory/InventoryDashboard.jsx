import React, { useState, useEffect, useContext, useMemo } from "react";
import { collection, onSnapshot, query, limit, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from "recharts";
import { 
  TrendingUp, AlertTriangle, Package, DollarSign, 
  ArrowUpRight, ArrowDownRight, Activity 
} from "lucide-react";

export default function InventoryDashboard() {
  const { user } = useContext(AuthContext);
  const [stocks, setStocks] = useState([]);
  const [movements, setMovements] = useState([]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch Stocks
    const unsubStock = onSnapshot(collection(db, "users", user.uid, "stocks"), (snap) => {
      setStocks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Last 50 Movements
    const qMove = query(collection(db, "users", user.uid, "movements"), orderBy("timestamp", "desc"), limit(50));
    const unsubMove = onSnapshot(qMove, (snap) => {
      setMovements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubStock(); unsubMove(); };
  }, [user]);

  // Calculations
  const stats = useMemo(() => {
    const totalValue = stocks.reduce((acc, s) => acc + (Number(s.quantity || 0) * Number(s.actualPrice || 0)), 0);
    const lowStockCount = stocks.filter(s => Number(s.quantity) < 100).length;
    const stockIn = movements.filter(m => m.type === "IN").reduce((acc, m) => acc + Number(m.quantity), 0);
    const stockOut = movements.filter(m => m.type === "OUT").reduce((acc, m) => acc + Number(m.quantity), 0);

    return { totalValue, lowStockCount, stockIn, stockOut };
  }, [stocks, movements]);

  // Data for Pie Chart (Stock Distribution)
  const pieData = useMemo(() => {
    const categories = {};
    stocks.forEach(s => {
      const cat = s.groupName || "General";
      categories[cat] = (categories[cat] || 0) + Number(s.quantity);
    });
    return Object.keys(categories).map(key => ({ name: key, value: categories[key] }));
  }, [stocks]);

  // Data for Bar Chart (Top 5 Items by Quantity)
  const barData = useMemo(() => {
    return [...stocks]
      .sort((a, b) => Number(b.quantity) - Number(a.quantity))
      .slice(0, 5)
      .map(s => ({ name: s.name, qty: s.quantity }));
  }, [stocks]);

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Inventory Value" value={`₹ ${stats.totalValue.toLocaleString()}`} icon={<DollarSign size={20}/>} color="indigo" />
        <StatCard title="Critical Low Stock" value={stats.lowStockCount} icon={<AlertTriangle size={20}/>} color="red" />
        <StatCard title="Monthly Intake" value={stats.stockIn} icon={<ArrowUpRight size={20}/>} color="emerald" />
        <StatCard title="Monthly Dispatch" value={stats.stockOut} icon={<ArrowDownRight size={20}/>} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Stock Levels (Bar Chart) */}
        <div className="bg-white p-6 rounded-[2.5rem] h-[300px] w-full shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-600"/> Top Stock Levels
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="qty" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Group Distribution (Pie Chart) */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity size={16} className="text-emerald-600"/> Stock Distribution
          </h3>
          <div className="h-64 flex flex-col md:flex-row items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 min-w-[150px]">
              {pieData.slice(0, 4).map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                  <span className="text-[10px] font-bold text-slate-600 truncate">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    red: "bg-red-50 text-red-600 border-red-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100"
  };

  return (
    <div className={`p-6 rounded-[2rem] border shadow-sm ${colors[color]} flex items-center gap-5`}>
      <div className="bg-white/80 p-3 rounded-2xl shadow-sm">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</p>
        <h4 className="text-xl font-black">{value}</h4>
      </div>
    </div>
  );
}