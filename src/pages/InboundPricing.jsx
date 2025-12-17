import React from "react";
import {
  Tag,
  TrendingUp,
  DollarSign,
  ArrowDown,
  Save,
  RefreshCw,
} from "lucide-react";

const InboundPricing = () => {
  return (
    <div className="p-8 bg-[#e5e7eb] min-h-screen font-sans text-slate-800">
      {/* Page Title Section */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-black tracking-tight">
            Inbound Pricing
          </h1>
          <p className="text-slate-500 font-medium">
            Configure profit margins and landing costs for incoming stock
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <RefreshCw size={14} /> Reset Rates
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-[#a8d1cd] text-white rounded-lg text-xs font-bold hover:bg-[#96c2be] transition-all shadow-md">
            <Save size={14} /> Update All Prices
          </button>
        </div>
      </div>

      {/* 1. Global Margin Configuration */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="text-teal-600" size={20} /> Global Pricing
          Strategy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-black uppercase tracking-widest">
              Base Markup (%)
            </label>
            <input
              type="number"
              defaultValue="20"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-inner focus:ring-2 focus:ring-teal-500/20 outline-none font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-black uppercase tracking-widest">
              Inbound Freight Fee
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ₱
              </span>
              <input
                type="number"
                defaultValue="150"
                className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl shadow-inner focus:ring-2 focus:ring-teal-500/20 outline-none font-bold"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-black uppercase tracking-widest">
              Tax Rate (%)
            </label>
            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-inner outline-none font-bold">
              <option>VAT Exempt (0%)</option>
              <option selected>Standard VAT (12%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Item-Specific Pricing Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold">Recent Inbound Shipments</h2>
          <div className="bg-[#d5e8e6] text-teal-800 px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter">
            SYNCED WITH PURCHASING
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4 text-center">Supplier Cost</th>
                <th className="px-6 py-4 text-center">Margin %</th>
                <th className="px-6 py-4 text-right">Suggested Retail Price</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <PricingRow
                name="PVC BLUE Fittings 1/2'"
                cost="14.50"
                landing="1.20"
                margin="25"
                srp="19.60"
              />
              <PricingRow
                name="STANLEY Hand Riveter"
                cost="480.00"
                landing="45.00"
                margin="30"
                srp="682.50"
              />
              <PricingRow
                name="LOTUS Welding Mask"
                cost="720.00"
                landing="50.00"
                margin="20"
                srp="924.00"
              />
              <PricingRow
                name="Electrical Wire (100m)"
                cost="2,450.00"
                landing="120.00"
                margin="15"
                srp="2,955.50"
              />
            </tbody>
          </table>
        </div>
      </div>

      <footer className="text-center mt-12 py-4 text-slate-400 text-xs">
        © Synchronized Technologies 2025
      </footer>
    </div>
  );
};

// Sub-component for individual pricing lines
const PricingRow = ({ name, cost, landing, margin, srp }) => (
  <tr className="hover:bg-slate-50/80 transition-colors group">
    <td className="px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-[#a8d1cd] group-hover:text-white transition-all">
          <Tag size={16} />
        </div>
        <span className="font-bold text-sm text-slate-800 uppercase tracking-tight">
          {name}
        </span>
      </div>
    </td>
    <td className="px-6 py-5 text-center font-semibold text-slate-600">
      ₱{cost}
    </td>

    <td className="px-6 py-5 text-center">
      <div className="flex items-center justify-center gap-1 font-bold text-teal-600">
        {margin}% <ArrowDown size={12} className="rotate-180" />
      </div>
    </td>
    <td className="px-6 py-5 text-right">
      <span className="text-lg font-black text-slate-900 tracking-tighter">
        ₱{srp}
      </span>
    </td>
    <td className="px-6 py-5 text-right">
      <button className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all uppercase">
        Adjust
      </button>
    </td>
  </tr>
);

export default InboundPricing;
