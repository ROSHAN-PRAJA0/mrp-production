import React, { useState, useEffect, useContext } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import Sidebar from "../../components/Sidebar";
import UserMenu from "../../components/UserMenu";

// Page Components
import PurchaseOrdersPage from "./PurchaseOrders"; 
import ManageSuppliers from "./ManageSuppliers"; 
import ReorderSetup from "./ReorderSetup"; 
import Requirement from "./Requirement"; 
import Forecasting from "./Forecasting"; 

import {
  ShoppingCart,
  Users,
  BarChart3,
  AlertOctagon,
  ClipboardList,
  Activity
} from "lucide-react";

export default function Procurement() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("Purchase Orders");
  const [lowStockCount, setLowStockCount] = useState(0);

  // Monitor stock levels to provide a notification badge on the 'Critical On-Hand' tab
  useEffect(() => {
    if (!user?.uid) return;
    
    const q = query(collection(db, "users", user.uid, "stocks"), where("quantity", "<", 100));
    const unsub = onSnapshot(q, (snap) => {
      setLowStockCount(snap.docs.length);
    });
    
    return () => unsub();
  }, [user]);

  const pages = [
    { 
      name: "Purchase Orders", 
      icon: <ShoppingCart size={16}/>, 
      component: <PurchaseOrdersPage />,
      description: "Manage active and completed procurement requests" 
    },
    { 
      name: "Vendors", 
      icon: <Users size={16}/>, 
      component: <ManageSuppliers />,
      description: "Database of registered suppliers and contact details" 
    },
    { 
      name: "Forecasting", 
      icon: <BarChart3 size={16}/>, 
      component: <Forecasting />,
      description: "Predictive material demand based on CRM inquiries" 
    },
    { 
      name: "Critical On-Hand", 
      icon: <AlertOctagon size={16}/>, 
      component: <ReorderSetup />,
      badge: lowStockCount,
      description: "Automated reordering for items below safety thresholds"
    },
    { 
      name: "Requirements", 
      icon: <ClipboardList size={16}/>, 
      component: <Requirement />,
      description: "Material Requirement Planning (MRP) demand matrix" 
    },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        {/* HEADER SECTION */}
        <div className="bg-white border-b px-8 py-5 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div>
            <h1 className="text-xl font-black uppercase text-slate-800 tracking-tight">
              Procurement Management
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Activity size={12} className="text-indigo-500 animate-pulse" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Supply Chain Control & Performance Tracking
              </p>
            </div>
          </div>
          <UserMenu />
        </div>

        {/* TAB NAVIGATION */}
        <div className="bg-white border-b px-8 sticky top-[73px] z-20">
          <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {pages.map(page => (
              <button
                key={page.name}
                onClick={() => setActiveTab(page.name)}
                className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap relative ${
                  activeTab === page.name
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {page.icon}
                {page.name}
                {page.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">
                    {page.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 p-8 space-y-6">
          {/* Sub-header context for the active tab */}
          <div className="px-2">
            <h2 className="text-lg font-extrabold text-slate-700">
              {activeTab}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {pages.find(p => p.name === activeTab)?.description}
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 min-h-[600px] animate-in fade-in duration-500">
            {pages.find(p => p.name === activeTab)?.component}
          </div>
        </div>
      </div>
    </div>
  );
}