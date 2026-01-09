import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  ChevronRight,
  Calendar,
  Printer,
  QrCode as QrIcon,
} from "lucide-react";

const ItemAction = ({ po_number, setCurrentPage }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);

  // po_number is now the object passed from Inventory.jsx
  const batchData = po_number;

  useEffect(() => {
    const fetchItemsByPO = async () => {
      if (!batchData?.number) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("purchase_order_items")
          .select(`*, purchase_orders (created_at, po_number)`)
          .eq("po_number", batchData.number);

        if (error) throw error;
        setItems(data || []);
        if (data && data.length === 1) setSelectedItem(data[0]);
      } catch (err) {
        console.error("Fetch Error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItemsByPO();
  }, [batchData]);

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

  // Generate the Combined QR String
  const qrString = `${batchData.name} | Batch: ${batchData.number} | Rec: ${batchData.date}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
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
          className="text-slate-400 mb-6 font-bold text-xs uppercase flex items-center gap-2 hover:text-black"
        >
          <ArrowLeft size={16} /> Back to Inventory
        </button>

        {/* --- QR CODE WITH BATCH DATE --- */}
        <div className="text-center mb-8 border-b border-slate-100 pb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white border-2 border-slate-50 rounded-2xl shadow-sm">
              <QRCodeSVG
                value={qrString}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">
            {batchData.name}
          </h1>
          <div className="flex justify-center gap-4 mt-4">
            <div className="text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase">
                Batch Ref
              </p>
              <p className="font-mono text-black font-bold text-sm">
                {batchData.number}
              </p>
            </div>
            <div className="text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase">
                Date Received
              </p>
              <p className="font-bold text-black text-sm">{batchData.date}</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="w-full mt-6 bg-slate-900 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest flex items-center justify-center gap-2"
          >
            <Printer size={16} /> Print Label
          </button>
        </div>

        {/* --- SELECTION / ACTION UI --- */}
        {items.length > 1 && !selectedItem ? (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Select Item to Update:
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
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Original Qty: {item.quantity}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-300 group-hover:text-blue-500"
                />
              </button>
            ))}
          </div>
        ) : (
          selectedItem && (
            <div className="animate-in fade-in zoom-in-95">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase">
                    Current Stock
                  </p>
                  <p className="text-lg font-black">{selectedItem.quantity}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase">
                    Today's Net
                  </p>
                  <p className="text-lg font-black text-emerald-600">
                    +{selectedItem.inbound_qty || 0}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  disabled={processing}
                  onClick={() => handleTransaction("in")}
                  className="bg-emerald-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100"
                >
                  Inbound
                </button>
                <button
                  disabled={processing}
                  onClick={() => handleTransaction("out")}
                  className="bg-rose-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-rose-600 transition-colors shadow-lg shadow-rose-100"
                >
                  Outbound
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ItemAction;
