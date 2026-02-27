import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import BOM from './BOM'; // Ensure you created BOM.jsx in the same folder
import ManufacturingOrders from './ManufacturingOrders';
import ProductManagement from './ProductManagement'; // Placeholder, create this component as needed

// Placeholder components for the other tabs


const ProductionSchedule = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-white mb-4">Production Schedule</h2>
    <p className="text-slate-400">Visual timeline of manufacturing tasks.</p>
  </div>
);

const Manufacturing = () => {
  const location = useLocation();

  // Define the sub-navigation tabs
  const subNav = [
    { label: "Products", path: "/manufacturing/products" },
    { label: "Manufacturing Orders", path: "/manufacturing" },
    { label: "Production Schedule", path: "/manufacturing/schedule" },
    { label: "BOM", path: "/manufacturing/bom" },
  ];

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      
      <div className="flex-1 flex flex-col ml-64">
        <Topbar title="Manufacturing Management" />
        
        {/* Sub-Navigation Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex gap-6">
          {subNav.map((item) => {
            // Check if the current path matches the link path
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`pb-2 px-1 text-sm font-medium transition-all ${
                  isActive
                    ? "text-indigo-400 border-b-2 border-indigo-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Content Area for Sub-Routes */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* 'index' renders when the path is exactly /manufacturing */}
            <Route path="products" element={<ProductManagement />} />
            <Route index element={<ManufacturingOrders />} />
            <Route path="schedule" element={<ProductionSchedule />} />
            <Route path="bom" element={<BOM />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Manufacturing;