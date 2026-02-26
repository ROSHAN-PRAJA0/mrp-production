import React, { useState, useEffect, useContext, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import {
  RefreshCcw,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export default function StockMovements() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [movements, setMovements] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    if (authLoading || !user?.uid) return;

    const q = query(
      collection(db, "users", user.uid, "movements"),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMovements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setDataLoading(false);
    });

    return () => unsub();
  }, [user, authLoading]);

  const filteredMovements = useMemo(() => {
    return movements.filter(mv => {
      const matchesSearch =
        mv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mv.itemid?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "ALL" || mv.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [movements, searchTerm, filterType]);

  const totalIn = movements
    .filter(m => m.type === "IN")
    .reduce((acc, m) => acc + Number(m.quantity || 0), 0);

  const totalOut = movements
    .filter(m => m.type === "OUT")
    .reduce((acc, m) => acc + Number(m.quantity || 0), 0);

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="font-black text-slate-400 animate-pulse">
          LOADING MOVEMENT LEDGER...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <RefreshCcw className="text-indigo-600" />
            Stock Movement Ledger
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Complete audit trail of stock inflow & outflow.
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-black uppercase text-emerald-500">Total Stock In</p>
            <h3 className="text-2xl font-black text-emerald-700">{totalIn}</h3>
          </div>
          <TrendingUp className="text-emerald-600" size={28} />
        </div>

        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-black uppercase text-red-500">Total Stock Out</p>
            <h3 className="text-2xl font-black text-red-700">{totalOut}</h3>
          </div>
          <TrendingDown className="text-red-600" size={28} />
        </div>

        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-black uppercase text-indigo-500">Total Entries</p>
            <h3 className="text-2xl font-black text-indigo-700">{movements.length}</h3>
          </div>
          <Package className="text-indigo-600" size={28} />
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[250px] flex items-center bg-slate-50 px-4 py-3 rounded-2xl border focus-within:ring-2 focus-within:ring-indigo-500 transition">
          <Search size={16} className="text-slate-400" />
          <input
            placeholder="Search by SKU or Product..."
            className="bg-transparent border-none outline-none ml-3 w-full text-sm font-semibold"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex bg-slate-50 p-1.5 rounded-2xl border">
          {["ALL", "IN", "OUT"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${
                filterType === type
                  ? type === "IN"
                    ? "bg-emerald-500 text-white"
                    : type === "OUT"
                    ? "bg-red-500 text-white"
                    : "bg-indigo-600 text-white"
                  : "text-slate-400"
              }`}
            >
              {type === "ALL" ? "All" : type === "IN" ? "Stock In" : "Stock Out"}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
            <tr>
              <th className="px-8 py-5">Date & Time</th>
              <th className="px-8 py-5">Product</th>
              <th className="px-8 py-5 text-center">Type</th>
              <th className="px-8 py-5 text-center">Qty</th>
              <th className="px-8 py-5">Reason</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filteredMovements.length > 0 ? (
              filteredMovements.map((mv) => (
                <tr key={mv.id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-5 text-xs font-mono text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-300" />
                      {mv.timestamp?.toDate().toLocaleString() || "Syncing..."}
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800">{mv.name}</p>
                    <p className="text-[10px] font-black text-indigo-500 uppercase">
                      SKU: {mv.itemid}
                    </p>
                  </td>

                  <td className="px-8 py-5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[9px] font-black uppercase ${
                        mv.type === "IN"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {mv.type === "IN" ? <ArrowUpCircle size={12}/> : <ArrowDownCircle size={12}/>}
                      {mv.type}
                    </span>
                  </td>

                  <td className="px-8 py-5 text-center font-black">
                    {mv.quantity}
                  </td>

                  <td className="px-8 py-5 text-xs font-semibold text-slate-600">
                    {mv.reason || "General Update"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-24 text-center opacity-30">
                  <RefreshCcw size={40} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm">
                    No movements found
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}