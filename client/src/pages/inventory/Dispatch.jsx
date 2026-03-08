import React, { useState, useEffect, useContext } from "react";
import { db } from "../../config/firebase";
import { 
  collection, getDocs, addDoc, doc, updateDoc, 
  increment, serverTimestamp, query, where 
} from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { Truck, Package, ShoppingCart, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Dispatch() {
  const { user } = useContext(AuthContext);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [crmRequests, setCrmRequests] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dispatchQty, setDispatchQty] = useState("");
  const [targetProduct, setTargetProduct] = useState(null);

  const fetchData = async () => {
    if (!user?.uid) return;
    try {
      const qStock = query(collection(db, "users", user.uid, "stocks"), where("category", "==", "Finished Goods"));
      const stockSnap = await getDocs(qStock);
      setFinishedGoods(stockSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const qCRM = query(collection(db, "customer_requests"), where("adminId", "==", user.uid));
      const crmSnap = await getDocs(qCRM);
      
      // LOGIC: Sirf wo dikhao jinki bachi hui quantity > 0 hai
      const pendingData = crmSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(req => Number(req.quantity) > 0); 
      
      setCrmRequests(pendingData);
      setLoading(false);
    } catch (err) {
      toast.error("Error loading data");
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleRequestSelection = (requestId) => {
    const request = crmRequests.find(r => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setDispatchQty(request.quantity); 
      const stockItem = finishedGoods.find(item => item.name === request.productRequirement);
      setTargetProduct(stockItem || null);
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !targetProduct) return toast.error("Stock not found for this product!");
    
    const dQty = Number(dispatchQty);
    const currentCrmQty = Number(selectedRequest.quantity);

    if (dQty <= 0) return toast.error("Enter valid quantity!");
    if (dQty > Number(targetProduct.quantity)) return toast.error("Insufficient Stock!");
    if (dQty > currentCrmQty) return toast.error("Cannot dispatch more than requested!");

    const toastId = toast.loading("Executing Dispatch...");
    try {
      const stockRef = doc(db, "users", user.uid, "stocks", targetProduct.id);
      const crmRef = doc(db, "customer_requests", selectedRequest.id);
      
      const remainingQty = currentCrmQty - dQty;
      const newStatus = remainingQty <= 0 ? "Completed" : "Partially Shipped";

      // 1. Inventory se stock minus
      await updateDoc(stockRef, {
        quantity: increment(-dQty),
        updatedAt: serverTimestamp()
      });

      // 2. CRM Request update (Subtract quantity and update status)
      await updateDoc(crmRef, { 
        quantity: remainingQty, 
        status: newStatus,
        lastDispatchDate: serverTimestamp() 
      });

      // 3. Movement record
      await addDoc(collection(db, "users", user.uid, "movements"), {
        itemid: targetProduct.itemid || targetProduct.id,
        name: targetProduct.name,
        type: "OUT",
        quantity: dQty,
        sellingPrice: Number(targetProduct.sellingPrice || 0),
        costPrice: Number(targetProduct.actualPrice || 0),
        reason: `Dispatch: ${selectedRequest.customerName} (${newStatus})`,
        timestamp: serverTimestamp(),
        user: user.email
      });

      toast.success(remainingQty <= 0 ? "Order Fully Shipped!" : `Partially Shipped: ${remainingQty} units left`, { id: toastId });
      
      setSelectedRequest(null);
      setDispatchQty("");
      setTargetProduct(null);
      fetchData(); 
    } catch (err) {
      toast.error("Dispatch Failed");
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-left">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar title="Order Fulfillment & Dispatch" />
        <main className="p-8 space-y-8 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                <Truck size={16} className="text-indigo-600"/> Dispatch Execution
              </h3>
              
              <form onSubmit={handleDispatch} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Select CRM Order</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    onChange={(e) => handleRequestSelection(e.target.value)}
                    value={selectedRequest?.id || ""}
                  >
                    <option value="">Choose Pending Inquiry...</option>
                    {crmRequests.map(req => (
                      <option key={req.id} value={req.id}>{req.customerName} - {req.productRequirement} ({req.quantity} left)</option>
                    ))}
                  </select>
                </div>

                {selectedRequest && (
                  <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                    <p className="text-[9px] font-black text-indigo-400 uppercase">Customer Requirement</p>
                    <h4 className="font-black text-slate-800 text-sm mt-1">{selectedRequest.productRequirement}</h4>
                    <p className="text-xs font-bold text-slate-500">Order Quantity: {selectedRequest.quantity} units</p>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Dispatch Quantity</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
                    value={dispatchQty}
                    onChange={(e) => setDispatchQty(e.target.value)}
                  />
                </div>

                <button 
                  disabled={!targetProduct || Number(dispatchQty) > Number(targetProduct?.quantity)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShoppingCart size={16}/> Confirm & Ship
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-end px-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Finished Goods Inventory</h3>
                <span className="text-[10px] font-bold text-indigo-500">Auto-Refreshed</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {finishedGoods.map(item => {
                  const isTarget = targetProduct?.id === item.id;
                  return (
                    <div key={item.id} className={`p-6 rounded-[2.5rem] border transition-all ${isTarget ? "bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]" : "bg-white border-slate-100 text-slate-800 shadow-sm"}`}>
                      <div className="flex justify-between items-start">
                        <div className={`${isTarget ? "bg-white/20" : "bg-indigo-50"} p-3 rounded-2xl`}>
                          <Package size={20} className={isTarget ? "text-white" : "text-indigo-600"}/>
                        </div>
                        <div className="text-right">
                          <span className={`text-2xl font-black ${isTarget ? "text-white" : "text-slate-800"}`}>{item.quantity}</span>
                          <p className={`text-[9px] font-black uppercase ${isTarget ? "text-white/60" : "text-slate-400"}`}>Units Available</p>
                        </div>
                      </div>
                      <h4 className="font-bold mt-4 uppercase tracking-tight">{item.name}</h4>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}