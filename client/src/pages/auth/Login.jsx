import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { useNavigate } from "react-router-dom";
import { Factory, Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = { uid: user.uid, ...userDoc.data() };
        
        // Session save karna zaroori hai ProtectedRoute ke liye
        localStorage.setItem("user", JSON.stringify(userData));

        const role = userData.role;
        if (role === "admin") navigate("/admin-dashboard");
        else if (role === "manager") navigate("/manager-dashboard");
        else if (role === "supervisor") navigate("/supervisor-dashboard");
        else if (role === "operator") navigate("/operator-dashboard");
      } else {
        alert("User record not found in database.");
      }
    } catch (error) {
      alert("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50"></div>

      <div className="bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] w-full max-w-md p-10 border border-white relative z-10">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="SmartStock Logo" className="h-9 w-9 rounded-md" />
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Smart<span className="text-indigo-600">MRP</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">Welcome back! Please enter your details.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-4 border-slate-200 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-600 font-medium"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Forgot Password?</button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full p-4 border-slate-200 border rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-600 font-medium pr-12"
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

          {/* Remember Me Toggle (Optional UI only) */}
          <div className="flex items-center space-x-2 ml-1">
            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="remember" className="text-xs font-semibold text-slate-500 cursor-pointer">Remember for 30 days</label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Authenticating...</span>
              </div>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Register Link */}
          <p className="text-center text-sm text-slate-500 font-medium pt-2">
            Don't have an account?{" "}
            <button 
              type="button" 
              onClick={() => navigate("/signup")} 
              className="text-indigo-600 font-bold hover:underline"
            >
              Start Free Trial
            </button>
          </p>
        </form>

        {/* Trust Badge */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-center space-x-2 opacity-50">
          <ShieldCheck size={14} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure AES-256 Encryption</span>
        </div>
      </div>
    </div>
  );
};

export default Login;