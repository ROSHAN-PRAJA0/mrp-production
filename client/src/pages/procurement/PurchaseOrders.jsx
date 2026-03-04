import React, { useState, useEffect, useContext } from "react";
import { 
  collection, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import { Trash2, Clock, CheckCircle, PackagePlus } from "lucide-react";
import toast from "react-hot-toast";

export default function PurchaseOrdersPage() {
  const { user } = useContext(AuthContext);
  const [reorders, setReorders] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "reorders"),
      where("adminUID", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setReorders(data);
    });

    return () => unsub();
  }, [user]);

  // ✅ New Function: Material milne par Inventory update karne ke liye
  const handleReceiveStock = async (order) => {
    if (!order.itemid) return toast.error("Item ID missing!");
    
    const toastId = toast.loading("Updating inventory...");
    try {
      // 1. Stock quantity badhayein (itemid yahan stock document ki ID honi chahiye)
      const stockRef = doc(db, "users", user.uid, "stocks", order.itemid);
      await updateDoc(stockRef, {
        quantity: increment(Number(order.requestedQty)),
        updatedAt: serverTimestamp()
      });

      // 2. Stock Movement record karein
      await addDoc(collection(db, "users", user.uid, "movements"), {
        itemid: order.itemid,
        name: order.name,
        type: "IN",
        quantity: Number(order.requestedQty),
        reason: `Procured from ${order.supplierName}`,
        timestamp: serverTimestamp(),
        user: user.email
      });

      // 3. Order status ko "completed" mark karein
      const reorderRef = doc(db, "reorders", order.id);
      await updateDoc(reorderRef, { status: "completed" });

      toast.success(`${order.name} added to inventory!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update inventory. Make sure the item exists.", { id: toastId });
    }
  };

  const deletePO = async (id) => {
    if (window.confirm("Delete this purchase order record?")) {
      await deleteDoc(doc(db, "reorders", id));
      toast.success("Order deleted");
    }
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-indigo-50 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-xs font-black text-indigo-400 uppercase">
              Active Requests
            </p>
            <h4 className="text-2xl font-black">
              {reorders.filter((r) => r.status === "pending").length}
            </h4>
          </div>
          <Clock className="text-indigo-600" size={32} />
        </div>

        <div className="bg-emerald-50 p-6 rounded-2xl flex justify-between items-center">
          <div>
            <p className="text-xs font-black text-emerald-400 uppercase">
              Received
            </p>
            <h4 className="text-2xl font-black">
              {reorders.filter((r) => r.status === "completed").length}
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
            {reorders.map((order) => (
              <tr key={order.id} className="group hover:bg-slate-50 transition-colors">
                <td className="py-4">
                  <p className="font-bold text-slate-800">{order.name}</p>
                  <p className="text-xs text-indigo-500 font-black italic">
                    REF: {order.itemid}
                  </p>
                </td>

                <td className="font-medium text-slate-600">{order.supplierName}</td>

                <td className="text-center font-black text-slate-800">
                  {order.requestedQty}
                </td>

                <td className="text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      order.status === "pending"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>

                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* ✅ "Add to Stock" button: Sirf tab dikhega jab status "pending" ho */}
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleReceiveStock(order)}
                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-slate-900 transition shadow-md flex items-center gap-1"
                        title="Receive Stock"
                      >
                        <PackagePlus size={16} />
                        <span className="text-[10px] font-black pr-1">ADD</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => deletePO(order.id)}
                      className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reorders.length === 0 && (
              <tr>
                <td colSpan="5" className="py-20 text-center text-slate-400 font-bold italic">
                  No purchase orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}