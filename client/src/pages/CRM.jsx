import React, { useState, useEffect, useContext } from "react";
import { db } from "../config/firebase";
import { 
  collection, getDocs, addDoc, serverTimestamp, 
  query, where, deleteDoc, doc, updateDoc 
} from "firebase/firestore";
import { AuthContext } from "../routes/AuthProvider"; // ✅ AuthContext import kiya
import { 
  PhoneCall, User, Calendar, ClipboardList, 
  Loader2, AlertCircle, CheckCircle, Trash2, Edit, X 
} from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const CRM = () => {
  const { user } = useContext(AuthContext); // ✅ Current User ki ID lene ke liye
  const [customerRequests, setCustomerRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productExists, setProductExists] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    productRequirement: "",
    quantity: "",
    expectedDate: "",
    notes: ""
  });

  // ✅ 1. Multi-Tenancy Fetch: Sirf wahi data jo login user ka hai
  const fetchRequests = async () => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(db, "customer_requests"), 
        where("adminId", "==", user.uid) // Filter by current admin
      );
      const snap = await getDocs(q);
      setCustomerRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching requests", error);
      toast.error("Failed to load records");
    }
  };

  useEffect(() => { fetchRequests(); }, [user]);

  // ✅ 2. Inventory Check Isolation: Apne hi stocks mein search karein
  useEffect(() => {
    const checkInventory = async () => {
      if (!user?.uid) return;
      if (formData.productRequirement.length > 2) {
        // Users sub-collection pattern use kar rahe hain hum stocks ke liye
        const q = query(
          collection(db, "users", user.uid, "stocks"), 
          where("name", "==", formData.productRequirement)
        );
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
  }, [formData.productRequirement, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.productRequirement || !formData.expectedDate) {
      return toast.error("Schedule (Date), Customer and Product are required!");
    }

    const selectedDate = new Date(formData.expectedDate);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (selectedDate < today) {
      return toast.error("Past date cannot be selected for scheduling!");
    }

    setLoading(true);
    try {
      const status = productExists ? "Ready to Order" : "New Requirement (Need BOM)";
      
      if (editingId) {
        await updateDoc(doc(db, "customer_requests", editingId), {
          ...formData,
          status: status,
          updatedAt: serverTimestamp()
        });
        toast.success("Inquiry updated!");
      } else {
        // ✅ 3. Multi-Tenancy Save: adminId tag add karein
        await addDoc(collection(db, "customer_requests"), {
          ...formData,
          adminId: user.uid, // Ownership tag
          status: status,
          createdAt: serverTimestamp()
        });
        toast.success(productExists ? "Requirement saved!" : "New Product flagged for BOM!");
      }
      resetForm();
      fetchRequests();
    } catch (error) {
      toast.error("Process failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this inquiry?")) {
      try {
        await deleteDoc(doc(db, "customer_requests", id));
        toast.success("Inquiry deleted");
        fetchRequests();
      } catch (error) {
        toast.error("Delete failed");
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
    <div className="flex h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 text-left">
        <Topbar title="CRM - Sales & Requirements" />
        
        <main className="p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm sticky top-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-600">
                    {editingId ? <Edit size={24} /> : <PhoneCall size={24} />} 
                    {editingId ? "Update Inquiry" : "New Inquiry"}
                  </h2>
                  {editingId && (
                    <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Customer Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Phone</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                        value={formData.phone}
                        onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10)}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="10 Digits"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Quantity</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Product Requirement</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search or Enter Product"
                        className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        value={formData.productRequirement}
                        onChange={(e) => setFormData({...formData, productRequirement: e.target.value})}
                      />
                      {productExists === false && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 p-2 rounded-xl border border-amber-100 italic">
                          <AlertCircle size={12}/> New product. Requires BOM Setup.
                        </div>
                      )}
                      {productExists === true && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                          <CheckCircle size={12}/> Product identified in inventory.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Expected Delivery (Schedule)</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={formData.expectedDate}
                      onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                    />
                  </div>
                  <button 
                    disabled={loading}
                    className={`w-full ${editingId ? 'bg-emerald-600' : 'bg-slate-900'} text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 mt-4 shadow-lg uppercase tracking-widest text-[10px]`}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (editingId ? "Update Inquiry" : "Log Inquiry")}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 uppercase tracking-tight">
                <ClipboardList className="text-indigo-600" /> Requirement Audit Trail
              </h3>
              <div className="space-y-4">
                {customerRequests.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)).map((req) => (
                  <div key={req.id} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                          <User size={20}/>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 leading-tight">{req.customerName}</h4>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{req.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(req)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(req.id)} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                        <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase border ${
                          req.status?.includes("New") 
                          ? "bg-amber-50 text-amber-600 border-amber-100" 
                          : "bg-indigo-50 text-indigo-600 border-indigo-100"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 mb-4 group-hover:bg-indigo-50/50 transition-colors flex justify-between items-center">
                      <div>
                        <p className="text-slate-500 font-bold text-sm">Product: <span className="text-slate-900">{req.productRequirement}</span></p>
                        <p className="text-indigo-600 font-black text-[10px] uppercase mt-1 italic">Demand: {req.quantity} units</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Date</p>
                         <p className="text-sm font-bold text-slate-700">{req.expectedDate || "No Date"}</p>
                      </div>
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