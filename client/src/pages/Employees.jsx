import React, { useEffect, useState, useContext } from "react";
// 1. Fixed: Import Sidebar and Topbar separately since SidebarLayout wasn't provided
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { db } from "../config/firebase"; // 2. Fixed: Correct path to your firebase config
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { initializeApp } from "firebase/app";
import toast from "react-hot-toast";
// 3. Fixed: Correct path to AuthContext
import { AuthContext } from "../routes/AuthProvider";

import {
  UserPlus,
  Mail,
  Lock,
  Trash2,
  Users,
  User,
} from "lucide-react";

// Secondary Firebase App config
const firebaseConfig = {
  apiKey: "AIzaSyD_IFyK6ya40H8SFdN44lqIecnZF14gOi0",
  authDomain: "mrp-automation.firebaseapp.com",
  projectId: "mrp-automation",
  storageBucket: "mrp-automation.firebasestorage.app",
  messagingSenderId: "392985441347",
  appId: "1:392985441347:web:45b26f32f815e70f03d0f6",
  measurementId: "G-REJFD11MGP"
};

const secondaryApp = initializeApp(firebaseConfig, "secondary-employees");
const secondaryAuth = getAuth(secondaryApp);

const Employees = () => {
  const [managerList, setManagerList] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users"),
      where("role", "==", "manager"),
      where("adminId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setManagerList(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    return () => unsub();
  }, [user]);

  const handleAddManager = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Admin not logged in!");
    if (password.length < 6) return toast.error("Password must be 6+ characters.");

    const toastId = toast.loading("Creating manager account...");
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const managerUser = cred.user;

      await setDoc(doc(db, "users", managerUser.uid), {
        uid: managerUser.uid,
        name,
        email,
        role: "manager",
        adminId: user.uid,
        approved: true, // Auto-approve if admin adds them
        createdAt: new Date(),
      });

      await signOut(secondaryAuth);
      setName("");
      setEmail("");
      setPassword("");
      toast.success("Manager added successfully!", { id: toastId });
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this manager?")) {
      try {
        await deleteDoc(doc(db, "users", id));
        toast.success("Manager removed.");
      } catch (error) {
        toast.error("Failed to delete manager.");
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Topbar title="User Management" />
        
        <main className="p-8 space-y-6 overflow-y-auto">
          <div className="mb-4 text-left">
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Users className="text-indigo-600" /> Manage Managers
            </h1>
            <p className="text-slate-500 font-medium">Add and control staff access levels.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            {/* Form Section */}
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
                  <UserPlus size={16} /> New Manager Account
                </h3>
                <form onSubmit={handleAddManager} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      placeholder="Enter Name"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      placeholder="email@company.com"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-black ml-1">Temporary Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      placeholder="Min. 6 characters"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-600 transition-all mt-4">
                    Add Manager Account
                  </button>
                </form>
              </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Manager</th>
                      <th className="px-8 py-5">Email</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {managerList.map((manager) => (
                      <tr key={manager.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-5 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                            {manager.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800">{manager.name}</span>
                        </td>
                        <td className="px-8 py-5 text-slate-500 font-medium text-sm">{manager.email}</td>
                        <td className="px-8 py-5 text-right">
                          <button onClick={() => handleDelete(manager.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {managerList.length === 0 && (
                      <tr><td colSpan="3" className="p-20 text-center text-slate-400 font-bold italic">No managers registered yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Employees;