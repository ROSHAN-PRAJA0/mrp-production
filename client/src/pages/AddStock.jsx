import { useState } from "react";
import { Plus, Trash2, Barcode, Save } from "lucide-react";

export default function AddStock() {
  const [rows, setRows] = useState([
    { id: 1, sku: "", name: "", category: "", unit: "Piece", qty: 0, price: 0 },
  ]);

  const addRow = () =>
    setRows((r) => [
      ...r,
      { id: Date.now(), sku: "", name: "", category: "", unit: "Piece", qty: 0, price: 0 },
    ]);

  const removeRow = (id) => setRows((r) => r.filter((x) => x.id !== id));

  const update = (id, key, val) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [key]: val } : x)));

  const totalQty = rows.reduce((a, b) => a + Number(b.qty || 0), 0);
  const totalValue = rows.reduce((a, b) => a + Number(b.qty || 0) * Number(b.price || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Add Stock</h2>
            <p className="text-sm text-slate-500">Add new inventory to your warehouse</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-100">
              <Barcode size={16} /> Scan
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800">
              <Save size={16} /> Save
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-medium">Stock Entries</h3>
            <button
              onClick={addRow}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800"
            >
              <Plus size={16} /> Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2">SKU / Barcode</th>
                  <th className="text-left px-3 py-2">Item Name</th>
                  <th className="text-left px-3 py-2">Category</th>
                  <th className="text-left px-3 py-2">Unit</th>
                  <th className="text-left px-3 py-2">Quantity</th>
                  <th className="text-left px-3 py-2">Price</th>
                  <th className="text-left px-3 py-2">Amount</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">
                      <input
                        value={r.sku}
                        onChange={(e) => update(r.id, "sku", e.target.value)}
                        className="w-40 rounded-lg border px-2 py-1.5"
                        placeholder="Scan / Enter SKU"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={r.name}
                        onChange={(e) => update(r.id, "name", e.target.value)}
                        className="w-56 rounded-lg border px-2 py-1.5"
                        placeholder="Item name"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={r.category}
                        onChange={(e) => update(r.id, "category", e.target.value)}
                        className="w-40 rounded-lg border px-2 py-1.5"
                        placeholder="Category"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={r.unit}
                        onChange={(e) => update(r.id, "unit", e.target.value)}
                        className="w-28 rounded-lg border px-2 py-1.5"
                      >
                        <option>Piece</option>
                        <option>Kg</option>
                        <option>Meter</option>
                        <option>Litre</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={r.qty}
                        onChange={(e) => update(r.id, "qty", e.target.value)}
                        className="w-28 rounded-lg border px-2 py-1.5"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={r.price}
                        onChange={(e) => update(r.id, "price", e.target.value)}
                        className="w-28 rounded-lg border px-2 py-1.5"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {(Number(r.qty || 0) * Number(r.price || 0)).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => removeRow(r.id)}
                        className="rounded-lg border p-2 hover:bg-red-50 text-red-600"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Bar */}
          <div className="p-4 border-t bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-600">
              Total Qty: <b className="text-slate-900">{totalQty}</b>
            </div>
            <div className="text-sm text-slate-600">
              Total Value: <b className="text-slate-900">₹ {totalValue.toFixed(2)}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
