import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Package,
  Download,
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  Calendar,
  Search,
  RefreshCcw,
} from "lucide-react";

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize with today's date
  const getTodayStr = () => new Date().toISOString().split("T")[0];

  const [dateRange, setDateRange] = useState({
    start: getTodayStr(),
    end: getTodayStr(),
  });

  useEffect(() => {
    fetchInventory();
  }, [dateRange]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Join hardware_inventory with product_pricing using product_id
      let { data, error: fetchError } = await supabase
        .from("hardware_inventory")
        .select(
          `
          *,
          product_pricing!product_id (
            supplier_cost,
            manual_retail_price
          )
        `
        )
        .gte("last_updated", `${dateRange.start}T00:00:00Z`)
        .lte("last_updated", `${dateRange.end}T23:59:59Z`)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;
      setInventoryItems(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setFilterToToday = () => {
    const today = getTodayStr();
    setDateRange({ start: today, end: today });
  };

  const handleEndDay = async () => {
    const confirmEnd = window.confirm(
      "End Business Day? This will archive current totals and reset daily movement counts."
    );

    if (!confirmEnd) return;

    try {
      setIsProcessing(true);

      const historyData = inventoryItems.map((item) => {
        const unitPrice =
          item.product_pricing?.manual_retail_price ||
          item.product_pricing?.supplier_cost ||
          0;

        return {
          sku: item.sku,
          name: item.name,
          category: item.category,
          initial_qty: item.quantity,
          inbound_qty: item.inbound_qty,
          outbound_qty: item.outbound_qty,
          final_balance: item.stock_balance,
          total_value: unitPrice * item.stock_balance,
          snapshot_date: new Date().toISOString().split("T")[0],
        };
      });

      const { error: historyError } = await supabase
        .from("daily_ledger_history")
        .insert(historyData);

      if (historyError) throw historyError;

      const updatePromises = inventoryItems.map((item) =>
        supabase
          .from("hardware_inventory")
          .update({
            quantity: item.quantity + item.stock_balance,
            inbound_qty: 0,
            outbound_qty: 0,
            last_updated: new Date().toISOString(),
          })
          .eq("id", item.id)
      );

      const results = await Promise.all(updatePromises);
      const firstError = results.find((r) => r.error);
      if (firstError) throw firstError.error;

      alert("Business day closed successfully!");
      fetchInventory();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatus = (balance, minLevel) => {
    if (balance <= 0) return "Out of Stock";
    if (balance <= minLevel) return "Low Stock";
    return "In Stock";
  };

  const exportToCSV = () => {
    if (inventoryItems.length === 0) return;
    // Price column removed from CSV headers
    const headers = [
      "SKU",
      "Product",
      "Category",
      "Initial",
      "In",
      "Out",
      "Balance",
      "Status",
    ];
    const rows = inventoryItems.map((item) => [
      item.sku,
      `"${item.name}"`,
      item.category,
      item.quantity,
      item.inbound_qty,
      item.outbound_qty,
      item.stock_balance,
      getStatus(item.stock_balance, item.min_stock_level),
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Inventory_Report_${dateRange.start}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 w-full bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Inventory Management
          </h1>
          <p className="text-slate-500 text-sm">Real-time Stock Ledger</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm grow md:grow-0">
            <div className="flex items-center gap-2 px-3 border-r border-slate-100">
              <Calendar size={16} className="text-teal-600" />
              <button
                onClick={setFilterToToday}
                className="text-[10px] font-bold uppercase tracking-wider text-teal-600 hover:text-teal-700 transition-colors"
              >
                Today
              </button>
            </div>
            <div className="flex items-center gap-2 pr-3">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="text-xs font-semibold text-slate-600 bg-transparent outline-none cursor-pointer hover:text-teal-600 transition-colors"
              />
              <span className="text-slate-300">—</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="text-xs font-semibold text-slate-600 bg-transparent outline-none cursor-pointer hover:text-teal-600 transition-colors"
              />
            </div>
            <button
              onClick={fetchInventory}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
            >
              <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleEndDay}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 transition-all shadow-md disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              End Business Day
            </button>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="font-bold text-slate-800">Movement Ledger</h2>
          <div className="relative group">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            />
            <input
              type="text"
              placeholder="Search items..."
              className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-xs outline-none w-48 md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {error ? (
            <div className="p-10 text-center text-red-500 bg-red-50">
              {error}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Initial</th>
                  <th className="px-6 py-4 text-blue-600">In (+)</th>
                  <th className="px-6 py-4 text-orange-600">Out (-)</th>
                  <th className="px-6 py-4 bg-teal-50/30 text-teal-700">
                    Balance
                  </th>
                  {/* Price column header removed */}
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">
                        {item.sku}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-700">
                      +{item.inbound_qty}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-700">
                      -{item.outbound_qty}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 bg-teal-50/20">
                      {item.stock_balance}
                    </td>
                    {/* Price table data cell removed */}
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={getStatus(
                          item.stock_balance,
                          item.min_stock_level
                        )}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-slate-600 p-1">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    "In Stock": "bg-green-50 text-green-600 border-green-100",
    "Low Stock": "bg-orange-50 text-orange-600 border-orange-100",
    "Out of Stock": "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-[11px] font-bold border ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export default Inventory;
