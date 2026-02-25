import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  BarChart3,
  Users,
  Menu,
  X,
  ChevronDown,
  ShoppingCart,
  Edit,
  TrendingUp,
  Factory,
  Truck,
  Settings
} from "lucide-react";

/* ================= NAVIGATION ================= */

const navLinks = [
  { href: "#features", text: "Features" },
  { href: "#flow", text: "MRP Flow" },
  { href: "#faq", text: "FAQ" },
];

/* ================= FEATURES ================= */

const featureCards = [
  {
    icon: <Factory className="w-8 h-8 text-white" />,
    gradient: "from-blue-600 to-indigo-700",
    title: "Production Planning",
    desc: "Smart scheduling with machine and workforce allocation."
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-white" />,
    gradient: "from-green-600 to-emerald-700",
    title: "Material Requirement Planning",
    desc: "Auto-calculate raw materials using BOM & inventory."
  },
  {
    icon: <Package className="w-8 h-8 text-white" />,
    gradient: "from-purple-600 to-violet-700",
    title: "Inventory Automation",
    desc: "Real-time stock updates across warehouses."
  },
  {
    icon: <Users className="w-8 h-8 text-white" />,
    gradient: "from-orange-600 to-red-600",
    title: "Role-Based Access",
    desc: "Admin, Manager & Operator secure workflow control."
  },
  {
    icon: <Settings className="w-8 h-8 text-white" />,
    gradient: "from-gray-700 to-gray-900",
    title: "Quality & Performance Monitoring",
    desc: "Track rejection rate, downtime & cost analysis."
  }
];

/* ================= FAQ ================= */

const faqs = [
  {
    q: "Does the system support multi-warehouse management?",
    a: "Yes. You can track inventory warehouse-wise with real-time stock updates."
  },
  {
    q: "Is MRP calculation automatic?",
    a: "Yes. The system automatically calculates required materials based on BOM and demand."
  },
  {
    q: "Is production scheduling supported?",
    a: "Yes. You can assign machines, operators and shifts with full timeline planning."
  }
];

/* ================= HEADER ================= */

const Header = ({ onSignIn, onSignUp }) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed w-full z-50 bg-white/90 backdrop-blur-lg border-b">
       <div className="container mx-auto flex justify-between items-center px-6 py-4">
        <div className="flex items-center space-x-3">
        <img src="/logo.png" alt="SmartStock Logo" className="h-9 w-9 rounded-md" />
        <h1 className="text-xl font-bold text-gray-800">
          Smart<span className="text-indigo-600">MRP</span>
        </h1>
 </div>
        <div className="hidden lg:flex gap-8 items-center">
          {navLinks.map(link => (
            <a key={link.text} href={link.href} className="hover:text-indigo-600">
              {link.text}
            </a>
          ))}
          <button onClick={onSignIn}>Sign In</button>
          <button
            onClick={onSignUp}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            Get Started
          </button>
        </div>

        <div className="lg:hidden">
          <button onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
};

/* ================= FAQ ITEM ================= */

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b py-4">
      <button
        className="flex justify-between w-full"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold">{q}</span>
        <ChevronDown className={`${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="mt-2 text-gray-600">{a}</p>}
    </div>
  );
};

/* ================= TRUCK ANIMATION ================= */

const TruckAnimation = () => {
  return (
    <div className="relative w-full h-24 overflow-hidden">
      <div className="absolute w-full border-t border-dashed border-gray-400 top-1/2"></div>

      <div className="absolute animate-truck">
        <Truck size={40} className="text-indigo-600" />
      </div>

      <style>{`
        @keyframes truckMove {
          0% { left: -10%; }
          100% { left: 110%; }
        }
        .animate-truck {
          position: absolute;
          top: 30%;
          animation: truckMove 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

/* ================= MRP FLOW SECTION ================= */

const FlowSection = () => {
  const steps = [
    "Define & Configure Inputs",
    "Calculate Requirements",
    "Generate Action Plans",
    "Procure & Track Materials",
    "Optimize & Forecast Costs",
    "Monitor & Improve Performance"
  ];

  return (
    <section id="flow" className="py-20 bg-gray-100 text-center">
      <h2 className="text-3xl font-bold mb-12">MRP Flow Diagram</h2>
      <div className="flex flex-wrap justify-center gap-10 px-6">
        {steps.map((step, i) => (
          <div key={i} className="w-40">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4 font-bold text-indigo-700">
              {i + 1}
            </div>
            <p className="text-sm">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ================= MAIN ================= */

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white text-gray-800">

      <Header
  onSignIn={() => navigate("/signin")} 
  onSignUp={() => navigate("/signup")}
/>

      {/* HERO */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white pt-32 pb-24">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Smart Manufacturing & Production Automation System
            </h1>
            <p className="mt-6 text-indigo-200">
              Automate MRP, optimize inventory, streamline production,
              and monitor performance in real-time.
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="mt-8 bg-white text-indigo-700 px-8 py-3 rounded-lg font-bold"
            >
              Get Started Free
            </button>
          </div>
           <img
              src="https://images.unsplash.com/photo-1581092335397-9583eb92d232"
              alt="MRP Dashboard"
              className="rounded-xl shadow-2xl"
            />
        </div>
      </section>

      {/* TRUCK ANIMATION */}
      <TruckAnimation />

      {/* FEATURES */}
      <section id="features" className="py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Complete Manufacturing Toolkit
        </h2>

        <div className="container mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureCards.map(feature => (
            <div
              key={feature.title}
              className={`bg-gradient-to-br ${feature.gradient} text-white p-8 rounded-2xl shadow-lg`}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-white/80">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FLOW */}
      <FlowSection />

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          {faqs.map(faq => (
            <FaqItem key={faq.q} {...faq} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-16 text-center">
        <h2 className="text-3xl font-bold">
          Digitize & Automate Your Manufacturing Today
        </h2>
        <p className="mt-4 opacity-80">
          Move from manual planning to intelligent automation.
        </p>
        <button
          onClick={() => navigate("/signup")}
          className="mt-8 bg-indigo-600 px-8 py-3 rounded-lg"
        >
          Start Free Trial
        </button>
      </section>

      <footer className="bg-black text-gray-400 text-center py-6 text-sm">
        © {new Date().getFullYear()} SmartMRP. All rights reserved.
      </footer>

    </div>
  );
};

export default LandingPage;
