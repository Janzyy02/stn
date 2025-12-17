import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import AddUser from "./pages/AddUser";
import Purchasing from "./pages/Purchasing";
import InboundPricing from "./pages/InboundPricing";
import RecordSales from "./pages/RecordSales";
import OutboundPricing from "./pages/OutboundPricing"; // Import the new module

function App() {
  // Global state to manage page routing
  const [currentPage, setCurrentPage] = useState("Dashboard");

  // Router logic to switch between the UI modules
  const renderPage = () => {
    switch (currentPage) {
      case "Dashboard":
        return <Dashboard />;
      case "Inventory":
        return <Inventory />;
      case "Add User":
        return <AddUser />;
      case "Purchasing":
        return <Purchasing />;
      case "Inbound Pricing":
        return <InboundPricing />;
      case "Record Sales":
        return <RecordSales />;
      case "Outbound Pricing":
        return <OutboundPricing />;
      case "Show Users":
        return (
          <div className="p-10 bg-white m-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              User Directory
            </h1>
            <p className="text-slate-500 mt-2">
              The user list is currently being indexed...
            </p>
          </div>
        );
      default:
        // Generic fallback for pages not yet coded
        return (
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center bg-white p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚙️</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-widest">
                {currentPage}
              </h1>
              <p className="text-slate-400 mt-2 max-w-xs mx-auto">
                This module is currently under development for the STN
                ecosystem.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar - Shared component for navigation */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

// import { useEffect, useState } from "react";
// import { supabase } from "./supabaseClient";

// function App() {
//   const [connectionStatus, setConnectionStatus] = useState(
//     "Checking connection..."
//   );
//   const [fetchError, setFetchError] = useState(null);
//   const [todos, setTodos] = useState(null);

//   useEffect(() => {
//     const fetchTodos = async () => {
//       // 1. Try to fetch data from the 'todos' table
//       const { data, error } = await supabase.from("todos").select();

//       // 2. Handle the result
//       if (error) {
//         setConnectionStatus("Connection Failed / Error");
//         setFetchError(error.message);
//         setTodos(null);
//         console.error("Supabase Error:", error);
//       } else {
//         setConnectionStatus("Connected Successfully!");
//         setFetchError(null);
//         setTodos(data);
//       }
//     };

//     fetchTodos();
//   }, []);

//   return (
//     <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
//       <h1>Supabase Connection Test</h1>

//       {/* Status Indicator */}
//       <div
//         style={{
//           padding: "10px",
//           marginBottom: "20px",
//           backgroundColor: fetchError ? "#ffcccc" : "#ccffcc",
//           color: fetchError ? "#cc0000" : "#006600",
//           borderRadius: "5px",
//         }}
//       >
//         <strong>Status:</strong> {connectionStatus}
//       </div>

//       {/* Error Message Display */}
//       {fetchError && (
//         <div style={{ color: "red" }}>
//           <p>
//             <strong>Error Details:</strong> {fetchError}
//           </p>
//           <p>
//             <em>(Check your console for more technical details)</em>
//           </p>
//         </div>
//       )}

//       {/* Data Display */}
//       {todos && (
//         <div>
//           <h3>Data from 'todos' table:</h3>
//           {todos.length === 0 ? (
//             <p>Connection works, but the table is empty.</p>
//           ) : (
//             <ul>
//               {todos.map((todo) => (
//                 <li key={todo.id}>{todo.title}</li>
//               ))}
//             </ul>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;
