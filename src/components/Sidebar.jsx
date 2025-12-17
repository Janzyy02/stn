import React from "react";
import {
  Search,
  Box,
  UserPlus,
  Users,
  ShoppingCart,
  Tag,
  Truck,
  Calculator,
  MoreVertical,
} from "lucide-react";

const Sidebar = () => {
  const menuSections = [
    {
      title: "ACCOUNTS",
      items: [
        { icon: <UserPlus size={20} />, label: "Add User" },
        { icon: <Users size={20} />, label: "Show Users" },
      ],
    },
    {
      title: "INBOUND",
      items: [
        { icon: <ShoppingCart size={20} />, label: "Purchasing" },
        { icon: <Tag size={20} />, label: "Inbound Pricing" },
        { icon: <Truck size={20} />, label: "Inbound Delivery" },
      ],
    },
    {
      title: "OUTBOUND",
      items: [
        { icon: <Calculator size={20} />, label: "Record Sales" },
        { icon: <Tag size={20} />, label: "Outbound Pricing" },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-gray-200 font-sans text-slate-800">
      {/* Logo Section */}
      <div className="p-6">
        <h1 className="text-3xl font-bold text-teal-800 tracking-tight">STN</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Search Bar */}
        <div className="relative mb-6">
          <span className="absolute inset-y-0 left-3 flex items-center text-teal-600">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 border border-teal-600 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder-gray-400"
          />
        </div>

        {/* Inventory Item */}
        <div className="flex items-center space-x-3 p-2 mb-4 cursor-pointer hover:bg-gray-100 rounded-md">
          <div className="bg-teal-800 p-1 rounded text-white">
            <Box size={20} />
          </div>
          <span className="font-semibold">Inventory</span>
        </div>

        {/* Dynamic Sections */}
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-6 border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-gray-400 tracking-widest mb-4 ml-2">
              {section.title}
            </h3>
            {section.items.map((item, itemIdx) => (
              <div
                key={itemIdx}
                className="flex items-center space-x-3 p-2 mb-1 cursor-pointer hover:bg-gray-50 rounded-md group"
              >
                <span className="text-teal-700 group-hover:text-teal-900">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* User Profile Section */}
      <div className="bg-teal-600/80 p-4 text-white">
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium">Robert Simmons</span>
          <MoreVertical size={16} />
        </div>

        <div className="flex items-center space-x-3 bg-teal-700/30 p-2 rounded-lg">
          <img
            src="https://via.placeholder.com/40"
            alt="Profile"
            className="w-12 h-12 rounded-full border-2 border-white/50"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold leading-tight">
              Robert Simmons
            </p>
            <p className="text-xs text-teal-100">Administrator</p>
          </div>
          <MoreVertical size={16} className="text-teal-100" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
