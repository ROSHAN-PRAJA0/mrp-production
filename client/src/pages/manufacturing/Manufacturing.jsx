import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import BOM from './BOM'; 
import ManufacturingOrders from './ManufacturingOrders';
import ProductManagement from './ProductManagement';
import ProductionSchedule from './ProductionSchedule';
import { 
  Calendar, 
  Package, 
  ClipboardList, 
  Layers, 
  Activity, 
  BarChart3,
  Settings2
} from "lucide-react";

const Manufacturing = () => {
  const location = useLocation();

  // MRPEasy inspired sub-navigation with icons
  const subNav = [
    { label: "Products & Parts", path: "/manufacturing/products", icon: <Package size={14}/> },
    { label: "Work Orders (MO)", path: "/manufacturing", icon: <ClipboardList size={14}/> },
    { label: "Production Planning", path: "/manufacturing/schedule", icon: <Calendar size={14}/> },
    { label: "BOM Master", path: "/manufacturing/bom", icon: <Layers size={14}/> },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col ml-64">
        <Topbar title="Manufacturing Resource Planning (MRP)" />
        
        {/* MRPEasy Style Professional Sub-Navigation Bar */}
        <div className="bg-white border-b border-slate-100 px-8 py-1 flex gap-8 sticky top-[80px] z-30 shadow-sm">
          {subNav.map((item) => {
            const isActive = location.pathname === item.path || (item.path === "/manufacturing" && location.pathname === "/manufacturing/");
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`pb-4 pt-3 px-1 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${
                  isActive
                    ? "text-indigo-600 border-indigo-600"
                    : "text-slate-400 border-transparent hover:text-slate-600"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Action Bar for Global Manufacturing Settings */}
        <div className="px-8 py-4 flex justify-between items-center">
            <div className="flex gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Activity size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">System Status: <span className="text-emerald-600">Syncing</span></span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <BarChart3 size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase">Shop Floor Load: <span className="text-indigo-600">Optimal</span></span>
                </div>
            </div>
            <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors">
                <Settings2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Global Settings</span>
            </button>
        </div>

        {/* Content Area for Sub-Routes */}
        <main className="flex-1 overflow-y-auto p-8 pt-2">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <Routes>
              <Route path="products" element={<ProductManagement />} />
              <Route index element={<ManufacturingOrders />} />
              <Route path="schedule" element={<ProductionSchedule />} />
              <Route path="bom" element={<BOM />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Manufacturing;