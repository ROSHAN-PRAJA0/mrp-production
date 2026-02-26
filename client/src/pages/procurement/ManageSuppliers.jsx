import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AuthContext } from '../../routes/AuthProvider';
import Sidebar from '../../components/Sidebar';
import UserMenu from '../../components/UserMenu';
import toast from 'react-hot-toast';
import { Briefcase, UserPlus, Trash2, Edit, X, Save, Tag,PlusCircle } from 'lucide-react';

const ManageSuppliers = () => {
    const { user } = useContext(AuthContext);
    const userId = user?.uid;

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", description: "" });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        const unsub = onSnapshot(collection(db, "users", userId, "suppliers"), (snap) => {
            setSuppliers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [userId]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({ name: "", email: "", phone: "", address: "", description: "" });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.description) {
            return toast.error("Name and Description (Type) are required.");
        }

        try {
            if (editingId) {
                const supplierRef = doc(db, "users", userId, "suppliers", editingId);
                await updateDoc(supplierRef, { ...formData, updatedAt: serverTimestamp() });
                toast.success("Supplier updated successfully!");
            } else {
                await addDoc(collection(db, "users", userId, "suppliers"), {
                    ...formData,
                    createdAt: serverTimestamp()
                });
                toast.success("Supplier added successfully!");
            }
            resetForm();
        } catch (error) {
            toast.error("Failed to save supplier.");
        }
    };

    const handleEdit = (supplier) => {
        setFormData({
            name: supplier.name,
            email: supplier.email || "",
            phone: supplier.phone || "",
            address: supplier.address || "",
            description: supplier.description || ""
        });
        setEditingId(supplier.id);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this supplier?")) {
            await deleteDoc(doc(db, "users", userId, "suppliers", id));
            toast.success("Supplier deleted.");
        }
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen flex text-left">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
                    
                    {/* Header Row */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                                <Briefcase className="text-indigo-600"/> Manage Suppliers
                            </h2>
                            <p className="text-slate-500 font-medium">Add and categorize suppliers for reorder requests.</p>
                        </div>
                        <UserMenu />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Add/Edit Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 sticky top-6">
                                <h3 className="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                                    {editingId ? <Edit size={18}/> : <UserPlus size={18}/>} 
                                    {editingId ? "Edit Supplier" : "New Supplier"}
                                </h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-01">Supplier Name*</label>
                                        <input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. john " className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Supplier Type* (Description)</label>
                                        <input name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g. Copper Wire Supplier" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Contact Email</label>
                                        <input name="email" value={formData.email} onChange={handleInputChange} placeholder="email@company.com" type="email" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Phone Number</label>
                                        <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 00000 00000" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    
                                    <div className="flex gap-2 pt-2">
                                        <button type="submit" className="flex-1 bg-slate-900 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg text-xs uppercase tracking-widest">
                                            {editingId ? <Save size={16}/> : <PlusCircle size={16}/>} {editingId ? "Save" : "Add"}
                                        </button>
                                        {editingId && (
                                            <button type="button" onClick={resetForm} className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all">
                                                <X size={20}/>
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* List Section */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-50">
                                    <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Registered Suppliers</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {loading ? (
                                        <p className="text-center py-10 font-bold text-slate-400 italic">Fetching supplier records...</p>
                                    ) : suppliers.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {suppliers.map(s => (
                                                <div key={s.id} className="border border-slate-100 p-5 rounded-[2rem] hover:shadow-md transition-all group relative">
                                                    <span className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(s)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white"><Edit size={14}/></button>
                                                        <button onClick={() => handleDelete(s.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 size={14}/></button>
                                                    </span>
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600"><Tag size={18}/></div>
                                                        <div>
                                                            <p className="font-black text-slate-800 leading-none">{s.name}</p>
                                                            <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1 tracking-tighter">{s.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1 mt-4 border-t border-slate-50 pt-3">
                                                        <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2 truncate">{s.email}</p>
                                                        <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">{s.phone}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 text-slate-300 font-black uppercase italic tracking-widest text-[10px]">
                                            <Briefcase size={40} className="mx-auto mb-4 opacity-10" />
                                            No suppliers found in directory
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ManageSuppliers;