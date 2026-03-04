import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import UserMenu from "../../components/UserMenu";

// Importing your specific page components
import PurchaseOrdersPage from "./PurchaseOrders"; 
import ManageSuppliers from "./ManageSuppliers"; 
import ReorderSetup from "./ReorderSetup"; 
import Requirement from "./Requirement"; 

import {
  ShoppingCart,
  Users,
  BarChart3,
  AlertOctagon,
  ClipboardList
} from "lucide-react";

export default function Procurement() {
  // Defining tabs based on image reference
  const pages = [
    { name: "Purchase Orders", icon: <ShoppingCart size={16}/>, component: <PurchaseOrdersPage /> },
    { name: "Vendors", icon: <Users size={16}/>, component: <ManageSuppliers /> },
    { name: "Forecasting", icon: <BarChart3 size={16}/>, component: <div className="flex flex-col items-center justify-center py-32 text-slate-400 font-black uppercase tracking-widest"><BarChart3 size={48} className="mb-4 opacity-20" /> Forecasting Module Coming Soon</div> },
    { name: "Critical On-Hand", icon: <AlertOctagon size={16}/>, component: <ReorderSetup /> },
    { name: "Requirements", icon: <ClipboardList size={16}/>, component: <Requirement /> },
  ];

  const [activeTab, setActiveTab] = useState("Purchase Orders");

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left">
      <Sidebar />

      <div className="flex-1 ml-64 flex  flex-col">
        {/* HEADER SECTION */}
        <div className="bg-white border-b px-8 py-5 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div>
            <h1 className="text-xl font-black uppercase text-slate-800 tracking-tight">
              Procurement Management
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Supply Chain Control
            </p>
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
                className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === page.name
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {page.icon}
                {page.name}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 p-8">
          <div className="bg-white rounded-[2.5rem] border shadow-sm p-8 min-h-[600px]">
            {/* Redirects to the selected component based on tab click */}
            {pages.find(p => p.name === activeTab)?.component}
          </div>
        </div>
      </div>
    </div>
  );
}