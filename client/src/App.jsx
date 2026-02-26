import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/auth/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import InventoryMaster from "./pages/inventory/Inventory";
import AddStock from "./pages/inventory/AddStock";
import Employees from "./pages/Employees";
import Settings from "./pages/Settings";
import ProtectedRoute from "./routes/ProtectedRoute";
import ProductAlerts from "./pages/inventory/ProductAlerts";
import ReorderSetup from "./pages/procurement/ReorderSetup";
import StockMovements from "./pages/inventory/StockMovements";
import ManageSuppliers from "./pages/procurement/ManageSuppliers";
import InventoryItems from "./pages/inventory/InventoryItems"; 
import PurchaseOrdersPage from "./pages/procurement/PurchaseOrders"; 
import Requirement from "./pages/procurement/Requirement";
import Procurement from "./pages/procurement/Procurement";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/signup" element={<Register />} />
      
      <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute role="admin"><InventoryMaster /></ProtectedRoute>} />
      <Route path="/add-stock" element={<ProtectedRoute role="admin"><AddStock /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute role="admin"><Employees /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute role="admin"><Settings /></ProtectedRoute>} />
      <Route path="/product-alerts" element={<ProtectedRoute role="admin"><ProductAlerts /></ProtectedRoute>} />
      <Route path="/manage-suppliers" element={<ProtectedRoute role="admin"><ManageSuppliers /></ProtectedRoute>} />
      <Route path="/stock-movements" element={<ProtectedRoute role="admin"><StockMovements /></ProtectedRoute>} />
      <Route path="/reorder-setup" element={<ProtectedRoute role="admin"><ReorderSetup /></ProtectedRoute>} />
      <Route path="/inventory-items" element={<ProtectedRoute role="admin"><InventoryItems /></ProtectedRoute>} />
      <Route path="/requirement" element={<ProtectedRoute role="admin"><Requirement /></ProtectedRoute>} />
      <Route path="/purchase-orders" element={<ProtectedRoute role="admin"><PurchaseOrdersPage /></ProtectedRoute>} />
     <Route path="/procurement" element={<ProtectedRoute role="admin"><Procurement /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default App;