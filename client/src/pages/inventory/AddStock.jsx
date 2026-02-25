import React, { useState, useEffect, useContext } from "react";
import {
  collection,
  addDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../../config/firebase"; 
import Sidebar from "../../components/Sidebar";
import { AuthContext } from "../../routes/AuthProvider";
import { PlusCircle, Search, Package, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const AddStock = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.uid;

  const initialRowState = {
    itemid: "", // Part No
    name: "",   // Description
    groupNo: "", 
    groupName: "",
    unit: "pcs",
    quantity: "", 
    actualPrice: "", // Cost
    sellingPrice: "", // Estimated Value
  };

  const [stockItems, setStockItems] = useState([initialRowState]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mrp, setMrp] = useState("");
  const [discount, setDiscount] = useState("");
  const [calculatedPrice, setCalculatedPrice] = useState(null);

  // Selling Price Calculator Logic
  useEffect(() => {
    if (mrp > 0 && discount >= 0 && discount <= 100) {
      const finalPrice = mrp - mrp * (discount / 100);
      setCalculatedPrice(finalPrice.toFixed(2));
    } else {
      setCalculatedPrice(null);
    }
  }, [mrp, discount]);

  const handleInputChange = (index, field, value) => {
    const updated = [...stockItems];
    updated[index][field] = value;

    if (field === "itemid") {
      const isDuplicate = updated.some(
        (item, i) => i !== index && item.itemid.trim() === value.trim() && value.trim() !== ""
      );
      if (isDuplicate) {
        toast.error("Part No already entered in another row.");
        updated[index][field] = "";
      }
    }
    setStockItems(updated);
  };

  const getItemDetails = async (index) => {
    try {
      const itemid = stockItems[index].itemid;
      if (!itemid || !userId) return toast.error("Enter Part No first");

      const q = query(collection(db, "users", userId, "stocks"), where("itemid", "==", itemid));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        const existingItem = querySnap.docs[0].data();
        const updated = [...stockItems];
        updated[index] = { 
          ...updated[index], 
          ...existingItem, 
          quantity: "", 
        };
        setStockItems(updated);
        toast.success("Part details fetched!");
      } else {
        toast.error("New Part Detected. Fill details.");
      }
    } catch (err) {
      toast.error("Error fetching part details.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !userId) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Updating inventory and recording movements...");

    try {
      const validItems = stockItems.filter(item => item.itemid && item.quantity > 0);

      for (const item of validItems) {
        const stockRef = collection(db, "users", userId, "stocks");
        const q = query(stockRef, where("itemid", "==", item.itemid));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const itemRef = doc(db, "users", userId, "stocks", snap.docs[0].id);
          await updateDoc(itemRef, {
            quantity: increment(Number(item.quantity)),
            actualPrice: Number(item.actualPrice),
            groupNo: item.groupNo,
            groupName: item.groupName,
            updatedAt: serverTimestamp(),
          });
        } else {
          await addDoc(stockRef, {
            ...item,
            quantity: Number(item.quantity),
            actualPrice: Number(item.actualPrice),
            addedAt: serverTimestamp(),
          });
        }

        await addDoc(collection(db, "users", userId, "movements"), {
          itemid: item.itemid,
          name: item.name,
          type: "IN",
          quantity: Number(item.quantity),
          reason: "Raw Material Intake",
          timestamp: serverTimestamp(),
          user: user.email
        });
      }

      toast.success("Inventory updated and movements recorded!", { id: toastId });
      setStockItems([initialRowState]);
    } catch (err) {
      toast.error("Submission failed.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalValue = stockItems.reduce((acc, item) => acc + Number(item.quantity) * Number(item.actualPrice || 0), 0);

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Shifting Content Up by removing Topbar and using p-8 directly */}
        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Header with Name/Role in Right Corner */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <Package className="text-indigo-600"/> Raw Material Intake
              </h2>
              <p className="text-slate-500 font-medium">Add materials with Part No, Group Details, and Cost.</p>
            </div>

            {/* User Details in Top Right Corner */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-right pl-2">
                <p className="text-sm font-bold text-slate-800 leading-none">{user?.displayName || user?.name || "Administrator"}</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Admin Account</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                {(user?.displayName || user?.name || "A").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Calculator Tool */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center mt-2">
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border">
                <span className="text-xs font-bold text-slate-400">MRP</span>
                <input type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} className="bg-transparent outline-none w-full font-bold text-right"/>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border">
                <span className="text-xs font-bold text-slate-400">Discount %</span>
                <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="bg-transparent outline-none w-full font-bold text-right"/>
             </div>
             {calculatedPrice && (
                <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold text-center">
                  Est. Price: ₹{calculatedPrice}
                </div>
             )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Part No</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Group Name</th>
                    <th className="px-6 py-4">Group No</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Cost (₹)</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockItems.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-all">
                      <td className="p-4">
                        <div className="flex items-center bg-white border rounded-xl overflow-hidden shadow-sm">
                          <input type="text" value={item.itemid} onChange={(e) => handleInputChange(index, "itemid", e.target.value)} className="p-2 w-full outline-none text-sm font-bold text-indigo-600" placeholder="P-101"/>
                          <button type="button" onClick={() => getItemDetails(index)} className="bg-indigo-600 text-white p-2"><Search size={16}/></button>
                        </div>
                      </td>
                      <td className="p-4">
                        <input type="text" value={item.name} onChange={(e) => handleInputChange(index, "name", e.target.value)} className="w-full outline-none text-sm font-semibold" placeholder="Steel Plate 5mm"/>
                      </td>
                      <td className="p-4">
                        <input type="text" value={item.groupName} onChange={(e) => handleInputChange(index, "groupName", e.target.value)} className="w-full outline-none text-sm font-semibold text-slate-600" placeholder="Metals"/>
                      </td>
                      <td className="p-4">
                        <input type="text" value={item.groupNo} onChange={(e) => handleInputChange(index, "groupNo", e.target.value)} className="w-full outline-none text-sm font-bold text-slate-400 uppercase" placeholder="GP-01"/>
                      </td>
                      <td className="p-4">
                         <select value={item.unit} onChange={(e) => handleInputChange(index, "unit", e.target.value)} className="bg-transparent font-bold text-xs outline-none">
                            <option>pcs</option><option>kg</option><option>mtr</option><option>box</option>
                         </select>
                      </td>
                      <td className="p-4"><input type="number" value={item.quantity} onChange={(e) => handleInputChange(index, "quantity", e.target.value)} className="w-20 font-black text-slate-800 outline-none" placeholder="0"/></td>
                      <td className="p-4"><input type="number" value={item.actualPrice} onChange={(e) => handleInputChange(index, "actualPrice", e.target.value)} className="w-24 font-black text-emerald-600 outline-none" placeholder="0.00"/></td>
                      <td className="p-4 text-right">
                        <button type="button" onClick={() => setStockItems(stockItems.filter((_, i) => i !== index))} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 bg-slate-50/50 flex justify-between border-t">
                 <button type="button" onClick={() => setStockItems([...stockItems, initialRowState])} className="flex items-center gap-2 text-indigo-600 font-bold hover:underline transition-all"><PlusCircle size={20}/> Add More Parts</button>
                 <div className="flex items-center gap-8">
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Total Batch Cost</p>
                       <p className="text-xl font-black text-slate-900">₹ {totalValue.toLocaleString()}</p>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black shadow-lg hover:bg-slate-800 transition-all">
                      {isSubmitting ? "PROCESSING..." : "SUBMIT INTAKE"}
                    </button>
                 </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddStock;