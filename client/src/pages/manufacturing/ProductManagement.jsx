import React, { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { PackagePlus, Loader2, List, Tag } from "lucide-react";
import toast from "react-hot-toast";

const ProductManagement = () => {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  // Firestore se existing products (Finished Goods) fetch karna
  const fetchProducts = async () => {
    try {
      const snap = await getDocs(collection(db, "inventory"));
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sirf Finished Goods filter kar rahe hain kyunki ye manufacturing module hai
      setProducts(items.filter(item => item.type === "Finished Good"));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!productName) return toast.error("Product name daalna zaroori hai");

    setLoading(true);
    try {
      // Inventory collection mein hi naya finished good add kar rahe hain
      await addDoc(collection(db, "inventory"), {
        name: productName,
        category: category || "General",
        type: "Finished Good", // MRP logic ke liye ye type bohot important hai
        stock: 0,
        unit: "pcs",
        createdAt: serverTimestamp()
      });
      
      toast.success(`${productName} system mein add ho gaya!`);
      setProductName("");
      setCategory("");
      fetchProducts(); // List refresh karne ke liye
    } catch (error) {
      toast.error("Product add karne mein error aaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Input Form Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 text-left">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <PackagePlus className="text-indigo-400" /> Register Finalized Product
        </h2>
        <form onSubmit={handleAddProduct} className="flex flex-wrap md:flex-nowrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Product Name (e.g. Office Chair)" 
              className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>
          <div className="w-full md:w-1/4 min-w-[150px]">
            <input 
              type="text" 
              placeholder="Category" 
              className="w-full bg-slate-800 border border-slate-700 text-white p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <button 
            disabled={loading}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 uppercase text-xs tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : "Add Product"}
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-500 italic">
          * Call par finalize hone ke baad product yahan register karein taaki BOM banaya ja sake.
        </p>
      </div>

      {/* Product List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-left">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
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