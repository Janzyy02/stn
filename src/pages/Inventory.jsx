import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { QRCodeSVG } from "qrcode.react";
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
  ShoppingBag,
  ArrowDownUp,
} from "lucide-react";

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [archiveItems, setArchiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- QR BATCH & SELECTION STATE ---
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

  // Fetching from purchase_order_items to ensure items are separated by PO and not merged
  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select("*")
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

  // Grouping logic for the Master Inventory table
  const groupedByPO = inventoryItems.reduce((acc, item) => {
    const po = item.po_number || "No PO Number";
    if (!acc[po]) acc[po] = [];
    acc[po].push(item);
    return acc;
  }, {});

  // Selection using unique database IDs to avoid issues with duplicate SKUs
  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === inventoryItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(inventoryItems.map((item) => item.id));
    }
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setDateRange({ start: today, end: today });
    setTimeout(() => fetchArchive(), 10);
  };

  const handleEndDay = async () => {
    const confirmEnd = window.confirm(
      "End Business Day? This will snapshot the current state and reset movements."
    );
    if (!confirmEnd) return;

    try {
      setIsProcessing(true);
      const today = new Date().toISOString().split("T")[0];

      const historyData = inventoryItems.map((item) => {
        const inbound = item.inbound_qty || 0;
        const outbound = item.outbound_qty || 0;
        const finalBalance = item.quantity + inbound - outbound;

        return {
          sku: item.sku,
          name: item.item_name || item.name,
          category: "PO Item",
          initial_qty: item.quantity,
          inbound_qty: inbound,
          outbound_qty: outbound,
          final_balance: finalBalance,
          snapshot_date: today,
        };
      });

      await supabase.from("daily_ledger_history").insert(historyData);

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
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 15px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* HEADER */}
      <div className="flex justify-between items-end mb-8 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Database className="text-blue-600" /> INVENTORY MANAGEMENT
          </h1>
          <p className="text-slate-500 text-sm">
            Active Ledger and Purchase Order Records
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end border-r border-slate-200 pr-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Current Time
            </span>
            <div className="flex items-center gap-2 text-slate-700 font-mono font-bold text-lg">
              <Clock size={18} className="text-blue-500" /> {currentTime}
            </div>
          </div>

          <button
            onClick={handleEndDay}
            disabled={isProcessing}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
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

      {/* TABLE 1: DAILY MOVEMENT LEDGER (TOP) */}
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
                <th className="px-6 py-4 text-center">Start Qty</th>
                <th className="px-6 py-4 text-blue-400 text-center">
                  Daily In (+)
                </th>
                <th className="px-6 py-4 text-orange-400 text-center">
                  Daily Out (-)
                </th>
                {/* Projected Balance column with distinct color styling */}
                <th className="px-6 py-4 bg-slate-700 text-teal-400 text-center border-l border-slate-600">
                  Projected Balance
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
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <span className="font-bold uppercase text-sm text-slate-700 block">
                        {item.item_name || item.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        PO: {item.po_number}
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
                    {/* Balanced column with background tint */}
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

      {/* TABLE 2: MASTER INVENTORY (BOTTOM - GROUPED BY PO) */}
      <div className="mb-12 no-print">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Package className="text-blue-600" size={20} /> Master Inventory
            Records
          </h2>
          {selectedItems.length > 0 && (
            <button
              onClick={() => setShowQRModal(true)}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg flex items-center gap-2"
            >
              <QrCode size={16} /> Generate Labels ({selectedItems.length})
            </button>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b">
                <th className="px-6 py-4 w-12 text-center">
                  <QrCode size={14} className="mx-auto" />
                </th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">SKU / Serial</th>
                <th className="px-6 py-4 text-center">Physical Stock</th>
                <th className="px-6 py-4 text-right">PO Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(groupedByPO).map(([po, items]) => (
                <React.Fragment key={po}>
                  {/* Row separator for PO separation */}
                  <tr className="bg-slate-50/50">
                    <td colSpan="5" className="px-6 py-2">
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Purchase Order: {po}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/20 transition-colors"
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
                        {item.item_name || item.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-blue-600 font-bold">
                        {item.sku}
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

      {/* SECTION 3: ARCHIVE LOG */}
      <div className="border-t-2 border-slate-200 pt-12 no-print">
        <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg text-white shadow-lg">
              <History size={24} />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              Daily Archive Log
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSetToday}
              className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm flex items-center gap-2"
            >
              <Clock size={14} className="text-blue-500" /> Today
            </button>
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <input
                type="date"
                className="text-xs font-bold outline-none bg-transparent px-2"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
              <ArrowRight size={14} className="text-slate-300" />
              <input
                type="date"
                className="text-xs font-bold outline-none bg-transparent px-2"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
              <button
                onClick={fetchArchive}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-12">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-slate-300 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Snapshot Date</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-4 py-4 text-center">Initial</th>
                <th className="px-4 py-4 text-center text-blue-400">In (+)</th>
                <th className="px-4 py-4 text-center text-orange-400">
                  Out (-)
                </th>
                <th className="px-6 py-4 text-center">Final Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {archiveItems.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-xs font-black text-slate-500 uppercase">
                    {new Date(record.snapshot_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 uppercase">
                    {record.name}
                  </td>
                  <td className="px-4 py-4 text-center text-xs font-bold text-slate-400">
                    {record.initial_qty}
                  </td>
                  <td className="px-4 py-4 text-center text-xs font-bold text-blue-500">
                    +{record.inbound_qty}
                  </td>
                  <td className="px-4 py-4 text-center text-xs font-bold text-orange-500">
                    -{record.outbound_qty}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-black text-slate-900">
                    {record.final_balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR MODAL PREVIEW */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <h2 className="font-black text-xl text-slate-800 uppercase">
                Label Batch Preview
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2"
                >
                  <Printer size={16} /> Print Labels
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div
              id="printable-area"
              className="p-10 overflow-y-auto grid grid-cols-3 gap-8 bg-slate-50"
            >
              {inventoryItems
                .filter((i) => selectedItems.includes(i.id))
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border p-6 flex flex-col items-center justify-center rounded-2xl shadow-sm text-center"
                  >
                    <QRCodeSVG
                      value={`${window.location.origin}/inventory/action?sku=${item.sku}`}
                      size={130}
                      level="H"
                      includeMargin={true}
                    />
                    <p className="mt-4 text-[10px] font-black uppercase text-slate-800">
                      {item.item_name || item.name}
                    </p>
                    <p className="text-[9px] font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded mt-1">
                      {item.sku}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
