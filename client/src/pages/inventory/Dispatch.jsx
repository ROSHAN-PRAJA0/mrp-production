import React, { useState, useEffect, useContext } from "react";
import { db } from "../../config/firebase";
import { 
  collection, getDocs, addDoc, doc, updateDoc, 
  increment, serverTimestamp, query, where 
} from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { Truck, Search, Package, ShoppingCart, User } from "lucide-react";
import toast from "react-hot-toast";

export default function Dispatch() {
  const { user } = useContext(AuthContext);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedItem, setSelectedItem] = useState(null);
  const [dispatchQty, setDispatchQty] = useState("");
  const [customerName, setCustomerName] = useState("");

  const fetchData = async () => {
    if (!user?.uid) return;
    try {
      // Sirf wahi items fetch karein jo 'Finished Goods' hain
      const q = query(collection(db, "users", user.uid, "stocks"), where("category", "==", "Finished Goods"));
      const snap = await getDocs(q);
      setFinishedGoods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    } catch (err) {
      toast.error("Error loading stock");
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!selectedItem || !dispatchQty || !customerName) return toast.error("Please fill all fields");
    if (Number(dispatchQty) > Number(selectedItem.quantity)) return toast.error("Not enough stock!");

    const toastId = toast.loading("Processing Dispatch...");
    try {
      const stockRef = doc(db, "users", user.uid, "stocks", selectedItem.id);
      
      // 1. Inventory se mal kam karein
      await updateDoc(stockRef, {
        quantity: increment(-Number(dispatchQty)),
        updatedAt: serverTimestamp()
      });

      // 2. Movement Ledger mein "OUT" entry karein (Dashboard profit yahan se uthayega)
      // IMPORTANT: sellingPrice aur actualPrice (cost) dono save karna zaroori hai
      await addDoc(collection(db, "users", user.uid, "movements"), {
        itemid: selectedItem.itemid,
        name: selectedItem.name,
        type: "OUT",
        quantity: Number(dispatchQty),
        sellingPrice: Number(selectedItem.sellingPrice || 0),
        costPrice: Number(selectedItem.actualPrice || 0), // Base cost for profit calculation
        reason: `Sales Dispatch to ${customerName}`,
        timestamp: serverTimestamp(),
        user: user.email
      });

      toast.success("Dispatch Successful!", { id: toastId });
      
      // Reset Form
      setDispatchQty("");
      setCustomerName("");
      setSelectedItem(null);
      fetchData(); // Refresh List
    } catch (err) {
      toast.error("Dispatch Failed");
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-left">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar title="Sales & Dispatch" />
        <main className="p-8 space-y-8 max-w-5xl mx-auto w-full">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase italic flex items-center gap-3">
                <Truck className="text-indigo-600" /> Dispatch Center
              </h2>
              <p className="text-slate-500 font-medium">Move Finished Goods from Warehouse to Customer.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dispatch Form */}
            <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">New Dispatch Order</h3>
              <form onSubmit={handleDispatch} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Select Product</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    onChange={(e) => setSelectedItem(finishedGoods.find(i => i.id === e.target.value))}
                    value={selectedItem?.id || ""}
                  >
                    <option value="">Choose Finished Good...</option>
                    {finishedGoods.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.quantity} available)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Customer Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 text-slate-400" size={18}/>
                    <input 
                      type="text" 
                      className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                      placeholder="e.g. Reliance Ind."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Quantity to Dispatch</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                    placeholder="0"
                    value={dispatchQty}
                    onChange={(e) => setDispatchQty(e.target.value)}
                  />
                </div>

                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                  <ShoppingCart size={16}/> Confirm Dispatch
                </button>
              </form>
            </div>

            {/* Current Finished Goods Preview */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">Available for Sale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {finishedGoods.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Package size={20}/></div>
                      <span className="text-xl font-black text-slate-800">{item.quantity}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 mt-4">{item.name}</h4>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">MRP: ₹{item.sellingPrice}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}