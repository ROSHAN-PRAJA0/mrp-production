import React, { useEffect, useState, useContext } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { AuthContext } from "../routes/AuthProvider";
import { Truck, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShortageReport() {
  const { user, loading } = useContext(AuthContext);
  const [shortages, setShortages] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "stocks"), (snap) => {
      const lowItems = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => Number(item.quantity) <= 10); // 10 se kam stock shortage hai
      setShortages(lowItems);
    });
    return () => unsub();
  }, [user]);

  const sendEmail = (item) => {
    const subject = `Urgent: Material Shortage for ${item.name}`;
    const body = `Hello Vendor, we are low on ${item.name}. Current stock: ${item.quantity}. Please send 100 units.`;
    window.location.href = `mailto:supplier@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success("Email client opened!");
  };

  if (loading) return <div className="text-center p-10">Loading Shortage Data...</div>;

  return (
    <div className="bg-[#f8fafc] min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="p-8 space-y-6">
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
             <Truck className="text-red-500" /> Shortage Analysis
          </h2>
          
          {shortages.length === 0 ? (
            <div className="bg-white p-12 rounded-[2.5rem] text-center shadow-sm border border-slate-100">
               <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
               <h3 className="text-2xl font-bold">Stock Levels Healthy</h3>
               <p className="text-slate-500">All materials are currently above reorder levels.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {shortages.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-50 p-3 rounded-2xl"><AlertTriangle className="text-red-500" /></div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{item.name}</h4>
                      <p className="text-sm text-red-600 font-bold uppercase tracking-wider">Stock: {item.quantity} units left</p>
                    </div>
                  </div>
                  <button onClick={() => sendEmail(item)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
                    <Send size={16} /> Contact Supplier
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}