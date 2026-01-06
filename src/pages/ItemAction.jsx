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
} from "lucide-react";

// Changed prop from sku to po_number
const ItemAction = ({ po_number, setCurrentPage }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  useEffect(() => {
    const fetchItemByPO = async () => {
      if (!po_number) {
        setLoading(false);
        return;
      }

      try {
        // Stop using SKU: Fetch from purchase_order_items using po_number
        // Inner join with purchase_orders to verify the relationship and get created_at
        const { data, error } = await supabase
          .from("purchase_order_items")
          .select(
            `
            *,
            purchase_orders!inner (
              created_at,
              po_number
            )
          `
          )
          .eq("po_number", po_number)
          .single();

        if (error) throw error;
        setItem(data);
      } catch (err) {
        console.error("Verification Error:", err.message);
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
      // Update inventory using po_number instead of SKU
      const { error } = await supabase
        .from("purchase_order_items")
        .update({ [column]: currentValue + 1 })
        .eq("po_number", po_number);

      if (error) throw error;

      setStatus("success");
      setTimeout(() => {
        setCurrentPage("Inventory");
      }, 1500);
    } catch (err) {
      alert("Error updating inventory: " + err.message);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!po_number || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle size={60} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 uppercase">
          Order Not Found
        </h2>
        <p className="text-slate-500 mb-6">
          PO Number: {po_number || "Missing"} does not exist in the database.
        </p>
        <button
          onClick={() => setCurrentPage("Inventory")}
          className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest"
        >
          Return to Ledger
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 relative overflow-hidden">
        {/* Success Overlay */}
        {status === "success" && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <CheckCircle size={80} className="text-emerald-500 mb-4" />
            <h2 className="text-2xl font-black text-slate-800 uppercase">
              Success!
            </h2>
            <p className="text-slate-500 font-bold">Inventory Updated.</p>
          </div>
        )}

        <button
          onClick={() => setCurrentPage("Inventory")}
          className="text-slate-400 hover:text-slate-600 flex items-center gap-2 mb-8 font-bold text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Ledger
        </button>

        <div className="text-center mb-6">
          <div className="bg-blue-50 text-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Hash size={36} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
            PO #{item.po_number}
          </h1>
          <p className="text-slate-500 font-bold mt-1 text-sm uppercase">
            {item.item_name}
          </p>
        </div>

        {/* Verified Metadata Section */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Hash size={10} /> Verified PO
            </p>
            <p className="text-xs font-bold text-slate-700 truncate">
              {item.purchase_orders?.po_number || item.po_number}
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Calendar size={10} /> Date Purchased
            </p>
            <p className="text-xs font-bold text-slate-700">
              {item.purchase_orders?.created_at
                ? new Date(item.purchase_orders.created_at).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            disabled={processing}
            onClick={() => handleTransaction("out")}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ShoppingCart size={20} />
            )}
            Confirm Purchase
          </button>

          <button
            disabled={processing}
            onClick={() => handleTransaction("in")}
            className="w-full bg-white border-2 border-slate-200 text-slate-600 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            <PackageCheck size={20} />
            Restock Item
          </button>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Stock Quantity
            </p>
            <p className="text-3xl font-black text-slate-900">
              {item.quantity}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Daily Movement
            </p>
            <p className="text-sm font-bold text-slate-600">
              <span className="text-blue-600">+{item.inbound_qty || 0}</span> /{" "}
              <span className="text-orange-600">-{item.outbound_qty || 0}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemAction;
