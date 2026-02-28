import React, { useState, useEffect, useContext, useMemo } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import Select from "react-select";
import { Plus, Trash2, Save, ListChecks, Package, ArrowRight, Calculator } from "lucide-react";
import toast from "react-hot-toast";

const BOM = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.uid;

  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [savedBoms, setSavedBoms] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recipe, setRecipe] = useState([{ materialId: "", quantity: 1, name: "", itemid: "", price: 0 }]);
  const [loading, setLoading] = useState(false);

  const fetchAllData = async () => {
    if (!userId) return;
    try {
      const prodSnap = await getDocs(collection(db, "inventory"));
      const prodList = prodSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(i => i.type === "Finished Good")
        .map(i => ({ value: i.id, label: i.name }));
      setProducts(prodList);

      const stockRef = collection(db, "users", userId, "stocks");
      const stockSnap = await getDocs(stockRef);
      const matList = stockSnap.docs.map(doc => ({
        value: doc.id,
        label: `${doc.data().itemid} - ${doc.data().name} (₹${doc.data().actualPrice || 0})`,
        name: doc.data().name,
        itemid: doc.data().itemid,
        price: doc.data().actualPrice || 0 // Price yahan fetch ho raha hai
      }));
      setRawMaterials(matList);

      const bomSnap = await getDocs(collection(db, "boms"));
      setSavedBoms(bomSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error("Data load karne mein error aaya");
    }
  };

  useEffect(() => { fetchAllData(); }, [userId]);

  // Real-time Cost Calculation
  const totalEstimateCost = useMemo(() => {
    return recipe.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price || 0)), 0);
  }, [recipe]);

  const addIngredient = () => {
    setRecipe([...recipe, { materialId: "", quantity: 1, name: "", itemid: "", price: 0 }]);
  };

  const removeIngredient = (index) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const handleSaveBOM = async () => {
    if (!selectedProduct || recipe.some(r => !r.materialId)) {
      return toast.error("Product aur saare Materials select karein");
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "boms"), {
        productId: selectedProduct.value,
        productName: selectedProduct.label,
        ingredients: recipe,
        totalEstimatedCost: totalEstimateCost,
        createdBy: userId,
        createdAt: serverTimestamp()
      });
      toast.success("BOM successfully save ho gaya!");
      setRecipe([{ materialId: "", quantity: 1, name: "", itemid: "", price: 0 }]);
      setSelectedProduct(null);
      fetchAllData();
    } catch (error) {
      toast.error("BOM save nahi ho paya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl sticky top-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-400">
              <ListChecks size={24} /> BOM Builder
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-black mb-2 block">Finished Product</label>
                <Select options={products} onChange={setSelectedProduct} value={selectedProduct} styles={darkSelectStyles} />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-slate-400 uppercase font-black mb-1 block">Materials & Qty</label>
                {recipe.map((item, index) => (
                  <div key={index} className="space-y-2 bg-slate-800/30 p-3 rounded-2xl border border-slate-800">
                    <Select
                      options={rawMaterials}
                      onChange={(opt) => {
                        const newRecipe = [...recipe];
                        newRecipe[index].materialId = opt.value;
                        newRecipe[index].name = opt.name;
                        newRecipe[index].itemid = opt.itemid;
                        newRecipe[index].price = opt.price;
                        setRecipe(newRecipe);
                      }}
                      styles={darkSelectStyles}
                    />
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newRecipe = [...recipe];
                          newRecipe[index].quantity = e.target.value;
                          setRecipe(newRecipe);
                        }}
                        className="w-20 bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-xs font-bold"
                      />
                      <span className="text-[10px] font-bold text-emerald-500">₹{(item.quantity * item.price).toLocaleString()}</span>
                      <button onClick={() => removeIngredient(index)} className="ml-auto text-red-500 hover:bg-red-500/10 p-1 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Section */}
              <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Cost Per Product</span>
                  <span className="text-lg font-black text-white">₹{totalEstimateCost.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={addIngredient} className="w-full py-3 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs font-bold hover:border-indigo-500">
                + Add Material
              </button>

              <button onClick={handleSaveBOM} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">
                {loading ? "Saving..." : "Save BOM"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Package className="text-indigo-400" /> Existing BOMs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedBoms.map((bom) => (
              <div key={bom.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight">{bom.productName}</h4>
                    <p className="text-[10px] font-black text-emerald-500 uppercase mt-1">Cost: ₹{bom.totalEstimatedCost?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {bom.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-800/40 px-3 py-1.5 rounded-xl text-[10px]">
                      <span className="text-slate-300">{ing.name}</span>
                      <span className="text-white font-black">{ing.quantity} pcs</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const darkSelectStyles = {
  control: (base) => ({ ...base, background: "#0f172a", borderColor: "#1e293b", borderRadius: "0.75rem", color: "white" }),
  menu: (base) => ({ ...base, background: "#0f172a" }),
  option: (base, state) => ({ ...base, background: state.isFocused ? "#4f46e5" : "transparent", color: "white", fontSize: "0.75rem" }),
  singleValue: (base) => ({ ...base, color: "white" }),
  placeholder: (base) => ({ ...base, color: "#64748b", fontSize: "0.75rem" })
};

export default BOM;