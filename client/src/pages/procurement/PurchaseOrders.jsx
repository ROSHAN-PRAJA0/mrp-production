import React, { useState, useEffect, useContext } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc, addDoc, serverTimestamp, query, where, getDocs, increment } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import Sidebar from "../../components/Sidebar";
import UserMenu from "../../components/UserMenu";
import { PackagePlus, Trash2, Clock, CheckCircle, X, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function PurchaseOrdersPage() {
  const { user } = useContext(AuthContext);
  const [reorders, setReorders] = useState([]);
  const [receiveModalItem, setReceiveModalItem] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "reorders"), where("adminUID", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReorders(data);
    });
    return () => unsub();
  }, [user]);

  const deletePO = async (id) => {
    if (window.confirm("Delete this purchase order record?")) {
      await deleteDoc(doc(db, "reorders", id));
      toast.success("Order deleted");
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <main className="p-8 space-y-6 max-w-7xl mx-auto">
          
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase text-slate-800">
              Purchase Orders
            </h2>
            <UserMenu />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-6 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-indigo-400 uppercase">Active Requests</p>
                <h4 className="text-2xl font-black">
                  {reorders.filter(r => r.status === "pending").length}
                </h4>
              </div>
              <Clock className="text-indigo-600" size={32} />
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-emerald-400 uppercase">Received</p>
                <h4 className="text-2xl font-black">
                  {reorders.filter(r => r.status === "completed").length}
                </h4>
              </div>
              <CheckCircle className="text-emerald-500" size={32} />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border">
            <table className="w-full text-left">
              <thead className="border-b text-xs uppercase font-black text-slate-400">
                <tr>
                  <th className="py-4">Ordered Part</th>
                  <th>Supplier</th>
                  <th className="text-center">Qty</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {reorders.map(order => (
                  <tr key={order.id}>
                    <td className="py-4">
                      <p className="font-bold">{order.name}</p>
                      <p className="text-xs text-indigo-500">SKU: {order.itemid}</p>
                    </td>
                    <td>{order.supplierName}</td>
                    <td className="text-center">{order.requestedQty}</td>
                    <td className="text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${
                        order.status === "pending"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-emerald-100 text-emerald-600"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => deletePO(order.id)}
                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={16} />
                      </button>
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