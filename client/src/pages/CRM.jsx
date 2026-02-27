import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { PhoneCall, User, Calendar, ClipboardList, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const CRM = () => {
  const [customerRequests, setCustomerRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    productRequirement: "",
    quantity: "",
    expectedDate: "",
    notes: ""
  });

  const fetchRequests = async () => {
    try {
      const snap = await getDocs(collection(db, "customer_requests"));
      setCustomerRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching requests", error);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.productRequirement) {
      return toast.error("Customer name aur Product requirement zaroori hai");
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "customer_requests"), {
        ...formData,
        status: "Call Finalized",
        createdAt: serverTimestamp()
      });
      toast.success("Customer requirement save ho gayi!");
      setFormData({ customerName: "", phone: "", productRequirement: "", quantity: "", expectedDate: "", notes: "" });
      fetchRequests();
    } catch (error) {
      toast.error("Save karne mein error aaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar title="CRM - Customer Requirements" />
        
        <main className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Section */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-400">
                  <PhoneCall size={24} /> New Call Entry
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Customer Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Phone</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Quantity</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Product Requirement</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Office Chairs, Smartphones"
                      className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.productRequirement}
                      onChange={(e) => setFormData({...formData, productRequirement: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Expected Delivery</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.expectedDate}
                      onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Call Notes</label>
                    <textarea 
                      className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Save Requirement"}
                  </button>
                </form>
              </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ClipboardList className="text-indigo-400" /> Recent Inquiries
              </h3>
              <div className="space-y-4">
                {customerRequests.map((req) => (
                  <div key={req.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all shadow-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-white">{req.customerName}</h4>
                        <p className="text-slate-400 text-sm flex items-center gap-1"><PhoneCall size={14}/> {req.phone}</p>
                      </div>
                      <span className="bg-indigo-500/10 text-indigo-400 text-xs px-3 py-1 rounded-full border border-indigo-500/20 font-bold">
                        {req.status}
                      </span>
                    </div>
                    <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 mb-3">
                      <p className="text-slate-200 font-medium">Requirement: <span className="text-indigo-300">{req.productRequirement} ({req.quantity} units)</span></p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Calendar size={14}/> Due: {req.expectedDate || 'N/A'}</span>
                      <span className="italic">Note: {req.notes || 'No notes'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default CRM;