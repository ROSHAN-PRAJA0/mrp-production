import React, { useState, useEffect, useContext } from "react";
import { db } from "../config/firebase";
import { 
  collection, onSnapshot, doc, setDoc, increment, 
  addDoc, serverTimestamp, deleteDoc, query, where, getDocs 
} from "firebase/firestore";
import { AuthContext } from "../routes/AuthProvider";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { ShieldCheck, CheckCircle2, XCircle, Package, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function QualityControl() {
  const { user } = useContext(AuthContext);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(collection(db, "quality_inspections"), (snap) => {
      setInspections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleQCStatus = async (item, status) => {
    const toastId = toast.loading(`Processing QC ${status}...`);
    try {
      if (status === "Pass") {
        // 1. BOM fetch karein taaki Unit Cost (MRP) mil sake
        const bomQuery = query(collection(db, "boms"), where("productId", "==", item.productId));
        const bomSnap = await getDocs(bomQuery);
        let unitCost = 0;
        if (!bomSnap.empty) {
          unitCost = bomSnap.docs[0].data().finalMRP || 0;
        }

        // 2. Finished Goods Stock Update (setDoc with merge: true handles new items)
        const stockRef = doc(db, "users", user.uid, "stocks", item.productId);
        await setDoc(stockRef, {
          name: item.productName,
          itemid: item.productId, 
          quantity: increment(Number(item.quantity)),
          category: "Finished Goods", 
          sellingPrice: unitCost, // Ye Unit Cost ke taur par save hoga
          updatedAt: serverTimestamp()
        }, { merge: true });

        // 3. Movement Record
        await addDoc(collection(db, "users", user.uid, "movements"), {
          itemid: item.productId,
          name: item.productName,
          type: "IN",
          quantity: Number(item.quantity),
          reason: "QC Passed - Production Complete",
          timestamp: serverTimestamp(),
          user: user.email
        });
        
        toast.success(`${item.quantity} units passed to Finished Goods!`, { id: toastId });
      } else {
        toast.error("Batch marked for Rework.", { id: toastId });
      }
      
      // Delete from pending list
      await deleteDoc(doc(db, "quality_inspections", item.id));
    } catch (err) {
      console.error(err);
      toast.error("QC failed. Document ID missing or Permission denied.", { id: toastId });
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar title="Quality Assurance Ledger" />
        <main className="p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6 text-left">
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 mb-6 uppercase tracking-tight">
               <ShieldCheck className="text-indigo-600" size={32} /> Pending Quality Check
            </h2>
            {loading ? (
              <div className="py-20 text-center font-bold text-slate-400 italic">Scanning batches...</div>
            ) : inspections.length > 0 ? (
              <div className="grid gap-4">
                {inspections.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-5">
                      <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><Package size={24} /></div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{item.productName}</h4>
                        <div className="flex gap-3 mt-1">
                          <p className="text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-1 rounded-lg">Qty: {item.quantity}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref ID: {item.productId?.slice(0,8)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleQCStatus(item, "Fail")} className="px-6 py-3 bg-red-50 text-red-600 font-black rounded-xl hover:bg-red-500 hover:text-white transition-all text-[10px] uppercase">Rework</button>
                      <button onClick={() => handleQCStatus(item, "Pass")} className="px-6 py-3 bg-green-50 text-green-600 font-black rounded-xl hover:bg-green-500 hover:text-white transition-all text-[10px] uppercase">Pass to Stock</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed text-center">
                <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-4 opacity-30" />
                <p className="text-slate-400 font-bold uppercase tracking-widest">No pending batches.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}