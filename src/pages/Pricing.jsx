import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { RefreshCcw, Edit3, Save, X, Truck, Tag } from "lucide-react";

const InboundPricing = () => {
  const [pricingData, setPricingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    supplier_cost: 0,
    manual_retail_price: 0,
    margin_percent: 0,
    suggested_srp: 0,
  });

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_pricing")
        .select(
          `
          id,
          supplier_cost,
          manual_retail_price,
          margin_percent,
          suggested_srp,
          hardware_inventory (name, sku)
        `
        )
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setPricingData(data || []);
    } catch (err) {
      console.error("Error fetching pricing:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRow = async (id) => {
    try {
      const { error } = await supabase
        .from("product_pricing")
        .update({
          supplier_cost: parseFloat(editData.supplier_cost).toFixed(2),
          manual_retail_price: parseFloat(editData.manual_retail_price).toFixed(
            2
          ),
          margin_percent: parseFloat(editData.margin_percent).toFixed(2),
          suggested_srp: parseFloat(editData.suggested_srp).toFixed(2),
          updated_at: new Date(),
        })
        .eq("id", id);

      if (error) throw error;
      setEditingId(null);
      await fetchPricing();
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const handleMarginChange = (val) => {
    const margin = parseFloat(val || 0);
    const cost = parseFloat(editData.supplier_cost || 0);
    const srp = margin < 100 ? cost / (1 - margin / 100) : cost;

    setEditData({
      ...editData,
      margin_percent: val,
      suggested_srp: srp.toFixed(2),
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <h1 className="text-4xl font-black mb-10 uppercase tracking-tight text-black">
        Pricing Manager
      </h1>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <th className="p-6">Product Item</th>
              <th className="p-6 bg-blue-50/30 text-blue-600">Supplier Cost</th>
              <th className="p-6 text-center">Margin %</th>
              <th className="p-6 text-teal-600">Suggested SRP</th>
              <th className="p-6 bg-emerald-50/30 text-emerald-600">
                Retail Price
              </th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pricingData.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <tr
                  key={item.id}
                  className={`transition-all ${
                    isEditing ? "bg-teal-50/40" : "hover:bg-slate-50/50"
                  }`}
                >
                  <td className="p-6">
                    <div className="font-black text-sm uppercase text-black">
                      {item.hardware_inventory?.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                      {item.hardware_inventory?.sku}
                    </div>
                  </td>

                  <td className="p-6 bg-blue-50/10">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-24 border-2 border-blue-400 rounded p-2 font-black text-sm text-black outline-none bg-white"
                        value={editData.supplier_cost}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            supplier_cost: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span className="font-bold text-blue-700">
                        ₱{parseFloat(item.supplier_cost).toLocaleString()}
                      </span>
                    )}
                  </td>

                  <td className="p-6 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-16 border-2 border-slate-300 rounded p-2 font-black text-sm text-black outline-none bg-white"
                        value={editData.margin_percent}
                        onChange={(e) => handleMarginChange(e.target.value)}
                      />
                    ) : (
                      <span className="text-xs font-black text-slate-500">
                        {parseFloat(item.margin_percent).toFixed(1)}%
                      </span>
                    )}
                  </td>

                  <td className="p-6">
                    <span className="font-black text-teal-600 italic text-sm">
                      ₱
                      {isEditing
                        ? parseFloat(editData.suggested_srp).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 }
                          )
                        : parseFloat(item.suggested_srp).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 }
                          )}
                    </span>
                  </td>

                  <td className="p-6 bg-emerald-50/10">
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-24 border-2 border-emerald-400 rounded p-2 font-black text-sm text-black outline-none bg-white"
                        value={editData.manual_retail_price}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            manual_retail_price: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span className="font-black text-emerald-700">
                        ₱{parseFloat(item.manual_retail_price).toLocaleString()}
                      </span>
                    )}
                  </td>

                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleUpdateRow(item.id)}
                            className="bg-emerald-500 text-white p-2.5 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-slate-200 text-slate-500 p-2.5 rounded-xl hover:bg-slate-300"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditData({
                              supplier_cost: item.supplier_cost,
                              manual_retail_price: item.manual_retail_price,
                              margin_percent: item.margin_percent,
                              suggested_srp: item.suggested_srp,
                            });
                          }}
                          className="bg-white border-2 border-slate-100 p-2.5 rounded-xl text-slate-600 hover:border-black hover:text-black transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                      )}
                    </div>
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

export default InboundPricing;
