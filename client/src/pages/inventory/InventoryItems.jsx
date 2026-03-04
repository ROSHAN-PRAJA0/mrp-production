import React, { useState, useEffect, useContext, useMemo } from "react";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import { Search, Trash2, Edit, Package, Hash, Tag } from "lucide-react";
import toast from "react-hot-toast";

export default function InventoryItems({ onEdit }) {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    // Direct listener to the stocks collection
    const unsub = onSnapshot(collection(db, "users", user.uid, "stocks"), (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredItems = useMemo(() => items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemid?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [items, searchTerm]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this item from the master list?")) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "stocks", id));
        toast.success("Item removed successfully");
      } catch (err) {
        toast.error("Failed to delete item");
      }
    }
  };

  if (loading) return <div className="py-20 text-center font-bold text-slate-400 animate-pulse">Loading Inventory Items...</div>;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 w-full max-w-md focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
        <Search size={18} className="text-slate-400" />
        <input 
          placeholder="Search by SKU or Item Name..." 
          className="bg-transparent border-none outline-none ml-3 w-full text-sm font-bold text-slate-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length > 0 ? filteredItems.map((item) => (
          <div key={item.id} className="bg-white border border-slate-100 p-5 rounded-[2rem] hover:shadow-md transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                <Package size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(item)} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                  <Edit size={16}/>
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase">
                  <Hash size={10}/> {item.itemid}
                </span>
                <span className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase">
                  <Tag size={10}/> {item.groupName || 'General'}
                </span>
              </div>
              <h4 className="text-lg font-black text-slate-800 pt-1">{item.name}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{item.groupNo}</p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Available Stock</p>
                <p className={`text-xl font-black ${item.quantity < 100 ? 'text-red-500' : 'text-slate-800'}`}>
                  {item.quantity} <span className="text-xs text-slate-400">{item.unit || 'pcs'}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Unit Cost</p>
                <p className="text-sm font-black text-emerald-600">₹{Number(item.actualPrice).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase italic tracking-widest text-xs">
            No items found in inventory
          </div>
        )}
      </div>
    </div>
  );
}