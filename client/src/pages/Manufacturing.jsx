import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Factory, Plus, Search, MoreVertical, PlayCircle } from "lucide-react";

const moData = [
  { id: "WH/MO/001", product: "Electric Motor G2", qty: "10 Units", deadline: "2024-03-25", status: "In Progress", priority: "High" },
  { id: "WH/MO/002", product: "Steel Chassis", qty: "50 Units", deadline: "2024-03-28", status: "To Do", priority: "Medium" },
  { id: "WH/MO/003", product: "Hydraulic Pump", qty: "5 Units", deadline: "2024-03-22", status: "Done", priority: "Low" },
];

export default function Manufacturing() {
  return (
    <div className="bg-[#f8fafc] min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900">Manufacturing Orders</h2>
              <p className="text-slate-500 font-medium">Create and manage your production cycles.</p>
            </div>
            <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all">
              <Plus size={20} /> Create MO
            </button>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Reference</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Quantity</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {moData.map((mo) => (
                  <tr key={mo.id} className="hover:bg-slate-50/50 transition-all cursor-pointer">
                    <td className="px-6 py-4 font-bold text-indigo-600">{mo.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{mo.product}</td>
                    <td className="px-6 py-4 text-slate-600">{mo.qty}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                        mo.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                        mo.status === "Done" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}>{mo.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><PlayCircle size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}