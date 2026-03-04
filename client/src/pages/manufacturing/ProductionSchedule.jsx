import React, { useState, useEffect, useContext } from "react";
import { db } from "../../config/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import { 
  Calendar, Clock, Info, AlertCircle, Filter, 
  Maximize2, LayoutGrid, CheckCircle2 
} from "lucide-react";

export default function ProductionSchedule() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");

  // Timeline Constants
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "manufacturing_orders"), orderBy("startDate", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(allOrders);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const getDayFromDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.getMonth() === today.getMonth() ? d.getDate() : null;
  };

  const filteredOrders = orders.filter(o => 
    filterStatus === "All" ? o.status !== "Completed" : o.status === filterStatus
  );

  return (
    <div className="w-full min-h-screen space-y-6 animate-in fade-in duration-500 text-left p-1">
      {/* Advanced Header Control */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <Calendar size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">
              Production Control <span className="text-indigo-600">Gantt</span>
            </h2>
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] ml-1">
            {today.toLocaleString('default', { month: 'long' })} {today.getFullYear()} • Resource Scheduling & Progress
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filters */}
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {["All", "Planned", "In-Progress", "Rework Required"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === status 
                  ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" 
                  : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md">
            <Maximize2 size={14} /> Full View
          </button>
        </div>
      </div>

      {/* Main Gantt Interface */}
      <div className="w-full bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[1400px] w-full">
            
            {/* Timeline Header */}
            <div className="flex border-b bg-slate-50/30 sticky top-0 z-20">
              <div className="w-80 p-8 border-r font-black text-[11px] uppercase text-slate-500 tracking-[0.2em] bg-white flex items-center gap-2">
                <LayoutGrid size={16} className="text-indigo-600" /> Job Specification
              </div>
              <div className="flex-1 flex">
                {calendarDays.map(day => (
                  <div 
                    key={day} 
                    className={`flex-1 min-w-[45px] p-6 text-center border-r last:border-0 font-black text-xs transition-all ${
                      day === today.getDate() 
                      ? "bg-indigo-600 text-white shadow-xl scale-y-105 z-10" 
                      : "text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Production Lanes */}
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-40 text-center flex flex-col items-center gap-4">
                   <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                   <p className="font-black text-slate-300 uppercase tracking-widest italic">Optimizing Timeline...</p>
                </div>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map(order => {
                  const startDay = getDayFromDate(order.startDate);
                  const endDay = getDayFromDate(order.endDate);
                  const startPos = startDay ? ((startDay - 1) * (100 / daysInMonth)) : 0;
                  const duration = (endDay && startDay) ? (endDay - startDay + 1) : 1;
                  const width = (duration * (100 / daysInMonth));
                  
                  // Progress Calculation (CompletedQty / Quantity)
                  const progress = Math.min(100, Math.round(((order.completedQty || 0) / (order.quantity || 1)) * 100));

                  return (
                    <div key={order.id} className="flex group hover:bg-indigo-50/10 transition-all duration-300">
                      {/* Left Job Info */}
                      <div className="w-80 p-8 border-r bg-white sticky left-0 z-10 group-hover:bg-indigo-50/5 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-black text-slate-800 text-base tracking-tighter uppercase truncate pr-4">{order.productName}</h4>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded ${
                            order.status === "Rework Required" ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"
                          }`}>#{order.id.slice(-4)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">{progress}% Done</span>
                        </div>
                      </div>
                      
                      {/* Gantt Bar Section */}
                      <div className="flex-1 relative h-28 flex items-center">
                        <div 
                          className={`absolute h-14 rounded-2xl shadow-xl flex flex-col justify-center px-5 border-2 transition-all group-hover:h-16 z-10 cursor-pointer ${
                            order.status === "Planned" ? "bg-amber-50 border-amber-200 text-amber-700 shadow-amber-200/10" :
                            order.status === "Rework Required" ? "bg-rose-50 border-rose-200 text-rose-700 shadow-rose-200/10" :
                            "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-indigo-200/10"
                          }`}
                          style={{ left: `${startPos}%`, width: `${width}%`, minWidth: '80px' }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {order.status === "In-Progress" && <Clock size={12} className="animate-spin" />}
                            <span className="text-[10px] font-black uppercase tracking-wider">{order.status}</span>
                          </div>
                          <div className="flex justify-between items-center opacity-60">
                             <span className="text-[9px] font-bold italic">{order.quantity} Units</span>
                             <span className="text-[8px] font-black">{order.startDate.split('-').slice(1).join('/')}</span>
                          </div>
                        </div>

                        {/* Visual Grid */}
                        {calendarDays.map(day => (
                          <div key={day} className={`flex-1 h-full border-r border-slate-50 last:border-0 ${day === today.getDate() ? 'bg-indigo-50/40' : ''}`}></div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-40 text-center flex flex-col items-center">
                  <Info className="text-slate-200 mb-4" size={64} />
                  <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No Matches Found</h3>
                  <p className="text-slate-400 font-medium italic">Adjust filters to see other manufacturing jobs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 shadow-sm">
          <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600"><CheckCircle2 size={28} /></div>
          <div>
            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Capacity Overview</h4>
            <p className="text-slate-400 text-[11px] font-medium mt-1">Shop floor is currently at {Math.round((filteredOrders.length / 10) * 100)}% utilization based on active Work Orders.</p>
          </div>
        </div>

        {orders.some(o => o.status === "Rework Required") && (
          <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] flex items-center gap-6 shadow-sm animate-pulse">
            <div className="bg-white p-4 rounded-3xl text-rose-600 shadow-md"><AlertCircle size={28} /></div>
            <div>
              <h4 className="font-black text-rose-800 uppercase text-xs tracking-widest">Bottleneck Warning</h4>
              <p className="text-rose-600 text-[11px] font-bold mt-1 uppercase">Active Rework detected in line. Future schedules may shift.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}