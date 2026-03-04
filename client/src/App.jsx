import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/auth/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/dashboard/AdminDashboard";

import InventoryMaster from "./pages/inventory/Inventory";
import AddStock from "./pages/inventory/AddStock";
import ProductAlerts from "./pages/inventory/ProductAlerts";
import StockMovements from "./pages/inventory/StockMovements";
import InventoryItems from "./pages/inventory/InventoryItems";
import Dispatch from "./pages/inventory/Dispatch";

import Procurement from "./pages/procurement/Procurement";
import PurchaseOrdersPage from "./pages/procurement/PurchaseOrders";
import ManageSuppliers from "./pages/procurement/ManageSuppliers";
import ReorderSetup from "./pages/procurement/ReorderSetup";
import Requirement from "./pages/procurement/Requirement";

import Manufacturing from "./pages/manufacturing/Manufacturing";
import ProductionSchedule from "./pages/manufacturing/ProductionSchedule";

import Employees from "./pages/Employees";
import Settings from "./pages/Settings";
import CRM from "./pages/CRM";
import QualityControl from "./pages/QualityControl";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Routes>
      
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Login />} />
      <Route path="/signup" element={<Register />} />

      {/* Dashboard */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Inventory */}
      <Route
        path="/inventory"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <InventoryMaster />
          </ProtectedRoute>
        }
      />

      <Route
        path="/add-stock"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <AddStock />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory-items"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <InventoryItems />
          </ProtectedRoute>
        }
      />

      <Route
        path="/product-alerts"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <ProductAlerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stock-movements"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <StockMovements />
          </ProtectedRoute>
        }
      />
      <Route
  path="/dispatch"
  element={
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <Dispatch />
    </ProtectedRoute>
  }
/>

      {/* Procurement */}
      <Route
        path="/procurement"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <Procurement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/purchase-orders"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <PurchaseOrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-suppliers"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <ManageSuppliers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reorder-setup"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <ReorderSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/requirement"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <Requirement />
          </ProtectedRoute>
        }
      />

      {/* Manufacturing */}
      <Route
        path="/manufacturing/*"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <Manufacturing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/production-schedule"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <ProductionSchedule />
          </ProtectedRoute>
        }
      />

      {/* CRM */}
      <Route
        path="/crm"
        element={
          <ProtectedRoute allowedRoles={["admin", "manager"]}>
            <CRM />
          </ProtectedRoute>
        }
      />
<Route
  path="/quality-control"
  element={
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <QualityControl />
    </ProtectedRoute>
  }
/>
      {/* Admin Only */}
      <Route
        path="/employees"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Employees />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

export default App;