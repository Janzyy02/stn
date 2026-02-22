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
  CheckCircle2,
} from "lucide-react";

const OutboundScheduling = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Statuses");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ delivery_date: "", status: "" });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales_transactions")
        .select(`*, sales_items (*)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id) => {
    try {
      const { data: order, error: fetchErr } = await supabase
        .from("sales_transactions")
        .select("*, sales_items(*)")
        .eq("id", id)
        .single();

      if (fetchErr) throw fetchErr;

      const isBecomingCompleted =
        editData.status === "Completed" && order.status !== "Completed";

      const { error: statusUpdateErr } = await supabase
        .from("sales_transactions")
        .update({
          status: editData.status,
          delivery_date: editData.delivery_date,
        })
        .eq("id", id);

      if (statusUpdateErr) throw statusUpdateErr;

      if (isBecomingCompleted) {
        for (const item of order.sales_items) {
          const { data: inv } = await supabase
            .from("hardware_inventory")
            .select("stock_balance, outbound_qty")
            .eq("id", item.product_id)
            .single();

          await supabase
            .from("hardware_inventory")
            .update({
              stock_balance:
                Number(inv?.stock_balance || 0) - Number(item.quantity),
              outbound_qty:
                Number(inv?.outbound_qty || 0) + Number(item.quantity),
            })
            .eq("id", item.product_id);

          await supabase.from("ledger").insert([
            {
              transaction_type: "OUTBOUND",
              reference_number: order.so_number,
              product_id: item.product_id,
              item_name: item.item_name,
              quantity: item.quantity,
              amount: Number(item.quantity) * Number(item.unit_price),
              timestamp: new Date().toISOString(),
            },
          ]);
        }
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }

      setEditingId(null);
      fetchTransactions();
    } catch (err) {
      alert("System Error: " + err.message);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.so_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "All Statuses" || tx.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 bg-[#f3f4f6] min-h-screen relative font-sans text-black">
      {showSuccess && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-8 py-4 rounded-xl font-black shadow-[8px_8px_0px_0px_rgba(34,197,94,1)] flex items-center gap-2 border-2 border-white animate-bounce">
          <CheckCircle2 className="text-emerald-400" /> STOCK & LEDGER UPDATED
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
          <Package className="text-black" size={36} /> Dispatch Center
        </h1>
        <div className="flex bg-white border-4 border-black rounded-xl p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <button
            onClick={() => setViewMode("table")}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 text-xs font-black uppercase transition-all ${
              viewMode === "table"
                ? "bg-black text-white"
                : "text-black hover:bg-slate-100"
            }`}
          >
            <List size={16} /> Table
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 text-xs font-black uppercase transition-all ${
              viewMode === "calendar"
                ? "bg-black text-white"
                : "text-black hover:bg-slate-100"
            }`}
          >
            <CalendarIcon size={16} /> Calendar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
            size={20}
          />
          <input
            type="text"
            placeholder="Search Order # or Customer..."
            className="w-full pl-12 pr-4 py-4 border-4 border-black rounded-2xl font-black uppercase text-xs outline-none focus:bg-yellow-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter
            className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
            size={20}
          />
          <select
            className="w-full pl-12 pr-4 py-4 border-4 border-black rounded-2xl font-black uppercase text-xs outline-none appearance-none bg-white cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All Statuses</option>
            <option>Pending</option>
            <option>In Transit</option>
            <option>Completed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2
            className="animate-spin text-black"
            size={64}
            strokeWidth={3}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-6 text-xs font-black uppercase italic tracking-widest border-r border-white/20">
                  Customer & Items
                </th>
                <th className="p-6 text-xs font-black uppercase italic tracking-widest border-r border-white/20">
                  Delivery Date
                </th>
                <th className="p-6 text-xs font-black uppercase italic tracking-widest border-r border-white/20">
                  Status
                </th>
                <th className="p-6 text-right text-xs font-black uppercase italic tracking-widest">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-black">
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-yellow-50 transition-colors"
                >
                  <td className="p-6 border-r-4 border-black">
                    <p className="font-mono text-blue-700 font-black text-sm mb-1">
                      #{tx.so_number}
                    </p>
                    <p className="font-black uppercase text-lg leading-none mb-2">
                      {tx.customer_name}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tx.sales_items?.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-white border-2 border-black px-2 py-1 rounded font-black text-black uppercase"
                        >
                          {item.item_name} (x{item.quantity})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-6 border-r-4 border-black">
                    {editingId === tx.id ? (
                      <input
                        type="date"
                        className="border-4 border-black rounded-lg p-2 text-sm font-black uppercase"
                        value={editData.delivery_date}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            delivery_date: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase">
                        <Clock size={18} strokeWidth={2.5} />{" "}
                        {tx.delivery_date || "NOT SCHEDULED"}
                      </div>
                    )}
                  </td>
                  <td className="p-6 border-r-4 border-black">
                    {editingId === tx.id ? (
                      <select
                        className="border-4 border-black rounded-lg p-2 text-sm font-black uppercase w-full"
                        value={editData.status}
                        onChange={(e) =>
                          setEditData({ ...editData, status: e.target.value })
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : (
                      <span
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border-4 ${
                          tx.status === "Completed"
                            ? "bg-emerald-400 text-black border-black"
                            : tx.status === "In Transit"
                            ? "bg-blue-400 text-black border-black"
                            : "bg-white text-black border-black"
                        }`}
                      >
                        {tx.status}
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    {editingId === tx.id ? (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleSave(tx.id)}
                          className="bg-emerald-400 border-2 border-black p-2 rounded-lg hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        >
                          <Save size={24} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-red-400 border-2 border-black p-2 rounded-lg"
                        >
                          <X size={24} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(tx.id);
                          setEditData({
                            delivery_date: tx.delivery_date || "",
                            status: tx.status,
                          });
                        }}
                        className="p-3 border-2 border-transparent hover:border-black hover:bg-slate-100 rounded-xl transition-all"
                      >
                        <Edit3 size={24} strokeWidth={2.5} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OutboundScheduling;
