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
  Package,
} from "lucide-react";

const OutboundScheduling = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Statuses");

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ delivery_date: "", status: "" });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Fetch from sales_transactions and include related sales_items
      const { data, error } = await supabase
        .from("sales_transactions")
        .select(
          `
          *,
          sales_items (*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id) => {
    try {
      // Use current timestamp for updated_at
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("sales_transactions")
        .update({
          // Using delivery_date column as the outbound equivalent of ETA
          delivery_date: editData.delivery_date,
          status: editData.status,
          updated_at: now,
        })
        .eq("id", id);

      if (error) throw error;
      setEditingId(null);
      await fetchTransactions();
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-500 text-white";
      case "Out for Delivery":
        return "bg-blue-500 text-white";
      case "Pending":
        return "bg-amber-500 text-white";
      case "Cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-slate-400 text-white";
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      (tx.invoice_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (tx.customer_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "All Statuses" || tx.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const localTileDate = `${year}-${month}-${day}`;

      const dayOrders = filteredTransactions.filter(
        (tx) => tx.delivery_date === localTileDate
      );
      return (
        <div className="flex flex-col gap-1 mt-1 w-full px-1">
          {dayOrders.map((tx) => (
            <div
              key={tx.id}
              className={`${getStatusStyle(
                tx.status
              )} text-[9px] p-1 rounded font-black truncate border border-white/20`}
            >
              {tx.invoice_number}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 font-sans text-slate-800">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-black text-black uppercase tracking-tight">
            Outbound Scheduling
          </h1>
          <p className="text-slate-500 font-bold mt-1">
            Manage Customer Deliveries & Dispatches
          </p>
        </div>
        <div className="flex bg-white rounded-lg border p-1 shadow-sm h-12">
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 w-12 flex items-center justify-center rounded ${
              viewMode === "table" ? "bg-black text-white" : "text-slate-400"
            }`}
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`p-2 w-12 flex items-center justify-center rounded ${
              viewMode === "calendar" ? "bg-black text-white" : "text-slate-400"
            }`}
          >
            <CalendarIcon size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
            Search Sales
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-3 text-slate-300"
              size={18}
            />
            <input
              type="text"
              placeholder="Invoice # or Customer Name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-black outline-none font-bold text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
            Delivery Status
          </label>
          <div className="relative">
            <Filter
              className="absolute left-3 top-3 text-slate-300"
              size={18}
            />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-50 rounded-xl focus:border-black outline-none font-bold text-sm appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Out for Delivery</option>
              <option>Delivered</option>
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
            .react-calendar__tile--now { background: #f1f5f9 !important; border-radius: 8px; font-weight: bold; }
            .react-calendar__tile--active { background: #000 !important; color: white !important; border-radius: 8px; }
          `}</style>
          <Calendar tileContent={tileContent} className="rounded-xl" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b">
              <tr>
                <th className="p-5">Invoice / Customer</th>
                <th className="p-5">Items</th>
                <th className="p-5 text-center">Schedule Delivery</th>
                <th className="p-5 text-center">Delivery Date</th>
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
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-5 font-black">
                      {tx.invoice_number}
                      <div className="text-[10px] text-slate-500 font-bold uppercase">
                        {tx.customer_name}
                      </div>
                      <div className="text-[9px] text-slate-300">
                        Placed: {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        {tx.sales_items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-fit"
                          >
                            {item.quantity}x {item.product_name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      {editingId === tx.id ? (
                        <input
                          type="date"
                          value={editData.delivery_date}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              delivery_date: e.target.value,
                            })
                          }
                          className="border-2 border-black rounded-lg p-1 text-xs font-black"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(tx.id);
                            setEditData({
                              delivery_date: tx.delivery_date || "",
                              status: tx.status || "Pending",
                            });
                          }}
                          className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 mx-auto"
                        >
                          <Clock size={12} /> Set Date
                        </button>
                      )}
                    </td>
                    <td className="p-5 text-center font-black text-slate-700">
                      {tx.delivery_date || "Pending"}
                    </td>
                    <td className="p-5 text-center">
                      {editingId === tx.id ? (
                        <select
                          className="text-[10px] font-black uppercase border-2 border-black rounded-lg p-1"
                          value={editData.status}
                          onChange={(e) =>
                            setEditData({ ...editData, status: e.target.value })
                          }
                        >
                          <option>Pending</option>
                          <option>Out for Delivery</option>
                          <option>Delivered</option>
                          <option>Cancelled</option>
                        </select>
                      ) : (
                        <span
                          className={`${getStatusStyle(
                            tx.status
                          )} px-4 py-1.5 rounded-full text-[10px] font-black uppercase`}
                        >
                          {tx.status || "Pending"}
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      {editingId === tx.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSave(tx.id)}
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
                            setEditingId(tx.id);
                            setEditData({
                              delivery_date: tx.delivery_date || "",
                              status: tx.status || "Pending",
                            });
                          }}
                          className="p-2 text-slate-300 hover:text-black"
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

export default OutboundScheduling;
