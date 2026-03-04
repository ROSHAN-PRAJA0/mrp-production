import React, { useState, useEffect, useContext } from "react";
import { db } from "../config/firebase";
import { 
  collection, onSnapshot, doc, setDoc, increment, 
  addDoc, serverTimestamp, deleteDoc, query, where, getDocs, updateDoc 
} from "firebase/firestore";
import { AuthContext } from "../routes/AuthProvider";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { ShieldCheck, CheckCircle2, XCircle, Package, AlertCircle, History, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

export default function QualityControl() {
  const { user } = useContext(AuthContext);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    // Listening to pending inspections
    const unsub = onSnapshot(collection(db, "quality_inspections"), (snap) => {
      setInspections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleQCStatus = async (item, status) => {
    const reason = status === "Fail" ? window.prompt("Enter reason for Rework/Rejection:") : "QC Passed";
    if (status === "Fail" && !reason) return; // Requirement for failure reason

    const toastId = toast.loading(`Processing Quality ${status}...`);
    
    try {
      if (status === "Pass") {
        // 1. Fetch BOM for Unit Cost
        const bomQuery = query(collection(db, "boms"), where("productId", "==", item.productId));
        const bomSnap = await getDocs(bomQuery);
        let unitCost = 0;
        if (!bomSnap.empty) {
          unitCost = bomSnap.docs[0].data().finalMRP || 0;
        }

        // 2. Update Finished Goods Inventory
        const stockRef = doc(db, "users", user.uid, "stocks", item.productId);
        await setDoc(stockRef, {
          name: item.productName,
          itemid: item.productId, 
          quantity: increment(Number(item.quantity)),
          category: "Finished Goods", 
          sellingPrice: unitCost,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // 3. Log Movement
        await addDoc(collection(db, "users", user.uid, "movements"), {
          itemid: item.productId,
          name: item.productName,
          type: "IN",
          quantity: Number(item.quantity),
          reason: "QC Passed - Production Complete",
          timestamp: serverTimestamp(),
          user: user.email
        });

        toast.success(`${item.quantity} units moved to Finished Goods.`, { id: toastId });
      } else {
        // REWORK LOGIC: Update Manufacturing Order status
        const orderRef = doc(db, "manufacturing_orders", item.orderId);
        await updateDoc(orderRef, {
          status: "Rework Required",
          lastQCReason: reason,
          completedQty: increment(-Number(item.quantity)) // Deducting from completed so it can be re-logged
        });

        toast.error("Batch sent back for Rework.", { id: toastId });
      }

      // Archive/Delete from pending list
      await deleteDoc(doc(db, "quality_inspections", item.id));
      
    } catch (err) {
      console.error(err);
      toast.error("Update failed. Please check permissions.", { id: toastId });
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar title="Quality Control Center" />
        <main className="p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6 text-left">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                  <ShieldCheck className="text-indigo-600" size={32} /> Inspection Queue
                </h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
                  Validate production batches before inventory intake
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center font-bold text-slate-400 italic">Scanning production output...</div>
            ) : inspections.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {inspections.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-6">
                      <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                        <Package size={28} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xl">{item.productName}</h4>
                        <div className="flex gap-4 mt-2">
                          <span className="flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-lg">
                            Batch Size: {item.quantity}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 py-1">
                            MO REF: {item.orderId?.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleQCStatus(item, "Fail")} 
                        className="flex items-center gap-2 px-6 py-4 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all text-[11px] uppercase tracking-wider"
                      >
                        <RotateCcw size={16} /> Rework
                      </button>
                      <button 
                        onClick={() => handleQCStatus(item, "Pass")} 
                        className="flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-600 font-black rounded-2xl hover:bg-emerald-500 hover:text-white transition-all text-[11px] uppercase tracking-wider shadow-sm"
                      >
                        <CheckCircle2 size={16} /> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-32 rounded-[3.5rem] border-2 border-dashed flex flex-col items-center justify-center">
                <ShieldCheck size={64} className="text-emerald-500 mb-6 opacity-20" />
                <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Inspection Queue Clear</h3>
                <p className="text-slate-400 font-medium">No pending production batches require validation.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}