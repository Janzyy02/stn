import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { QRCodeSVG } from "qrcode.react";
import {
  Package,
  History,
  Loader2,
  CheckCircle2,
  Clock,
  Database,
  Search,
  QrCode,
  ShoppingBag,
  ArrowDownUp,
  X,
  Printer,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const Inventory = ({ setCurrentPage, setSelectedPO }) => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [archiveItems, setArchiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [expandedPOs, setExpandedPOs] = useState({}); // State to track visible batches
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

      // Initialize all PO sections as expanded by default
      const initialExpanded = {};
      data?.forEach((item) => {
        initialExpanded[item.po_number] = true;
      });
      setExpandedPOs(initialExpanded);
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

  // NEW: Logic to toggle selection for a whole batch
  const toggleBatch = (itemsInBatch) => {
    const batchIds = itemsInBatch.map((item) => item.id);
    const allInBatchSelected = batchIds.every((id) =>
      selectedItems.includes(id)
    );

    if (allInBatchSelected) {
      // Remove all items of this batch from selection
      setSelectedItems((prev) => prev.filter((id) => !batchIds.includes(id)));
    } else {
      // Add all items of this batch to selection
      setSelectedItems((prev) => [...new Set([...prev, ...batchIds])]);
    }
  };

  // NEW: Logic to show/hide items under a PO reference
  const togglePOVisibility = (po) => {
    setExpandedPOs((prev) => ({
      ...prev,
      [po]: !prev[po],
    }));
  };

  const handleItemClick = (po_number) => {
    setSelectedPO(po_number);
    setCurrentPage("Item Action");
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
        name: item.item_name,
        initial_qty: item.quantity,
        inbound_qty: item.inbound_qty || 0,
        outbound_qty: item.outbound_qty || 0,
        final_balance:
          item.quantity + (item.inbound_qty || 0) - (item.outbound_qty || 0),
        snapshot_date: today,
        po_number: item.po_number,
      }));

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
      fetchInventory();
      fetchArchive();
    } catch (err) {
      alert("Error: " + err.message);
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
            Status: <span className="text-emerald-600">Live Ledger</span>
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
                <th className="px-6 py-4 text-center">Start</th>
                <th className="px-6 py-4 text-blue-400 text-center">In (+)</th>
                <th className="px-6 py-4 text-orange-400 text-center">
                  Out (-)
                </th>
                <th className="px-6 py-4 bg-slate-700 text-teal-400 text-center border-l border-slate-600">
                  Close
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventoryItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-bold uppercase text-sm text-slate-700 block">
                      {item.item_name}
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
                  <td className="px-6 py-4 text-center font-black bg-teal-50/20 border-l border-slate-100 text-teal-700">
                    {item.quantity +
                      (item.inbound_qty || 0) -
                      (item.outbound_qty || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 2: MASTER INVENTORY */}
      <div className="mb-12 no-print">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Package className="text-blue-600" size={20} /> Master Inventory
            Records
          </h2>
          {selectedItems.length > 0 && (
            <button
              onClick={() => setShowQRModal(true)}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg flex items-center gap-2 transition-all active:scale-95"
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
                  <ShoppingBag size={14} className="mx-auto" />
                </th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4 text-center">Date Purchased</th>
                <th className="px-6 py-4 text-center">Physical Stock</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(groupedByPO).map(([po, items]) => (
                <React.Fragment key={po}>
                  {/* BATCH HEADER ROW: Handles batch selection and accordion toggle */}
                  <tr
                    className="bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer transition-colors"
                    onClick={() => togglePOVisibility(po)}
                  >
                    <td
                      className="px-6 py-2 border-y border-slate-100 text-center"
                      onClick={(e) => e.stopPropagation()} // Prevent selection click from toggling accordion
                    >
                      <input
                        type="checkbox"
                        checked={items.every((i) =>
                          selectedItems.includes(i.id)
                        )}
                        onChange={() => toggleBatch(items)}
                        className="rounded accent-emerald-600 cursor-pointer"
                      />
                    </td>
                    <td
                      colSpan="4"
                      className="px-6 py-2 border-y border-slate-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedPOs[po] ? (
                            <ChevronDown size={16} className="text-slate-400" />
                          ) : (
                            <ChevronRight
                              size={16}
                              className="text-slate-400"
                            />
                          )}
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            PO Reference: {po}{" "}
                            <span className="ml-2 text-slate-400">
                              ({items.length} Items)
                            </span>
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {expandedPOs[po]
                            ? "Click to collapse"
                            : "Click to expand"}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* ITEM ROWS: Hidden/Shown via accordion state; individual checkboxes removed */}
                  {expandedPOs[po] &&
                    items.map((item) => (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          selectedItems.includes(item.id)
                            ? "bg-blue-50/20"
                            : "hover:bg-blue-50/10"
                        }`}
                      >
                        <td className="px-6 py-4 text-center">
                          {/* Cell placeholder for alignment */}
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
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleItemClick(item.po_number)}
                            className="text-blue-600 hover:text-blue-800 font-black text-[10px] uppercase flex items-center gap-1 ml-auto transition-colors"
                          >
                            Update <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Printer size={20} className="text-blue-600" /> Print Asset
                Labels
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-6 bg-white print:grid-cols-2 print:p-0">
              {inventoryItems
                .filter((i) => selectedItems.includes(i.id))
                .map((item) => (
                  <div
                    key={item.id}
                    className="border-2 border-slate-100 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 hover:border-blue-200 transition-colors"
                  >
                    <QRCodeSVG
                      value={`${window.location.origin}?po=${item.po_number}`}
                      size={120}
                      level="H"
                      includeMargin={true}
                    />
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                        Asset Reference
                      </p>
                      <p className="text-sm font-black text-slate-800 uppercase leading-tight truncate w-full">
                        {item.item_name}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-blue-600 mt-1">
                        PO: {item.po_number}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 no-print">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg"
              >
                <Printer size={16} /> Print Labels
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE 3: LEDGER HISTORY */}
      <div className="no-print">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <History className="text-blue-600" size={20} /> Ledger History
          </h2>
          <div className="flex gap-2">
            <input
              type="date"
              className="text-xs font-bold border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
            <button
              onClick={fetchArchive}
              className="bg-slate-200 p-2 rounded-lg hover:bg-slate-300 transition-colors"
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
                <tr
                  key={record.id}
                  className="text-xs hover:bg-slate-50/50 transition-colors"
                >
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
