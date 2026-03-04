import React, { useState, useEffect, useContext } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import toast from "react-hot-toast";
import {
  Briefcase,
  UserPlus,
  Trash2,
  Edit,
  X,
  Save,
  Tag,
  PlusCircle,
} from "lucide-react";

const ManageSuppliers = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.uid;

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    const unsub = onSnapshot(
      collection(db, "users", userId, "suppliers"),
      (snap) => {
        setSuppliers(
          snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      description: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      return toast.error("Name and Type are required.");
    }

    try {
      if (editingId) {
        const supplierRef = doc(
          db,
          "users",
          userId,
          "suppliers",
          editingId
        );
        await updateDoc(supplierRef, {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        toast.success("Supplier updated successfully!");
      } else {
        await addDoc(
          collection(db, "users", userId, "suppliers"),
          {
            ...formData,
            createdAt: serverTimestamp(),
          }
        );
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
      description: supplier.description || "",
    });
    setEditingId(supplier.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this supplier?")) {
      await deleteDoc(
        doc(db, "users", userId, "suppliers", id)
      );
      toast.success("Supplier deleted.");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM SECTION */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 p-6 rounded-2xl border">
            <h3 className="text-sm font-black uppercase mb-6 flex items-center gap-2">
              {editingId ? <Edit size={16} /> : <UserPlus size={16} />}
              {editingId ? "Edit Supplier" : "New Supplier"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Supplier Name"
                className="w-full p-3 bg-white border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />

              <input
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Supplier Type (Copper, Electronics...)"
                className="w-full p-3 bg-white border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />

              <input
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                type="email"
                className="w-full p-3 bg-white border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone"
                className="w-full p-3 bg-white border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition text-xs uppercase tracking-widest"
                >
                  {editingId ? <Save size={16} /> : <PlusCircle size={16} />}
                  {editingId ? "Save" : "Add"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* LIST SECTION */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="font-black uppercase text-xs tracking-widest mb-6">
              Registered Suppliers
            </h3>

            {loading ? (
              <p className="text-center py-10 font-bold text-slate-400 italic">
                Loading suppliers...
              </p>
            ) : suppliers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map((s) => (
                  <div
                    key={s.id}
                    className="border p-5 rounded-2xl hover:shadow-md transition group relative"
                  >
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleEdit(s)}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                        <Tag size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800">
                          {s.name}
                        </p>
                        <p className="text-xs font-bold text-indigo-600 uppercase">
                          {s.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 mt-3">
                      <p>{s.email}</p>
                      <p>{s.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-300 font-black uppercase italic tracking-widest text-xs">
                <Briefcase size={40} className="mx-auto mb-4 opacity-10" />
                No suppliers found
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageSuppliers;