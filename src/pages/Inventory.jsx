import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Package,
  History,
  Loader2,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
  MinusCircle,
  PlusCircle,
} from "lucide-react";

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from("hardware_inventory")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      setInventoryItems(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleEndDay = async () => {
    const confirmEnd = window.confirm(
      "End Business Day? This will add today's balance to the quantity record and reset daily movements to 0."
    );
    if (!confirmEnd) return;

    try {
      setIsProcessing(true);
      const today = new Date().toISOString().split("T")[0];

      // 1. Archive snapshot for history
      const historyData = inventoryItems.map((item) => ({
        sku: item.sku,
        name: item.name,
        category: item.category,
        initial_qty: item.quantity,
        inbound_qty: item.inbound_qty,
        outbound_qty: item.outbound_qty,
        // The daily net movement is what we archive as the "result" of today
        final_balance: item.inbound_qty - item.outbound_qty,
        snapshot_date: today,
      }));

      await supabase.from("daily_ledger_history").insert(historyData);

      // 2. The Logic: Add today's result to Quantity and reset daily counters
      const updatePromises = inventoryItems.map((item) => {
        const dailyNet = item.inbound_qty - item.outbound_qty;
        return supabase
          .from("hardware_inventory")
          .update({
            quantity: item.quantity + dailyNet, // Retain and add
            inbound_qty: 0, // Reset to 0
            outbound_qty: 0, // Reset to 0
            last_updated: new Date().toISOString(),
          })
          .eq("id", item.id);
      });

      await Promise.all(updatePromises);
      alert("Day Archived: Daily movements added to Quantity and reset to 0.");
      fetchInventory();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 w-full bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Inventory Ledger
          </h1>
          <p className="text-slate-500 text-sm">
            Cumulative Quantity Management
          </p>
        </div>
        <button
          onClick={handleEndDay}
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          End Business Day
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
              <th className="px-6 py-5">Product Details</th>
              <th className="px-6 py-4">Total Quantity</th>
              <th className="px-6 py-4 text-blue-600">Daily In (+)</th>
              <th className="px-6 py-4 text-orange-600">Daily Out (-)</th>
              <th className="px-6 py-4 bg-teal-50/30 text-teal-700 font-black">
                Daily Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventoryItems.map((item) => {
              const dailyBalance = item.inbound_qty - item.outbound_qty;
              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.sku}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-600">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-700">
                    <div className="flex items-center gap-1">
                      <PlusCircle size={12} /> {item.inbound_qty}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-700">
                    <div className="flex items-center gap-1">
                      <MinusCircle size={12} /> {item.outbound_qty}
                    </div>
                  </td>
                  <td
                    className={`px-6 py-4 text-sm font-black bg-teal-50/20 ${
                      dailyBalance < 0 ? "text-red-600" : "text-slate-900"
                    }`}
                  >
                    {dailyBalance}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
