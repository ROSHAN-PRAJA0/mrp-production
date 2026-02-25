import React, { useState, useEffect, useContext, useMemo } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc, addDoc, serverTimestamp, query, orderBy, where, getDocs, increment, limit } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import Sidebar from "../../components/Sidebar";
import UserMenu from "../../components/UserMenu";
import EditStockModal from "../../components/EditStockModal";
import ProductAlerts from "./ProductAlerts";
import ReorderSetup from "./ReorderSetup";
import FinishedGoods from "./FinishedGoods";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { 
  Package, LayoutDashboard, AlertTriangle, Activity, 
  RefreshCcw, ArrowLeftRight, Plus, 
  Search, Trash2, Edit, CheckCircle, ArrowUpCircle, ArrowDownCircle, 
  ListOrdered, Clock, Check, PackagePlus, X, DollarSign, ArrowUpRight, ArrowDownRight, Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// --- Sub-Component: Inventory Dashboard ---
const InventoryDashboard = ({ stocks, movements }) => {
  const stats = useMemo(() => {
    const totalValue = stocks.reduce((acc, s) => acc + (Number(s.quantity || 0) * Number(s.actualPrice || 0)), 0);
    const lowStockCount = stocks.filter(s => Number(s.quantity) < 100).length;
    const stockIn = movements.filter(m => m.type === "IN").reduce((acc, m) => acc + Number(m.quantity), 0);
    const stockOut = movements.filter(m => m.type === "OUT").reduce((acc, m) => acc + Number(m.quantity), 0);
    return { totalValue, lowStockCount, stockIn, stockOut };
  }, [stocks, movements]);

  const pieData = useMemo(() => {
    const categories = {};
    stocks.forEach(s => {
      const cat = s.groupName || "General";
      categories[cat] = (categories[cat] || 0) + Number(s.quantity);
    });
    return Object.keys(categories).map(key => ({ name: key, value: categories[key] }));
  }, [stocks]);

  const barData = useMemo(() => {
    return [...stocks]
      .sort((a, b) => Number(b.quantity) - Number(a.quantity))
      .slice(0, 5)
      .map(s => ({ name: s.name, qty: s.quantity }));
  }, [stocks]);

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Inventory Value" value={`₹ ${stats.totalValue.toLocaleString()}`} icon={<DollarSign size={20}/>} color="indigo" />
        <StatCard title="Critical Low Stock" value={stats.lowStockCount} icon={<AlertTriangle size={20}/>} color="red" />
        <StatCard title="Monthly Intake" value={stats.stockIn} icon={<ArrowUpRight size={20}/>} color="emerald" />
        <StatCard title="Monthly Dispatch" value={stats.stockOut} icon={<ArrowDownRight size={20}/>} color="orange" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={16} className="text-indigo-600"/> Top Stock Levels</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="qty" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={16} className="text-emerald-600"/> Stock Distribution</h3>
          <div className="h-64 flex flex-col md:flex-row items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 min-w-[150px]">
              {pieData.slice(0, 4).map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                  <span className="text-[10px] font-bold text-slate-600 truncate">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    red: "bg-red-50 text-red-600 border-red-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100"
  };
  return (
    <div className={`p-6 rounded-[2rem] border shadow-sm ${colors[color]} flex items-center gap-5`}>
      <div className="bg-white/80 p-3 rounded-2xl shadow-sm">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</p>
        <h4 className="text-xl font-black">{value}</h4>
      </div>
    </div>
  );
};

// --- Sub-Component: Receive Stock Modal ---
const ReceiveStockModal = ({ item, onClose, onConfirm, stocks }) => {
    // Find current price from current inventory stocks
    const currentInventoryItem = stocks.find(s => s.itemid === item.itemid);
    
    const [formData, setFormData] = useState({
        quantity: item.requestedQty || '',
        actualPrice: currentInventoryItem?.actualPrice || '', // Default to existing price
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(item, formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                        <PackagePlus className="text-emerald-500"/> Receive Stock
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors"><X size={20} /></button>
                </div>
                <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">
                    Confirming arrival for: <span className="text-indigo-600 italic">{item.name}</span>
                </p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Received Quantity</label>
                        <input type="number" value={formData.quantity} onChange={(e)=>setFormData({...formData, quantity: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-2xl font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all" required/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Unit Cost (₹) <span className="text-[8px] text-indigo-500">(Auto-filled from Inventory)</span></label>
                        <input type="number" step="0.01" value={formData.actualPrice} onChange={(e)=>setFormData({...formData, actualPrice: e.target.value})} className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-2xl font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Enter cost..." required/>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">Cancel</button>
                        <button type="submit" className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
                            <Check size={18}/> Update Stock
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main Component ---
export default function InventoryMaster() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Inventory Dashboard");
  const [stockItems, setStockItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [reorders, setReorders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [receiveModalItem, setReceiveModalItem] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "stocks"), (snap) => {
      setStockItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "movements"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMovements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || (activeTab !== "Purchase Orders" && activeTab !== "Inventory Dashboard")) return;
    const q = query(collection(db, 'reorders'), where('adminUID', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setReorders(data.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)));
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
    { name: "Reorder Setup", icon: <ArrowLeftRight size={14} /> },
    { name: "Purchase Orders", icon: <ListOrdered size={14} /> },
    { name: "Finished Goods Stock", icon: <CheckCircle size={14} /> },
    { name: "Stock Movements", icon: <RefreshCcw size={14} /> },
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

  const handleConfirmReceive = async (reorderItem, updatedData) => {
    const toastId = toast.loading("Recording incoming stock...");
    try {
        const stockRef = collection(db, "users", user.uid, "stocks");
        const q = query(stockRef, where("itemid", "==", reorderItem.itemid));
        const stockSnap = await getDocs(q);
        if (stockSnap.empty) throw new Error("Item not found in main stock directory.");
        const stockDoc = stockSnap.docs[0];
        
        await updateDoc(stockDoc.ref, {
            quantity: increment(Number(updatedData.quantity)),
            actualPrice: Number(updatedData.actualPrice),
            updatedAt: serverTimestamp()
        });

        await updateDoc(doc(db, 'reorders', reorderItem.id), { status: 'completed' });

        await addDoc(collection(db, "users", user.uid, "movements"), {
            itemid: reorderItem.itemid,
            name: reorderItem.name,
            type: "IN",
            quantity: Number(updatedData.quantity),
            reason: `Purchase Order Received (${reorderItem.supplierName})`,
            timestamp: serverTimestamp(),
            user: user.email
        });

        setReceiveModalItem(null);
        toast.success("Stock updated and movement recorded!", { id: toastId });
    } catch (error) {
        toast.error(`Error: ${error.message}`, { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this item permanently?")) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "stocks", id));
        toast.success("Item Deleted Successfully");
      } catch (err) { toast.error("Delete Failed"); }
    }
  };

  const deletePO = async (id) => {
    if (window.confirm("Delete this purchase order record?")) {
        await deleteDoc(doc(db, 'reorders', id));
        toast.success("Order deleted");
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <main className="p-8 space-y-6 w-full max-w-7xl mx-auto">
          {receiveModalItem && (
            <ReceiveStockModal 
               item={receiveModalItem} 
               stocks={stockItems} 
               onClose={()=>setReceiveModalItem(null)} 
               onConfirm={handleConfirmReceive} 
            />
          )}
          <EditStockModal item={selectedItem} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEdit} />
          
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
            <UserMenu /> 
          </div>

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
            {activeTab === "Inventory Dashboard" && <InventoryDashboard stocks={stockItems} movements={movements} />}
            
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

            {activeTab === "Purchase Orders" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 flex items-center justify-between">
                            <div><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Requests</p><h4 className="text-2xl font-black text-slate-800">{reorders.filter(r=>r.status === 'pending').length}</h4></div>
                            <Clock className="text-indigo-600" size={32}/>
                        </div>
                        <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
                            <div><p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Received Batches</p><h4 className="text-2xl font-black text-slate-800">{reorders.filter(r=>r.status === 'completed').length}</h4></div>
                            <CheckCircle className="text-emerald-500" size={32}/>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-50 text-[10px] uppercase font-black text-slate-400">
                                <tr><th className="px-4 py-4">Ordered Part</th><th className="px-4 py-4">Supplier</th><th className="px-4 py-4 text-center">Qty</th><th className="px-4 py-4 text-center">Status</th><th className="px-4 py-4 text-right">Actions</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs font-bold">
                                {reorders.length > 0 ? reorders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-4 py-5"><p className="text-slate-800">{order.name}</p><p className="text-[9px] text-indigo-500 font-black">SKU: {order.itemid}</p></td>
                                        <td className="px-4 py-5 text-slate-500">{order.supplierName}</td>
                                        <td className="px-4 py-5 text-center font-black">{order.requestedQty}</td>
                                        <td className="px-4 py-5 text-center"><span className={`px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-tight ${order.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{order.status}</span></td>
                                        <td className="px-4 py-5 text-right flex justify-end gap-2">
                                            {order.status === 'pending' && <button onClick={()=>setReceiveModalItem(order)} className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[9px] font-black hover:bg-emerald-500 transition-all uppercase tracking-widest flex items-center gap-1"><PackagePlus size={12}/> Receive</button>}
                                            <button onClick={()=>deletePO(order.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan="5" className="py-20 text-center font-black text-slate-300 uppercase tracking-widest text-[10px]">No active purchase orders</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "Stock Movements" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Live Movement Ledger</h3>
                  <div className="flex gap-4 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-emerald-600"><ArrowUpCircle size={12}/> STOCK IN</span>
                    <span className="flex items-center gap-1 text-red-600"><ArrowDownCircle size={12}/> STOCK OUT</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400">
                      <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Item Details</th><th className="px-6 py-4 text-center">Type</th><th className="px-6 py-4 text-center">Qty</th><th className="px-6 py-4">Reason / Source</th></tr>
                    </thead>
                    <tbody className="divide-y text-xs font-bold text-slate-600">
                      {movements.map((mv) => (
                        <tr key={mv.id} className="hover:bg-slate-50 transition-all">
                          <td className="px-6 py-4 text-slate-400 font-mono">{mv.timestamp?.toDate().toLocaleString() || 'Processing...'}</td>
                          <td className="px-6 py-4"><p className="text-slate-800">{mv.name}</p><p className="text-[10px] text-indigo-500 font-black">SKU: {mv.itemid}</p></td>
                          <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black ${mv.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{mv.type}</span></td>
                          <td className="px-6 py-4 text-center text-slate-900 font-black">{mv.quantity}</td>
                          <td className="px-6 py-4"><p className="text-[10px] uppercase tracking-tight">{mv.reason}</p><p className="text-[9px] text-slate-300 uppercase italic font-medium">Recorded by: {mv.user?.split('@')[0]}</p></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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