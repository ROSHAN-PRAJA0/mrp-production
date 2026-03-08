import React, { useState, useEffect, useContext } from "react";
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
import { AuthContext } from "../../routes/AuthProvider"; // Import AuthContext
import { 
  PackagePlus, Loader2, List, Tag, 
  AlertCircle, MousePointer2, Boxes 
} from "lucide-react";
import toast from "react-hot-toast";

const ProductManagement = () => {
  const { user } = useContext(AuthContext); // Get current logged-in user
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // 1. Fetch Existing Finished Goods (Filtered by Admin ID)
  const fetchProducts = async () => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(db, "inventory"), 
        where("adminId", "==", user.uid) // Multi-tenancy filter
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items.filter(item => item.type === "Finished Good"));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // 2. Real-time CRM Requests (Filtered by Admin ID)
  useEffect(() => {
    if (!user?.uid) return;
    
    fetchProducts();
    
    const q = query(
      collection(db, "customer_requests"), 
      where("status", "==", "New Requirement (Need BOM)"),
      where("adminId", "==", user.uid) // Multi-tenancy filter for incoming requests
    );

    const unsub = onSnapshot(q, (snap) => {
      setPendingRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [user]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productName) return toast.error("Product name is required!");
    if (!user?.uid) return toast.error("User not authenticated!");

    setLoading(true);
    try {
      await addDoc(collection(db, "inventory"), {
        adminId: user.uid, // ✅ Link to current admin
        name: productName,
        category: category || "General",
        type: "Finished Good",
        stock: 0,
        unit: "pcs",
        createdAt: serverTimestamp()
      });
      
      toast.success(`${productName} added to system!`);
      setProductName("");
      setCategory("");
      fetchProducts();
    } catch (error) {
      toast.error("Error adding product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 text-left bg-[#f8fafc] min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic flex items-center gap-3">
            <Boxes className="text-indigo-600" /> Product <span className="text-indigo-600">Master</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-1">Register & Manage Finished Goods</p>
        </div>
      </div>

      {/* CRM REQUESTS BANNER */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] shadow-sm animate-in fade-in zoom-in duration-500">
          <h3 className="text-amber-600 font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <AlertCircle size={18}/> Incoming CRM Product Requests
          </h3>
          <div className="flex flex-wrap gap-4">
            {pendingRequests.map(req => (
              <button 
                key={req.id}
                onClick={() => {
                  setProductName(req.productRequirement);
                  setCategory("CRM Requested");
                  toast.success("CRM details imported!");
                }}
                className="bg-white border-2 border-dashed border-amber-200 p-5 rounded-3xl hover:border-amber-500 transition-all group relative pr-12 text-left shadow-sm"
              >
                <p className="text-slate-800 font-black text-sm uppercase">{req.productRequirement}</p>
                <p className="text-[9px] text-slate-400 font-black uppercase mt-1">
                  Qty: {req.quantity} | Client: {req.customerName}
                </p>
                <MousePointer2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-300 group-hover:text-amber-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* REGISTRATION FORM */}
      <div className="bg-white border rounded-[2.5rem] p-8 shadow-sm">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <PackagePlus size={16} className="text-indigo-600" /> New Product Registration
        </h3>
        <form onSubmit={handleAddProduct} className="flex flex-wrap md:flex-nowrap gap-6 items-end">
          <div className="flex-1 min-w-[250px] space-y-2">
            <label className="text-[10px] text-slate-500 font-black uppercase ml-1">Official Product Name</label>
            <input 
              type="text" 
              placeholder="e.g. Wireless Sensor Module" 
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-800"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>
          <div className="w-full md:w-1/3 min-w-[200px] space-y-2">
            <label className="text-[10px] text-slate-500 font-black uppercase ml-1">Category / Line</label>
            <input 
              type="text" 
              placeholder="e.g. Electronics" 
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-800"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <button 
            disabled={loading}
            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl uppercase text-[10px] tracking-widest hover:bg-indigo-600 disabled:opacity-50 h-[58px]"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : "Register Product"}
          </button>
        </form>
      </div>

      {/* REGISTERED PRODUCTS TABLE */}
      <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-50 flex items-center gap-3">
          <List size={20} className="text-indigo-600" />
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Master Product Database</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="p-8">Product Details</th>
                <th className="p-8">Category</th>
                <th className="p-8 text-center">Available Stock</th>
                <th className="p-8 text-right">System Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.length > 0 ? (
                products.map(p => (
                  <tr key={p.id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="p-8">
                      <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{p.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1">UUID: {p.id.slice(0,12)}</p>
                    </td>
                    <td className="p-8">
                      <span className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase">
                        <Tag size={14} className="text-indigo-400" />
                        {p.category}
                      </span>
                    </td>
                    <td className="p-8 text-center">
                      <div className="bg-slate-100 inline-block px-4 py-1.5 rounded-full">
                        <span className="text-xs font-black text-slate-700">{p.stock} Units</span>
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] px-3 py-1.5 rounded-xl border border-emerald-100 font-black uppercase tracking-widest">
                        Ready for MO
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic">
                    No products registered for your organization.
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