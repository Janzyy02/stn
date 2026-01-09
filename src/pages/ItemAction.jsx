import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Layers,
  ChevronRight,
  Calendar,
  Hash,
} from "lucide-react";

const ItemAction = ({ po_number, setCurrentPage }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);

  // State para sa batch date na kukunin natin sa database
  const [batchDate, setBatchDate] = useState(null);

  // Parse po_number: Check if it's an object from Inventory.jsx or just a string from URL
  const isObject = typeof po_number === "object" && po_number !== null;
  const batchRef = isObject ? po_number.number : po_number;

  useEffect(() => {
    const fetchData = async () => {
      if (!batchRef) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Fetch Items in this Batch
        const itemsRequest = supabase
          .from("purchase_order_items")
          .select(`*, purchase_orders (created_at, po_number)`)
          .eq("po_number", batchRef);

        // 2. Fetch the actual batch_date from inventory_batches table
        const batchRequest = supabase
          .from("inventory_batches")
          .select("batch_date")
          .eq("batch_number", batchRef)
          .single();

        const [itemsRes, batchRes] = await Promise.all([
          itemsRequest,
          batchRequest,
        ]);

        if (itemsRes.error) throw itemsRes.error;

        setItems(itemsRes.data || []);
        if (itemsRes.data && itemsRes.data.length === 1) {
          setSelectedItem(itemsRes.data[0]);
        }

        // Set the batch date from the fetch result
        if (batchRes.data) {
          setBatchDate(batchRes.data.batch_date);
        }
      } catch (err) {
        console.error("Fetch Error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [batchRef]);

  const handleTransaction = async (type) => {
    if (!selectedItem) return;
    setProcessing(true);
    const column = type === "out" ? "outbound_qty" : "inbound_qty";
    const currentValue = selectedItem[column] || 0;

    try {
      const { error } = await supabase
        .from("purchase_order_items")
        .update({ [column]: currentValue + 1 })
        .eq("id", selectedItem.id);

      if (error) throw error;
      setStatus("success");
      setTimeout(() => setCurrentPage("Inventory"), 1500);
    } catch (err) {
      alert("Error: " + err.message);
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

  const qrUrl = `${window.location.origin}${window.location.pathname}?po=${batchRef}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 relative overflow-hidden">
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
          className="text-slate-400 mb-6 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:text-black"
        >
          <ArrowLeft size={16} /> Back to Inventory
        </button>

        {/* --- QR DISPLAY WITH BATCH DATE --- */}
        <div className="text-center mb-8 border-b border-slate-100 pb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white border-2 border-slate-50 rounded-2xl shadow-sm">
              <QRCodeSVG
                value={qrUrl}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
              Batch Record
            </p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              {batchRef}
            </h1>
          </div>

          {/* Heto na yung batch_date na kinuha natin sa inventory_batches */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="px-3 py-1 bg-slate-100 rounded-full flex items-center gap-2">
              <Calendar size={14} className="text-slate-500" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">
                Received:{" "}
                {batchDate
                  ? new Date(batchDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "No Date Found"}
              </span>
            </div>
          </div>
        </div>

        {/* --- SELECTION UI --- */}
        {!selectedItem && items.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Layers size={14} /> Select Item to Process:
            </p>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-50 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="text-left">
                  <p className="font-black text-slate-700 uppercase text-sm group-hover:text-blue-700">
                    {item.item_name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Qty: {item.quantity}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-300 group-hover:text-blue-500"
                />
              </button>
            ))}
          </div>
        )}

        {/* --- TRANSACTION UI --- */}
        {selectedItem && (
          <div className="animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 p-5 rounded-2xl mb-6 shadow-lg shadow-slate-200">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                Active Item
              </p>
              <p className="font-black text-white uppercase text-lg leading-tight">
                {selectedItem.item_name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase">
                  Original Stock
                </p>
                <p className="text-lg font-black">{selectedItem.quantity}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase">
                  Today's In/Out
                </p>
                <p className="text-lg font-black text-blue-600">
                  +{selectedItem.inbound_qty || 0} / -
                  {selectedItem.outbound_qty || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={processing}
                onClick={() => handleTransaction("in")}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all shadow-lg shadow-emerald-100"
              >
                Inbound
              </button>
              <button
                disabled={processing}
                onClick={() => handleTransaction("out")}
                className="bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest transition-all shadow-lg shadow-rose-100"
              >
                Outbound
              </button>
            </div>

            {items.length > 1 && (
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full mt-6 text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 transition-colors"
              >
                ← Switch to another item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemAction;
