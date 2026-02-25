// src/pages/ViewStocks.jsx - FIXED
import React, { useEffect, useState, useContext, useMemo } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { AuthContext } from "../../routes/AuthProvider";
import SidebarLayout from "../../components/Sidebar";

import { Trash2, Search, Archive, IndianRupee, AlertTriangle, Package, Edit, Download, Calendar, Activity, X } from "lucide-react"; 
import toast from "react-hot-toast";
import AddStock from "./AddStock";
import { useLocation, useNavigate } from "react-router-dom"; 

const StatCard = ({ icon, title, value, color }) => (
  <div className={`flex items-center p-4 bg-white rounded-xl shadow-md border-l-4 ${color}`}>
    <div className="p-3 rounded-full bg-gray-100 mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// Expiry Helper Function
const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'none', days: null, className: '' };
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { status: 'expired', days: diffDays, className: 'bg-red-200 border-red-500 text-red-800' };
    if (diffDays <= 90) return { status: 'critical', days: diffDays, className: 'bg-orange-100 border-orange-500 text-orange-800' };
    
    return { status: 'ok', days: diffDays, className: '' };
};


const ViewStock = () => {
  const { user, role, adminUID } = useContext(AuthContext);
  const location = useLocation(); // FIX
  const navigate = useNavigate(); // FIX

  const [stockItems, setStockItems] = useState([]);
  const [dashboardFilter, setDashboardFilter] = useState(null); // FIX
  const [filters, setFilters] = useState({ name: "", brand: "", category: "" });
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const effectiveAdminUID = role === "admin" ? user?.uid : adminUID;

  // 👇 FIX: Filter Logic based on URL Path
  useEffect(() => {
    if (location.pathname === '/admin/low-stock') {
        setDashboardFilter('low-stock');
    } else if (location.pathname === '/admin/expiring-stock') {
        setDashboardFilter('expiring-stock');
    } else {
        setDashboardFilter(null);
    }
  }, [location.pathname]);
  // 👆 FIX

  useEffect(() => {
    if (!effectiveAdminUID) return;
    setLoading(true);
    const stockRef = collection(db, "users", effectiveAdminUID, "stocks");
    const unsubscribe = onSnapshot(stockRef, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      data.sort((a, b) => Number(a.quantity) - Number(b.quantity));
      setStockItems(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [effectiveAdminUID]);
  
  const handleFilterChange = (e) => {
      setFilters({...filters, [e.target.name]: e.target.value });
  };

  const filteredStocks = useMemo(() => stockItems.filter(item => {
      // 1. Text/Input Filters
      const textMatch = (
          item.name?.toLowerCase().includes(filters.name.toLowerCase()) &&
          item.brand?.toLowerCase().includes(filters.brand.toLowerCase()) &&
          item.category?.toLowerCase().includes(filters.category.toLowerCase())
      );

      if (!textMatch) return false;

      // 2. Dashboard Filters
      if (dashboardFilter === 'low-stock') {
          return Number(item.quantity) > 0 && Number(item.quantity) <= 30;
      }
      if (dashboardFilter === 'expiring-stock') {
          const status = getExpiryStatus(item.expiryDate).status;
          return status === 'critical' || status === 'expired';
      }
      
      return true;
  }), [stockItems, filters, dashboardFilter]);

  const { totalValue, totalQuantity, lowStockCount, expiringSoonCount } = useMemo(() => {
    let value = 0, quantity = 0, lowCount = 0;
    let expiringCount = 0;

    // Use full stockItems array here to calculate overall summary if needed, 
    // but using filteredStocks here shows summary of the visible list
    filteredStocks.forEach(item => {
        const qty = Number(item.quantity) || 0;
        quantity += qty;
        value += qty * (Number(item.sellingPrice) || 0);
        if (qty > 0 && qty <= 30) lowCount++;
        
        const expiryStatus = getExpiryStatus(item.expiryDate);
        if (expiryStatus.status === 'critical' || expiryStatus.status === 'expired') {
            expiringCount++;
        }
    });
    return { totalValue: value, totalQuantity: quantity, lowStockCount: lowCount, expiringSoonCount: expiringCount };
  }, [filteredStocks]);
  
  const handleEdit = (item) => {
      setSelectedItem(item);
      setIsModalOpen(true);
  };
  
  const handleSave = async (id, updatedData) => {
      const itemRef = doc(db, "users", effectiveAdminUID, "stocks", id);
      await updateDoc(itemRef, {
          ...updatedData,
          sellingPrice: Number(updatedData.sellingPrice),
          actualPrice: Number(updatedData.actualPrice),
          expiryDate: updatedData.expiryDate || null, 
      });
      toast.success("Item updated successfully!");
      setIsModalOpen(false);
      setSelectedItem(null);
  };

  const handleDelete = async (id) => {
    if (role !== "admin") return toast.error("Only Admins can delete stock.");
    if (!window.confirm("Are you sure you want to delete this stock item permanently?")) return;
    try {
        await deleteDoc(doc(db, "users", effectiveAdminUID, "stocks", id));
        toast.success("Stock item deleted.");
    } catch (error) {
        toast.error("Failed to delete stock.");
    }
  };
  
  const exportToCSV = () => {
    const headers = ["Item ID", "Name", "Brand", "Category", "Size", "Quantity", "Selling Price", "Actual Price", "Expiry Date"];
    const rows = filteredStocks.map(item => [
        item.itemid, `"${item.name}"`, item.brand, item.category,
        item.size, item.quantity, item.sellingPrice, item.actualPrice, item.expiryDate || ""
    ]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stock_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // -- 👇 Function to clear dashboard filter 👇 --
  const handleClearDashboardFilter = () => {
    setDashboardFilter(null);
    navigate('/viewstocks'); 
  };
  // -- 👆 Function to clear dashboard filter 👆 --


  return (
    <SidebarLayout>
      <EditStockModal item={selectedItem} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} />
      <div className="p-4 md:p-12 bg-gray-50 min-h-screen font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3"><Archive/> View Stock</h1>
                <p className="text-gray-500 mt-1">Search, view, and manage all items in your inventory.</p>
            </div>
            <button onClick={exportToCSV} className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 mt-4 md:mt-0">
                <Download size={18}/> Export to CSV
            </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard icon={<Package className="text-blue-500"/>} title="Items in Stock" value={totalQuantity} color="border-blue-500"/>
            <StatCard icon={<IndianRupee className="text-green-500"/>} title="Total Stock Value" value={`Rs. ${totalValue.toFixed(2)}`} color="border-green-500"/>
            <StatCard icon={<AlertTriangle className="text-red-500"/>} title="Low Stock Items" value={lowStockCount} color="border-red-500"/>
            <StatCard icon={<Activity className="text-orange-500"/>} title="Expiring Soon Items" value={expiringSoonCount} color="border-orange-500"/>
        </div>
        
        {/* -- 👇 NEW: Active Filter Display (Dashboard click ke baad dikhega) 👇 -- */}
        {dashboardFilter && (
            <div className={`flex items-center justify-between p-4 mb-6 rounded-xl shadow-md ${dashboardFilter === 'low-stock' ? 'bg-red-200 border-red-500' : 'bg-orange-200 border-orange-500'} border-l-4`}>
                <p className="font-semibold text-gray-800">
                    Active Filter: 
                    <span className="ml-2 font-bold capitalize">
                        {dashboardFilter === 'low-stock' ? 'Low Stock Items (Qty ≤ 30)' : 'Expiring Soon Items (Next 90 Days)'}
                    </span>
                </p>
                <button onClick={handleClearDashboardFilter} className="text-gray-700 hover:text-red-700 p-1 rounded-full"><X size={20}/></button>
            </div>
        )}
        {/* -- 👆 NEW: Active Filter Display 👆 -- */}


        <div className="bg-white p-4 rounded-xl shadow-lg mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" name="name" placeholder="Search by Name" value={filters.name} onChange={handleFilterChange} className="p-2.5 border rounded-lg w-full" />
              <input type="text" name="brand" placeholder="Search by Brand" value={filters.brand} onChange={handleFilterChange} className="p-2.5 border rounded-lg w-full" />
              <input type="text" name="category" placeholder="Search by Category" value={filters.category} onChange={handleFilterChange} className="p-2.5 border rounded-lg w-full" />
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase font-medium">
              <tr>
                <th className="p-4 text-left">Item ID</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Brand</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Size</th>
                <th className="p-4 text-center">Quantity</th>
                <th className="p-4 text-left flex items-center gap-1"><Calendar size={14}/> Expiry Date</th>
                <th className="p-4 text-right">Selling Price</th>
                {role === "admin" && <th className="p-4 text-right">Actual Price</th>}
                {role === "admin" && <th className="p-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={role === 'admin' ? 10 : 8} className="text-center p-10 text-gray-500">Loading stock...</td></tr>
              ) : filteredStocks.length > 0 ? (
                filteredStocks.map((item) => {
                  const expiryStatus = getExpiryStatus(item.expiryDate);
                  const highlightClass = Number(item.quantity) <= 10 
                                         ? "bg-red-50" 
                                         : expiryStatus.status === 'expired' 
                                         ? "bg-red-100" 
                                         : expiryStatus.status === 'critical' 
                                         ? "bg-orange-100" 
                                         : "";
                  return (
                  <tr key={item.id} className={`hover:bg-gray-50 ${highlightClass}`}>
                    <td className="p-4 text-gray-600 font-mono whitespace-nowrap">{item.itemid || "-"}</td>
                    <td className="p-4 font-semibold text-gray-800 whitespace-nowrap">{item.name || "-"}</td>
                    <td className="p-4 text-gray-600 whitespace-nowrap">{item.brand || "-"}</td>
                    <td className="p-4 text-gray-600 whitespace-nowrap">{item.category || "-"}</td>
                    <td className="p-4 text-gray-600 whitespace-nowrap">{item.size || "-"}</td>
                    
                    <td className={`p-4 text-center font-bold ${Number(item.quantity) <= 30 ? "text-red-600" : "text-green-700"}`}>{item.quantity || 0}</td>
                    
                    <td className={`p-4 whitespace-nowrap ${expiryStatus.status !== 'none' && expiryStatus.className}`}>
                        {item.expiryDate || "-"}
                        {expiryStatus.status === 'expired' && <span className="ml-2 text-xs font-bold text-red-700">(EXPIRED)</span>}
                        {expiryStatus.status === 'critical' && <span className="ml-2 text-xs font-bold text-orange-700">({expiryStatus.days} days left)</span>}
                    </td>

                    <td className="p-4 text-right font-semibold text-blue-600">Rs. {Number(item.sellingPrice || 0).toFixed(2)}</td>
                    {role === "admin" && <td className="p-4 text-right text-orange-600">Rs. {Number(item.actualPrice || 0).toFixed(2)}</td>}
                    {role === "admin" && (
                      <td className="p-4 text-center flex justify-center items-center gap-2">
                        <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 transition"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-100 transition"><Trash2 size={16} /></button>
                      </td>
                    )}
                  </tr>
                )})
              ) : (
                <tr><td colSpan={role === 'admin' ? 10 : 8} className="text-center p-10 text-gray-500">No stock found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
};
export default ViewStock;