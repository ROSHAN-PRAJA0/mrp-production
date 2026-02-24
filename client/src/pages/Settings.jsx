import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Settings as SettingsIcon, Save, Globe, Lock, Bell } from "lucide-react";

export default function Settings() {
  return (
    <div className="bg-[#f8fafc] min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="p-8 space-y-6 max-w-4xl">
          <h2 className="text-3xl font-extrabold text-slate-900">System Settings</h2>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 space-y-8">
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Globe size={20} className="text-indigo-600"/> Company Profile
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Company Name" className="p-3 border rounded-xl outline-none" defaultValue="S&R Manufacturing" />
                <input type="text" placeholder="Currency" className="p-3 border rounded-xl outline-none" defaultValue="INR (₹)" />
              </div>
            </section>
            
            <section className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Lock size={20} className="text-indigo-600"/> Security & Access
              </h3>
              <p className="text-sm text-slate-500">Manage role-based permissions and two-factor authentication.</p>
              <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs">Configure Roles</button>
            </section>

            <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg">
              <Save size={20}/> Save All Changes
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}