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
} from "lucide-react";

const Inventory = ({ setCurrentPage, setSelectedPO }) => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [archiveItems, setArchiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
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
      // Joins with purchase_orders to get the verified created_at date
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

  const handleItemClick = (po_number) => {
    setSelectedPO(po_number);
    setCurrentPage("ItemAction");
  };

  const handleEndDay = async () => {
    if (
      !window.confirm(
        "End Business Day? This will snapshot movements and reset daily tallies."
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
      alert("Day closed successfully.");
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
      {/* 1. HEADER */}
      <div className="flex justify-between items-end mb-8 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Database className="text-blue-600" /> INVENTORY MANAGEMENT
          </h1>
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
            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black flex items-center gap-2 shadow-lg"
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

      {/* 2. DAILY MOVEMENT LEDGER */}
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
                  <td className="px-6 py-4 text-center font-black bg-teal-50/20 border-l text-teal-700">
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

      {/* 3. MASTER INVENTORY */}
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
                <th className="px-6 py-4 text-center">Date Purchased</th>
                <th className="px-6 py-4 text-center">Physical Stock</th>
                <th className="px-6 py-4 text-right">Action</th>
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
                          PO Ref: {po}
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
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleItemClick(item.po_number)}
                          className="text-blue-600 hover:text-blue-800 font-black text-[10px] uppercase flex items-center gap-1 ml-auto"
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

      {/* 4. QR CODE MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Printer size={20} className="text-blue-600" /> Asset Labels
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2"
              >
                <X size={24} />
              </button>
            </div>
            <div
              className="p-8 overflow-y-auto grid grid-cols-3 gap-6 bg-white print:grid-cols-2 print:p-0"
              id="printable-area"
            >
              {inventoryItems
                .filter((i) => selectedItems.includes(i.id))
                .map((item) => (
                  <div
                    key={item.id}
                    className="border-2 border-slate-100 p-4 rounded-2xl flex flex-col items-center text-center space-y-3"
                  >
                    <QRCodeSVG
                      value={item.po_number}
                      size={120}
                      level="H"
                      includeMargin={true}
                    />
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Asset Ref
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
            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
              >
                <Printer size={16} /> Print Labels
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. LEDGER HISTORY */}
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
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4 text-center">In</th>
                <th className="px-6 py-4 text-center">Out</th>
                <th className="px-6 py-4 text-right">Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-bold">
              {archiveItems.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-3 text-slate-500 font-mono">
                    {record.snapshot_date}
                  </td>
                  <td className="px-6 py-3 uppercase text-slate-700">
                    {record.name}
                  </td>
                  <td className="px-6 py-3 text-center text-blue-600">
                    +{record.inbound_qty}
                  </td>
                  <td className="px-6 py-3 text-center text-orange-600">
                    -{record.outbound_qty}
                  </td>
                  <td className="px-6 py-3 text-right font-black">
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
