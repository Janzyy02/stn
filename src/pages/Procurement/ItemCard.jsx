import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

const ItemCard = ({ item, onAdd }) => {
  const [qty, setQty] = useState(1);
  return (
    <div className="bg-white rounded-xl p-5 border-2 border-slate-100 hover:border-black shadow-sm group transition-all">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-black uppercase text-sm group-hover:text-blue-600 transition-colors">
          {item.name}
        </h3>
        <span className="text-[10px] font-mono font-bold text-slate-400">
          #{item.sku}
        </span>
      </div>
      <p className="text-xl font-black text-slate-800 mb-6">
        ₱{item.price.toLocaleString()}
      </p>
      <div className="flex justify-between items-center pt-4 border-t-2 border-slate-50">
        <div className="flex border-2 border-slate-200 rounded-lg h-10 overflow-hidden shadow-sm">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="px-3 hover:bg-slate-100"
          >
            <Minus size={14} />
          </button>
          <input
            readOnly
            value={qty}
            className="w-10 text-center text-xs font-black bg-white outline-none"
          />
          <button
            onClick={() => setQty(qty + 1)}
            className="px-3 hover:bg-slate-100"
          >
            <Plus size={14} />
          </button>
        </div>
        <button
          onClick={() => onAdd(item, qty)}
          className="bg-black text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase hover:bg-slate-800"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ItemCard;
