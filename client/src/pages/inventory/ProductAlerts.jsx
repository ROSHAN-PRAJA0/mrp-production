import React, { useState, useEffect, useContext } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import { BellRing, MessageSquare, PackageSearch } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductAlerts() {
  const { user, loading: authLoading } = useContext(AuthContext); 
  const [shortages, setShortages] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // FIX: Only fetch if auth is complete and user ID exists
    if (authLoading || !user?.uid) return;

    const stockRef = collection(db, "users", user.uid, "stocks");
    const unsub = onSnapshot(stockRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Items with quantity < 100 are flagged as alerts
      const alertItems = data.filter(item => Number(item.quantity) < 100);
      setShortages(alertItems);
      setDataLoading(false);
    });
    return () => unsub();
  }, [user, authLoading]);

  const sendOrderAlert = (item) => {
    const subject = `URGENT REORDER: ${item.name}`;
    const body = `Stock for Part ${item.itemid} is at ${item.quantity} units. Threshold is 100.`;
    window.location.href = `mailto:procurement@company.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success("Order alert sent!");
  };

  if (authLoading || dataLoading) return <div className="py-20 text-center font-bold text-slate-400 italic">Scanning warehouse levels...</div>;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <BellRing className="text-red-600 animate-bounce" size={24} />
          <div>
            <h3 className="text-lg font-black text-red-800 uppercase tracking-tight italic">Low Stock Protocol Active</h3>
            <p className="text-red-600 text-xs font-black uppercase">{shortages.length} items require attention</p>
          </div>
        </div>
      </div>

      {shortages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortages.map((item) => (
            <div key={item.id} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">SKU: {item.itemid}</span>
                  <h4 className="text-xl font-bold text-slate-800 mt-1">{item.name}</h4>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-red-600">{item.quantity}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Units Left</p>
                </div>
              </div>
              <button onClick={() => sendOrderAlert(item)} className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg">
                <MessageSquare size={14} /> REORDER NOW
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed flex flex-col items-center">
          <PackageSearch size={48} className="text-emerald-500 mb-4" />
          <h3 className="text-xl font-black text-slate-800">Warehouse Healthy</h3>
          <p className="text-slate-400 font-medium">All items are above 100 units.</p>
        </div>
      )}
    </div>
  );
}