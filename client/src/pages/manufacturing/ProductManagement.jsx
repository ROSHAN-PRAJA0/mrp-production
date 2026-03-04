import React, { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { PackagePlus, Loader2, List, Tag, AlertCircle, MousePointer2 } from "lucide-react";
import toast from "react-hot-toast";

const ProductManagement = () => {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]); // CRM requests ke liye state

  // 1. Inventory se existing Finished Goods fetch karna
  const fetchProducts = async () => {
    try {
      const snap = await getDocs(collection(db, "inventory"));
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items.filter(item => item.type === "Finished Good"));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // 2. CRM se "New Requirement" waali requests fetch karna
  useEffect(() => {
    fetchProducts();

    const q = query(
      collection(db, "customer_requests"), 
      where("status", "==", "New Requirement (Need BOM)")
    );

    const unsub = onSnapshot(q, (snap) => {
      setPendingRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productName) return toast.error("Product name daalna zaroori hai");

    setLoading(true);
    try {
      await addDoc(collection(db, "inventory"), {
        name: productName,
        category: category || "General",
        type: "Finished Good",
        stock: 0,
        unit: "pcs",
        createdAt: serverTimestamp()
      });
      
      toast.success(`${productName} system mein add ho gaya!`);
      setProductName("");
      setCategory("");
      fetchProducts();
    } catch (error) {
      toast.error("Product add karne mein error aaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      
      {/* SECTION: CRM Incoming Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl text-left animate-in fade-in slide-in-from-top-4 duration-500">
          <h3 className="text-amber-500 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertCircle size={16}/> CRM Incoming Requests (New Products Needed)
          </h3>
          <div className="flex flex-wrap gap-3">
            {pendingRequests.map(req => (
              <button 
                key={req.id}
                onClick={() => {
                  setProductName(req.productRequirement);
                  setCategory("Requested by " + req.customerName);
                  toast.success("Details filled from CRM!");
                }}
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-indigo-500 transition-all group text-left relative overflow-hidden"
              >
                <div className="relative z-10">
                  <p className="text-white font-bold text-sm group-hover:text-indigo-400 transition-colors">{req.productRequirement}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                    Qty: {req.quantity} | {req.customerName}
                  </p>
                </div>
                <MousePointer2 size={14} className="absolute right-2 bottom-2 text-slate-700 group-hover:text-indigo-500 transition-colors" />
              </button>
            ))}
          </div>
          
        </div>
      )}

      {/* Input Form Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-left">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <PackagePlus className="text-indigo-400" /> Register Finalized Product
        </h2>
        <form onSubmit={handleAddProduct} className="flex flex-wrap md:flex-nowrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] text-slate-500 font-black uppercase mb-1 block ml-1">Product Name</label>
            <input 
              type="text" 
              placeholder="e.g. Smart Weather Station" 
              className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>
          <div className="w-full md:w-1/3 min-w-[150px]">
            <label className="text-[10px] text-slate-500 font-black uppercase mb-1 block ml-1">Category / Tag</label>
            <input 
              type="text" 
              placeholder="Electronics" 
              className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 uppercase text-xs tracking-widest disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20}/> : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      {/* Product List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-left">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2 bg-slate-800/20">
          <List size={18} className="text-indigo-400" />
          <h3 className="font-bold text-white uppercase text-xs tracking-widest">Registered Finished Goods</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="p-4">Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Current Stock</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-300 divide-y divide-slate-800">
              {products.length > 0 ? (
                products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-white">{p.name}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-xs font-semibold">
                        <Tag size={14} className="text-slate-500" />
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4 text-center font-black">{p.stock} units</td>
                    <td className="p-4 text-right">
                      <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-1 rounded-md border border-emerald-500/20 font-black uppercase tracking-tighter">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-slate-500 font-bold italic">
                    Koi products nahi hain. Naya product add karein!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;