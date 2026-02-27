import React, { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import Select from "react-select";
import { ClipboardList, AlertCircle, CheckCircle2, Play } from "lucide-react";
import toast from "react-hot-toast";

const ManufacturingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ productId: "", quantity: 1, deadline: "" });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const snap = await getDocs(collection(db, "inventory"));
    setProducts(snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(i => i.type === "Finished Good")
      .map(i => ({ value: i.id, label: i.name }))
    );
  };

  const fetchOrders = async () => {
    const snap = await getDocs(collection(db, "manufacturing_orders"));
    setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleCreateOrder = async () => {
    if (!newOrder.productId || !newOrder.deadline) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      // 1. Fetch the BOM for this product
      const bomQuery = query(collection(db, "boms"), where("productId", "==", newOrder.productId));
      const bomSnap = await getDocs(bomQuery);

      if (bomSnap.empty) {
        toast.error("No BOM found for this product. Create one first!");
        return;
      }

      const bomData = bomSnap.docs[0].data();
      
      // 2. Simple MRP Check (Placeholder for logic)
      // In a real scenario, you'd loop through ingredients and check inventory levels here.
      
      await addDoc(collection(db, "manufacturing_orders"), {
        ...newOrder,
        productName: products.find(p => p.value === newOrder.productId)?.label,
        status: "Planned",
        createdAt: new Date(),
      });

      toast.success("Manufacturing Order Created");
      setShowModal(false);
      fetchOrders();
    } catch (error) {
      toast.error("Error creating order");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Manufacturing Orders</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold transition-all"
        >
          + New Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-slate-400 text-sm">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Product</th>
              <th className="p-4">Quantity</th>
              <th className="p-4">Deadline</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                <td className="p-4 font-mono text-xs">{order.id.slice(0, 8)}</td>
                <td className="p-4 font-bold">{order.productName}</td>
                <td className="p-4">{order.quantity}</td>
                <td className="p-4">{order.deadline}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {order.status}
                  </span>
                </td>
                <td className="p-4">
                  <button className="text-indigo-400 hover:text-indigo-300"><Play size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Order Modal (Simplified) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Plan New Production</h3>
            <div className="space-y-4">
              <Select 
                options={products} 
                onChange={(opt) => setNewOrder({...newOrder, productId: opt.value})}
                placeholder="Select Product"
                className="text-slate-900"
              />
              <input 
                type="number" 
                placeholder="Quantity"
                className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg"
                onChange={(e) => setNewOrder({...newOrder, quantity: e.target.value})}
              />
              <input 
                type="date" 
                className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg"
                onChange={(e) => setNewOrder({...newOrder, deadline: e.target.value})}
              />
              <div className="flex gap-4 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 text-slate-400">Cancel</button>
                <button onClick={handleCreateOrder} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturingOrders;