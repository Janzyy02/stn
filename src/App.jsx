import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Pricing from "./pages/Pricing";
import Purchasing from "./pages/Purchasing";
import PurchaseHistory from "./pages/PurchaseHistory";
import InboundDelivery from "./pages/InboundScheduling";
import OutboundDelivery from "./pages/OutboundScheduling";
import InvoiceHistory from "./pages/InvoiceHistory"; // - Added this import
import RecordSales from "./pages/RecordSales";
import Inventory from "./pages/Inventory";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("Dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "Dashboard":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold italic uppercase text-slate-800">
              Dashboard
            </h2>
            <p className="text-slate-500">Welcome back, Administrator.</p>
          </div>
        );
      case "Inventory":
        return <Inventory />;
      case "Edit Pricing":
        return <Pricing />;
      case "Purchasing":
        return <Purchasing />;
      case "Purchase History":
        return <PurchaseHistory />;
      case "Inbound Delivery":
        return <InboundDelivery />;
      case "Point of Sales":
        return <RecordSales />;
      case "Outbound Delivery":
        return <OutboundDelivery />;
      case "Invoice History": // - Added this case
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
      case "Edit Pricing":
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold italic uppercase text-slate-800">
              Edit Pricing
            </h2>
            <p className="text-slate-500">Markup and discount management.</p>
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
