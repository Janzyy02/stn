import React, { useState } from "react";
import {
  Search,
  User,
  Plus,
  ShoppingCart,
  ArrowRight,
  ChevronDown,
  Percent,
} from "lucide-react";

const RecordSales = () => {
  return (
    <div className="p-8 bg-[#e5e7eb] min-h-screen font-sans text-slate-800">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-black">Record Sales</h1>
        <p className="text-slate-500 font-medium">
          Generate Outbound Invoice & Sales Receipt
        </p>
      </div>

      {/* 1. Customer Selection Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <User className="text-teal-600" size={20} /> Customer Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-black uppercase">
              Select Customer
            </label>
            <div className="relative">
              <select className="w-full p-2.5 bg-white border border-slate-300 rounded shadow-inner outline-none appearance-none">
                <option>Walk-in Customer</option>
                <option>Johncel Trading Corp</option>
                <option>STN Solutions</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-black uppercase">
              Invoice Date
            </label>
            <input
              type="date"
              className="w-full p-2 bg-white border border-slate-300 rounded shadow-inner outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-black uppercase">
              Payment Mode
            </label>
            <select className="w-full p-2.5 bg-white border border-slate-300 rounded shadow-inner outline-none appearance-none">
              <option>Cash</option>
              <option>GCash / PayMaya</option>
              <option>Bank Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Item Filter Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Search Inventory</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Item name or SKU..."
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-black uppercase">
              Filter by Category
            </label>
            <select className="w-full p-2 bg-white border border-slate-300 rounded shadow-inner outline-none">
              <option>All Categories</option>
              <option>Construction</option>
              <option>Electrical</option>
            </select>
          </div>
          <button className="bg-[#a8d1cd] text-white px-6 py-2.5 rounded shadow hover:bg-[#96c2be] transition-colors font-bold text-xs uppercase tracking-widest">
            Refresh Inventory List
          </button>
        </div>
      </div>

      {/* 3. Sales Grid Area */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 relative">
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100">
          <h2 className="text-2xl font-bold">Available Stock</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Current Subtotal
              </p>
              <p className="text-lg font-black text-teal-700">₱0.00</p>
            </div>
            <div className="bg-[#a8d1cd] p-2.5 rounded-lg text-white shadow-md cursor-pointer relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                0
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SalesItemCard
            title="PVC BLUE Fittings 1/2'"
            stock={142}
            price={25.0}
          />
          <SalesItemCard
            title="STANLEY Steel Tape 5m"
            stock={28}
            price={320.0}
          />
          <SalesItemCard
            title="Boysen Permacoat White"
            stock={12}
            price={680.0}
          />
        </div>

        {/* Action Bar */}
        <div className="mt-10 flex justify-end">
          <button className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl hover:scale-105 transition-transform uppercase tracking-widest text-sm">
            Finalize Sale & Print <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <footer className="text-center mt-12 py-4 text-slate-400 text-xs uppercase tracking-tighter">
        © Synchronized Technologies 2025 | STN System v2.0
      </footer>
    </div>
  );
};

// Sub-component for Sales Item Cards
const SalesItemCard = ({ title, stock, price }) => {
  // Use strings for state to allow backspacing to empty
  const [qty, setQty] = useState("1");
  const [discount, setDiscount] = useState("0");

  // Numeric parsing for calculations
  const numericQty = parseFloat(qty) || 0;
  const numericDiscount = parseFloat(discount) || 0;

  const grossTotal = numericQty * price;
  const discountAmount = grossTotal * (numericDiscount / 100);
  const subtotal = grossTotal - discountAmount;

  // Validation: Allow empty for backspace, cap max at 100
  const handleDiscountChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      setDiscount("");
      return;
    }
    const num = parseFloat(val);
    if (num > 100) {
      setDiscount("100");
    } else if (num >= 0) {
      setDiscount(val);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-teal-500/50 transition-all group">
      <div>
        <h3 className="font-bold text-lg leading-tight mb-1 uppercase tracking-tight">
          {title}
        </h3>
        <div className="flex justify-between items-center mb-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              stock > 20
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            STOCK: {stock}
          </span>
          <p className="text-sm font-black text-slate-900">
            ₱{price.toFixed(2)}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {/* Quantity Input */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 focus-within:border-teal-400 transition-colors">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onBlur={() => {
                if (qty === "" || qty === "0") setQty("1");
              }}
              className="w-full bg-transparent font-bold text-slate-700 outline-none"
              placeholder="0"
            />
          </div>

          {/* Discount Input */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 focus-within:border-teal-400 transition-colors">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center gap-1">
              <Percent size={10} /> Discount %
            </label>
            <input
              type="number"
              value={discount}
              onChange={handleDiscountChange}
              className={`w-full bg-transparent font-bold outline-none ${
                numericDiscount === 100 ? "text-orange-600" : "text-teal-600"
              }`}
              placeholder="0"
            />
          </div>
        </div>

        {/* Dynamic Subtotal Section */}
        <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Item Subtotal
            </span>
            <span className="font-black text-slate-900 text-lg">
              ₱
              {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          {numericDiscount > 0 && (
            <div className="flex justify-between items-center mt-0.5">
              <span className="text-[9px] text-teal-500 font-bold uppercase">
                {numericDiscount === 100
                  ? "100% Free / Sample"
                  : "Discount applied"}
              </span>
              <span className="text-[10px] text-teal-600 font-bold">
                -₱{discountAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <button className="mt-4 w-full bg-[#a8d1cd] text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow hover:bg-teal-600 transition-colors uppercase tracking-widest">
        <Plus size={14} /> Add to Cart
      </button>
    </div>
  );
};

export default RecordSales;
