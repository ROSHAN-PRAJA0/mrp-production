import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/auth/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import InventoryMaster from "./pages/inventory/Inventory";
import AddStock from "./pages/inventory/AddStock";
import ManufacturingMaster from "./pages/manufacturing/Manufacturing";
import Employees from "./pages/Employees";
import Settings from "./pages/Settings";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/signup" element={<Register />} />
      
      <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute role="admin"><InventoryMaster /></ProtectedRoute>} />
      <Route path="/add-stock" element={<ProtectedRoute role="admin"><AddStock /></ProtectedRoute>} />
      <Route path="/manufacturing" element={<ProtectedRoute role="admin"><ManufacturingMaster /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute role="admin"><Employees /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute role="admin"><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default App;