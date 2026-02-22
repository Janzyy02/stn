import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  LayoutDashboardIcon,
  UserPlus,
  Users,
  ShoppingCart,
  Tag,
  Truck,
  Calculator,
  MoreVertical,
  Package,
  History,
  LogOut,
  ShieldCheck, // Added for Admin icon
} from "lucide-react";
import stnLogo from "../assets/stn logo.png";

const Sidebar = ({ currentPage, setCurrentPage }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "User", role: "Staff" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        setUser({
          name:
            authUser.user_metadata?.full_name || authUser.email.split("@")[0],
          role: authUser.user_metadata?.role || "Administrator",
        });
      }
    });
  }, []);

  // Standard menu sections
  const menuSections = [
    {
      title: "INVENTORY",
      items: [
        {
          icon: <LayoutDashboardIcon size={20} />,
          label: "Dashboard",
          path: "/dashboard",
        },
        { icon: <Package size={20} />, label: "Inventory", path: "/inventory" },
      ],
    },
    {
      title: "PRICING",
      items: [
        { icon: <Tag size={20} />, label: "Edit Pricing", path: "/pricing" },
      ],
    },
    {
      title: "INBOUND",
      items: [
        {
          icon: <ShoppingCart size={20} />,
          label: "Procurement",
          path: "/purchasing",
        },
        {
          icon: <History size={20} />,
          label: "Procurement History",
          path: "/purchase-history",
        },
        {
          icon: <Truck size={20} />,
          label: "Inbound Delivery",
          path: "/inbound",
        },
      ],
    },
    {
      title: "OUTBOUND",
      items: [
        {
          icon: <Calculator size={20} />,
          label: "Point of Sales",
          path: "/pos",
        },
        {
          icon: <History size={20} />,
          label: "Invoice History",
          path: "/invoice-history",
        },
        {
          icon: <Truck size={20} />,
          label: "Outbound Delivery",
          path: "/outbound",
        },
      ],
    },
  ];

  // Dynamic section for Super Admin
  const adminSection =
    user.role === "Super Admin"
      ? {
          title: "ADMINISTRATION",
          items: [
            {
              icon: <ShieldCheck size={20} />,
              label: "Manage Users",
              path: "/manage-users",
            },
          ],
        }
      : null;

  const NavItem = ({ icon, label, path }) => {
    const isActive = currentPage === label;
    return (
      <div
        onClick={() => {
          setCurrentPage(label);
          navigate(path);
        }}
        className={`flex items-center space-x-3 p-3 mb-1 cursor-pointer transition-all duration-200 rounded-xl 
          ${isActive ? "bg-teal-500/40 text-teal-900 shadow-sm" : "hover:bg-teal-50 text-slate-600"}`}
      >
        <span className={isActive ? "text-teal-900" : "text-teal-800"}>
          {icon}
        </span>
        <span className="font-bold text-[15px]">{label}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-72 bg-white border-r border-gray-100 font-sans shadow-sm sticky top-0">
      <div className="p-6 flex justify-center">
        <img src={stnLogo} alt="Logo" className="h-20 w-auto object-contain" />
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {/* Render standard sections */}
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-6 border-t border-gray-100 pt-4">
            <h3 className="text-[11px] font-bold text-gray-400 tracking-[0.2em] mb-4 ml-3 uppercase">
              {section.title}
            </h3>
            {section.items.map((item, i) => (
              <NavItem
                key={i}
                icon={item.icon}
                label={item.label}
                path={item.path}
              />
            ))}
          </div>
        ))}

        {/* Render Admin section if it exists */}
        {adminSection && (
          <div className="mb-6 border-t border-gray-100 pt-4">
            <h3 className="text-[11px] font-bold text-gray-400 tracking-[0.2em] mb-4 ml-3 uppercase">
              {adminSection.title}
            </h3>
            {adminSection.items.map((item, i) => (
              <NavItem
                key={i}
                icon={item.icon}
                label={item.label}
                path={item.path}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center space-x-3 p-2">
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold uppercase">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-400">{user.role}</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-gray-400 hover:text-rose-600"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
