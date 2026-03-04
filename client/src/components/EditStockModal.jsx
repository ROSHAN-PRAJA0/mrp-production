import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function EditStockModal({ item, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (item) setFormData(item);
  }, [item]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6 text-left">
          <h3 className="text-xl font-black text-slate-800 uppercase">Edit Part Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={20}/>
          </button>
        </div>
        
        <div className="space-y-4 text-left">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Part Name / Description</label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.name || ""} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Quantity</label>
              <input 
                type="number"
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none"
                value={formData.quantity || ""} 
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Unit Cost (₹)</label>
              <input 
                type="number"
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none"
                value={formData.actualPrice || ""} 
                onChange={(e) => setFormData({...formData, actualPrice: e.target.value})}
              />
            </div>
          </div>
          
          <button 
            onClick={() => onSave(item.id, formData)}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-slate-800 transition-all mt-4 uppercase tracking-widest"
          >
            Update Inventory
          </button>
        </div>
      </div>
    </div>
  );
}