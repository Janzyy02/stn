import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Printer,
  ChevronDown,
  ChevronUp,
  History,
  Loader2,
  Search,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Tag,
} from "lucide-react";

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        // Fetch from sales_transactions and join with sales_items
        const { data, error } = await supabase
          .from("sales_transactions")
          .select(
            `
            *,
            sales_items (*)
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        setInvoices(data || []);
      } catch (err) {
        console.error("Error fetching invoices:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // Filtering Logic
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      (inv.so_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const invDate = new Date(inv.created_at).toISOString().split("T")[0];
    const matchesStart = !startDate || invDate >= startDate;
    const matchesEnd = !endDate || invDate <= endDate;

    return matchesSearch && matchesStart && matchesEnd;
  });

  const currentItems = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

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
            <Receipt size={36} className="text-blue-600" /> Invoice History
          </h1>
          <p className="text-slate-400 font-bold text-sm">
            {filteredInvoices.length} sales records
          </p>
        </div>

        {/* Filters - Matching PurchaseHistory style */}
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
                  placeholder="Order # or Customer..."
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

        {/* Invoice List */}
        <div className="space-y-4">
          {currentItems.map((inv) => {
            const isExpanded = expandedInvoice === inv.id;
            return (
              <div
                key={inv.id}
                className="bg-white rounded-xl border-2 border-slate-100 overflow-hidden hover:border-black transition-all print:border-none"
              >
                <div
                  onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}
                  className="p-6 flex justify-between items-center cursor-pointer no-print"
                >
                  <div className="flex gap-12">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Order #
                      </p>
                      <p className="font-mono font-bold text-blue-600">
                        {inv.so_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Customer
                      </p>
                      <p className="font-bold uppercase text-sm">
                        {inv.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Status
                      </p>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded border-2 ${
                          inv.status === "Completed"
                            ? "border-emerald-500 text-emerald-500"
                            : "border-amber-500 text-amber-500"
                        }`}
                      >
                        {inv.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-black text-lg">
                      ₱{inv.total_amount?.toLocaleString()}
                    </p>
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-white p-8 border-t-2 border-slate-50 print-area">
                    {/* Toolbar - Same as PurchaseHistory */}
                    <div className="bg-black text-white p-4 flex justify-between items-center no-print rounded-t-xl">
                      <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                        <Tag size={16} /> Transaction Details
                      </h2>
                      <button
                        onClick={() => window.print()}
                        className="bg-white text-black px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 hover:bg-slate-200"
                      >
                        <Printer size={14} /> Print Invoice
                      </button>
                    </div>

                    {/* Quotation Style Content - Adapted from PurchaseHistory */}
                    <div className="border-2 border-black p-8 bg-white shadow-sm">
                      <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-6">
                        <div>
                          <h1 className="text-4xl font-black uppercase italic leading-none">
                            Sales Invoice
                          </h1>
                          <p className="text-xs font-bold text-slate-500 mt-2">
                            Ref Order: {inv.so_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black uppercase">
                            Date:{" "}
                            {new Date(inv.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Transaction Record
                          </p>
                        </div>
                      </div>

                      <div className="mb-8">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-1">
                          Billed To:
                        </h4>
                        <p className="text-sm font-black uppercase">
                          {inv.customer_name}
                        </p>
                      </div>

                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b-2 border-black text-[10px] uppercase font-black text-black">
                            <th className="py-2">Description</th>
                            <th className="py-2 text-center">Qty</th>
                            <th className="py-2 text-right">Unit Price</th>
                            <th className="py-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.sales_items?.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-slate-100"
                            >
                              <td className="py-4 text-sm font-black uppercase">
                                {item.item_name}
                              </td>
                              <td className="py-4 text-center font-black">
                                {item.quantity}
                              </td>
                              <td className="py-4 text-right text-sm font-bold">
                                ₱{item.unit_price?.toLocaleString()}
                              </td>
                              <td className="py-4 text-right text-sm font-black">
                                ₱
                                {(
                                  item.quantity * item.unit_price
                                ).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td
                              colSpan="3"
                              className="py-6 text-right text-xs font-black uppercase text-slate-400"
                            >
                              Grand Total:
                            </td>
                            <td className="py-6 text-right text-xl font-black underline decoration-4 decoration-blue-500">
                              ₱{inv.total_amount?.toLocaleString()}
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

        {/* Pagination Controls */}
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

export default InvoiceHistory;
