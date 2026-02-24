import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { HardHat, Activity, Clock, Wrench } from "lucide-react";

export default function ShopFloor() {
  return (
    <div className="bg-[#f8fafc] min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <h2 className="text-3xl font-extrabold text-slate-900">Shop Floor Terminal</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WorkCenterCard name="CNC Cutting Station" operator="Rohan P." status="Busy" load="85%" />
            <WorkCenterCard name="Assembly Line 1" operator="Unassigned" status="Idle" load="0%" />
            <WorkCenterCard name="Quality Control" operator="Suresh V." status="Busy" load="40%" />
          </div>
        </main>
      </div>
    </div>
  );
}

function WorkCenterCard({ name, operator, status, load }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-slate-50 p-3 rounded-2xl"><Activity size={24} className="text-indigo-600"/></div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${status === "Busy" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{status}</span>
      </div>
      <h3 className="text-xl font-bold text-slate-800">{name}</h3>
      <p className="text-slate-500 text-sm mb-4">Operator: {operator}</p>
      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
        <span>Workload</span>
        <span>{load}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
        <div className="h-full bg-indigo-500" style={{width: load}}></div>
      </div>
    </div>
  );
}