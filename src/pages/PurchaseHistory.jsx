import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Printer,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  XCircle,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Tag,
  Mail,
} from "lucide-react";

const PurchaseHistory = () => {
  const [batches, setBatches] = useState([]);
  const [suppliers, setSuppliers] = useState([]); // Added to fetch vendor details
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
    const fetchData = async () => {
      setLoading(true);

      // Fetch Batches
      const { data: batchData, error: batchError } = await supabase
        .from("inventory_batches")
        .select(
          `
          *,
          hardware_inventory (
            name,
            sku,
            unit,
            supplier
          )
        `
        )
        .order("batch_date", { ascending: false });

      // Fetch Suppliers for contact info
      const { data: supData } = await supabase.from("suppliers").select("*");

      if (batchError) console.error("Error fetching data:", batchError);
      setBatches(batchData || []);
      setSuppliers(supData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filtering & Pagination Logic
  const filteredBatches = batches.filter((batch) => {
    const itemName = batch.hardware_inventory?.name || "";
    const vendorName = batch.hardware_inventory?.supplier || "";
    const matchesSearch =
      batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendorName.toLowerCase().includes(searchTerm.toLowerCase());

    const batchDate = new Date(batch.batch_date).toISOString().split("T")[0];
    const matchesStart = !startDate || batchDate >= startDate;
    const matchesEnd = !endDate || batchDate <= endDate;

    return matchesSearch && matchesStart && matchesEnd;
  });

  const currentItems = filteredBatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);

  const handleGmailSend = (batch) => {
    const vendor = suppliers.find(
      (s) => s.name === batch.hardware_inventory?.supplier
    );
    const email = vendor?.email || "";
    const subject = encodeURIComponent(`Inquiry: Batch ${batch.batch_number}`);
    const body = encodeURIComponent(
      `Regarding Item: ${batch.hardware_inventory?.name} (${batch.hardware_inventory?.sku})\nQuantity: ${batch.current_stock}`
    );
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`,
      "_blank"
    );
  };

  if (loading)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

  return (
    <div className="p-8 bg-[#f3f4f6] min-h-screen text-black print:bg-white print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; border: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8 no-print">
          <h1 className="text-4xl font-black uppercase flex items-center gap-3 italic tracking-tighter">
            <PackageCheck size={36} className="text-blue-600" /> Inbound History
          </h1>
          <p className="text-slate-400 font-bold text-sm">
            {filteredBatches.length} records
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl border-2 border-black mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] no-print">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">
                Search Records
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Batch, Item, or Vendor..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-slate-100 focus:border-black outline-none font-bold transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-7">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-black uppercase text-slate-400">
                  Date Range
                </label>
                {(searchTerm || startDate || endDate) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="text-[10px] font-black uppercase text-red-500 flex items-center gap-1"
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
                <span className="font-black text-slate-300 text-xs">TO</span>
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

        {/* List */}
        <div className="space-y-4">
          {currentItems.map((batch) => {
            const vendor = suppliers.find(
              (s) => s.name === batch.hardware_inventory?.supplier
            );
            const isExpanded = expandedBatch === batch.id;

            return (
              <div
                key={batch.id}
                className="bg-white rounded-xl border-2 border-slate-100 overflow-hidden hover:border-black transition-all print:border-none"
              >
                <div
                  onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                  className="p-6 flex justify-between items-center cursor-pointer no-print"
                >
                  <div className="flex gap-12">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Batch #
                      </p>
                      <p className="font-mono font-bold text-blue-600">
                        {batch.batch_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Vendor
                      </p>
                      <p className="font-bold uppercase text-sm">
                        {batch.hardware_inventory?.supplier || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Item
                      </p>
                      <p className="font-bold uppercase text-sm truncate max-w-[200px]">
                        {batch.hardware_inventory?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-black text-lg">
                      {batch.current_stock} {batch.hardware_inventory?.unit}
                    </p>
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-white p-8 border-t-2 border-slate-50 print-area">
                    {/* Toolbar - Same as CheckoutView */}
                    <div className="bg-black text-white p-4 flex justify-between items-center no-print rounded-t-xl">
                      <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                        <Tag size={16} /> {batch.hardware_inventory?.supplier}
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.print()}
                          className="bg-white text-black px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 hover:bg-slate-200"
                        >
                          <Printer size={14} /> Print Record
                        </button>
                        <button
                          onClick={() => handleGmailSend(batch)}
                          className="bg-[#ea4335] px-3 py-1.5 rounded-lg text-[10px] font-black text-white flex items-center gap-2"
                        >
                          <Mail size={14} /> Email Vendor
                        </button>
                      </div>
                    </div>

                    {/* Quotation Style Content */}
                    <div className="border-2 border-black p-8 bg-white shadow-sm">
                      <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-6">
                        <div>
                          <h1 className="text-4xl font-black uppercase italic leading-none">
                            Inbound Record
                          </h1>
                          <p className="text-xs font-bold text-slate-500 mt-2">
                            Ref Batch: {batch.batch_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black uppercase">
                            Date:{" "}
                            {new Date(batch.batch_date).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Inventory History
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">
                            Source Vendor:
                          </h4>
                          <p className="text-sm font-black uppercase">
                            {batch.hardware_inventory?.supplier}
                          </p>
                          <p className="text-xs font-medium text-slate-600">
                            {vendor?.address || "Address not listed"}
                          </p>
                          <p className="text-xs font-medium text-slate-600">
                            {vendor?.email || "Email not listed"}
                          </p>
                        </div>
                      </div>

                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b-2 border-black text-[10px] uppercase font-black text-black">
                            <th className="py-2">SKU</th>
                            <th className="py-2">Description</th>
                            <th className="py-2 text-center">Qty Received</th>
                            <th className="py-2 text-center">Unit</th>
                            <th className="py-2 text-right">Unit Cost</th>
                            <th className="py-2 text-right">Total Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-4 text-[10px] font-mono font-bold text-slate-400">
                              #{batch.hardware_inventory?.sku}
                            </td>
                            <td className="py-4 text-sm font-black uppercase">
                              {batch.hardware_inventory?.name}
                            </td>
                            <td className="py-4 text-center font-black">
                              {batch.current_stock}
                            </td>
                            <td className="py-4 text-center text-xs font-bold text-slate-500 uppercase">
                              {batch.hardware_inventory?.unit}
                            </td>
                            <td className="py-4 text-right text-sm font-bold">
                              ₱{batch.unit_cost?.toLocaleString()}
                            </td>
                            <td className="py-4 text-right text-sm font-black">
                              ₱
                              {(
                                batch.unit_cost * batch.current_stock
                              ).toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr>
                            <td
                              colSpan="5"
                              className="py-6 text-right text-xs font-black uppercase text-slate-400"
                            >
                              Recorded Inventory Value:
                            </td>
                            <td className="py-6 text-right text-xl font-black underline decoration-4 decoration-blue-500">
                              ₱
                              {(
                                batch.unit_cost * batch.current_stock
                              ).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination - Reuse original logic */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center items-center gap-2 no-print">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border-2 bg-white disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-lg font-black text-xs ${
                  currentPage === i + 1
                    ? "bg-black text-white"
                    : "bg-white border-2"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border-2 bg-white disabled:opacity-30"
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
