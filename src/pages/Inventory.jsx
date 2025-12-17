import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Package,
  Layers,
  AlertTriangle,
  Filter,
  Download,
  MoreHorizontal,
  Loader2,
  Calendar,
} from "lucide-react";

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper functions for date shortcuts
  const getToday = () => new Date().toISOString().split("T")[0];
  const getFirstOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  };

  // State for date filtering - defaults to current month
  const [dateRange, setDateRange] = useState({
    start: getFirstOfMonth(),
    end: getToday(),
  });

  useEffect(() => {
    fetchInventory();
  }, [dateRange]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      // If start and end are same, it effectively queries a single day
      const startTime = `${dateRange.start}T00:00:00`;
      const endTime = `${dateRange.end}T23:59:59`;

      let { data, error } = await supabase
        .from("hardware_inventory")
        .select("*")
        .gte("last_updated", startTime)
        .lte("last_updated", endTime)
        .order("name", { ascending: true });

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Date Shortcut Handlers
  const setSingleDate = (date) => setDateRange({ start: date, end: date });
  const setMonthRange = () =>
    setDateRange({ start: getFirstOfMonth(), end: getToday() });

  const getStatus = (balance, minLevel) => {
    if (balance <= 0) return "Out of Stock";
    if (balance <= minLevel) return "Low Stock";
    return "In Stock";
  };

  const exportToCSV = () => {
    if (inventoryItems.length === 0) return;
    const headers = [
      "SKU",
      "Product",
      "Category",
      "Initial",
      "In",
      "Out",
      "Balance",
      "Price",
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
      item.price,
      getStatus(item.stock_balance, item.min_stock_level),
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Ledger_${dateRange.start}_to_${dateRange.end}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 w-full bg-slate-50 min-h-screen font-sans text-slate-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Inventory Management
          </h1>
          <p className="text-slate-500 text-sm">
            Hardware Store Stock Ledger (PHP)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Quick Shortcuts */}
          <div className="flex gap-2">
            <button
              onClick={() => setSingleDate(getToday())}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-all shadow-sm active:scale-95"
            >
              Today
            </button>
            <button
              onClick={setMonthRange}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-all shadow-sm active:scale-95"
            >
              This Month
            </button>
          </div>

          {/* Date Picker Range/Single */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-400 font-bold">
                From
              </span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="text-xs font-bold outline-none cursor-pointer text-slate-800"
              />
            </div>
            <div className="h-8 w-px bg-slate-100 mx-2" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-slate-400 font-bold">
                To
              </span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="text-xs font-bold outline-none cursor-pointer text-slate-800"
              />
            </div>
            <Calendar size={16} className="text-teal-600 ml-2" />
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Stock Value"
          value={`₱${inventoryItems
            .reduce((acc, item) => acc + item.price * item.stock_balance, 0)
            .toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<Package className="text-teal-600" />}
          trend="Current View"
          up={true}
        />
        <StatCard
          title="Unique Categories"
          value={[...new Set(inventoryItems.map((i) => i.category))].length}
          icon={<Layers className="text-blue-600" />}
          trend="Active"
          up={true}
        />
        <StatCard
          title="Low Stock Alerts"
          value={
            inventoryItems.filter((i) => i.stock_balance <= i.min_stock_level)
              .length
          }
          icon={<AlertTriangle className="text-orange-600" />}
          trend="Action Needed"
          up={false}
        />
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Stock Activity Ledger</h2>
          {loading && (
            <Loader2 className="animate-spin text-teal-600" size={20} />
          )}
        </div>

        <div className="overflow-x-auto">
          {error ? (
            <div className="p-10 text-center text-red-500 font-medium bg-red-50">
              Error: {error}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                  <th className="px-6 py-4">Product / SKU</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Initial</th>
                  <th className="px-6 py-4 text-blue-600">In (+)</th>
                  <th className="px-6 py-4 text-orange-600">Out (-)</th>
                  <th className="px-6 py-4 bg-teal-50/30 text-teal-700 font-extrabold">
                    Balance
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryItems.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-10 text-center text-slate-400 italic font-medium"
                    >
                      No stock activity found for selected date(s).
                    </td>
                  </tr>
                )}
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
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={getStatus(
                          item.stock_balance,
                          item.min_stock_level
                        )}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      ₱
                      {parseFloat(item.price).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
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

const StatCard = ({ title, value, icon, trend, up }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
      <span
        className={`text-xs font-bold ${
          up ? "text-green-600" : "text-red-500"
        }`}
      >
        {trend}
      </span>
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
  </div>
);

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
