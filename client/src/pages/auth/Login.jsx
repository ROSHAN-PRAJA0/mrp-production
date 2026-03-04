import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // npm install framer-motion
import { Factory, Eye, EyeOff, LogIn, ShieldCheck, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Verifying credentials...");

    try {
      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        toast.error("User record not found in database.", { id: toastId });
        return;
      }

      const userData = { uid: user.uid, ...userDoc.data() };

      // Manager approval validation
      if (userData.role === "manager" && !userData.approved) {
        toast.error("Manager account pending admin approval.", { id: toastId });
        return;
      }

      // Session management
      localStorage.setItem("user", JSON.stringify(userData));
      toast.success(`Welcome back, ${userData.name}!`, { id: toastId });

      // Role-based redirection
      const dashboardMap = {
        admin: "/admin-dashboard",
        manager: "/admin-dashboard",
        supervisor: "/supervisor-dashboard",
        operator: "/operator-dashboard"
      };

      navigate(dashboardMap[userData.role] || "/");

    } catch (error) {
      toast.error("Invalid email or password.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4 relative overflow-hidden">
      {/* Dynamic Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-100 rounded-full blur-[130px] opacity-60 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-blue-100 rounded-full blur-[130px] opacity-60 animate-pulse"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/70 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] w-full max-w-md p-10 border border-white/50 relative z-10"
      >
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="SmartStock Logo" className="h-10 w-10 rounded-xl shadow-sm" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter ">
              Smart<span className="text-indigo-600">MRP</span>
            </h1>
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Secure Terminal Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">Corporate Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="email"
                placeholder="name@company.com"
                required
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-4 pl-12 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Access Key</label>
              <button type="button" className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-tighter">Reset Password</button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full p-4 pl-12 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center space-x-3 disabled:opacity-70 group active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Execute Authentication</span>
                <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Registration Link */}
          <p className="text-center text-xs font-bold text-slate-400 pt-2 uppercase tracking-tight">
            New Entity?{" "}
            <button 
              type="button" 
              onClick={() => navigate("/signup")} 
              className="text-indigo-600 font-black hover:underline underline-offset-4"
            >
              Initialize Workspace
            </button>
          </p>
        </form>

        {/* Security Footer */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-center space-x-2 opacity-40">
          <ShieldCheck size={14} className="text-slate-400" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Protected by Enterprise Grade Encryption</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;