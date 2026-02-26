import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import UserMenu from "../../components/UserMenu";

import PurchaseOrders from "./PurchaseOrders";
import ManageSuppliers from "./ManageSuppliers";
import ReorderSetup from "./ReorderSetup";
import Requirement from "./Requirement";

import {
  FileText,
  Users,
  Repeat,
  ClipboardList
} from "lucide-react";

export default function Procurement() {

  const [activeTab, setActiveTab] = useState("Purchase Orders");

  const tabs = [
    { name: "Purchase Orders", icon: <FileText size={14} /> },
    { name: "Suppliers", icon: <Users size={14} /> },
    { name: "Reorder Setup", icon: <Repeat size={14} /> },
    { name: "Requirements", icon: <ClipboardList size={14} /> },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <main className="p-8 space-y-6 w-full max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black uppercase text-slate-800">
                Procurement Management
              </h2>
            </div>
            <UserMenu />
          </div>

          {/* TABS (Same Style as Inventory) */}
          <div className="bg-white p-1.5 rounded-2xl border flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition ${
                  activeTab === tab.name
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="bg-white rounded-3xl border p-8 min-h-[600px]">

            {activeTab === "Purchase Orders" && <PurchaseOrders />}

            {activeTab === "Suppliers" && <ManageSuppliers />}

            {activeTab === "Reorder Setup" && <ReorderSetup />}

            {activeTab === "Requirements" && <Requirement />}

          </div>

        </main>
      </div>
    </div>
  );
}