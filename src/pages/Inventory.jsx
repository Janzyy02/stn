import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Package,
  Loader2,
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
  const [expandedNames, setExpandedNames] = useState({});
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString()
  );

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
    setLoading(true);
    const { data } = await supabase
      .from("inventory_batches")
      .select(`*, hardware_inventory (*)`)
      .order("batch_date", { ascending: false });
    setBatches(data || []);
    setLoading(false);
  };

  const fetchArchive = async () => {
    const { data } = await supabase
      .from("daily_ledger_history")
      .select("*")
      .order("snapshot_date", { ascending: false });
    setArchiveItems(data || []);
  };

  const groupedByName = batches.reduce((acc, batch) => {
    const name = batch.hardware_inventory?.name || "Unknown Item";
    if (!acc[name]) acc[name] = [];
    acc[name].push(batch);
    return acc;
  }, {});

  return (
    <div className="p-8 w-full bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Database className="text-blue-600" /> INVENTORY
        </h1>
        <div className="text-right font-mono font-bold text-lg">
          <Clock size={18} className="inline mr-2 text-blue-500" />{" "}
          {currentTime}
        </div>
      </div>

      {/* DAILY MOVEMENT LEDGER */}
      <div className="mb-12">
        <h2 className="text-lg font-black mb-4 uppercase flex items-center gap-2">
          <ArrowDownUp className="text-blue-600" size={20} /> Daily Ledger
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-slate-300 text-[10px] uppercase font-black">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4 text-center">Opening</th>
                <th className="px-6 py-4 text-blue-400 text-center">In (+)</th>
                <th className="px-6 py-4 text-orange-400 text-center">
                  Out (-)
                </th>
                <th className="px-6 py-4 bg-slate-700 text-teal-400 text-center">
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
                  <tr key={name}>
                    <td className="px-6 py-4 text-black font-bold uppercase text-sm">
                      {name}
                    </td>
                    <td className="px-6 py-4 text-black font-black text-center">
                      {opening}
                    </td>
                    <td className="px-6 py-4 text-center text-blue-600 font-black">
                      +{master.inbound_qty || 0}
                    </td>
                    <td className="px-6 py-4 text-center text-orange-600 font-black">
                      -{master.outbound_qty || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-black bg-teal-50 text-teal-700">
                      {master.stock_balance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MASTER RECORDS (BATCHES) */}
      <div className="mb-12">
        <h2 className="text-lg font-black mb-4 uppercase flex items-center gap-2">
          <Package className="text-blue-600" size={20} /> Master Batches
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase font-black">
              <tr>
                <th className="px-6 py-4 w-12 text-center">#</th>
                <th className="px-6 py-4">Batch Reference</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
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
                    <td className="px-6 py-3 text-black text-center">
                      <ChevronDown
                        size={16}
                        className={expandedNames[itemName] ? "" : "-rotate-90"}
                      />
                    </td>
                    <td
                      colSpan="3"
                      className="px-6 py-3 text-black font-black text-sm uppercase italic"
                    >
                      {itemName}
                    </td>
                  </tr>
                  {expandedNames[itemName] &&
                    itemBatches.map((batch) => (
                      <tr key={batch.id} className="text-xs">
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4 text-black font-mono font-bold">
                          {batch.batch_number}
                        </td>
                        <td className="px-6 py-4 text-black text-center font-black">
                          {batch.current_stock}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedPO(batch.batch_number);
                              setCurrentPage("Item Action");
                            }}
                            className="text-blue-600 font-black text-[10px] flex items-center gap-1 ml-auto"
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

      {/* LEDGER HISTORY SECTION */}
      <div>
        <h2 className="text-lg font-black mb-4 uppercase flex items-center gap-2">
          <Clock size={20} className="text-slate-400" /> Ledger History
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b">
              <tr>
                <th className="px-6 py-4">Snapshot Date</th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4 text-center text-blue-500">Inbound</th>
                <th className="px-6 py-4 text-center text-orange-500">
                  Outbound
                </th>
                <th className="px-6 py-4 text-right">Final Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {archiveItems.map((record) => (
                <tr key={record.id} className="text-xs">
                  <td className="px-6 py-3 text-black font-mono">
                    {new Date(record.snapshot_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-black font-bold uppercase">
                    {record.name}
                  </td>
                  <td className="px-6 py-3 text-center text-blue-600 font-black">
                    +{record.inbound_qty}
                  </td>
                  <td className="px-6 py-3 text-center text-orange-600 font-black">
                    -{record.outbound_qty}
                  </td>
                  <td className="px-6 py-3 text-black text-right font-black">
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
