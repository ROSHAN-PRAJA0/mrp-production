import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardCards from "../components/DashboardCards";

export default function Dashboard() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="ml-64 transition-all duration-300">
        <Topbar />
        <main className="p-8 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Operational Overview</h2>
              <p className="text-slate-500">Real-time data from all production lines.</p>
            </div>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700">
              Generate Report
            </button>
          </div>

          <DashboardCards />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
              <h3 className="font-bold text-slate-800 mb-6">Production Efficiency Trend</h3>
              <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
                <p className="text-slate-400">Chart Visualization Placeholder</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Stock Alerts</h3>
              <div className="space-y-4">
                {[
                  { name: "Steel Sheets", status: "Critical", color: "text-red-600" },
                  { name: "Aluminium Rods", status: "Low", color: "text-yellow-600" },
                  { name: "Hydraulic Fluid", status: "Normal", color: "text-green-600" },
                ].map((item) => (
                  <div key={item.name} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className={`text-xs font-bold ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}