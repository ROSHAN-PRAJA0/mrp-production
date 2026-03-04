import React, { useState, useEffect, useContext, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

export default function Forecasting() {
  const { user } = useContext(AuthContext);
  const [forecastData, setForecastData] = useState([]);

  useEffect(() => {
    const runAnalysis = async () => {
      const [crmSnap, bomSnap] = await Promise.all([
        getDocs(collection(db, "customer_requests")),
        getDocs(collection(db, "boms"))
      ]);

      const boms = bomSnap.docs.map(d => d.data());
      const rawMaterialDemand = {};

      // Analyze CRM inquiries that aren't finalized yet
      crmSnap.docs.forEach(doc => {
        const req = doc.data();
        const bom = boms.find(b => b.productName === req.productRequirement);
        
        if (bom) {
          bom.ingredients.forEach(ing => {
            const qty = Number(ing.quantity) * Number(req.quantity);
            rawMaterialDemand[ing.name] = (rawMaterialDemand[ing.name] || 0) + qty;
          });
        }
      });

      const chartData = Object.keys(rawMaterialDemand).map(name => ({
        name,
        demand: rawMaterialDemand[name]
      }));
      setForecastData(chartData);
    };
    runAnalysis();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-black uppercase italic">Demand Forecasting</h3>
          <p className="text-indigo-200 text-sm font-bold uppercase mt-2">Predicted Raw Material Needs based on CRM Inquiries</p>
        </div>
        <TrendingUp className="absolute right-8 top-8 opacity-20" size={80} />
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h4 className="text-xs font-black uppercase text-slate-400 mb-8 tracking-widest flex items-center gap-2">
           <AlertTriangle size={14} className="text-amber-500"/> Predicted Material Shortage
        </h4>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tick={{fontSize: 10, fontWeight: 800}} />
              <YAxis axisLine={false} tick={{fontSize: 10}} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="demand" fill="#6366f1" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}