import React, { useEffect, useRef, useContext, useState } from "react";
import Gantt from "frappe-gantt";
import { db } from "../../config/firebase";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { AuthContext } from "../../routes/AuthProvider";
import { Calendar, MousePointer2, Settings2 } from "lucide-react";
import toast from "react-hot-toast";

const ProductionSchedule = () => {
  const { user } = useContext(AuthContext);

  const ganttRef = useRef(null);
  const ganttInstance = useRef(null);

  const [tasks, setTasks] = useState([]);

  // 🔹 Fetch Manufacturing Orders
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(
      collection(db, "manufacturing_orders"),
      (snap) => {
        const orders = snap.docs.map((d) => {
          const data = d.data();

          const start =
            data.startDate || new Date().toISOString().split("T")[0];

          const end =
            data.deadline ||
            new Date(new Date(start).getTime() + 86400000)
              .toISOString()
              .split("T")[0];

          return {
            id: d.id,
            name: `${data.productName || "Product"} (Qty:${
              data.quantity || 0
            })`,
            start: start,
            end: end,
            progress:
              data.status === "Completed"
                ? 100
                : data.status === "In-Progress"
                ? 50
                : 10,
            custom_class:
              data.status === "In-Progress"
                ? "bar-progress"
                : data.status === "Completed"
                ? "bar-finished"
                : "bar-planned",
          };
        });

        setTasks(orders);
      }
    );

    return () => unsub();
  }, [user]);

  // 🔹 Initialize Gantt
  useEffect(() => {
    if (!tasks.length) return;
    if (!ganttRef.current) return;

    // Destroy old instance
    if (ganttInstance.current) {
      ganttRef.current.innerHTML = "";
      ganttInstance.current = null;
    }

    ganttInstance.current = new Gantt(ganttRef.current, tasks, {
      header_height: 50,
      column_width: 40,
      step: 24,
      view_modes: ["Day", "Week", "Month"],
      view_mode: "Day",
      bar_height: 28,
      bar_corner_radius: 8,
      date_format: "YYYY-MM-DD",

      // Drag reschedule
      on_date_change: async (task, start, end) => {
        try {
          const orderRef = doc(db, "manufacturing_orders", task.id);

          await updateDoc(orderRef, {
            startDate: start.toISOString().split("T")[0],
            deadline: end.toISOString().split("T")[0],
          });

          toast.success(`Rescheduled: ${task.name}`);
        } catch (err) {
          toast.error("Rescheduling failed");
        }
      },

      on_click: (task) => {
        toast(`MO: ${task.name} | Progress ${task.progress}%`);
      },
    });
  }, [tasks]);

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic flex items-center gap-3">
            <Calendar className="text-indigo-600" />
            Master Production Schedule
          </h2>

          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
            Finite Capacity Planning • Real-time Manufacturing Timeline
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 text-[10px] font-black uppercase text-indigo-600">
            <MousePointer2 size={12} />
            Drag To Reschedule
          </div>

          <button className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
            <Settings2 size={18} />
          </button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm min-h-[520px] overflow-x-auto">
        <div ref={ganttRef}></div>
      </div>

      {/* Status Legend */}
      <div className="flex gap-6 justify-center">

        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          Planned
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          In Progress
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          Completed
        </div>

      </div>

      {/* Gantt Styles */}
      <style>{`
        .gantt .bar-progress { fill:#6366f1; stroke:#4338ca }
        .gantt .bar-planned { fill:#fbbf24; stroke:#d97706 }
        .gantt .bar-finished { fill:#10b981; stroke:#059669 }

        .gantt .bar-label{
          font-family:Inter;
          font-weight:800;
          font-size:10px;
          fill:#1e293b
        }

        .gantt .grid-header{
          fill:#f8fafc;
          stroke:#f1f5f9
        }

        .gantt .lower-text{
          font-weight:700;
          fill:#94a3b8;
          text-transform:uppercase
        }

        .gantt .handle{
          fill:#cbd5e1
        }

        .gantt .arrow{
          stroke:#e2e8f0;
          stroke-width:1.5
        }
      `}</style>
    </div>
  );
};

export default ProductionSchedule;