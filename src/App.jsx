import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { supabase } from "./supabaseClient";

// Components & Pages
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Purchasing from "./pages/Procurement/Purchasing";
import PurchaseHistory from "./pages/PurchaseHistory";
import InboundDelivery from "./pages/InboundScheduling";
import OutboundDelivery from "./pages/OutboundScheduling";
import InvoiceHistory from "./pages/InvoiceHistory";
import RecordSales from "./pages/PointofSales/RecordSales";
import Inventory from "./pages/Inventory";
import ItemAction from "./pages/ItemAction"; // Ensure this import exists
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserManagement from "./pages/UserManagement";
import PendingApproval from "./pages/PendingApproval";

const AppLayout = ({ session }) => {
  const [currentPage, setCurrentPage] = useState("Dashboard");

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="flex">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
};

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- ADDED STATES FOR QR SYSTEM NAVIGATION ---
  const [inventoryView, setInventoryView] = useState("Inventory");
  const [selectedPO, setSelectedPO] = useState(null);

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        setUserRole(session.user.user_metadata?.role);
      }
      setLoading(false);
    };
    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserRole(session?.user?.user_metadata?.role);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-teal-600"></div>
      </div>
    );

  return (
    <Routes>
      <Route
        path="/login"
        element={!session ? <Login /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/signup"
        element={!session ? <Signup /> : <Navigate to="/dashboard" replace />}
      />
      <Route path="/pending-approval" element={<PendingApproval />} />

      <Route element={<AppLayout session={session} />}>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* MODIFIED INVENTORY ROUTE */}
        <Route
          path="/inventory"
          element={
            inventoryView === "Item Action" ? (
              <ItemAction
                po_number={selectedPO}
                setCurrentPage={setInventoryView}
              />
            ) : (
              <Inventory
                setSelectedPO={setSelectedPO}
                setCurrentPage={setInventoryView}
              />
            )
          }
        />

        <Route path="/pricing" element={<Pricing />} />
        <Route path="/purchasing" element={<Purchasing />} />
        <Route path="/purchase-history" element={<PurchaseHistory />} />
        <Route path="/inbound" element={<InboundDelivery />} />
        <Route path="/pos" element={<RecordSales />} />
        <Route path="/invoice-history" element={<InvoiceHistory />} />
        <Route path="/outbound" element={<OutboundDelivery />} />

        <Route
          path="/manage-users"
          element={
            userRole === "Super Admin" ? (
              <UserManagement />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to={session ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;
