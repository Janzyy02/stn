import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Package,
  History,
  Loader2,
  CheckCircle2,
  Calendar,
  Database,
  Search,
  ArrowRight,
  Clock,
} from "lucide-react";

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [archiveItems, setArchiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- DATE FILTER STATE ---
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    fetchInventory();
    fetchArchive();
  }, []);

  const fetchInventory = async () => {
    const { data } = await supabase
      .from("hardware_inventory")
      .select("*")
      .order("name", { ascending: true });
    setInventoryItems(data || []);
  };

  const fetchArchive = async () => {
    try {
      let query = supabase
        .from("daily_ledger_history")
        .select("*")
        .order("snapshot_date", { ascending: false });

      if (dateRange.start) query = query.gte("snapshot_date", dateRange.start);
      if (dateRange.end) query = query.lte("snapshot_date", dateRange.end);

      const { data, error } = await query;
      if (error) throw error;
      setArchiveItems(data || []);
    } catch (err) {
      console.error("Archive Error:", err.message);
    }
  };

  // --- RESTORED: TODAY BUTTON LOGIC ---
  const handleSetToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setDateRange({ start: today, end: today });
    // We use a small timeout or a manual call because state updates are async
    setTimeout(() => fetchArchive(), 10);
  };

  const handleEndDay = async () => {
    const confirmEnd = window.confirm(
      "End Business Day? This will add today's balance to quantity and reset movements to 0."
    );
    if (!confirmEnd) return;

    try {
      setIsProcessing(true);
      const today = new Date().toISOString().split("T")[0];

      const historyData = inventoryItems.map((item) => ({
        sku: item.sku,
        name: item.name,
        category: item.category,
        initial_qty: item.quantity,
        inbound_qty: item.inbound_qty || 0,
        outbound_qty: item.outbound_qty || 0,
        final_balance: (item.inbound_qty || 0) - (item.outbound_qty || 0),
        snapshot_date: today,
      }));

      await supabase.from("daily_ledger_history").insert(historyData);

      const updatePromises = inventoryItems.map((item) => {
        const dailyNet = (item.inbound_qty || 0) - (item.outbound_qty || 0);
        return supabase
          .from("hardware_inventory")
          .update({
            quantity: item.quantity + dailyNet,
            inbound_qty: 0,
            outbound_qty: 0,
            last_updated: new Date().toISOString(),
          })
          .eq("id", item.id);
      });

      await Promise.all(updatePromises);
      alert("Day Closed Successfully.");
      fetchInventory();
      fetchArchive();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 w-full bg-slate-50 min-h-screen font-sans text-slate-900">
      {/* SECTION 1: LIVE LEDGER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Database className="text-blue-600" /> LIVE INVENTORY LEDGER
          </h1>
          <p className="text-slate-500 text-sm">
            Real-time daily stock movements
          </p>
        </div>
        <button
          onClick={handleEndDay}
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black shadow-xl disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          End Business Day
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-16">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <th className="px-6 py-5">Product Details</th>
              <th className="px-6 py-4">Current Master Qty</th>
              <th className="px-6 py-4 text-blue-600">Daily In (+)</th>
              <th className="px-6 py-4 text-orange-600">Daily Out (-)</th>
              <th className="px-6 py-4 bg-teal-50 text-teal-700">
                Daily Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventoryItems.map((item) => {
              const dailyBalance =
                (item.inbound_qty || 0) - (item.outbound_qty || 0);
              return (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold uppercase">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono font-bold">
                      {item.sku}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-600">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600">
                    +{item.inbound_qty || 0}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-orange-600">
                    -{item.outbound_qty || 0}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-black bg-teal-50/30 ${
                      dailyBalance < 0 ? "text-red-600" : "text-teal-800"
                    }`}
                  >
                    {dailyBalance}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SECTION 2: DAILY ARCHIVE LOG */}
      <div className="border-t-2 border-slate-200 pt-12">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg text-white shadow-lg">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Daily Archive Log
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                Historical snapshots
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* TODAY BUTTON */}
            <button
              onClick={handleSetToday}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Clock size={14} className="text-blue-500" />
              Today
            </button>

            {/* DATE RANGE PICKER UI */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 px-2 border-r">
                <Calendar size={16} className="text-blue-500" />
                <input
                  type="date"
                  className="text-xs font-bold outline-none bg-transparent"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                />
              </div>
              <ArrowRight size={14} className="text-slate-300" />
              <div className="flex items-center gap-2 px-2">
                <input
                  type="date"
                  className="text-xs font-bold outline-none bg-transparent"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                />
              </div>
              <button
                onClick={fetchArchive}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-300 text-[10px] uppercase font-black tracking-widest">
                <th className="px-6 py-4">Snapshot Date</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Starting Qty</th>
                <th className="px-6 py-4">Day Net Change</th>
                <th className="px-6 py-4">Closing Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {archiveItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-slate-400 font-bold italic"
                  >
                    No records found for the selected range.
                  </td>
                </tr>
              ) : (
                archiveItems.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(record.snapshot_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 uppercase">
                      {record.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-500">
                      {record.initial_qty}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-black ${
                        record.final_balance >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {record.final_balance > 0
                        ? `+${record.final_balance}`
                        : record.final_balance}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">
                      {record.initial_qty + record.final_balance}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
