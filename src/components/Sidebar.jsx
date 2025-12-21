import React from "react";
import {
  Search,
  LayoutDashboardIcon,
  UserPlus,
  Users,
  ShoppingCart,
  Tag,
  Truck,
  Calculator,
  MoreVertical,
  Package,
  History, // Added for the new page
} from "lucide-react";

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const user = {
    name: "Robert Simmons",
    role: "Administrator",
    image: null,
  };

  const menuSections = [
    {
      title: "ACCOUNTS",
      items: [
        { icon: <UserPlus size={20} />, label: "Add User" },
        { icon: <Users size={20} />, label: "Show Users" },
      ],
    },
    {
      title: "PRICING",
      items: [{ icon: <Tag size={20} />, label: "Edit Pricing" }],
    },
    {
      title: "INBOUND",
      items: [
        { icon: <ShoppingCart size={20} />, label: "Purchasing" },
        { icon: <History size={20} />, label: "Purchase History" },
        { icon: <Truck size={20} />, label: "Inbound Delivery" },
      ],
    },
    {
      title: "OUTBOUND",
      items: [
        { icon: <Calculator size={20} />, label: "Point of Sales" },
        { icon: <History size={20} />, label: "Invoice History" },
        { icon: <Truck size={20} />, label: "Outbound Delivery" },
      ],
    },
  ];

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const NavItem = ({ icon, label }) => {
    const isActive = currentPage === label;
    return (
      <div
        onClick={() => setCurrentPage(label)}
        className={`flex items-center space-x-3 p-3 mb-1 cursor-pointer transition-all duration-200 rounded-xl group 
          ${
            isActive
              ? "bg-teal-500/40 text-teal-900 shadow-sm"
              : "hover:bg-teal-50 text-slate-600"
          }`}
      >
        <span className={`${isActive ? "text-teal-900" : "text-teal-800"}`}>
          {icon}
        </span>
        <span
          className={`font-bold text-[15px] ${isActive ? "text-teal-900" : ""}`}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-72 bg-white border-r border-gray-100 font-sans text-slate-700 shadow-sm sticky top-0">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-400 tracking-widest text-center">
          STN
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        <div className="relative mb-6">
          <span className="absolute inset-y-0 left-3 flex items-center text-teal-600">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 border border-teal-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm"
          />
        </div>
        <NavItem icon={<LayoutDashboardIcon size={20} />} label="Dashboard" />
        <NavItem icon={<Package size={20} />} label="Inventory" />
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-6 border-t border-gray-100 pt-4">
            <h3 className="text-[11px] font-bold text-gray-400 tracking-[0.2em] mb-4 ml-3 uppercase">
              {section.title}
            </h3>
            {section.items.map((item, itemIdx) => (
              <NavItem key={itemIdx} icon={item.icon} label={item.label} />
            ))}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center space-x-3 p-2 rounded-xl">
          {!user.image ? (
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              {getInitials(user.name)}
            </div>
          ) : (
            <img
              src={user.image}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <p className="text-sm font-bold leading-tight text-slate-800">
              {user.name}
            </p>
            <p className="text-xs text-slate-400">{user.role}</p>
          </div>
          <MoreVertical size={16} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
