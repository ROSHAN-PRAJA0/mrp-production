import { useState, useEffect, useContext, useMemo } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import Select from "react-select";
import { Plus, Trash2, Save, Layers, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function BOM() {
  const { user, adminUID, role } = useContext(AuthContext);
  const [stockItems, setStockItems] = useState([]);
  const [bomItems, setBomItems] = useState([]);
  const effectiveAdminUID = role === "admin" ? user?.uid : adminUID;

  // Stock items fetch karna (Raw Materials ke liye)
  useEffect(() => {
    if (!effectiveAdminUID) return;
    const unsub = onSnapshot(collection(db, "users", effectiveAdminUID, "stocks"), (snap) => {
      setStockItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [effectiveAdminUID]);

  const searchOptions = useMemo(() =>
    stockItems.map(item => ({
      value: item.itemid,
      label: `${item.name} (${item.brand}) - Avail: ${item.quantity}`,
      ...item
    })), [stockItems]);

  const addComponent = (selectedOption) => {
    if (!selectedOption) return;
    const exists = bomItems.find(i => i.itemid === selectedOption.itemid);
    if (exists) return toast.error("Material already in BOM");
    
    setBomItems([...bomItems, { ...selectedOption, requiredQty: 1 }]);
  };

  const removeComponent = (id) => {
    setBomItems(bomItems.filter(item => item.id !== id));
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Topbar />
        <main className="p-8 space-y-6 max-w-6xl mx-auto w-full">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Layers className="text-indigo-600" /> BOM Master
            </h2>
            <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Save size={20} /> Finalize Product Recipe
            </button>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Add Raw Material to BOM</label>
              <Select options={searchOptions} onChange={addComponent} placeholder="Search Materials..." isClearable value={null} />
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl flex items-start gap-3 border border-indigo-100">
              <Info className="text-indigo-600 mt-1" size={18} />
              <p className="text-xs text-indigo-700 font-medium">Define exactly how much material is needed to produce 1 unit of finished product.</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  <th className="px-8 py-4">Component Details</th>
                  <th className="px-8 py-4 text-center">Required Qty</th>
                  <th className="px-8 py-4">Unit Cost (Est.)</th>
                  <th className="px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bomItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-4">
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400 font-medium">SKU: {item.itemid}</p>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <input type="number" defaultValue="1" className="w-24 p-2 border rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                    </td>
                    <td className="px-8 py-4 font-bold text-slate-600">₹{item.actualPrice || 0}</td>
                    <td className="px-8 py-4 text-right">
                      <button onClick={() => removeComponent(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}