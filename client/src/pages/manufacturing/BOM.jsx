import React, { useState, useEffect, useContext } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider"; // AuthContext zaroori hai
import Select from "react-select";
import { Plus, Trash2, Save, ListChecks } from "lucide-react";
import toast from "react-hot-toast";

const BOM = () => {
  const { user } = useContext(AuthContext); // Current login user ki details
  const userId = user?.uid;

  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recipe, setRecipe] = useState([{ materialId: "", quantity: 1, name: "" }]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!userId) return;

      try {
        // 1. Fetch Products (Finished Goods) from main 'inventory' collection
        const prodSnap = await getDocs(collection(db, "inventory"));
        const prodList = prodSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(i => i.type === "Finished Good")
          .map(i => ({ value: i.id, label: i.name }));
        setProducts(prodList);

        // 2. Fetch Raw Materials from 'users/userId/stocks' (As per your AddStock.jsx)
        const stockRef = collection(db, "users", userId, "stocks");
        const stockSnap = await getDocs(stockRef);
        const matList = stockSnap.docs.map(doc => ({
          value: doc.id, // Firestore Document ID
          label: `${doc.data().itemid} - ${doc.data().name}`, // Part No + Name
          name: doc.data().name,
          unit: doc.data().unit
        }));
        setRawMaterials(matList);

      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Stock data load nahi ho paya");
      }
    };

    fetchAllData();
  }, [userId]);

  const addIngredient = () => {
    setRecipe([...recipe, { materialId: "", quantity: 1, name: "" }]);
  };

  const removeIngredient = (index) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const handleSaveBOM = async () => {
    if (!selectedProduct || recipe.some(r => !r.materialId)) {
      toast.error("Product aur saare Materials select karein");
      return;
    }

    try {
      await addDoc(collection(db, "boms"), {
        productId: selectedProduct.value,
        productName: selectedProduct.label,
        ingredients: recipe,
        createdBy: userId,
        createdAt: serverTimestamp()
      });
      toast.success("BOM Recipe save ho gayi!");
      setRecipe([{ materialId: "", quantity: 1, name: "" }]);
      setSelectedProduct(null);
    } catch (error) {
      toast.error("BOM save karne mein error aaya");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-600/20 rounded-2xl">
            <ListChecks className="text-indigo-400" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white">Bill of Materials Builder</h2>
        </div>
        
        {/* Product Selection */}
        <div className="mb-10 bg-slate-800/20 p-6 rounded-3xl border border-slate-800">
          <label className="block text-slate-400 text-xs uppercase font-black tracking-widest mb-3 px-1">Select Target Product</label>
          <Select
            options={products}
            onChange={setSelectedProduct}
            value={selectedProduct}
            placeholder="Search finished goods..."
            styles={darkSelectStyles}
          />
        </div>

        {/* Ingredients Section */}
        <div className="space-y-4">
          <label className="block text-slate-400 text-xs uppercase font-black tracking-widest mb-1 px-1">Raw Materials Needed</label>
          {recipe.map((item, index) => (
            <div key={index} className="flex gap-4 items-center bg-slate-800/40 p-4 rounded-2xl border border-slate-800 transition-all hover:border-slate-700">
              <div className="flex-1">
                <Select
                  options={rawMaterials}
                  onChange={(opt) => {
                    const newRecipe = [...recipe];
                    newRecipe[index].materialId = opt.value;
                    newRecipe[index].name = opt.name;
                    setRecipe(newRecipe);
                  }}
                  placeholder="Select material (Part No)..."
                  styles={darkSelectStyles}
                />
              </div>
              <div className="flex items-center bg-slate-900 rounded-xl px-4 border border-slate-700 h-[42px]">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const newRecipe = [...recipe];
                    newRecipe[index].quantity = e.target.value;
                    setRecipe(newRecipe);
                  }}
                  className="w-16 bg-transparent text-white font-bold outline-none text-center"
                />
                <span className="text-slate-500 text-[10px] font-black uppercase ml-2">Qty</span>
              </div>
              <button onClick={() => removeIngredient(index)} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-between items-center border-t border-slate-800 pt-8">
          <button
            onClick={addIngredient}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-all font-bold"
          >
            <Plus size={18} /> Add Material
          </button>
          
          <button
            onClick={handleSaveBOM}
            className="flex items-center gap-2 px-12 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 font-black transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest"
          >
            <Save size={20} /> Save BOM
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Styles for React Select
const darkSelectStyles = {
  control: (base) => ({
    ...base,
    background: "#0f172a",
    borderColor: "#1e293b",
    borderRadius: "1rem",
    padding: "4px",
    color: "white",
    boxShadow: "none",
    '&:hover': { borderColor: '#4f46e5' }
  }),
  menu: (base) => ({ ...base, background: "#0f172a", borderRadius: "1rem", border: "1px solid #1e293b" }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? "#4f46e5" : "transparent",
    color: "white",
    cursor: "pointer",
    fontSize: "0.875rem"
  }),
  singleValue: (base) => ({ ...base, color: "white" }),
  input: (base) => ({ ...base, color: "white" }),
  placeholder: (base) => ({ ...base, color: "#64748b" })
};

export default BOM;