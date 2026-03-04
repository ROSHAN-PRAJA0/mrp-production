import { useState } from "react";
import { Factory, Eye, EyeOff, ShieldCheck, Mail, User, Building2, Users as UsersIcon } from "lucide-react";
import { auth, db } from "../../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // Install: npm install framer-motion
import toast from "react-hot-toast"; // Install: npm install react-hot-toast

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    companySize: "",
    password: "",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Empty",
    color: "bg-slate-200",
  });

  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length > 6) score++;
    if (password.length > 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 33, label: "Weak", color: "bg-red-500" };
    if (score <= 4) return { score: 66, label: "Medium", color: "bg-yellow-500" };
    return { score: 100, label: "Strong", color: "bg-green-500" };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      if (value === "") {
        setPasswordStrength({ score: 0, label: "Empty", color: "bg-slate-200" });
      } else {
        setPasswordStrength(checkPasswordStrength(value));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordStrength.label === "Weak") {
      return toast.error("Please use a stronger password.");
    }

    setLoading(true);
    const toastId = toast.loading("Creating your factory space...");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const userData = {
        uid: userCredential.user.uid,
        name: formData.name,
        company: formData.company,
        role: "admin",
        companySize: formData.companySize,
        email: formData.email,
        createdAt: new Date().toISOString()
      };

      // 1. Save to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      // 2. Save to localStorage
      localStorage.setItem("user", JSON.stringify(userData));

      toast.success("Welcome to SmartMRP!", { id: toastId });
      navigate("/admin-dashboard");
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error("This email is already registered.", { id: toastId });
      } else {
        toast.error(error.message, { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-indigo-100 rounded-full blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-[2.5rem] w-full max-w-xl p-8 md:p-12 border border-white relative z-10"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="SmartStock Logo" className="h-10 w-10 rounded-xl shadow-sm" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter ">
              Smart<span className="text-indigo-600">MRP</span>
            </h1>
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Enterprise Resource Planning</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">Admin Name</label>
              <div className="relative">
                <User className="absolute left-4 top-4 text-slate-400" size={18} />
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  className="w-full bg-slate-50 border-slate-100 border p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-4 text-slate-400" size={18} />
                <input
                  type="text"
                  name="company"
                  placeholder="Acme Corp"
                  className="w-full bg-slate-50 border-slate-100 border p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">Official Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="john@company.com"
                  className="w-full bg-slate-50 border-slate-100 border p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">Team Size</label>
              <div className="relative">
                <UsersIcon className="absolute left-4 top-4 text-slate-400" size={18} />
                <select
                  name="companySize"
                  className="w-full bg-slate-50 border-slate-100 border p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-600 appearance-none"
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Size</option>
                  <option>1-10 employees</option>
                  <option>11-50 employees</option>
                  <option>50+ employees</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1 flex justify-between">
              Secure Password
              <span className={`text-[10px] font-black uppercase ${passwordStrength.color.replace('bg-', 'text-')}`}>
                {passwordStrength.label}
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className="w-full bg-slate-50 border-slate-100 border p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 pr-12"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {/* Strength Indicator */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
              <motion.div 
                className={`h-full ${passwordStrength.color}`} 
                initial={{ width: 0 }}
                animate={{ width: `${passwordStrength.score}%` }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center space-x-3 mt-4 disabled:opacity-70 group"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Initialize Admin Workspace</span>
              </>
            )}
          </button>

          <p className="text-center text-sm font-bold text-slate-500 mt-6">
            Member already?{" "}
            <button type="button" onClick={() => navigate("/signin")} className="text-indigo-600 font-black hover:underline underline-offset-4">
              Sign In
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}