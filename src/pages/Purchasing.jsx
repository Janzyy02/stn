import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  ShoppingCart,
  Search,
  Plus,
  Filter,
  UserPlus,
  PackagePlus,
  Loader2,
} from "lucide-react";

const Purchasing = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch live inventory data
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("hardware_inventory")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  return (
    <div className="p-8 bg-[#e5e7eb] min-h-screen font-sans text-slate-800">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-black">Purchase Order</h1>
        <p className="text-slate-500 font-medium">Create Purchase Order</p>
      </div>

      {/* Filter and Add Forms (UI remains the same) */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <h2 className="text-xl font-bold mb-4">Filter Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-black uppercase">
              Filter by Supplier
            </label>
            <select className="w-full p-2 bg-white border border-slate-300 rounded shadow-inner outline-none">
              <option>All Suppliers</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-black uppercase">
              Filter by Item Name
            </label>
            <div className="flex gap-4">
              <select className="w-full p-2 bg-white border border-slate-300 rounded shadow-inner outline-none">
                <option>All Items</option>
              </select>
              <button className="bg-[#a8d1cd] text-white px-4 py-2 rounded shadow hover:bg-[#96c2be] transition-colors font-bold text-xs whitespace-nowrap">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Item Selection Area (Now Dynamic) */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Supplier Selection</h2>
          <div className="flex items-center gap-3">
            {loading && (
              <Loader2 className="animate-spin text-teal-600" size={20} />
            )}
            <div className="relative">
              <div className="bg-[#a8d1cd] p-2 rounded-lg text-white shadow-md cursor-pointer">
                <ShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  0
                </span>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-10 text-center text-red-500 font-medium bg-red-50">
            Error: {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                title={item.name}
                category={item.category}
                price={item.price}
                unit="pcs"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ItemCard = ({ title, category, price, unit }) => (
  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
    <div>
      <h3 className="font-bold text-lg leading-tight mb-1 uppercase tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 mb-2 font-medium">
        Category: <span className="text-slate-600">{category}</span>
      </p>
      <p className="text-sm font-bold text-[#a8d1cd]">
        Price: ₱
        {parseFloat(price).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })}
      </p>
      <p className="text-xs text-slate-500">Unit: {unit}</p>
      <div className="mt-4 flex items-center gap-2">
        <label className="text-[10px] font-bold">Quantity:</label>
        <div className="flex items-center border border-slate-300 rounded overflow-hidden">
          <input
            type="number"
            defaultValue="1"
            className="w-12 text-center text-xs p-1 focus:outline-none"
          />
        </div>
      </div>
    </div>
    <div className="mt-6 flex justify-end">
      <button className="bg-[#a8d1cd] text-white px-3 py-2 rounded text-[10px] font-bold flex items-center gap-2 shadow hover:opacity-90 transition-opacity uppercase">
        <ShoppingCart size={14} /> Add to Order
      </button>
    </div>
  </div>
);

export default Purchasing;
