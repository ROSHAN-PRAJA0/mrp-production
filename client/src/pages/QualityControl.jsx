import React, { useState, useEffect, useContext } from "react";
import { db } from "../config/firebase";
import { 
  collection, onSnapshot, doc, setDoc, increment, 
  addDoc, serverTimestamp, deleteDoc, query, where, getDocs, updateDoc 
} from "firebase/firestore";
import { AuthContext } from "../routes/AuthProvider";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { ShieldCheck, CheckCircle2, Package, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function QualityControl() {
  const { user } = useContext(AuthContext);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    // Multi-tenant isolation
    const q = query(
      collection(db, "quality_inspections"), 
      where("adminId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setInspections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error("QC Listen Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleQCStatus = async (item, status) => {
    const reason = status === "Fail" ? window.prompt("Enter reason for Rework:") : "QC Passed";
    if (status === "Fail" && !reason) return; 

    setProcessingId(item.id);
    const toastId = toast.loading(`Processing ${status === "Pass" ? "Approval" : "Rework"}...`);
    
    try {
      if (status === "Pass") {
        // 1. Fetch BOM for Unit Cost (Robust check)
        let unitCost = 0;
        try {
          const bomQuery = query(
            collection(db, "boms"), 
            where("productId", "==", item.productId),
            where("adminId", "==", user.uid)
          );
          const bomSnap = await getDocs(bomQuery);
          if (!bomSnap.empty) {
            unitCost = bomSnap.docs[0].data().finalMRP || 0;
          }
        } catch (e) {
          console.warn("BOM fetch failed, continuing with 0 cost", e);
        }

        // 2. Add to Finished Goods Inventory
        const stockRef = doc(db, "users", user.uid, "stocks", item.productId);
        await setDoc(stockRef, {
          name: item.productName,
          itemid: item.productId, 
          quantity: increment(Number(item.quantity)),
          category: "Finished Goods", 
          sellingPrice: unitCost,
          updatedAt: serverTimestamp(),
          adminId: user.uid 
        }, { merge: true });

        // 3. Log Movement
        await addDoc(collection(db, "users", user.uid, "movements"), {
          itemid: item.productId,
          name: item.productName,
          type: "IN",
          quantity: Number(item.quantity),
          reason: "QC Passed - Production Complete",
          timestamp: serverTimestamp(),
          user: user.email,
          adminId: user.uid
        });

        toast.success(`${item.quantity} units moved to Finished Goods.`, { id: toastId });
      } else {
        // 4. REWORK LOGIC
        const orderRef = doc(db, "manufacturing_orders", item.orderId);
        await updateDoc(orderRef, {
          status: "Rework Required",
          lastQCReason: reason,
          completedQty: increment(-Number(item.quantity)) 
        });

        toast.error("Batch sent back for Rework.", { id: toastId });
      }

      // 5. Cleanup
      await deleteDoc(doc(db, "quality_inspections", item.id));
      
    } catch (err) {
      console.error("CRITICAL QC ERROR:", err);
      toast.error(`Error: ${err.message}. Check Database Permissions.`, { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 text-left">
        <Topbar title="Quality Control Center" />
        <main className="p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
              <ShieldCheck className="text-indigo-600" size={32} /> Inspection Queue
            </h2>

            {loading ? (
              <div className="py-20 text-center font-bold text-slate-400 italic">Scanning production...</div>
            ) : inspections.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {inspections.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                        <Package size={28} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xl">{item.productName}</h4>
                        <div className="flex gap-4 mt-2 font-bold text-[11px] uppercase">
                          <span className="text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg">Batch: {item.quantity}</span>
                          <span className="text-slate-400">Ref: {item.orderId?.slice(-6)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        disabled={processingId === item.id}
                        onClick={() => handleQCStatus(item, "Fail")} 
                        className="flex items-center gap-2 px-6 py-4 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all text-[11px] uppercase"
                      >
                        {processingId === item.id ? <Loader2 className="animate-spin" size={16}/> : <RotateCcw size={16} />} Rework
                      </button>
                      <button 
                        disabled={processingId === item.id}
                        onClick={() => handleQCStatus(item, "Pass")} 
                        className="flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-600 font-black rounded-2xl hover:bg-emerald-500 hover:text-white transition-all text-[11px] uppercase"
                      >
                        {processingId === item.id ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16} />} Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-32 rounded-[3.5rem] border-2 border-dashed flex flex-col items-center justify-center opacity-40">
                <ShieldCheck size={64} className="mb-4" />
                <p className="font-bold uppercase tracking-widest">Queue Clear</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}