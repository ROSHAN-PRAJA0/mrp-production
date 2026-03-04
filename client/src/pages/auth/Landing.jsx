import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // Install: npm install framer-motion
import {
  Package,
  BarChart3,
  Users,
  Menu,
  X,
  ChevronDown,
  Factory,
  Truck,
  Settings,
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";

/* ================= ANIMATION VARIANTS ================= */
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

/* ================= DATA ================= */
const navLinks = [
  { href: "#features", text: "Features" },
  { href: "#flow", text: "MRP Flow" },
  { href: "#faq", text: "FAQ" },
];

const featureCards = [
  {
    icon: <Zap className="w-8 h-8 text-amber-400" />,
    title: "Real-time Automation",
    desc: "Automate inventory and production triggers instantly.",
    color: "from-amber-500/20 to-orange-600/20"
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-indigo-400" />,
    title: "Smart MRP Logic",
    desc: "Auto-calculate raw materials using live BOM & Demand data.",
    color: "from-indigo-500/20 to-blue-600/20"
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
    title: "Quality Assurance",
    desc: "Integrated rework loops and rejection rate tracking.",
    color: "from-emerald-500/20 to-teal-600/20"
  }
];

/* ================= COMPONENTS ================= */

const Header = ({ onSignIn, onSignUp }) => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200">
      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center space-x-2"
        >
         <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-white p-1 rounded-md flex-shrink-0">
          <img src="/logo.png" alt="Shop Logo" className="h-8 w-8" />
        </div>
        <span className="text-xl font-bold text-black ">
          Smart<span className="text-indigo-400">MRP</span>
        </span>
      </div>
        </motion.div>

        <div className="hidden lg:flex gap-8 items-center font-bold text-sm uppercase tracking-widest">
          {navLinks.map(link => (
            <a key={link.text} href={link.href} className="text-slate-500 hover:text-indigo-600 transition-colors">
              {link.text}
            </a>
          ))}
          <button onClick={onSignIn} className="text-slate-900 hover:opacity-70">Sign In</button>
          <button
            onClick={onSignUp}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
          >
            Get Started
          </button>
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-700 overflow-x-hidden">
      <Header onSignIn={() => navigate("/signin")} onSignUp={() => navigate("/signup")} />

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-200/30 blur-[100px] rounded-full" />
        </div>

        <div className="container mx-auto px-6 text-center lg:text-left grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeIn}>
            <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-indigo-100">
              Industry 4.0 Ready
            </span>
            <h1 className="mt-8 text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter">
              Automate Your <span className="text-indigo-600 italic">Shop Floor</span> Intelligence.
            </h1>
            <p className="mt-8 text-lg text-slate-500 font-medium max-w-xl mx-auto lg:mx-0">
              Stop managing with spreadsheets. Streamline your production, inventory, 
              and material requirements with our automated SmartMRP system.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button 
                onClick={() => navigate("/signup")}
                className="group bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
              >
                Launch Your Factory <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2.5rem] blur-2xl opacity-20 animate-pulse" />
            <img
              src="https://images.unsplash.com/photo-1581092335397-9583eb92d232"
              alt="MRP System"
              className="relative rounded-[2rem] shadow-2xl border-4 border-white"
            />
          </motion.div>
        </div>
      </section>

      {/* STATS / TRUCK AREA */}
      <div className="py-12 bg-white border-y border-slate-100 overflow-hidden relative">
        <motion.div 
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
          className="flex items-center gap-4 text-slate-300 opacity-50 absolute top-1/2 -translate-y-1/2"
        >
          <Truck size={40} />
          <div className="h-[2px] w-screen border-t-2 border-dashed" />
        </motion.div>
        <div className="container mx-auto px-6 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[["99%", "Accuracy"], ["40%", "Efficiency"], ["24/7", "Monitoring"], ["0", "Paperwork"]].map(([val, label]) => (
            <div key={label}>
              <h3 className="text-3xl font-black text-slate-900">{val}</h3>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
              Built for <span className="text-indigo-600">Modern</span> Production
            </h2>
            <div className="h-1.5 w-24 bg-indigo-600 mx-auto mt-4 rounded-full" />
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {featureCards.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                className={`p-10 rounded-[2.5rem] bg-gradient-to-br ${feature.color} border border-white shadow-sm hover:shadow-xl transition-all group`}
              >
                <div className="bg-white p-4 rounded-2xl shadow-sm w-fit mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight italic">
                  {feature.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full" />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase italic">
                Ready to <span className="text-indigo-400">Digitize</span> your shop floor?
              </h2>
              <p className="mt-6 text-slate-400 max-w-xl mx-auto font-medium">
                Join 500+ factories moving from manual chaos to automated precision. 
                Start your 14-day free trial today.
              </p>
              <button 
                onClick={() => navigate("/signup")}
                className="mt-10 bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-white hover:text-indigo-600 transition-all shadow-2xl shadow-indigo-500/20"
              >
                Start Free Trial Now
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-200 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} SmartMRP • All Production Data Secured
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;