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
  QrCode,
  ShoppingBag,
  ArrowDownUp,
  TrendingUp,
} from "lucide-react";

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [archiveItems, setArchiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchInventory();
    fetchArchive();
    const timer = setInterval(
      () => setCurrentTime(new Date().toLocaleTimeString()),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  const fetchInventory = async () => {
    try {
      // Joins purchase_order_items with purchase_orders to get the verified created_at date
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select(
          `
          *,
          purchase_orders (
            created_at
          )
        `
        )
        .order("po_number", { ascending: false });

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (err) {
      console.error("Error fetching items:", err.message);
    } finally {
      setLoading(false);
    }
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

  const groupedByPO = inventoryItems.reduce((acc, item) => {
    const po = item.po_number || "No PO Number";
    if (!acc[po]) acc[po] = [];
    acc[po].push(item);
    return acc;
  }, {});

  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleEndDay = async () => {
    if (
      !window.confirm(
        "End Business Day? This will snapshot movements and reset tallies."
      )
    )
      return;

    try {
      setIsProcessing(true);
      const today = new Date().toISOString().split("T")[0];

      const historyData = inventoryItems.map((item) => ({
        sku: item.sku,
        name: item.item_name,
        initial_qty: item.quantity,
        inbound_qty: item.inbound_qty || 0,
        outbound_qty: item.outbound_qty || 0,
        final_balance:
          item.quantity + (item.inbound_qty || 0) - (item.outbound_qty || 0),
        snapshot_date: today,
      }));

      // 1. Save to History
      const { error: historyError } = await supabase
        .from("daily_ledger_history")
        .insert(historyData);
      if (historyError) throw historyError;

      // 2. Update Master Stock and Reset Daily Counts
      const updatePromises = inventoryItems.map((item) => {
        const netChange = (item.inbound_qty || 0) - (item.outbound_qty || 0);
        return supabase
          .from("purchase_order_items")
          .update({
            quantity: item.quantity + netChange,
            inbound_qty: 0,
            outbound_qty: 0,
          })
          .eq("id", item.id);
      });

      await Promise.all(updatePromises);
      fetchInventory();
      fetchArchive();
      alert("Business day closed successfully.");
    } catch (err) {
      alert("Error closing day: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

  return (
    <div className="p-8 w-full bg-slate-50 min-h-screen font-sans text-slate-900">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-8 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Database className="text-blue-600" /> INVENTORY MANAGEMENT
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
            System Status: <span className="text-emerald-600">Active</span>
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end border-r border-slate-200 pr-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Station Time
            </span>
            <div className="flex items-center gap-2 text-slate-700 font-mono font-bold text-lg">
              <Clock size={18} className="text-blue-500" /> {currentTime}
            </div>
          </div>
          <button
            onClick={handleEndDay}
            disabled={isProcessing}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg active:scale-95"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            End Business Day
          </button>
        </div>
      </div>

      {/* TABLE 1: DAILY MOVEMENT LEDGER */}
      <div className="mb-12 no-print">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-4">
          <ArrowDownUp className="text-blue-600" size={20} /> Daily Movement
          Ledger
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800 text-slate-300 text-[10px] uppercase font-black tracking-widest">
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4 text-center">Opening Stock</th>
                <th className="px-6 py-4 text-blue-400 text-center">
                  Daily In (+)
                </th>
                <th className="px-6 py-4 text-orange-400 text-center">
                  Daily Out (-)
                </th>
                <th className="px-6 py-4 bg-slate-700 text-teal-400 text-center border-l border-slate-600">
                  Projected Close
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventoryItems.map((item) => {
                const balance =
                  item.quantity +
                  (item.inbound_qty || 0) -
                  (item.outbound_qty || 0);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold uppercase text-sm text-slate-700 block">
                        {item.item_name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        PO Ref: {item.po_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-blue-600">
                      +{item.inbound_qty || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-orange-600">
                      -{item.outbound_qty || 0}
                    </td>
                    <td
                      className={`px-6 py-4 text-center font-black bg-teal-50/20 border-l border-slate-100 ${
                        balance < 0 ? "text-red-600" : "text-teal-700"
                      }`}
                    >
                      {balance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 2: MASTER INVENTORY (SKU REMOVED, DATE ADDED) */}
      <div className="mb-12 no-print">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-4">
          <Package className="text-blue-600" size={20} /> Master Inventory
          Records
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b">
                <th className="px-6 py-4 w-12 text-center">
                  <QrCode size={14} className="mx-auto" />
                </th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4 text-center">Date Purchased</th>
                <th className="px-6 py-4 text-center">Physical Stock</th>
                <th className="px-6 py-4 text-right">PO Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(groupedByPO).map(([po, items]) => (
                <React.Fragment key={po}>
                  <tr className="bg-slate-50/50">
                    <td
                      colSpan="5"
                      className="px-6 py-2 border-y border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          PO: {po}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/10 transition-colors"
                    >
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded accent-blue-600"
                        />
                      </td>
                      <td className="px-6 py-4 font-bold uppercase text-sm text-slate-700">
                        {item.item_name}
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">
                        {item.purchase_orders?.created_at
                          ? new Date(
                              item.purchase_orders.created_at
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {po}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 3: LEDGER HISTORY (ARCHIVE) */}
      <div className="no-print">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <History className="text-blue-600" size={20} /> Ledger History
          </h2>
          <div className="flex gap-2">
            <input
              type="date"
              className="text-xs font-bold border rounded-lg px-2 py-1"
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
            <button
              onClick={fetchArchive}
              className="bg-slate-200 p-2 rounded-lg hover:bg-slate-300"
            >
              <Search size={14} />
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
                <th className="px-6 py-4">Snapshot Date</th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4 text-center">Daily In</th>
                <th className="px-6 py-4 text-center">Daily Out</th>
                <th className="px-6 py-4 text-right">Closed Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {archiveItems.map((record) => (
                <tr key={record.id} className="text-xs">
                  <td className="px-6 py-3 font-mono text-slate-500">
                    {record.snapshot_date}
                  </td>
                  <td className="px-6 py-3 font-bold text-slate-700 uppercase">
                    {record.name}
                  </td>
                  <td className="px-6 py-3 text-center text-blue-600 font-bold">
                    +{record.inbound_qty}
                  </td>
                  <td className="px-6 py-3 text-center text-orange-600 font-bold">
                    -{record.outbound_qty}
                  </td>
                  <td className="px-6 py-3 text-right font-black text-slate-900">
                    {record.final_balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
