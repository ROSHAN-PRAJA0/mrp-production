import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardCards from "../components/DashboardCards";
import { TrendingUp, AlertCircle, CheckCircle2, BarChart3 } from "lucide-react";

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="bg-[#f8fafc] min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900">Welcome, {user.name || "Admin"}</h2>
              <p className="text-slate-500 font-medium">Factory production and inventory overview.</p>
            </div>
          </div>
          <DashboardCards />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Efficiency Trend</h3>
                <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><TrendingUp size={14}/> +12%</span>
              </div>
              <div className="h-64 bg-slate-50 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400">
                <BarChart3 size={48} className="mb-2 opacity-20" />
                <p>Chart Data Visualization</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Live Assets</h3>
              <div className="space-y-4">
                <StatusItem label="CNC Machine A" status="Operating" color="text-green-600" bg="bg-green-100" />
                <StatusItem label="Line 04" status="Maintenance" color="text-amber-600" bg="bg-amber-100" />
                <StatusItem label="Packaging Unit" status="Operating" color="text-green-600" bg="bg-green-100" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatusItem({ label, status, color, bg }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
      <span className="font-semibold text-slate-700 text-sm">{label}</span>
      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${color} ${bg}`}>{status}</span>
    </div>
  );
}