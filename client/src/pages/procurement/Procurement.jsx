import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import UserMenu from "../../components/UserMenu";
import PurchaseOrders from "./PurchaseOrders";
import ManageSuppliers from "./ManageSuppliers";
import ReorderSetup from "./ReorderSetup";
import Requirement from "./Requirement"; // FIXED: Corrected path from ../inventory to ./

import {
  FileText,
  Users,
  BarChart2,
  AlertTriangle,
  ClipboardList
} from "lucide-react";

export default function Procurement() {
  const [activeTab, setActiveTab] = useState("Purchase Orders");

  const tabs = [
    { name: "Purchase Orders", icon: <FileText size={14}/> },
    { name: "Vendors", icon: <Users size={14}/> },
    { name: "Forecasting", icon: <BarChart2 size={14}/> },
    { name: "Critical On-Hand", icon: <AlertTriangle size={14}/> },
    { name: "Requirements", icon: <ClipboardList size={14}/> },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left">
      <Sidebar />

      <div className="flex-1 ml-64">
        <main className="p-8 space-y-6 max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 uppercase">
              Procurement Management
            </h2>
            <UserMenu />
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white p-1.5 rounded-2xl border flex gap-1 overflow-x-auto shadow-sm">
            {tabs.map(tab => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  activeTab === tab.name
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          {/* Dynamic Content Area */}
          <div className="bg-white rounded-3xl border p-8 min-h-[600px] shadow-sm">

            {/* Note: Components are rendered as fragments here to avoid double-sidebar issues 
                if your sub-components like PurchaseOrders already have Sidebars. */}
            
            {activeTab === "Purchase Orders" && <PurchaseOrders />}

            {activeTab === "Vendors" && <ManageSuppliers />}

            {activeTab === "Forecasting" && (
              <div className="flex flex-col items-center justify-center py-32 text-slate-400 font-black uppercase tracking-widest">
                <BarChart2 size={48} className="mb-4 opacity-20" />
                Forecasting Module Coming Soon
              </div>
            )}

            {activeTab === "Critical On-Hand" && <ReorderSetup />}

            {activeTab === "Requirements" && <Requirement />}

          </div>

        </main>
      </div>
    </div>
  );
}