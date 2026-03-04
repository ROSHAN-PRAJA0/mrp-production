import React, { useState, useEffect, useContext, useMemo } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import Sidebar from "../../components/Sidebar";
import UserMenu from "../../components/UserMenu";
import EditStockModal from "../../components/EditStockModal";
import ProductAlerts from "./ProductAlerts";
import FinishedGoods from "./FinishedGoods";
import InventoryDashboard from "./InventoryDashboard";
import StockMovements from "./StockMovements";

import {
  Package,
  LayoutDashboard,
  AlertTriangle,
  RefreshCcw,
  Plus,
  Search,
  Trash2,
  Edit,
  CheckCircle,
  ListOrdered
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function InventoryMaster() {

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Inventory Dashboard");
  const [stockItems, setStockItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // STOCK FETCH
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(
      collection(db, "users", user.uid, "stocks"),
      (snap) => {
        setStockItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    return () => unsub();
  }, [user]);

  // MOVEMENTS FETCH
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "movements"),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMovements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  const filteredStocks = useMemo(() =>
    stockItems.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemid?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [stockItems, searchTerm]
  );

  // ✅ FINAL TABS (Reorder Removed)
  const tabs = [
    { name: "Inventory Dashboard", icon: <LayoutDashboard size={14} /> },
    { name: "Stock Levels", icon: <Package size={14} /> },
    { name: "Finished Goods Stock", icon: <CheckCircle size={14} /> },
    { name: "Stock Movements", icon: <RefreshCcw size={14} /> },
  ];

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSaveEdit = async (id, updatedData) => {
    try {
      const oldQty = Number(selectedItem.quantity);
      const newQty = Number(updatedData.quantity);
      const diff = newQty - oldQty;

      await updateDoc(doc(db, "users", user.uid, "stocks", id), {
        ...updatedData,
        quantity: newQty,
        actualPrice: Number(updatedData.actualPrice)
      });

      if (diff !== 0) {
        await addDoc(collection(db, "users", user.uid, "movements"), {
          itemid: updatedData.itemid,
          name: updatedData.name,
          type: diff > 0 ? "IN" : "OUT",
          quantity: Math.abs(diff),
          reason: "Manual Adjustment",
          timestamp: serverTimestamp(),
          user: user.email
        });
      }

      toast.success("Inventory Updated!");
      setIsModalOpen(false);

    } catch {
      toast.error("Update Failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this item permanently?")) {
      await deleteDoc(doc(db, "users", user.uid, "stocks", id));
      toast.success("Item Deleted");
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen flex text-left">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <main className="p-8 space-y-6 w-full max-w-7xl mx-auto">

          <EditStockModal
            item={selectedItem}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveEdit}
          />

          {/* HEADER */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black uppercase text-slate-800">
                Inventory Management
              </h2>

              <div className="flex items-center gap-4 mt-3">
                <button
                  onClick={() => navigate("/add-stock")}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2"
                >
                  <Plus size={14} /> New Intake
                </button>

                <div className="flex items-center bg-white px-3 py-2 rounded-xl border w-64">
                  <Search size={14} className="text-slate-400" />
                  <input
                    placeholder="Search SKU..."
                    className="ml-2 w-full outline-none text-xs font-bold"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <UserMenu />
          </div>

          {/* TABS */}
          <div className="bg-white p-1.5 rounded-2xl border flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase transition ${
                  activeTab === tab.name
                    ? "bg-indigo-600 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="bg-white rounded-3xl border p-8 min-h-[500px]">

            {activeTab === "Inventory Dashboard" && (
              <InventoryDashboard 
                stocks={stockItems} 
                movements={movements} 
              />
            )}

            {activeTab === "Stock Levels" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b text-xs uppercase font-black text-slate-400">
                    <tr>
                      <th className="py-4">Item</th>
                      <th>Qty</th>
                      <th>Unit Cost</th>
                      <th>Total Value</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {filteredStocks.map(item => {
                      const totalVal =
                        Number(item.quantity || 0) *
                        Number(item.actualPrice || 0);

                      return (
                        <tr key={item.id}>
                          <td className="py-4">
                            <p className="font-bold">{item.name}</p>
                            <p className="text-[10px] text-indigo-500">
                              SKU: {item.itemid}
                            </p>
                          </td>
                          <td>{item.quantity}</td>
                          <td>₹ {item.actualPrice}</td>
                          <td className="font-bold text-indigo-600">
                            ₹ {totalVal}
                          </td>
                          <td className="text-right space-x-2">
                            <button onClick={() => handleEdit(item)}>
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDelete(item.id)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "Product Alerts" && <ProductAlerts />}
            {activeTab === "Finished Goods Stock" && <FinishedGoods />}
            {activeTab === "Stock Movements" && <StockMovements />}
            

          </div>

        </main>
      </div>
    </div>
  );
}