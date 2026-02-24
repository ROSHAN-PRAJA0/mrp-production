import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/Landing";
import SignIn from "./pages/Login";
import SignUp from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import Inventory from "./pages/Inventory";
import Manufacturing from "./pages/Manufacturing";
import ShopFloor from "./pages/ShopFloor";
import Employees from "./pages/Employees";
import Settings from "./pages/Settings";
import BOM from "./pages/BOM";
import ShortageReport from "./pages/ShortageReport";
import ProtectedRoute from "./routes/ProtectedRoute";
import QualityControl from "./pages/QualityControl";
import AddStock from "./pages/AddStock";
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      
      {/* Protected Routes for Admin/Manager */}
      <Route path="/admin-dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute role="admin"><Inventory /></ProtectedRoute>} />
      <Route path="/bom" element={<ProtectedRoute role="admin"><BOM /></ProtectedRoute>} />
      <Route path="/manufacturing" element={<ProtectedRoute role="admin"><Manufacturing /></ProtectedRoute>} />
      <Route path="/shop-floor" element={<ProtectedRoute role="admin"><ShopFloor /></ProtectedRoute>} />
      <Route path="/shortage" element={<ProtectedRoute role="admin"><ShortageReport /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute role="admin"><Employees /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute role="admin"><Settings /></ProtectedRoute>} />
      <Route path="/quality-control" element={<ProtectedRoute role="admin"><QualityControl /></ProtectedRoute>} />
      <Route path="/add-stock" element={<ProtectedRoute role="admin"><AddStock /></ProtectedRoute>} />
      {/* Fallback to landing if route not found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default App;