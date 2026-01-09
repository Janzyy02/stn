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
  const [activePO, setActivePO] = useState(null);

  // --- QR SCAN / URL REDIRECT LOGIC ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const po = params.get("po") || params.get("sku");

    if (po) {
      setActivePO(po);
      setCurrentPage("Item Action");
      // Clean URL to prevent loop on refresh
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
      default:
        return <div className="p-8 text-red-500 font-bold">Page Not Found</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 print:block">
      {currentPage !== "Item Action" && (
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      )}
      <main
        className={`flex-1 overflow-x-hidden ${
          currentPage === "Item Action" ? "w-full" : ""
        }`}
      >
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
