import { Bell, Search } from "lucide-react";

export default function Topbar() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center bg-slate-100 px-4 py-2 rounded-xl w-96">
        <Search size={18} className="text-slate-400" />
        <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none ml-3 w-full text-sm" />
      </div>
      <div className="flex items-center gap-6">
        <Bell size={22} className="text-slate-600 cursor-pointer" />
        <div className="flex items-center gap-3 pl-6 border-l">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{user.name || "Administrator"}</p>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
            {user.name ? user.name.charAt(0).toUpperCase() : "A"}
          </div>
        </div>
      </div>
    </div>
  );
}