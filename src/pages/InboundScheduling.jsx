import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Edit3,
  Save,
  List,
  Calendar as CalendarIcon,
  Loader2,
  X,
  Search,
  Filter,
  Clock,
} from "lucide-react";

const InboundScheduling = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table");

  // Restored Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Statuses");

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ eta: "", status: "" });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id) => {
    try {
      const phTime = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
        .format(new Date())
        .replace(",", "")
        .replace(/\//g, "-");

      const { error } = await supabase
        .from("purchase_orders")
        .update({
          eta: editData.eta,
          status: editData.status,
          updated_at: phTime,
        })
        .eq("id", id);

      if (error) throw error;
      setEditingId(null);
      await fetchOrders();
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Received":
        return "bg-emerald-500 text-white";
      case "Pending":
        return "bg-amber-500 text-white";
      case "Cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-slate-400 text-white";
    }
  };

  // Restored Filtering Logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.po_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (order.supplier_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "All Statuses" || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const localTileDate = `${year}-${month}-${day}`;

      const dayOrders = filteredOrders.filter((o) => o.eta === localTileDate);
      return (
        <div className="flex flex-col gap-1 mt-1 w-full px-1">
          {dayOrders.map((o) => (
            <div
              key={o.id}
              className={`${getStatusStyle(
                o.status
              )} text-[9px] p-1 rounded font-black truncate border border-white/20`}
            >
              {o.po_number}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#e9ecef] p-8 font-sans text-slate-800">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-tight">
            Inbound Scheduling
          </h1>
          <p className="text-slate-500 font-bold mt-1">
            Manage Supply Chain Timeline (PST)
          </p>
        </div>
        <div className="flex bg-white rounded-lg border p-1 shadow-sm h-12">
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 w-12 flex items-center justify-center rounded ${
              viewMode === "table"
                ? "bg-[#a8d1cd] text-white"
                : "text-slate-400"
            }`}
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`p-2 w-12 flex items-center justify-center rounded ${
              viewMode === "calendar"
                ? "bg-[#a8d1cd] text-white"
                : "text-slate-400"
            }`}
          >
            <CalendarIcon size={20} />
          </button>
        </div>
      </div>

      {/* Restored Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
            Search Orders
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-3 text-slate-300"
              size={18}
            />
            <input
              type="text"
              placeholder="PO Number or Supplier..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-[#a8d1cd] outline-none font-bold text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
            Status Filter
          </label>
          <div className="relative">
            <Filter
              className="absolute left-3 top-3 text-slate-300"
              size={18}
            />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-[#a8d1cd] outline-none font-bold text-sm appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Received</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <style>{`
            .react-calendar { width: 100% !important; border: none; } 
            .react-calendar__tile { height: 110px !important; display: flex !important; flex-direction: column !important; align-items: flex-start !important; border: 1px solid #f1f5f9 !important; padding: 10px !important; }
            /* Teal highlight for current date */
            .react-calendar__tile--now { background: #a8d1cd !important; color: white !important; border-radius: 8px; }
            .react-calendar__tile--active { background: #1a3a3a !important; color: white !important; border-radius: 8px; }
            .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus { background-color: #f8fafc; }
          `}</style>
          <Calendar tileContent={tileContent} className="rounded-xl" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b">
              <tr>
                <th className="p-5">PO Number</th>
                <th className="p-5">Supplier</th>
                <th className="p-5 text-center">Schedule</th>
                <th className="p-5 text-center">ETA</th>
                <th className="p-5 text-center">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto" />
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-5 font-black">
                      {order.po_number}
                      <div className="text-[9px] text-slate-300">
                        Updated:{" "}
                        {order.updated_at
                          ? new Date(order.updated_at).toLocaleString("en-PH")
                          : "N/A"}
                      </div>
                    </td>
                    <td className="p-5 font-bold text-slate-500 uppercase text-xs">
                      {order.supplier_name}
                    </td>
                    <td className="p-5 text-center">
                      {editingId === order.id ? (
                        <input
                          type="date"
                          value={editData.eta}
                          onChange={(e) =>
                            setEditData({ ...editData, eta: e.target.value })
                          }
                          className="border-2 border-[#a8d1cd] rounded-lg p-1 text-xs font-black"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(order.id);
                            setEditData({
                              eta: order.eta || "",
                              status: order.status,
                            });
                          }}
                          className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 mx-auto"
                        >
                          <Clock size={12} /> Set Date
                        </button>
                      )}
                    </td>
                    <td className="p-5 text-center font-black text-slate-700">
                      {order.eta || "TBD"}
                    </td>
                    <td className="p-5 text-center">
                      {editingId === order.id ? (
                        <select
                          className="text-[10px] font-black uppercase border-2 border-[#a8d1cd] rounded-lg p-1"
                          value={editData.status}
                          onChange={(e) =>
                            setEditData({ ...editData, status: e.target.value })
                          }
                        >
                          <option>Pending</option>
                          <option>Received</option>
                          <option>Cancelled</option>
                        </select>
                      ) : (
                        <span
                          className={`${getStatusStyle(
                            order.status
                          )} px-4 py-1.5 rounded-full text-[10px] font-black uppercase`}
                        >
                          {order.status || "Pending"}
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      {editingId === order.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSave(order.id)}
                            className="bg-emerald-500 text-white p-2 rounded-lg"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-slate-100 text-slate-400 p-2 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(order.id);
                            setEditData({
                              eta: order.eta || "",
                              status: order.status,
                            });
                          }}
                          className="p-2 text-slate-300 hover:text-[#a8d1cd]"
                        >
                          <Edit3 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InboundScheduling;
