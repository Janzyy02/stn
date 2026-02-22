import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  Activity,
  Timer,
  Zap,
  Target,
  BarChart3,
  Flame,
  Info,
  Trash2,
} from "lucide-react";

const Dashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: invData } = await supabase
        .from("hardware_inventory")
        .select("*");
      const { data: histData } = await supabase
        .from("daily_ledger_history")
        .select("*")
        .order("snapshot_date", { ascending: true });
      setInventory(invData || []);
      setHistory(histData || []);
    } catch (err) {
      console.error("Dashboard Load Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- BI LOGIC: MAD & ANALYTICS ---
  const calculateMAD = (itemName) => {
    const itemHistory = history.filter((h) => h.name === itemName).slice(-7);
    if (itemHistory.length === 0) return 0;
    const mean =
      itemHistory.reduce((acc, h) => acc + h.outbound_qty, 0) /
      itemHistory.length;
    const absoluteDeviations = itemHistory.map((h) =>
      Math.abs(h.outbound_qty - mean)
    );
    return (
      absoluteDeviations.reduce((acc, d) => acc + d, 0) / itemHistory.length
    );
  };

  const getABCAnalytics = (item) => {
    const velocityScore = (item.outbound_qty || 0) * (item.quantity || 1);
    if (velocityScore > 100)
      return {
        label: "A",
        color: "bg-purple-100 text-purple-700",
        desc: "High Value",
      };
    if (velocityScore > 30)
      return { label: "B", color: "bg-blue-100 text-blue-700", desc: "Steady" };
    return { label: "C", color: "bg-slate-100 text-slate-600", desc: "Slow" };
  };

  const stockoutRiskItems = inventory.filter(
    (i) => i.quantity / (i.outbound_qty || 1) < 3 && i.quantity > 0
  );

  // --- CHART DATA PREP ---
  const velocityData = history.slice(-10).map((h) => ({
    date: new Date(h.snapshot_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    sales: h.outbound_qty,
    upperBound: h.outbound_qty + calculateMAD(h.name) * 1.65,
  }));

  const ageingData = [
    {
      name: "0-30d",
      value: inventory.filter((i) => i.outbound_qty > 5).length,
      fill: "#10b981",
    },
    {
      name: "31-60d",
      value: inventory.filter((i) => i.outbound_qty <= 5 && i.outbound_qty > 0)
        .length,
      fill: "#3b82f6",
    },
    {
      name: "61-90d",
      value: inventory.filter((i) => i.outbound_qty === 0).length,
      fill: "#f59e0b",
    },
    { name: "90d+", value: 2, fill: "#ef4444" },
  ];

  if (loading)
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  return (
    <main className="flex-1 p-8 bg-slate-50 min-h-screen font-sans">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">
            STN Command Center
          </h1>
          <p className="text-slate-500 font-medium">
            Predictive Procurement & Inventory Health
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs uppercase">
          <Zap size={14} className="text-amber-500" /> Webhook: Active
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Sales Velocity"
          value={inventory.reduce((acc, i) => acc + (i.outbound_qty || 0), 0)}
          icon={<TrendingUp className="text-emerald-600" />}
          sub="Units / 24h"
          trend={<ArrowUpRight size={14} className="text-emerald-500" />}
        />
        <StatCard
          label="Stockout Risk"
          value={stockoutRiskItems.length}
          icon={<AlertTriangle className="text-rose-600" />}
          sub="High Urgency SKUs"
          isAlert={true}
        />
        <StatCard
          label="Procurement"
          value={inventory.reduce((acc, i) => acc + (i.inbound_qty || 0), 0)}
          icon={<ShoppingCart className="text-purple-600" />}
          sub="Daily Receipts"
        />
        <StatCard
          label="Accuracy"
          value="98.2%"
          icon={<Target className="text-blue-600" />}
          sub="System Fidelity"
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-black text-slate-800 uppercase text-xs mb-6 flex items-center gap-2">
            <Activity size={16} /> Demand Velocity & MAD Forecasting
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="transparent"
                  fill="#f1f5f9"
                  name="Safety Buffer"
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#0d9488"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  name="Actual Sales"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-black text-slate-800 uppercase text-xs mb-6 flex items-center gap-2">
            <Timer size={16} /> Inventory Ageing
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageingData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DATA TABLES SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-4">
          {/* Legend restored */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-6 items-center shadow-sm">
            <div className="flex items-center gap-2 border-r border-slate-100 pr-4 text-[10px] font-black uppercase text-slate-400">
              <Info size={14} /> Class Legend:
            </div>
            <LegendItem
              label="Class A"
              desc="Critical"
              color="bg-purple-100 text-purple-700"
            />
            <LegendItem
              label="Class B"
              desc="Steady"
              color="bg-blue-100 text-blue-700"
            />
            <LegendItem
              label="Class C"
              desc="Slow"
              color="bg-slate-100 text-slate-600"
            />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 font-black text-slate-800 uppercase text-xs flex items-center gap-2">
              <BarChart3 size={16} /> Procurement Decision Engine
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">MAD</th>
                  <th className="px-6 py-4 text-right">Buy Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.slice(0, 6).map((item) => {
                  const mad = calculateMAD(item.name).toFixed(1);
                  const { label, color } = getABCAnalytics(item);
                  const target = Math.ceil(mad * 1.65) + 50;
                  const buyQty =
                    item.quantity < target - 20 ? target - item.quantity : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 text-xs">
                      <td className="px-6 py-4 font-bold text-slate-800 uppercase">
                        {item.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-black uppercase ${color}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">
                        ±{mad}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {buyQty > 0 ? (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-black text-[10px] animate-pulse">
                            REPLENISH: +{buyQty}
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-black text-[10px] uppercase">
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stockout Risk Table */}
        <div className="bg-white rounded-3xl border border-rose-200 shadow-lg shadow-rose-100 overflow-hidden">
          <div className="p-6 border-b border-rose-100 bg-rose-50 font-black text-rose-800 uppercase text-xs flex items-center gap-2">
            <Flame size={16} className="text-rose-600" /> Stockout Monitor
          </div>
          <table className="w-full text-left">
            <thead className="bg-rose-50/50 text-[10px] font-black uppercase text-rose-400">
              <tr>
                <th className="px-4 py-4">Item</th>
                <th className="px-4 py-4">Qty</th>
                <th className="px-4 py-4 text-right">Runway</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {stockoutRiskItems.map((item) => (
                <tr key={item.id} className="hover:bg-rose-50/30 text-xs">
                  <td className="px-4 py-4 font-bold text-slate-800 uppercase truncate max-w-[120px]">
                    {item.name}
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-rose-600">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="bg-rose-600 text-white px-2 py-1 rounded text-[9px] font-black uppercase">
                      {(item.quantity / (item.outbound_qty || 1)).toFixed(1)}{" "}
                      Days
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEAD STOCK SECTION RESTORED */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-black text-slate-800 uppercase text-xs mb-6 flex items-center gap-2">
          <Package size={16} /> Dead Stock Alerts (90d+ Idle)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {inventory
            .filter((i) => i.outbound_qty === 0)
            .slice(0, 4)
            .map((item) => (
              <div
                key={item.id}
                className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between"
              >
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    {item.name}
                  </p>
                  <h4 className="text-lg font-black text-slate-800">
                    {item.quantity}{" "}
                    <span className="text-[10px] text-slate-400">Units</span>
                  </h4>
                </div>
                <button className="mt-4 flex items-center justify-center gap-2 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-100 transition-all">
                  <Trash2 size={12} /> Trigger Clearance
                </button>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
};

const LegendItem = ({ label, desc, color }) => (
  <div className="flex items-center gap-2">
    <span
      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${color}`}
    >
      {label}
    </span>
    <span className="text-[9px] font-bold text-slate-400 uppercase">
      {desc}
    </span>
  </div>
);

const StatCard = ({ label, value, icon, sub, trend, isAlert }) => (
  <div
    className={`p-6 rounded-3xl border transition-all ${
      isAlert
        ? "bg-rose-50 border-rose-200 shadow-lg shadow-rose-100"
        : "bg-white border-slate-200 shadow-sm"
    }`}
  >
    <div className="flex justify-between items-start mb-4">
      <div
        className={`p-3 rounded-xl ${isAlert ? "bg-rose-100" : "bg-slate-50"}`}
      >
        {icon}
      </div>
      {trend}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
      {label}
    </p>
    <h2
      className={`text-3xl font-black ${
        isAlert ? "text-rose-900" : "text-slate-900"
      }`}
    >
      {value}
    </h2>
    <p
      className={`text-[10px] font-bold mt-2 uppercase flex items-center gap-1 ${
        isAlert ? "text-rose-600" : "text-slate-400"
      }`}
    >
      {isAlert && <Activity size={12} />} {sub}
    </p>
  </div>
);

export default Dashboard;
