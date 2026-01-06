import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { QRCodeSVG } from "qrcode.react"; // Ensure you run: npm install qrcode.react
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
  X,
  Printer,
} from "lucide-react";

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [archiveItems, setArchiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- NEW STATE FOR QR BATCHING & REDIRECTION ---
  const [selectedItems, setSelectedItems] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);

  // --- LIVE CLOCK STATE ---
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );

  // --- DATE FILTER STATE ---
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    fetchInventory();
    fetchArchive();

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
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

  // --- SELECTION HANDLERS ---
  const toggleSelect = (sku) => {
    setSelectedItems((prev) =>
      prev.includes(sku) ? prev.filter((i) => i !== sku) : [...prev, sku]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === inventoryItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(inventoryItems.map((item) => item.sku));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setDateRange({ start: today, end: today });
    setTimeout(() => fetchArchive(), 10);
  };

  const handleEndDay = async () => {
    const confirmEnd = window.confirm(
      "End Business Day? This will update the master quantity and reset daily movements."
    );
    if (!confirmEnd) return;

    try {
      setIsProcessing(true);
      const today = new Date().toISOString().split("T")[0];

      const historyData = inventoryItems.map((item) => {
        const inbound = item.inbound_qty || 0;
        const outbound = item.outbound_qty || 0;
        const projectedBalance = item.quantity + inbound - outbound;

        return {
          sku: item.sku,
          name: item.name,
          category: item.category,
          initial_qty: item.quantity,
          inbound_qty: inbound,
          outbound_qty: outbound,
          final_balance: projectedBalance,
          snapshot_date: today,
        };
      });

      await supabase.from("daily_ledger_history").insert(historyData);

      const updatePromises = inventoryItems.map((item) => {
        const netChange = (item.inbound_qty || 0) - (item.outbound_qty || 0);
        return supabase
          .from("hardware_inventory")
          .update({
            quantity: item.quantity + netChange,
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
      {/* PRINT STYLES - Ensures only labels print */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            padding: 0;
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 15px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* SECTION 1: LIVE LEDGER */}
      <div className="flex justify-between items-end mb-8 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Database className="text-blue-600" /> LIVE INVENTORY LEDGER
          </h1>
          <p className="text-slate-500 text-sm">
            Real-time daily stock movements
          </p>
        </div>

        <div className="flex items-center gap-6">
          {selectedItems.length > 0 && (
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all"
            >
              <QrCode size={16} />
              Generate QR ({selectedItems.length})
            </button>
          )}

          <div className="flex flex-col items-end border-r border-slate-200 pr-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Current Time
            </span>
            <div className="flex items-center gap-2 text-slate-700 font-mono font-bold text-lg">
              <Clock size={18} className="text-blue-500" />
              {currentTime}
            </div>
          </div>

          <button
            onClick={handleEndDay}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black shadow-xl disabled:opacity-50 transition-all active:scale-95"
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

      {/* INVENTORY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-16 no-print">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
              <th className="px-6 py-5 w-10">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 cursor-pointer"
                  onChange={toggleSelectAll}
                  checked={
                    selectedItems.length === inventoryItems.length &&
                    inventoryItems.length > 0
                  }
                />
              </th>
              <th className="px-6 py-5">Product Details</th>
              <th className="px-6 py-4">Current Master Qty</th>
              <th className="px-6 py-4 text-blue-600">Daily In (+)</th>
              <th className="px-6 py-4 text-orange-600">Daily Out (-)</th>
              <th className="px-6 py-4 bg-teal-50 text-teal-700">
                Projected Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventoryItems.map((item) => {
              const projectedBalance =
                item.quantity +
                (item.inbound_qty || 0) -
                (item.outbound_qty || 0);

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 cursor-pointer"
                      checked={selectedItems.includes(item.sku)}
                      onChange={() => toggleSelect(item.sku)}
                    />
                  </td>
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
                      projectedBalance < 0 ? "text-red-600" : "text-teal-800"
                    }`}
                  >
                    {projectedBalance}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* QR MODAL PREVIEW */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="font-black text-xl text-slate-800">
                  QR BATCH GENERATOR
                </h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">
                  Linking to action UI for {selectedItems.length} labels
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all"
                >
                  <Printer size={16} /> Print Labels
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div
              id="printable-area"
              className="p-10 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-8 bg-slate-50"
            >
              {inventoryItems
                .filter((item) => selectedItems.includes(item.sku))
                .map((item) => (
                  <div
                    key={item.sku}
                    className="bg-white border-2 border-slate-200 p-6 flex flex-col items-center justify-center rounded-2xl shadow-sm text-center"
                  >
                    {/* REDIRECT URL ENCODED IN QR CODE */}
                    <QRCodeSVG
                      value={`${window.location.origin}/inventory/action?sku=${item.sku}`}
                      size={140}
                      level="H"
                      includeMargin={true}
                    />
                    <div className="mt-4">
                      <p className="text-[11px] font-black uppercase text-slate-800 line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-blue-600 mt-1 bg-blue-50 px-2 py-0.5 rounded italic">
                        Scan to buy/restock
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: DAILY ARCHIVE LOG */}
      <div className="border-t-2 border-slate-200 pt-12 no-print">
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
            <button
              onClick={handleSetToday}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Clock size={14} className="text-blue-500" />
              Today
            </button>

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
                        record.inbound_qty - record.outbound_qty >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {record.inbound_qty - record.outbound_qty > 0
                        ? `+${record.inbound_qty - record.outbound_qty}`
                        : record.inbound_qty - record.outbound_qty}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">
                      {record.final_balance}
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
