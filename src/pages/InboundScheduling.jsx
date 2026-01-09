import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Edit3, Save, Clock, CheckCircle2, X, Loader2 } from "lucide-react";

const InboundScheduling = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ eta: "", status: "" });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("order_scheduling")
      .select("*")
      .order("date_ordered", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const handleSave = async (id) => {
    try {
      console.log("Starting save process for ID:", id);

      // 1. Kunin ang latest data ng scheduling record
      const { data: order, error: fetchErr } = await supabase
        .from("order_scheduling")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchErr) throw new Error("Fetch Order Error: " + fetchErr.message);

      // Check if status is transitioning to Arrived
      const isBecomingArrived =
        editData.status === "Arrived" && order.status !== "Arrived";

      // 2. Update the Status of the Order
      const { error: statusUpdateErr } = await supabase
        .from("order_scheduling")
        .update({
          eta: editData.eta,
          status: editData.status,
          date_arrived:
            editData.status === "Arrived"
              ? new Date().toISOString()
              : order.date_arrived,
        })
        .eq("id", id);

      if (statusUpdateErr)
        throw new Error("Status Update Error: " + statusUpdateErr.message);

      // 3. IF ARRIVED: Record to Inventory and Batches
      if (isBecomingArrived) {
        console.log("Status is Arrived. Updating Inventory and Batches...");

        // A. Get current inventory
        const { data: inv, error: invFetchErr } = await supabase
          .from("hardware_inventory")
          .select("stock_balance, inbound_qty, outbound_qty")
          .eq("id", order.product_id)
          .single();

        if (invFetchErr)
          throw new Error("Inventory Fetch Error: " + invFetchErr.message);

        // B. Update Hardware Inventory Table
        const { error: invUpdateErr } = await supabase
          .from("hardware_inventory")
          .update({
            inbound_qty: Number(inv?.inbound_qty || 0) + Number(order.quantity),
            stock_balance:
              Number(inv?.stock_balance || 0) + Number(order.quantity),
            outbound_qty: Number(inv?.outbound_qty || 0),
          })
          .eq("id", order.product_id);

        if (invUpdateErr)
          throw new Error("Inventory Update Error: " + invUpdateErr.message);

        // C. Insert into inventory_batches (Match sa image_28b46f.png)
        const { error: batchErr } = await supabase
          .from("inventory_batches")
          .insert([
            {
              product_id: order.product_id,
              batch_date: new Date().toISOString(),
              current_stock: Number(order.quantity), // int4 sa DB
              unit_cost: Number(order.unit_cost || 0), // numeric sa DB
              batch_number: order.order_number || `BAT-${Date.now()}`, // text sa DB
            },
          ]);

        if (batchErr) {
          console.error("Batch Insert Error Details:", batchErr);
          throw new Error("Batch Recording Error: " + batchErr.message);
        }

        console.log("Successfully recorded all data!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }

      setEditingId(null);
      fetchOrders();
    } catch (err) {
      console.error("CRITICAL ERROR:", err.message);
      alert("SYSTEM ERROR: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen relative font-sans">
      {showSuccess && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl animate-bounce flex items-center gap-2">
          <CheckCircle2 /> INVENTORY & BATCHES UPDATED!
        </div>
      )}

      <h1 className="text-3xl font-black uppercase italic mb-8 flex items-center gap-3">
        <Clock className="text-[#a8d1cd]" size={32} /> Inbound Scheduling
      </h1>

      <div className="bg-white rounded-[2rem] border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black text-white">
            <tr>
              <th className="p-5 text-xs font-black uppercase italic tracking-widest">
                Order Details
              </th>
              <th className="p-5 text-xs font-black uppercase italic tracking-widest text-blue-400">
                ETA
              </th>
              <th className="p-5 text-xs font-black uppercase italic tracking-widest">
                Status
              </th>
              <th className="p-5 text-right text-xs font-black uppercase italic tracking-widest">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-b-2 border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="p-5">
                  <span className="font-mono text-blue-600 font-bold">
                    #{o.order_number}
                  </span>
                  <p className="text-sm font-black uppercase text-slate-900">
                    {o.item_name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                    {o.supplier} | Qty: {o.quantity}
                  </p>
                </td>
                <td className="p-5 text-sm font-bold">
                  {editingId === o.id ? (
                    <input
                      type="date"
                      className="border-2 border-black rounded-lg p-1"
                      value={editData.eta}
                      onChange={(e) =>
                        setEditData({ ...editData, eta: e.target.value })
                      }
                    />
                  ) : (
                    o.eta || "TBD"
                  )}
                </td>
                <td className="p-5">
                  {editingId === o.id ? (
                    <select
                      className="border-2 border-black rounded-lg p-1 font-black text-[10px]"
                      value={editData.status}
                      onChange={(e) =>
                        setEditData({ ...editData, status: e.target.value })
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Arrived">Arrived</option>
                    </select>
                  ) : (
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 ${
                        o.status === "Arrived"
                          ? "bg-emerald-100 text-emerald-600 border-emerald-600"
                          : "bg-blue-50 text-blue-600 border-blue-600"
                      }`}
                    >
                      {o.status}
                    </span>
                  )}
                </td>
                <td className="p-5 text-right">
                  {editingId === o.id ? (
                    <button
                      onClick={() => handleSave(o.id)}
                      className="bg-black text-white p-2 rounded-xl"
                    >
                      <Save size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(o.id);
                        setEditData({ eta: o.eta || "", status: o.status });
                      }}
                      className="p-2 text-slate-300 hover:text-black"
                    >
                      <Edit3 size={20} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InboundScheduling;
