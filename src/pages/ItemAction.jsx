import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  ShoppingCart,
  ArrowLeft,
  Loader2,
  PackageCheck,
  AlertCircle,
  CheckCircle,
  Calendar,
  Hash,
  Database,
} from "lucide-react";

const ItemAction = ({ po_number, setCurrentPage }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchItemByPO = async () => {
      // Logic: Ensure we have a po_number to search for
      if (!po_number) {
        setLoading(false);
        return;
      }

      try {
        // We use a Left Join (removing !inner) so that if the
        // purchase_orders record is missing, we still see the item.
        const { data, error } = await supabase
          .from("purchase_order_items")
          .select(
            `
            *,
            purchase_orders (
              created_at,
              po_number
            )
          `
          )
          .eq("po_number", po_number)
          .maybeSingle(); // Prevents crash if query returns 0 results

        if (error) throw error;
        setItem(data);
      } catch (err) {
        console.error("Fetch Error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItemByPO();
  }, [po_number]);

  const handleTransaction = async (type) => {
    setProcessing(true);
    const column = type === "out" ? "outbound_qty" : "inbound_qty";
    const currentValue = item[column] || 0;

    try {
      const { error } = await supabase
        .from("purchase_order_items")
        .update({ [column]: currentValue + 1 })
        .eq("po_number", po_number);

      if (error) throw error;

      setStatus("success");
      // Redirect back to main inventory after a short delay
      setTimeout(() => setCurrentPage("Inventory"), 1500);
    } catch (err) {
      alert("Error updating: " + err.message);
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

  // Error State: If PO Number is not found in purchase_order_items
  if (!item)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center">
          <AlertCircle size={64} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            PO Not Found
          </h2>
          <p className="text-slate-500 mt-2 font-medium max-w-xs">
            The PO Number{" "}
            <span className="text-blue-600 font-bold">#{po_number}</span> could
            not be located in the current inventory.
          </p>
          <button
            onClick={() => setCurrentPage("Inventory")}
            className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all active:scale-95"
          >
            Return to Ledger
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 relative overflow-hidden">
        {/* Success Animation Overlay */}
        {status === "success" && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="bg-emerald-100 p-4 rounded-full mb-4">
              <CheckCircle size={60} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
              Inventory Updated
            </h2>
            <p className="text-slate-500 font-bold text-sm uppercase mt-1">
              Syncing with database...
            </p>
          </div>
        )}

        <button
          onClick={() => setCurrentPage("Inventory")}
          className="text-slate-400 hover:text-slate-600 flex items-center gap-2 mb-8 font-bold text-xs uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={16} /> Back to Inventory
        </button>

        <div className="text-center mb-8">
          <div className="bg-blue-50 text-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Hash size={36} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
            PO #{item.po_number}
          </h1>
          <p className="text-slate-400 font-bold mt-2 text-xs uppercase tracking-widest">
            {item.item_name}
          </p>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Calendar size={12} className="text-blue-500" /> Date Purchased
            </p>
            <p className="text-xs font-black text-slate-700">
              {item.purchase_orders?.created_at
                ? new Date(item.purchase_orders.created_at).toLocaleDateString()
                : "UNVERIFIED"}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Database size={12} className="text-emerald-500" /> Physical Stock
            </p>
            <p className="text-xs font-black text-slate-900">
              {item.quantity} Units
            </p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-4">
          <button
            onClick={() => handleTransaction("out")}
            disabled={processing}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-lg hover:bg-black transition-all disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ShoppingCart size={20} />
            )}
            Confirm Sale / Outbound
          </button>

          <button
            onClick={() => handleTransaction("in")}
            disabled={processing}
            className="w-full bg-white border-2 border-slate-200 text-slate-600 py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <PackageCheck size={20} />
            )}
            Restock / Inbound
          </button>
        </div>

        {/* DAILY TALLY FOOTER */}
        <div className="mt-8 pt-6 border-t border-dashed border-slate-200 flex justify-between items-center px-2">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Today In
            </p>
            <p className="font-bold text-blue-600 text-sm">
              +{item.inbound_qty || 0}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Today Out
            </p>
            <p className="font-bold text-orange-600 text-sm">
              -{item.outbound_qty || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemAction;
