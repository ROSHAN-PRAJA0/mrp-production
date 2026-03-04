export default function DashboardCards() {
  return (
    <div className="grid grid-cols-3 gap-6">

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-gray-500 text-sm">Total Sales Value</h2>
        <p className="text-2xl font-bold mt-2">₹ 1,921,500</p>
        <p className="text-green-500 text-sm mt-1">↑ 12.5%</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-gray-500 text-sm">Inventory Value</h2>
        <p className="text-2xl font-bold mt-2">₹ 9,338,901</p>
        <p className="text-red-500 text-sm mt-1">↓ 3.2%</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-gray-500 text-sm">Inventory Ratio</h2>
        <p className="text-2xl font-bold mt-2">20.58%</p>
        <p className="text-green-500 text-sm mt-1">↑ 7.3%</p>
      </div>

    </div>
  );
}
