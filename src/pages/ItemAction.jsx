import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  ChevronRight,
  Calendar,
} from "lucide-react";

const ItemAction = ({ po_number, setCurrentPage }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      if (!po_number) return setLoading(false);
      const { data } = await supabase
        .from("purchase_order_items")
        .select(`*, purchase_orders (*)`)
        .eq("po_number", po_number);
      setItems(data || []);
      if (data?.length === 1) setSelectedItem(data[0]);
      setLoading(false);
    };
    fetchItems();
  }, [po_number]);

  const handleTransaction = async (type) => {
    const column = type === "out" ? "outbound_qty" : "inbound_qty";
    const { error } = await supabase
      .from("purchase_order_items")
      .update({ [column]: (selectedItem[column] || 0) + 1 })
      .eq("id", selectedItem.id);
    if (!error) {
      setStatus("success");
      setTimeout(() => setCurrentPage("Inventory"), 1500);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );

  // Generate URL for scanning: includes the PO as a query parameter
  const qrRedirectUrl = `${window.location.origin}${window.location.pathname}?po=${po_number}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 relative overflow-hidden">
        {status === "success" && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-50 rounded-3xl">
            <CheckCircle size={60} className="text-emerald-500 mb-2" />
            <h2 className="text-2xl font-black uppercase text-slate-800">
              Updated
            </h2>
          </div>
        )}
        <button
          onClick={() => setCurrentPage("Inventory")}
          className="text-slate-400 mb-6 font-bold text-xs uppercase flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
              <QRCodeSVG value={qrRedirectUrl} size={160} level="H" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            PO #{po_number}
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Scan to Open Link
          </p>
        </div>

        {items.length > 1 && !selectedItem && (
          <div className="space-y-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-500"
              >
                <div className="text-left">
                  <p className="font-black text-slate-700 uppercase text-sm">
                    {item.item_name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    STOCK: {item.quantity}
                  </p>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            ))}
          </div>
        )}

        {selectedItem && (
          <div className="animate-in fade-in zoom-in-95">
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 mb-6 text-center">
              <p className="font-black text-blue-900 uppercase text-base">
                {selectedItem.item_name}
              </p>
              <p className="text-[10px] font-bold text-blue-500 uppercase flex items-center justify-center gap-1 mt-1">
                <Calendar size={12} />{" "}
                {new Date(
                  selectedItem.purchase_orders?.created_at
                ).toLocaleDateString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase">
                  In-Stock
                </p>
                <p className="text-lg font-black">{selectedItem.quantity}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase">
                  Today's Net
                </p>
                <p className="text-lg font-black">
                  +{selectedItem.inbound_qty || 0} / -
                  {selectedItem.outbound_qty || 0}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTransaction("in")}
                className="bg-emerald-500 text-white font-black py-4 rounded-2xl uppercase text-xs"
              >
                Inbound
              </button>
              <button
                onClick={() => handleTransaction("out")}
                className="bg-rose-500 text-white font-black py-4 rounded-2xl uppercase text-xs"
              >
                Outbound
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemAction;
