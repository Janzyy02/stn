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
import ItemAction from "./pages/ItemAction";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  // Changed from activeSku to activePO to match your new database logic
  const [activePO, setActivePO] = useState(null);

  // --- QR SCAN / URL REDIRECT LOGIC ---
  useEffect(() => {
    // Check if the URL has a ?po= query parameter (updated from ?sku=)
    const params = new URLSearchParams(window.location.search);
    const po = params.get("po") || params.get("sku"); // Supports both for transition

    if (po) {
      setActivePO(po);
      setCurrentPage("Item Action");

      // Clean up the URL to prevent loops on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "Dashboard":
        return <Dashboard />;
      case "Inventory":
        return (
          <Inventory
            setCurrentPage={setCurrentPage}
            setSelectedPO={setActivePO}
          />
        );
      case "Item Action":
        return (
          <ItemAction po_number={activePO} setCurrentPage={setCurrentPage} />
        );
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
      {/* Hide sidebar on Item Action to optimize mobile scanning experience */}
      {currentPage !== "Item Action" && (
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      )}

      <main
        className={`flex-1 overflow-x-hidden print:w-full print:p-0 ${
          currentPage === "Item Action" ? "w-full" : ""
        }`}
      >
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
