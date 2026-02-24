import { useState } from "react";
import { Factory, Eye, EyeOff, ShieldCheck } from "lucide-react"; // Removed unused CheckCircle2
import { auth, db } from "../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Added loading state for better UX
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
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const userData = {
        uid: userCredential.user.uid,
        name: formData.name,
        company: formData.company,
        role: "admin",
        companySize: formData.companySize,
        email: formData.email,
        createdAt: new Date()
      };

      // 1. Save to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      // 2. IMPORTANT: Save to localStorage so ProtectedRoute works
      localStorage.setItem("user", JSON.stringify(userData));

      alert("Registration Successful!");
      navigate("/admin-dashboard");
    } catch (error) {
      // Handle Firebase specific errors like 'email-already-in-use'
      if (error.code === 'auth/email-already-in-use') {
        alert("This email is already registered. Please Sign In.");
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4">
      <div className="bg-white shadow-2xl rounded-[2rem] w-full max-w-xl p-8 md:p-12 border border-slate-100">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="SmartStock Logo" className="h-9 w-9 rounded-md" />
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Smart<span className="text-indigo-600">MRP</span>
            </h1>
          </div>
          <p className="text-slate-500 font-medium">Create your admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                className="w-full border-slate-200 border p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Company Name</label>
              <input
                type="text"
                name="company"
                placeholder="Acme Corp"
                className="w-full border-slate-200 border p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="john@company.com"
                className="w-full border-slate-200 border p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 ml-1">Company Size</label>
              <select
                name="companySize"
                className="w-full border-slate-200 border p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
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

          <div className="space-y-1.5 relative">
            <label className="text-sm font-semibold text-slate-700 ml-1 flex justify-between">
              Password
              <span className={`text-[10px] uppercase tracking-wider font-bold ${passwordStrength.label === "Strong" ? "text-green-600" : "text-slate-400"}`}>
                {passwordStrength.label}
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className="w-full border-slate-200 border p-3.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
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
            
            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${passwordStrength.color}`} 
                style={{ width: `${passwordStrength.score}%` }}
              ></div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 mt-4 disabled:opacity-50"
          >
            <ShieldCheck size={20} />
            <span>{loading ? "Creating Account..." : "Create Admin Account"}</span>
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <button type="button" onClick={() => navigate("/signin")} className="text-indigo-600 font-bold hover:underline">
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}