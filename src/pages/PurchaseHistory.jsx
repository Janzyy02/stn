import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Printer,
  ChevronDown,
  ChevronUp,
  History,
  Loader2,
  Search,
  Calendar,
  XCircle,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
} from "lucide-react";

const PurchaseHistory = () => {
  const [batches, setBatches] = useState([]);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      // Fetching from inventory_batches and joining with hardware_inventory for item names/SKUs
      const { data, error } = await supabase
        .from("inventory_batches")
        .select(
          `
          *,
          hardware_inventory (
            name,
            sku,
            unit
          )
        `
        )
        .order("batch_date", { ascending: false });

      if (error) console.error("Error fetching batches:", error);
      setBatches(data || []);
      setLoading(false);
    };
    fetchBatches();
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  // Filtering Logic
  const filteredBatches = batches.filter((batch) => {
    const itemName = batch.hardware_inventory?.name || "";
    const matchesSearch =
      batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemName.toLowerCase().includes(searchTerm.toLowerCase());

    const batchDate = new Date(batch.batch_date).toISOString().split("T")[0];
    const matchesStart = !startDate || batchDate >= startDate;
    const matchesEnd = !endDate || batchDate <= endDate;

    return matchesSearch && matchesStart && matchesEnd;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBatches.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  if (loading)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

  return (
    <div className="p-8 bg-[#f3f4f6] min-h-screen font-sans text-black print:bg-white print:p-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `,
        }}
      />

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8 print:hidden">
          <h1 className="text-4xl font-black uppercase flex items-center gap-3 italic tracking-tighter">
            <PackageCheck size={36} className="text-blue-600" /> Inbound History
          </h1>
          <p className="text-slate-400 font-bold text-sm">
            {filteredBatches.length} batches recorded
          </p>
        </div>

        {/* FILTERS SECTION */}
        <div className="bg-white p-6 rounded-xl border-2 border-black mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">
                Search Batches or Items
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Batch # or Item Name..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-slate-100 focus:border-black outline-none font-bold transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] font-black uppercase text-slate-400">
                  Arrival Date Range
                </label>
                {(searchTerm || startDate || endDate) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-red-500"
                  >
                    <XCircle size={12} /> Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-100 font-bold text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="font-black text-slate-300 text-xs text-center">
                  TO
                </span>
                <input
                  type="date"
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-100 font-bold text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BATCHES LIST */}
        <div className="space-y-4">
          {currentItems.length > 0 ? (
            currentItems.map((batch) => (
              <div
                key={batch.id}
                className="bg-white rounded-xl border-2 border-slate-100 overflow-hidden hover:border-black transition-all print:border-none"
              >
                <div
                  onClick={() =>
                    setExpandedBatch(
                      expandedBatch === batch.id ? null : batch.id
                    )
                  }
                  className="p-6 flex justify-between items-center cursor-pointer print:hidden"
                >
                  <div className="flex gap-12">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Batch Number
                      </p>
                      <p className="font-mono font-bold text-blue-600">
                        {batch.batch_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Item Name
                      </p>
                      <p className="font-bold uppercase text-sm">
                        {batch.hardware_inventory?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Received Qty
                      </p>
                      <p className="font-black text-lg">
                        {batch.daily_inbound || batch.current_stock}{" "}
                        {batch.hardware_inventory?.unit}
                      </p>
                    </div>
                    {expandedBatch === batch.id ? (
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
                    )}
                  </div>
                </div>

                {expandedBatch === batch.id && (
                  <div className="bg-white p-10 border-t-2 border-slate-50 print:p-0 print-area">
                    <div className="flex justify-end mb-6 no-print">
                      <button
                        onClick={() => window.print()}
                        className="bg-black text-white px-6 py-2 rounded-xl font-black uppercase text-xs flex items-center gap-2"
                      >
                        <Printer size={16} /> Print Receipt
                      </button>
                    </div>
                    <div className="border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
                        <div>
                          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
                            Receiving Report
                          </h1>
                          <p className="text-blue-600 font-mono font-bold mt-1">
                            Batch ID: {batch.batch_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black uppercase text-[10px] text-slate-400">
                            Received Date
                          </p>
                          <p className="font-bold">
                            {new Date(batch.batch_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 mb-12">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                            Product Details
                          </p>
                          <p className="text-xl font-black uppercase">
                            {batch.hardware_inventory?.name}
                          </p>
                          <p className="text-sm font-bold text-slate-500 italic">
                            SKU: {batch.hardware_inventory?.sku}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                            Cost Summary
                          </p>
                          <p className="text-xl font-black">
                            ₱{batch.unit_cost?.toLocaleString()}{" "}
                            <span className="text-xs text-slate-400">
                              / {batch.hardware_inventory?.unit}
                            </span>
                          </p>
                        </div>
                      </div>

                      <table className="w-full mb-12">
                        <thead>
                          <tr className="border-b-2 border-black text-[10px] uppercase font-black text-slate-400">
                            <th className="py-3 text-left">Classification</th>
                            <th className="py-3 text-center">Batch Status</th>
                            <th className="py-3 text-right">Inbound Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-6 font-bold text-sm">
                              Inventory Stock Arrival
                            </td>
                            <td className="py-6 text-center">
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                Active
                              </span>
                            </td>
                            <td className="py-6 text-right font-black text-xl">
                              {batch.daily_inbound || batch.current_stock}{" "}
                              {batch.hardware_inventory?.unit}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="flex justify-between items-end border-t-4 border-black pt-6">
                        <div className="text-[10px] font-bold text-slate-400 italic">
                          * This batch has been automatically registered into
                          master inventory records.
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">
                            Batch Total Cost Value
                          </p>
                          <p className="text-4xl font-black italic">
                            ₱
                            {(
                              (batch.unit_cost || 0) *
                              (batch.daily_inbound || batch.current_stock)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-16 text-center rounded-xl border-4 border-dashed border-slate-200">
              <p className="text-slate-400 font-black uppercase text-sm tracking-widest">
                No Batch History Found
              </p>
            </div>
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center items-center gap-2 print:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border-2 bg-white disabled:opacity-30 hover:border-black transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx + 1}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-10 h-10 rounded-lg font-black text-xs transition-all ${
                  currentPage === idx + 1
                    ? "bg-black text-white shadow-lg"
                    : "bg-white border-2 text-slate-400 hover:border-black hover:text-black"
                }`}
              >
                {idx + 1}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border-2 bg-white disabled:opacity-30 hover:border-black transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseHistory;
