import React from "react";

export default function UserMenu() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="flex items-center gap-3 pl-6">
      <div className="text-right">
        <p className="text-sm font-bold text-slate-800">{user.name || "Administrator"}</p>
        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">{user.role}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-100">
        {user.name ? user.name.charAt(0).toUpperCase() : "A"}
      </div>
    </div>
  );
}