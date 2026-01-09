import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Package,
  Loader2,
  CheckCircle2,
  Clock,
  Database,
  ArrowDownUp,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

const Inventory = ({ setCurrentPage, setSelectedPO }) => {
  const [batches, setBatches] = useState([]);
  const [archiveItems, setArchiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedNames, setExpandedNames] = useState({});
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );

  useEffect(() => {
    fetchInventory();
    fetchArchive(); // Restored call
    const timer = setInterval(
      () => setCurrentTime(new Date().toLocaleTimeString()),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inventory_batches")
        .select(
          `
          *,
          hardware_inventory (
            name, 
            sku, 
            inbound_qty, 
            outbound_qty, 
            stock_balance, 
            category, 
            unit
          )
        `
        )
        .order("batch_date", { ascending: false });

      if (error) throw error;
      setBatches(data || []);

      const initialExpanded = {};
      data?.forEach((b) => {
        if (b.hardware_inventory)
          initialExpanded[b.hardware_inventory.name] = true;
      });
      setExpandedNames(initialExpanded);
    } catch (err) {
      console.error("Error fetching batches:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Restored fetchArchive logic
  const fetchArchive = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_ledger_history")
        .select("*")
        .order("snapshot_date", { ascending: false });
      if (error) throw error;
      setArchiveItems(data || []);
    } catch (err) {
      console.error("Archive Error:", err.message);
    }
  };

  const groupedByName = batches.reduce((acc, batch) => {
    const name = batch.hardware_inventory?.name || "Unknown Item";
    if (!acc[name]) acc[name] = [];
    acc[name].push(batch);
    return acc;
  }, {});

  const handleEndDay = async () => {
    if (
      !window.confirm(
        "End Business Day? This locks today's balances and resets tallies."
      )
    )
      return;
    try {
      setIsProcessing(true);
      const today = new Date().toISOString().split("T")[0];

      const products = Object.values(groupedByName).map(
        (group) => group[0].hardware_inventory
      );

      const historyData = products.map((prod) => ({
        name: prod.name,
        initial_qty:
          (prod.stock_balance || 0) -
          (prod.inbound_qty || 0) +
          (prod.outbound_qty || 0),
        inbound_qty: prod.inbound_qty || 0,
        outbound_qty: prod.outbound_qty || 0,
        final_balance: prod.stock_balance || 0,
        snapshot_date: today,
        po_number: prod.sku,
      }));

      // Insert snapshots and reset daily counters
      await supabase.from("daily_ledger_history").insert(historyData);
      await supabase
        .from("hardware_inventory")
        .update({ inbound_qty: 0, outbound_qty: 0 })
        .gt("stock_balance", -1000000);

      fetchInventory();
      fetchArchive();
      alert("Business day closed successfully.");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 w-full bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Database className="text-blue-600" /> INVENTORY MANAGEMENT
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
            Verified by Name | Hardware Inventory Master
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right border-r pr-6 border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Station Time
            </span>
            <div className="flex items-center gap-2 text-slate-700 font-mono font-bold text-lg">
              <Clock size={18} className="text-blue-500" /> {currentTime}
            </div>
          </div>
          <button
            onClick={handleEndDay}
            disabled={isProcessing}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase hover:bg-black transition-all"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "End Business Day"
            )}
          </button>
        </div>
      </div>

      {/* DAILY MOVEMENT LEDGER */}
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
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4 text-center">Opening</th>
                <th className="px-6 py-4 text-blue-400 text-center">
                  Inbound (+)
                </th>
                <th className="px-6 py-4 text-orange-400 text-center">
                  Outbound (-)
                </th>
                <th className="px-6 py-4 bg-slate-700 text-teal-400 text-center border-l border-slate-600">
                  Live Stock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(groupedByName).map(([name, itemBatches]) => {
                const master = itemBatches[0].hardware_inventory;
                const opening =
                  (master.stock_balance || 0) -
                  (master.inbound_qty || 0) +
                  (master.outbound_qty || 0);
                return (
                  <tr
                    key={name}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold uppercase text-sm text-slate-700">
                      {name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase bg-slate-100 px-2 py-1 rounded text-slate-500">
                        {master.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                        {master.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-500">
                      {opening}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-blue-600">
                      +{master.inbound_qty || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-orange-600">
                      -{master.outbound_qty || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-black bg-teal-50/20 border-l border-slate-100 text-teal-700">
                      {master.stock_balance || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MASTER INVENTORY TABLE */}
      <div className="mb-12 no-print">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-4">
          <Package className="text-blue-600" size={20} /> Master Records
          (Batches)
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase font-black border-b">
                <th className="px-6 py-4 w-12 text-center">#</th>
                <th className="px-6 py-4">Batch Reference</th>
                <th className="px-6 py-4 text-center">Date Received</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(groupedByName).map(([itemName, itemBatches]) => (
                <React.Fragment key={itemName}>
                  <tr
                    className="bg-slate-50/80 cursor-pointer"
                    onClick={() =>
                      setExpandedNames((p) => ({
                        ...p,
                        [itemName]: !p[itemName],
                      }))
                    }
                  >
                    <td className="px-6 py-3 text-center">
                      <ChevronDown
                        size={16}
                        className={
                          expandedNames[itemName]
                            ? "text-blue-600"
                            : "-rotate-90"
                        }
                      />
                    </td>
                    <td
                      colSpan="4"
                      className="px-6 py-3 font-black text-sm uppercase italic text-slate-800"
                    >
                      {itemName}
                    </td>
                  </tr>
                  {expandedNames[itemName] &&
                    itemBatches.map((batch) => (
                      <tr
                        key={batch.id}
                        className="text-xs hover:bg-blue-50/30"
                      >
                        <td className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            className="rounded accent-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-500">
                          {batch.batch_number}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500">
                          {new Date(batch.batch_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center font-black">
                          {batch.current_stock}{" "}
                          <span className="text-[10px] text-slate-400 uppercase">
                            {itemBatches[0].hardware_inventory.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedPO({
                                number: batch.batch_number,
                                date: new Date(
                                  batch.batch_date
                                ).toLocaleDateString(),
                                name: itemName,
                              });
                              setCurrentPage("Item Action");
                            }}
                            className="text-blue-600 font-black text-[10px] flex items-center gap-1 ml-auto hover:underline"
                          >
                            QR <ArrowRight size={14} />
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

      {/* RESTORED LEDGER HISTORY SECTION */}
      <div className="no-print">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
          <Clock size={20} className="text-slate-400" /> Ledger History (EOD
          Snapshots)
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b">
                <th className="px-6 py-4">Snapshot Date</th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4 text-center">Initial</th>
                <th className="px-6 py-4 text-center text-blue-500">Inbound</th>
                <th className="px-6 py-4 text-center text-orange-500">
                  Outbound
                </th>
                <th className="px-6 py-4 text-right">Final Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {archiveItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-slate-400 text-xs font-bold uppercase italic"
                  >
                    No snapshot history found
                  </td>
                </tr>
              ) : (
                archiveItems.map((record) => (
                  <tr key={record.id} className="text-xs hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-mono text-slate-500">
                      {new Date(record.snapshot_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 font-bold text-slate-700 uppercase">
                      {record.name}
                    </td>
                    <td className="px-6 py-3 text-center text-slate-400 font-bold">
                      {record.initial_qty}
                    </td>
                    <td className="px-6 py-3 text-center text-blue-600 font-black">
                      +{record.inbound_qty}
                    </td>
                    <td className="px-6 py-3 text-center text-orange-600 font-black">
                      -{record.outbound_qty}
                    </td>
                    <td className="px-6 py-3 text-right font-black text-slate-900 bg-slate-50/30">
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
