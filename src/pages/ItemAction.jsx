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
  Layers,
} from "lucide-react";

const ItemAction = ({ po_number, setCurrentPage }) => {
  const [items, setItems] = useState([]); // Changed to an array
  const [selectedItem, setSelectedItem] = useState(null); // The specific record being updated
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchItemsByPO = async () => {
      if (!po_number) {
        setLoading(false);
        return;
      }

      try {
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
          .eq("po_number", po_number); // Removed .single() to allow multiple matches

        if (error) throw error;

        setItems(data || []);
        if (data && data.length === 1) {
          setSelectedItem(data[0]); // Auto-select if only one item found
        }
      } catch (err) {
        console.error("Fetch Error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItemsByPO();
  }, [po_number]);

  const handleTransaction = async (type) => {
    if (!selectedItem) return;
    setProcessing(true);

    const column = type === "out" ? "outbound_qty" : "inbound_qty";
    const currentValue = selectedItem[column] || 0;

    try {
      const { error } = await supabase
        .from("purchase_order_items")
        .update({ [column]: currentValue + 1 })
        .eq("id", selectedItem.id); // Update by UNIQUE ID, not PO number

      if (error) throw error;

      setStatus("success");
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

  if (items.length === 0)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 uppercase">
            PO Not Found
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            #{po_number} is not in the system.
          </p>
          <button
            onClick={() => setCurrentPage("Inventory")}
            className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest"
          >
            Return
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 relative">
        {status === "success" && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
            <CheckCircle size={60} className="text-emerald-500 mb-2" />
            <h2 className="text-2xl font-black text-slate-800 uppercase">
              Updated
            </h2>
          </div>
        )}

        <button
          onClick={() => setCurrentPage("Inventory")}
          className="text-slate-400 mb-8 font-bold text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="text-center mb-6">
          <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Hash size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            PO #{po_number}
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
            Verified Purchase Records
          </p>
        </div>

        {/* MULTI-ITEM SELECTION (If items have same name/PO) */}
        {items.length > 1 && !selectedItem && (
          <div className="mb-6 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Layers size={12} /> Select Specific Item to Check Stock:
            </p>
            {items.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelectedItem(i)}
                className="w-full text-left p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <p className="font-black text-slate-700 uppercase text-sm group-hover:text-blue-700">
                  {i.item_name}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Stock: {i.quantity}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* ACTION UI (Shows when one item is selected) */}
        {selectedItem && (
          <>
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-6 text-center">
              <p className="font-black text-blue-800 uppercase text-sm">
                {selectedItem.item_name}
              </p>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                Purchased:{" "}
                {selectedItem.purchase_orders?.created_at
                  ? new Date(
                      selectedItem.purchase_orders.created_at
                    ).toLocaleDateString()
                  : "Unverified"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase">
                  In-Stock
                </p>
                <p className="text-sm font-black text-slate-900">
                  {selectedItem.quantity}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase">
                  Today's Net
                </p>
                <p className="text-sm font-black text-slate-900">
                  +{selectedItem.inbound_qty || 0} / -
                  {selectedItem.outbound_qty || 0}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ItemAction;
