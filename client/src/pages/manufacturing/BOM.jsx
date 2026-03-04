import React, { useState, useEffect, useContext, useMemo } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import Select from "react-select";
import { Plus, Trash2, Save, Calculator, Trash, Settings2, Percent } from "lucide-react";
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

  // New states for calculation
  const [machineCost, setMachineCost] = useState(0);
  const [margin, setMargin] = useState(20); // Default 20% margin

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
        price: doc.data().actualPrice || 0
      }));
      setRawMaterials(matList);

      const bomSnap = await getDocs(collection(db, "boms"));
      setSavedBoms(bomSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error("Error loading data");
    }
  };

  useEffect(() => { fetchAllData(); }, [userId]);

  const totalMaterialCost = useMemo(() => {
    return recipe.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price || 0)), 0);
  }, [recipe]);

  // Combined Calculation: (Material Cost + Machine Cost) + Margin
  const finalMRP = useMemo(() => {
    const baseCost = totalMaterialCost + Number(machineCost);
    const marginAmount = baseCost * (Number(margin) / 100);
    return baseCost + marginAmount;
  }, [totalMaterialCost, machineCost, margin]);

  const addIngredient = () => {
    setRecipe([...recipe, { materialId: "", quantity: 1, name: "", itemid: "", price: 0 }]);
  };

  const removeIngredient = (index) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const handleSaveBOM = async () => {
    if (!selectedProduct || recipe.some(r => !r.materialId)) {
      return toast.error("Please select a product and all materials");
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "boms"), {
        productId: selectedProduct.value,
        productName: selectedProduct.label,
        ingredients: recipe,
        materialCost: totalMaterialCost,
        machineCost: Number(machineCost),
        margin: Number(margin),
        finalMRP: finalMRP, // Saving calculated MRP
        createdBy: userId,
        createdAt: serverTimestamp()
      });
      toast.success("BOM and MRP saved successfully!");
      setRecipe([{ materialId: "", quantity: 1, name: "", itemid: "", price: 0 }]);
      setSelectedProduct(null);
      setMachineCost(0);
      setMargin(20);
      fetchAllData();
    } catch (error) {
      toast.error("Failed to save BOM");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBOM = async (id) => {
    if (window.confirm("Are you sure you want to delete this BOM?")) {
      try {
        await deleteDoc(doc(db, "boms", id));
        toast.success("BOM deleted");
        fetchAllData();
      } catch (error) {
        toast.error("Delete failed");
      }
    }
  };

  return (
    <div className="p-8 space-y-8 text-left bg-[#f8fafc] min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BUILDER SECTION */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm sticky top-24">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Create New BOM</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block ml-1">Finished Product</label>
                <Select options={products} onChange={setSelectedProduct} value={selectedProduct} styles={lightSelectStyles} placeholder="Select Product..." />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block ml-1">Raw Materials & Quantity</label>
                {recipe.map((item, index) => (
                  <div key={index} className="space-y-2 bg-slate-50 p-4 rounded-3xl border border-slate-100 group transition-all hover:border-indigo-200">
                    <Select
                      options={rawMaterials}
                      placeholder="Search Material..."
                      onChange={(opt) => {
                        const newRecipe = [...recipe];
                        newRecipe[index].materialId = opt.value;
                        newRecipe[index].name = opt.name;
                        newRecipe[index].itemid = opt.itemid;
                        newRecipe[index].price = opt.price;
                        setRecipe(newRecipe);
                      }}
                      styles={lightSelectStyles}
                    />
                    <div className="flex gap-3 items-center mt-2">
                      <div className="flex items-center bg-white border border-slate-100 rounded-xl px-2">
                        <span className="text-[10px] font-bold text-slate-400 px-1">QTY:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newRecipe = [...recipe];
                            newRecipe[index].quantity = e.target.value;
                            setRecipe(newRecipe);
                          }}
                          className="w-16 p-2 text-xs font-bold outline-none text-slate-800"
                        />
                      </div>
                      <span className="text-[11px] font-black text-emerald-600 italic">₹{(item.quantity * item.price).toLocaleString()}</span>
                      <button onClick={() => removeIngredient(index)} className="ml-auto p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Advanced Costing Inputs */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block ml-1">Machine Cost (₹)</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <Settings2 size={14} className="text-slate-400 mr-2" />
                    <input 
                      type="number" 
                      value={machineCost} 
                      onChange={(e) => setMachineCost(e.target.value)} 
                      className="bg-transparent w-full text-xs font-bold outline-none" 
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black mb-1 block ml-1">Margin (%)</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <Percent size={14} className="text-slate-400 mr-2" />
                    <input 
                      type="number" 
                      value={margin} 
                      onChange={(e) => setMargin(e.target.value)} 
                      className="bg-transparent w-full text-xs font-bold outline-none" 
                      placeholder="20"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-2 shadow-inner">
                <div className="flex justify-between items-center opacity-70">
                  <span className="text-[9px] font-black text-indigo-400 uppercase">Material + Machine</span>
                  <span className="text-xs font-bold text-slate-600">₹{(totalMaterialCost + Number(machineCost)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Estimated Final MRP</span>
                  <span className="text-xl font-black text-indigo-600 tracking-tight">₹{finalMRP.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={addIngredient} className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all">
                  <Plus size={16} /> Add Ingredient
                </button>

                <button onClick={handleSaveBOM} disabled={loading} className="bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                  {loading ? "Processing..." : <><Save size={16}/> Save Recipe</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DISPLAY SECTION */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">Active Master Recipes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedBoms.length > 0 ? savedBoms.map((bom) => (
              <div key={bom.id} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all relative group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-bold text-slate-800 leading-tight">{bom.productName}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase">₹{bom.finalMRP?.toLocaleString()} MRP</span>
                      <span className="bg-slate-50 text-slate-400 text-[9px] font-black px-3 py-1 rounded-full uppercase">{bom.ingredients.length} Parts</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteBOM(bom.id)}
                    className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    <Trash size={16} />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {bom.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">{ing.name}</p>
                        <p className="text-[9px] font-black text-indigo-400 uppercase">{ing.itemid}</p>
                      </div>
                      <span className="text-[11px] font-black text-slate-900 bg-white px-3 py-1 rounded-xl border border-slate-100">{ing.quantity} Pcs</span>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white">
                <Calculator size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No saved recipes found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const lightSelectStyles = {
  control: (base, state) => ({ 
    ...base, 
    background: "#f8fafc", 
    borderColor: state.isFocused ? "#6366f1" : "#f1f5f9", 
    borderRadius: "1rem", 
    padding: "0.4rem",
    boxShadow: "none",
    fontSize: "0.8rem",
    fontWeight: "700"
  }),
  option: (base, state) => ({ 
    ...base, 
    background: state.isSelected ? "#6366f1" : state.isFocused ? "#eef2ff" : "white", 
    color: state.isSelected ? "white" : "#1e293b",
    fontSize: "0.75rem",
    fontWeight: "600"
  }),
  singleValue: (base) => ({ ...base, color: "#1e293b" }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" })
};

export default BOM;