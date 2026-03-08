import React, { useState, useEffect, useContext } from "react";
import { db } from "../config/firebase";
import { 
  collection, getDocs, addDoc, serverTimestamp, 
  query, where, deleteDoc, doc, updateDoc 
} from "firebase/firestore";
import { AuthContext } from "../routes/AuthProvider";
import { PhoneCall, User, Calendar, ClipboardList, Loader2, AlertCircle, CheckCircle, Trash2, Edit, X } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const CRM = () => {
  const { user } = useContext(AuthContext);
  const [customerRequests, setCustomerRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productExists, setProductExists] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    customerName: "", phone: "", productRequirement: "", quantity: "", expectedDate: "", notes: ""
  });

  const fetchRequests = async () => {
    if (!user?.uid) return;
    try {
      const q = query(collection(db, "customer_requests"), where("adminId", "==", user.uid));
      const snap = await getDocs(q);
      
      // LOGIC: Sirf wo dikhao jinhe abhi deliver karna baki hai (qty > 0)
      const activeData = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(req => Number(req.quantity) > 0); 
      
      setCustomerRequests(activeData);
    } catch (error) {
      toast.error("Failed to load records");
    }
  };

  useEffect(() => { fetchRequests(); }, [user]);

  useEffect(() => {
    const checkInventory = async () => {
      if (!user?.uid || formData.productRequirement.length < 2) return;
      const q = query(collection(db, "users", user.uid, "stocks"), where("name", "==", formData.productRequirement));
      const snap = await getDocs(q);
      setProductExists(!snap.empty);
    };
    const delayDebounceFn = setTimeout(() => { checkInventory(); }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [formData.productRequirement, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.productRequirement || !formData.expectedDate) {
      return toast.error("Schedule, Customer and Product are required!");
    }

    setLoading(true);
    try {
      const status = productExists ? "Ready to Order" : "New Requirement (Need BOM)";
      const dataToSave = {
        ...formData,
        quantity: Number(formData.quantity),
        adminId: user.uid,
        status: status,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "customer_requests", editingId), dataToSave);
        toast.success("Inquiry updated!");
      } else {
        await addDoc(collection(db, "customer_requests"), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
        toast.success("Requirement saved!");
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
      await deleteDoc(doc(db, "customer_requests", id));
      fetchRequests();
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
                <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-600 mb-6">
                  {editingId ? <Edit size={24} /> : <PhoneCall size={24} />} 
                  {editingId ? "Update Inquiry" : "New Inquiry"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Customer Name</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Phone</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Quantity</label>
                      <input type="number" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Product Requirement</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" value={formData.productRequirement} onChange={(e) => setFormData({...formData, productRequirement: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Expected Date</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none font-bold" value={formData.expectedDate} onChange={(e) => setFormData({...formData, expectedDate: e.target.value})} />
                  </div>
                  <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : (editingId ? "Update Inquiry" : "Log Inquiry")}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 uppercase tracking-tight">
                <ClipboardList className="text-indigo-600" /> Requirement Audit Trail
              </h3>
              <div className="space-y-4">
                {customerRequests.map((req) => (
                  <div key={req.id} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><User size={20}/></div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 leading-tight">{req.customerName}</h4>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{req.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(req)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(req.id)} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white"><Trash2 size={16}/></button>
                        <span className="text-[9px] px-3 py-1 rounded-full font-black uppercase border bg-indigo-50 text-indigo-600 border-indigo-100">{req.status}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex justify-between items-center">
                      <div>
                        <p className="text-slate-500 font-bold text-sm">Product: <span className="text-slate-900">{req.productRequirement}</span></p>
                        <p className="text-indigo-600 font-black text-[10px] uppercase mt-1 italic">Remaining Demand: {req.quantity} units</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Date</p>
                         <p className="text-sm font-bold text-slate-700">{req.expectedDate}</p>
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