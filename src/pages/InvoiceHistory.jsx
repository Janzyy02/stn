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
      // Fetches from sales_transactions and joins with sales_items
      const { data, error } = await supabase
        .from("sales_transactions")
        .select(`*, sales_items (*)`)
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching invoices:", error);
      setInvoices(data || []);
      setLoading(false);
    };
    fetchInvoices();
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  // Filtering Logic adapted for Sales Transactions
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      (inv.invoice_number || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (inv.customer_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const invDate = new Date(inv.created_at).toISOString().split("T")[0];
    const matchesStart = !startDate || invDate >= startDate;
    const matchesEnd = !endDate || invDate <= endDate;

    return matchesSearch && matchesStart && matchesEnd;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInvoices.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  if (loading)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-black" size={40} />
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
          <h1 className="text-4xl font-black uppercase flex items-center gap-3">
            <History size={36} /> Invoice History
          </h1>
          <p className="text-slate-400 font-bold text-sm">
            {filteredInvoices.length} sales records found
          </p>
        </div>

        {/* FILTERS SECTION */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 mb-8 shadow-sm print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">
                Search Invoices
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Invoice # or Customer..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black font-bold transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] font-black uppercase text-slate-400">
                  Date Range
                </label>
                {(searchTerm || startDate || endDate) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-red-500 hover:text-red-700"
                  >
                    <XCircle size={12} /> Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black font-bold text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="font-black text-slate-300 text-xs">TO</span>
                <input
                  type="date"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black font-bold text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* INVOICE LIST */}
        <div className="space-y-4">
          {currentItems.length > 0 ? (
            currentItems.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm print:border-none print:shadow-none"
              >
                <div
                  onClick={() =>
                    setExpandedInvoice(
                      expandedInvoice === inv.id ? null : inv.id
                    )
                  }
                  className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 print:hidden"
                >
                  <div className="flex gap-12">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Invoice Number
                      </p>
                      <p className="font-bold text-black">
                        {inv.invoice_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Customer
                      </p>
                      <p className="font-bold">{inv.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Amount
                      </p>
                      <p className="font-black text-lg">
                        ₱{inv.total_amount?.toLocaleString()}
                      </p>
                    </div>
                    {expandedInvoice === inv.id ? (
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
                    )}
                  </div>
                </div>

                {expandedInvoice === inv.id && (
                  <div className="bg-white p-10 border-t border-slate-100 print:p-0 print-area">
                    <div className="flex justify-end mb-6 no-print">
                      <button
                        onClick={() => window.print()}
                        className="bg-black text-white px-6 py-2 rounded-xl font-black uppercase text-xs hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Printer size={16} /> Reprint Invoice
                      </button>
                    </div>
                    <div className="border-4 border-black p-8">
                      <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
                        <div>
                          <h1 className="text-5xl font-black uppercase tracking-tighter">
                            Sales Invoice
                          </h1>
                          <p className="text-slate-500 font-bold mt-1">
                            {inv.invoice_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black uppercase text-[10px] text-slate-400">
                            Date Issued
                          </p>
                          <p className="font-bold">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <table className="w-full mb-12">
                        <thead>
                          <tr className="border-b-2 border-black text-[10px] uppercase font-black text-slate-400">
                            <th className="py-3 text-left">Description</th>
                            <th className="py-3 text-center">Qty</th>
                            <th className="py-3 text-right">Unit Price</th>
                            <th className="py-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inv.sales_items?.map((item) => (
                            <tr key={item.id}>
                              <td className="py-4">
                                <p className="font-black uppercase text-sm">
                                  {item.product_name}
                                </p>
                              </td>
                              <td className="py-4 text-center font-bold">
                                {item.quantity}
                              </td>
                              <td className="py-4 text-right">
                                ₱{item.unit_price?.toLocaleString()}
                              </td>
                              <td className="py-4 text-right font-black">
                                ₱{item.subtotal?.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex justify-end border-t-4 border-black pt-6">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">
                            Grand Total
                          </p>
                          <p className="text-5xl font-black">
                            ₱{inv.total_amount?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-16 text-center rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-black uppercase text-sm tracking-widest">
                No records found
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
              className="p-2 rounded-lg border bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors"
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
                    : "bg-white border text-slate-400 hover:border-black hover:text-black"
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
              className="p-2 rounded-lg border bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors"
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
