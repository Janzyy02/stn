import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard"; // --- IMPORT ADDED ---
import Pricing from "./pages/Pricing";
import Purchasing from "./pages/Purchasing";
import PurchaseHistory from "./pages/PurchaseHistory";
import InboundDelivery from "./pages/InboundScheduling";
import OutboundDelivery from "./pages/OutboundScheduling";
import InvoiceHistory from "./pages/InvoiceHistory";
import RecordSales from "./pages/RecordSales";
import Inventory from "./pages/Inventory";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("Dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "Dashboard":
        return <Dashboard />; // --- UPDATED TO RENDER COMPONENT ---
      case "Inventory":
        return <Inventory />;
      case "Edit Pricing":
        return <Pricing />;
      case "Procurement":
        return <Purchasing />;
      case "Procurement History":
        return <PurchaseHistory />;
      case "Inbound Delivery":
        return <InboundDelivery />;
      case "Point of Sales":
        return <RecordSales />;
      case "Outbound Delivery":
        return <OutboundDelivery />;
      case "Invoice History":
        return <InvoiceHistory />;
      case "Add User":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold italic uppercase text-slate-800">
              Add User
            </h2>
            <p className="text-slate-500">System access management.</p>
          </div>
        );
      case "Show Users":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold italic uppercase text-slate-800">
              User Directory
            </h2>
            <p className="text-slate-500">View and manage staff accounts.</p>
          </div>
        );
      default:
        return (
          <div className="p-8 text-2xl font-bold italic uppercase text-red-500">
            Page "{currentPage}" Not Found
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 print:block">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-x-hidden print:w-full print:p-0">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
