import React, { useState, useEffect, useContext, useMemo } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import Sidebar from "../../components/Sidebar";
import UserMenu from "../../components/UserMenu"; // Naya import
import EditStockModal from "../../components/EditStockModal";
import ProductAlerts from "./ProductAlerts";
import ReorderSetup from "./ReorderSetup";
import FinishedGoods from "./FinishedGoods";
import { 
  Package, LayoutDashboard, AlertTriangle, Activity, 
  RefreshCcw, ArrowLeftRight, Plus, 
  Search, Trash2, Edit, CheckCircle, ArrowUpCircle, ArrowDownCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function InventoryMaster() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Stock Levels");
  const [stockItems, setStockItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "stocks"), (snap) => {
      setStockItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || activeTab !== "Stock Movements") return;
    const q = query(collection(db, "users", user.uid, "movements"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMovements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user, activeTab]);

  const filteredStocks = useMemo(() => stockItems.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemid?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [stockItems, searchTerm]);

  const tabs = [
    { name: "Inventory Dashboard", icon: <LayoutDashboard size={14} /> },
    { name: "Stock Levels", icon: <Package size={14} /> },
    { name: "Product Alerts", icon: <AlertTriangle size={14} /> },
    { name: "Finished Goods Stock", icon: <CheckCircle size={14} /> },
    { name: "Stock Movements", icon: <RefreshCcw size={14} /> },
    { name: "Reorder Setup", icon: <ArrowLeftRight size={14} /> },
  ];

  const handleEdit = (item) => { setSelectedItem(item); setIsModalOpen(true); };

  const handleSaveEdit = async (id, updatedData) => {
    try {
      const oldQty = Number(selectedItem.quantity);
      const newQty = Number(updatedData.quantity);
      const diff = newQty - oldQty;
      await updateDoc(doc(db, "users", user.uid, "stocks", id), {
        ...updatedData,
        actualPrice: Number(updatedData.actualPrice),
        quantity: newQty
      });
      if (diff !== 0) {
        await addDoc(collection(db, "users", user.uid, "movements"), {
          itemid: updatedData.itemid,
          name: updatedData.name,
          type: diff > 0 ? "IN" : "OUT",
          quantity: Math.abs(diff),
          reason: "Manual Adjustment / Edit",
          timestamp: serverTimestamp(),
          user: user.email
        });
      }
      toast.success("Inventory Updated!");
      setIsModalOpen(false);
    } catch (err) { toast.error("Update Failed"); }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Topbar hatakar directly main content with Header */}
        <main className="p-8 space-y-6 w-full max-w-7xl mx-auto">
          <EditStockModal item={selectedItem} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEdit} />
          
          {/* Header Row with User Info on Right */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Inventory Management</h2>
              <div className="flex items-center gap-4">
                 <button onClick={() => navigate("/add-stock")} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-md flex items-center gap-2 hover:bg-indigo-700 transition-all uppercase">
                  <Plus size={14} /> New Intake
                </button>
                <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-slate-100 w-64 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                  <Search size={14} className="text-slate-400" />
                  <input placeholder="Search SKU..." className="bg-transparent border-none outline-none ml-2 w-full text-[11px] font-bold text-slate-700" onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </div>
            <UserMenu /> {/* Right Corner Name */}
          </div>

          {/* Tabs moved up */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-100 flex gap-1 overflow-x-auto no-scrollbar shadow-sm">
            {tabs.map((tab) => (
              <button key={tab.name} onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase whitespace-nowrap transition-all ${
                  activeTab === tab.name ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                }`}>
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 min-h-[500px]">
            {activeTab === "Stock Levels" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-4 py-4">Item ID & Name</th>
                      <th className="px-4 py-4 text-center">Stock Quantity</th>
                      <th className="px-4 py-4">Unit Cost</th>
                      <th className="px-4 py-4">Total Value</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredStocks.map((item) => {
                      const totalVal = Number(item.quantity || 0) * Number(item.actualPrice || 0);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-4 py-5">
                            <span className="text-indigo-600 block text-[9px] font-black uppercase tracking-tighter">REF: {item.itemid}</span>
                            <p className="font-bold text-slate-800">{item.name}</p>
                          </td>
                          <td className="px-4 py-5 text-center">
                            <span className={`px-2 py-1 rounded-lg font-black ${item.quantity <= 10 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                              {item.quantity} {item.unit || 'pcs'}
                            </span>
                          </td>
                          <td className="px-4 py-5 font-bold text-slate-500">₹{Number(item.actualPrice).toLocaleString()}</td>
                          <td className="px-4 py-5 font-black text-indigo-600 font-mono">₹{totalVal.toLocaleString()}</td>
                          <td className="px-4 py-5 text-right flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(item)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Edit size={14}/></button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={14}/></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === "Stock Movements" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Live Movement Ledger</h3>
                  <div className="flex gap-4 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-600"><ArrowUpCircle size={12}/> STOCK IN</span>
                    <span className="flex items-center gap-1 text-red-600"><ArrowDownCircle size={12}/> STOCK OUT</span>
                  </div>
                </div>
                {/* Movement Table Code ... */}
              </div>
            )}
            {activeTab === "Product Alerts" && <ProductAlerts />}
            {activeTab === "Reorder Setup" && <ReorderSetup />}
            {activeTab === "Finished Goods Stock" && <FinishedGoods />}
          </div>
        </main>
      </div>
    </div>
  );
}