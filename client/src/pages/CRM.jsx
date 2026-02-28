import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { 
  collection, getDocs, addDoc, serverTimestamp, 
  query, where, deleteDoc, doc, updateDoc 
} from "firebase/firestore";
import { 
  PhoneCall, User, Calendar, ClipboardList, 
  Loader2, AlertCircle, CheckCircle, Trash2, Edit, X 
} from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const CRM = () => {
  const [customerRequests, setCustomerRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productExists, setProductExists] = useState(null);
  const [editingId, setEditingId] = useState(null); // Track editing state

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

  useEffect(() => {
    const checkInventory = async () => {
      if (formData.productRequirement.length > 2) {
        const q = query(collection(db, "inventory"), where("name", "==", formData.productRequirement));
        const snap = await getDocs(q);
        setProductExists(!snap.empty);
      } else {
        setProductExists(null);
      }
    };
    const delayDebounceFn = setTimeout(() => {
      checkInventory();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [formData.productRequirement]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.productRequirement) {
      return toast.error("Customer name aur Product requirement zaroori hai");
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update Logic
        await updateDoc(doc(db, "customer_requests", editingId), {
          ...formData,
          status: productExists ? "Ready to Order" : "New Requirement (Need BOM)",
          updatedAt: serverTimestamp()
        });
        toast.success("Inquiry update ho gayi!");
      } else {
        // Create Logic
        await addDoc(collection(db, "customer_requests"), {
          ...formData,
          status: productExists ? "Ready to Order" : "New Requirement (Need BOM)",
          createdAt: serverTimestamp()
        });
        toast.success(productExists ? "Requirement saved!" : "New Product requirement saved!");
      }
      resetForm();
      fetchRequests();
    } catch (error) {
      toast.error("Process fail ho gaya");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Kya aap is inquiry ko delete karna chahte hain?")) {
      try {
        await deleteDoc(doc(db, "customer_requests", id));
        toast.success("Inquiry delete ho gayi");
        fetchRequests();
      } catch (error) {
        toast.error("Delete fail ho gaya");
      }
    }
  };

  const handleEdit = (req) => {
    setFormData({
      customerName: req.customerName,
      phone: req.phone,
      productRequirement: req.productRequirement,
      quantity: req.quantity,
      expectedDate: req.expectedDate,
      notes: req.notes
    });
    setEditingId(req.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormData({ customerName: "", phone: "", productRequirement: "", quantity: "", expectedDate: "", notes: "" });
    setEditingId(null);
    setProductExists(null);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar title="CRM - Sales & Requirements" />
        
        <main className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            
            {/* Form Section */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl sticky top-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                    {editingId ? <Edit size={24} /> : <PhoneCall size={24} />} 
                    {editingId ? "Edit Inquiry" : "Customer Inquiry"}
                  </h2>
                  {editingId && (
                    <button onClick={resetForm} className="text-slate-500 hover:text-white">
                      <X size={20} />
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-black mb-1 block">Customer Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-black mb-1 block">Phone</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                        value={formData.phone}
                        maxLength={10}
                        onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="10 digits"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-black mb-1 block">Quantity</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-black mb-1 block">Product Requirement</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="e.g. Office Chair"
                        className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        value={formData.productRequirement}
                        onChange={(e) => setFormData({...formData, productRequirement: e.target.value})}
                      />
                      {productExists === false && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                          <AlertCircle size={12}/> New product. Needs Registration & BOM.
                        </div>
                      )}
                      {productExists === true && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                          <CheckCircle size={12}/> Product found in inventory!
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-black mb-1 block">Expected Delivery</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={formData.expectedDate}
                      onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-black mb-1 block">Internal Notes</label>
                    <textarea 
                      className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none font-medium"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                  <button 
                    disabled={loading}
                    className={`w-full ${editingId ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 mt-4 shadow-lg uppercase tracking-widest text-xs`}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (editingId ? "Update Inquiry" : "Log Inquiry")}
                  </button>
                </form>
              </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ClipboardList className="text-indigo-400" /> Recent Sales Inquiries
              </h3>
              <div className="space-y-4">
                {customerRequests.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)).map((req) => (
                  <div key={req.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl hover:border-slate-600 transition-all shadow-xl group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-800 p-3 rounded-2xl text-indigo-400">
                          <User size={20}/>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white leading-tight">{req.customerName}</h4>
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{req.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(req)}
                          className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(req.id)}
                          className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase border ${
                          req.status?.includes("New") 
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                          : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800/60 mb-4 group-hover:bg-slate-800/60 transition-colors">
                      <p className="text-slate-300 font-bold text-sm">Requirement: <span className="text-white">{req.productRequirement}</span></p>
                      <p className="text-indigo-400 font-black text-xs uppercase mt-1">Order Quantity: {req.quantity} units</p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">
                      <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-600"/> Deadline: {req.expectedDate || 'Not Set'}</span>
                      <span className="italic normal-case text-slate-600">Note: {req.notes || 'No remarks'}</span>
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