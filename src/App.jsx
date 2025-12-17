import React from "react";
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            Dashboard Overview
          </h2>
          <p className="text-gray-500">Welcome back, Robert.</p>
        </header>

        {/* Placeholder for Page Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((card) => (
            <div
              key={card}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-48 flex items-center justify-center"
            >
              <span className="text-gray-300 italic">Content Card {card}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
