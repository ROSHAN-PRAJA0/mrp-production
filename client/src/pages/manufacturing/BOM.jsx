import React, { useState, useEffect, useContext, useMemo } from "react";
import { db } from "../../config/firebase";
import { 
  collection, getDocs, addDoc, serverTimestamp, 
  deleteDoc, doc, query, where 
} from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import Select from "react-select";
import { Plus, Trash2, Save, Layers } from "lucide-react";
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
  const [machineCost, setMachineCost] = useState(0);
  const [margin, setMargin] = useState(20);

  const fetchAllData = async () => {
    if (!userId) return;
    try {
      const prodQuery = query(collection(db, "inventory"), where("adminId", "==", userId));
      const prodSnap = await getDocs(prodQuery);
      setProducts(prodSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(item => item.type === "Finished Good")
        .map(item => ({ value: item.id, label: item.name }))
      );
      
      const stockSnap = await getDocs(collection(db, "users", userId, "stocks"));
      setRawMaterials(stockSnap.docs.map(d => ({
        value: d.id, 
        label: `${d.data().itemid} - ${d.data().name}`, 
        name: d.data().name, 
        itemid: d.data().itemid, 
        price: d.data().actualPrice || 0
      })));

      const bomQuery = query(collection(db, "boms"), where("adminId", "==", userId));
      const bomSnap = await getDocs(bomQuery);
      setSavedBoms(bomSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { 
      console.error(e);
      toast.error("Error loading data"); 
    }
  };

  useEffect(() => { 
    if (userId) fetchAllData(); 
  }, [userId]);

  // ✅ LOGIC: Filter options to prevent duplicate material selection
  const getFilteredOptions = (index) => {
    const selectedIds = recipe.map((item, i) => i !== index ? item.materialId : null).filter(Boolean);
    return rawMaterials.filter(option => !selectedIds.includes(option.value));
  };

  const totalMaterialCost = useMemo(() => 
    recipe.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price || 0)), 0), 
  [recipe]);

  const finalMRP = useMemo(() => 
    (totalMaterialCost + Number(machineCost)) * (1 + Number(margin)/100), 
  [totalMaterialCost, machineCost, margin]);

  const handleInputChange = (index, field, value) => {
    const updated = [...recipe];
    updated[index][field] = value;
    setRecipe(updated);
  };

  const handleSaveBOM = async () => {
    if (!selectedProduct || recipe.some(r => !r.materialId)) {
      return toast.error("Please select a product and add ingredients.");
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "boms"), {
        productId: selectedProduct.value, 
        productName: selectedProduct.label,
        ingredients: recipe, 
        machineCost: Number(machineCost),
        margin: Number(margin),
        totalMaterialCost,
        finalMRP, 
        adminId: userId,
        createdBy: userId, 
        createdAt: serverTimestamp()
      });
      
      toast.success("BOM Master Saved!");
      setRecipe([{ materialId: "", quantity: 1, name: "", itemid: "", price: 0 }]);
      setSelectedProduct(null);
      setMachineCost(0);
      fetchAllData();
    } catch (e) { 
      toast.error("Save failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="p-8 space-y-8 text-left bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic flex items-center gap-3">
            <Layers className="text-indigo-600" /> Bill of Materials <span className="text-indigo-600">(BOM)</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-1">Define Recipes & Product Costing</p>
        </div>
      </div>

      <div className="bg-white border rounded-[2.5rem] p-8 shadow-sm space-y-8">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex-1 min-w-[300px]">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">Target Finished Good</label>
            <Select options={products} onChange={setSelectedProduct} value={selectedProduct} styles={customSelectStyles} placeholder="Select Product..." />
          </div>
          <div className="w-40">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">Machine Cost</label>
            <input type="number" value={machineCost} onChange={(e) => setMachineCost(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="₹ 0" />
          </div>
          <div className="w-32">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">Margin %</label>
            <input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="20%" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Raw Material Requirements</label>
          <div className="space-y-3">
            {recipe.map((item, index) => (
              <div key={index} className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all">
                <div className="flex-1">
                  <Select 
                    options={getFilteredOptions(index)} 
                    onChange={(opt) => {
                      handleInputChange(index, "materialId", opt.value);
                      handleInputChange(index, "price", opt.price);
                      handleInputChange(index, "name", opt.name);
                      handleInputChange(index, "itemid", opt.itemid);
                    }}
                    value={rawMaterials.find(rm => rm.value === item.materialId)}
                    styles={customSelectStyles} 
                    placeholder="Search Raw Material..." 
                  />
                </div>
                <div className="w-32 flex items-center bg-white rounded-xl border px-3">
                  <span className="text-[9px] font-black text-slate-300 uppercase mr-2">Qty</span>
                  <input type="number" value={item.quantity} onChange={(e) => handleInputChange(index, "quantity", e.target.value)} className="w-full p-2 font-bold text-sm outline-none" />
                </div>
                <div className="w-32 text-center">
                  <p className="text-[9px] font-black text-slate-300 uppercase">Subtotal</p>
                  <p className="text-xs font-black text-emerald-600 italic">₹{(item.quantity * item.price).toLocaleString()}</p>
                </div>
                <button onClick={() => setRecipe(recipe.filter((_, i) => i !== index))} className="p-3 bg-red-50 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all">
                  <Trash2 size={16}/>
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => setRecipe([...recipe, { materialId: "", quantity: 1, name: "", itemid: "", price: 0 }])} className="mt-4 flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-6 py-3 rounded-full hover:bg-indigo-600 hover:text-white transition-all">
            <Plus size={14}/> Add Another Material Row
          </button>
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-slate-100">
           <div className="flex gap-8">
             <div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Material Cost</p>
               <p className="text-lg font-bold text-slate-700">₹{totalMaterialCost.toLocaleString()}</p>
             </div>
             <div className="h-10 w-[1px] bg-slate-100"/>
             <div>
               <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Calculated MRP</p>
               <p className="text-2xl font-black text-indigo-600">₹{finalMRP.toLocaleString()}</p>
             </div>
           </div>
           <button onClick={handleSaveBOM} disabled={loading} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center gap-2">
             {loading ? "Saving Master..." : <><Save size={18}/> Finalize & Save BOM</>}
           </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">Recipe Master Database</h3>
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Product Name</th>
                <th className="px-8 py-5">Ingredient Structure</th>
                <th className="px-8 py-5 text-center">Final Unit MRP</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {savedBoms.map((bom) => (
                <tr key={bom.id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-8 py-5 font-black text-slate-800 uppercase text-sm">{bom.productName}</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-2">
                      {bom.ingredients.map((ing, i) => (
                        <span key={i} className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase border">
                          {ing.name} ({ing.quantity})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-black text-indigo-600 text-base italic">₹{bom.finalMRP?.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={async () => { if(window.confirm("Delete BOM?")) { await deleteDoc(doc(db, "boms", bom.id)); fetchAllData(); } }} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const customSelectStyles = {
  control: (base, state) => ({ 
    ...base, 
    background: "#f8fafc", 
    borderColor: state.isFocused ? "#6366f1" : "#f1f5f9", 
    borderRadius: "1.2rem", 
    padding: "0.3rem",
    boxShadow: "none",
    fontSize: "0.85rem",
    fontWeight: "700"
  }),
  option: (base, state) => ({ 
    ...base, 
    background: state.isSelected ? "#6366f1" : state.isFocused ? "#eef2ff" : "white", 
    color: state.isSelected ? "white" : "#1e293b",
    fontSize: "0.8rem",
    fontWeight: "600"
  })
};

export default BOM;