import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Factory, 
  Users, 
  Settings, 
  LogOut, 
  PhoneCall, // Suppliers (Briefcase) ki jagah CRM ke liye
  ShoppingBag 
} from "lucide-react";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("user");
      navigate("/signin");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const menu = [
    { 
      icon: <LayoutDashboard size={20}/>, 
      label: "Dashboards", 
      path: "/admin-dashboard" 
    },
    { 
      icon: <PhoneCall size={20}/>, // Naya CRM section
      label: "CRM", 
      path: "/crm" 
    },
    { 
      icon: <Factory size={20}/>, 
      label: "Manufacturing", 
      path: "/manufacturing" 
    },
    { 
      icon: <Package size={20}/>, 
      label: "Inventory", 
      path: "/inventory" 
    },
    { 
      icon: <ShoppingBag size={20}/>, 
      label: "Procurement", 
      path: "/procurement" 
    },
    { 
      icon: <Users size={20}/>, 
      label: "Employees", 
      path: "/employees" 
    },
    { 
      icon: <Settings size={20}/>, 
      label: "Settings", 
      path: "/settings" 
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col z-50 shadow-2xl">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800"><div className="bg-white p-1 rounded-md flex-shrink-0">
                 <img src="/logo.png" alt="Shop Logo" className="h-8 w-8" />
              </div>
        <span className="text-xl font-bold text-white ">
          Smart<span className="text-indigo-400">MRP</span>
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1 mt-2">
        {menu.map((item) => (
          <div 
            key={item.label} 
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all ${
              location.pathname.startsWith(item.path) // startsWith taaki sub-pages par bhi active rahe
                ? "bg-indigo-600 text-white shadow-lg font-bold" 
                : "hover:bg-slate-800"
            }`}
          >
            {item.icon} 
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 p-3.5 rounded-xl text-red-400 hover:bg-red-500/10 font-bold transition-all"
        >
          <LogOut size={20} /> 
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}