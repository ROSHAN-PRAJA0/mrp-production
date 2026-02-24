// src/pages/QualityControl.jsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { ShieldCheck, CheckCircle2, XCircle, FileSearch, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function QualityControl() {
  const [inspections] = useState([
    { id: "QC-9901", product: "Electric Motor G2", batch: "BT-442", status: "Pending" },
    { id: "QC-9902", product: "Steel Chassis", batch: "BT-109", status: "Pending" }
  ]);

  const handleAction = (status) => {
    status === "Pass" 
      ? toast.success("Batch Quality Approved!") 
      : toast.error("Batch marked for Rework.");
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
               <ShieldCheck className="text-indigo-600" /> Quality Assurance
            </h2>
          </div>

          <div className="grid gap-6">
            {inspections.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="bg-slate-50 p-4 rounded-2xl text-indigo-600">
                    <FileSearch size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{item.product}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reference: {item.id} | Batch: {item.batch}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAction("Fail")}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all"
                  >
                    <XCircle size={18} /> Rework
                  </button>
                  <button 
                    onClick={() => handleAction("Pass")}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-50 text-green-600 font-bold rounded-xl hover:bg-green-100 transition-all"
                  >
                    <CheckCircle2 size={18} /> Pass QC
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}