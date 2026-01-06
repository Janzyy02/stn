import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Purchasing from "./pages/Purchasing";
import PurchaseHistory from "./pages/PurchaseHistory";
import InboundDelivery from "./pages/InboundScheduling";
import OutboundDelivery from "./pages/OutboundScheduling";
import InvoiceHistory from "./pages/InvoiceHistory";
import RecordSales from "./pages/RecordSales";
import Inventory from "./pages/Inventory";
import ItemAction from "./pages/ItemAction"; // --- IMPORT ADDED ---
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [activeSku, setActiveSku] = useState(null); // State to hold SKU for ItemAction

  // Effect to listen for SKU parameters if arriving via QR scan URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sku = params.get("sku");
    if (sku) {
      setActiveSku(sku);
      setCurrentPage("Item Action");
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "Dashboard":
        return <Dashboard />;
      case "Inventory":
        return <Inventory />;
      case "Item Action": // --- NEW CASE ADDED ---
        return <ItemAction sku={activeSku} setCurrentPage={setCurrentPage} />;
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
      {/* Hide sidebar if on Item Action page for a cleaner mobile scan experience */}
      {currentPage !== "Item Action" && (
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      )}
      <main className="flex-1 overflow-x-hidden print:w-full print:p-0">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
