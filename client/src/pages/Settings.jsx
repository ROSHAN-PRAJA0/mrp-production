import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { AuthContext } from "../routes/AuthProvider"; //
import { 
  Settings as SettingsIcon, 
  Save, 
  Globe, 
  Lock, 
  Bell, 
  User as UserIcon,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, userName, role } = useContext(AuthContext); //

  const handleSave = () => {
    toast.success("Settings updated successfully!");
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar title="System Settings" />
        
        <main className="p-8 space-y-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Configuration</h2>
              <p className="text-slate-500 font-medium">Manage your factory profile and security preferences.</p>
            </div>
            <button 
              onClick={handleSave}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Save size={16}/> Save All Changes
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile & Account */}
            <div className="lg:col-span-2 space-y-8">
              {/* Company Profile Section */}
              <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                  <Globe size={16} className="text-indigo-600"/> Company Environment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Company Name</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" defaultValue="S&R Manufacturing" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Base Currency</label>
                    <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>INR (₹) - Indian Rupee</option>
                      <option>USD ($) - US Dollar</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Security Section */}
              <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                  <Lock size={16} className="text-indigo-600"/> Security & Access Control
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm text-indigo-600"><Smartphone size={20}/></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Two-Factor Authentication</p>
                        <p className="text-[10px] font-medium text-slate-500">Secure your account with an extra layer of protection.</p>
                      </div>
                    </div>
                    <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-all"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm text-indigo-600"><ShieldCheck size={20}/></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Role-Based Permissions</p>
                        <p className="text-[10px] font-medium text-slate-500">Configure what managers and operators can see.</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-black uppercase text-indigo-600 hover:underline">Manage Roles</button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: User Info Card */}
            <div className="lg:col-span-1 space-y-8">
              <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">User Profile</h3>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-black shadow-lg mb-4">
                      {userName?.[0]?.toUpperCase() || "A"}
                    </div>
                    <h4 className="text-xl font-black">{userName || "Administrator"}</h4>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">{role || "Admin"}</p>
                    
                    <div className="w-full mt-8 pt-6 border-t border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">User Email</span>
                        <span className="text-xs font-bold">{user?.email || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
                        <span className="bg-emerald-500/10 text-emerald-500 text-[9px] px-2 py-1 rounded-md border border-emerald-500/20 font-black">VERIFIED</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-8 -bottom-8 text-white/5 group-hover:scale-110 transition-transform">
                  <UserIcon size={160} />
                </div>
              </section>

              <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                  <Bell size={16} className="text-indigo-600"/> Notifications
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs font-bold text-slate-600">Stock Out Alerts</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs font-bold text-slate-600">Production Reports</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-xs font-bold text-slate-600">Supplier Updates</span>
                  </label>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}       