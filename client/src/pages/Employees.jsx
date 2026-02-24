import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Users, Mail, Phone, BadgeCheck } from "lucide-react";

export default function Employees() {
  const staff = [
    { name: "Roshan Prajapati", role: "Admin", email: "roshan@company.com" },
    { name: "Amit Kumar", role: "Manager", email: "amit@company.com" },
    { name: "Vikram Singh", role: "Operator", email: "vikram@company.com" },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <h2 className="text-3xl font-extrabold text-slate-900 font-bold">Employee Directory</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {staff.map(emp => (
              <div key={emp.email} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl mb-4">
                  {emp.name.charAt(0)}
                </div>
                <h3 className="font-bold text-lg text-slate-800">{emp.name}</h3>
                <span className="text-indigo-600 text-xs font-bold uppercase tracking-widest mb-4">{emp.role}</span>
                <div className="w-full pt-4 border-t border-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                    <Mail size={14}/> {emp.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}