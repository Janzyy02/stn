import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { ShoppingCart, ArrowLeft, Loader2, PackageCheck } from "lucide-react";

const ItemAction = () => {
  const [searchParams] = useSearchParams();
  const sku = searchParams.get("sku");
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      const { data } = await supabase
        .from("hardware_inventory")
        .select("*")
        .eq("sku", sku)
        .single();
      setItem(data);
      setLoading(false);
    };
    if (sku) fetchItem();
  }, [sku]);

  const handleTransaction = async (type) => {
    setProcessing(true);
    const column = type === "out" ? "outbound_qty" : "inbound_qty";
    const currentValue = item[column] || 0;

    const { error } = await supabase
      .from("hardware_inventory")
      .update({ [column]: currentValue + 1 })
      .eq("sku", sku);

    if (error) alert("Error updating inventory");
    else navigate("/inventory"); // Go back to the main ledger
  };

  if (loading)
    return (
      <div className="p-20 text-center">
        <Loader2 className="animate-spin mx-auto" />
      </div>
    );
  if (!item) return <div className="p-20 text-center">Item not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 flex items-center gap-2 mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="text-center mb-8">
          <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase">
            {item.name}
          </h1>
          <p className="font-mono text-slate-500 font-bold">{item.sku}</p>
        </div>

        <div className="space-y-4">
          <button
            disabled={processing}
            onClick={() => handleTransaction("out")}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3"
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
            className="w-full bg-white border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
          >
            <PackageCheck size={20} />
            Restock Item
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-bold uppercase">
            Current Stock Level
          </p>
          <p className="text-3xl font-black text-slate-900">{item.quantity}</p>
        </div>
      </div>
    </div>
  );
};

export default ItemAction;
