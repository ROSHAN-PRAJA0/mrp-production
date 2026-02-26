import React from "react";
import { ClipboardList } from "lucide-react";

export default function Requirement() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex items-center gap-3">
        <ClipboardList className="text-indigo-600" size={22} />
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">
          Material Requirement Planning
        </h3>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <p className="text-sm text-slate-500 font-semibold">
          This section will calculate required raw materials based on:
        </p>

        <ul className="mt-6 space-y-3 text-sm font-bold text-slate-600">
          <li>• Production Orders</li>
          <li>• Current Stock Levels</li>
          <li>• Minimum Reorder Quantity</li>
          <li>• BOM (Bill of Materials)</li>
        </ul>

        <div className="mt-10 text-center text-xs text-slate-300 uppercase tracking-widest">
          Requirement calculation module ready for integration
        </div>
      </div>
    </div>
  );
}