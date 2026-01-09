import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  ChevronLeft,
  X,
  Trash2,
  Loader2,
  Package,
  Calendar,
  Tag,
} from "lucide-react";

const RecordSales = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [view, setView] = useState("browse");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [customer, setCustomer] = useState("Walk-in Customer");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      // Fetching main product data from hardware_inventory
      // Joining inventory_batches to see available stock per batch
      const { data, error } = await supabase
        .from("hardware_inventory")
        .select(
          `
          *,
          product_pricing (manual_retail_price),
          inventory_batches (
            id,
            batch_number,
            batch_date,
            current_stock
          )
        `
        )
        .order("name", { ascending: true });

      if (error) throw error;

      const formattedData = (data || []).map((item) => ({
        ...item,
        displayPrice: parseFloat(
          item.product_pricing?.manual_retail_price || 0
        ),
        // Filter out batches with 0 stock and sort by date (FIFO)
        batches: (item.inventory_batches || [])
          .filter((b) => b.current_stock > 0)
          .sort((a, b) => new Date(a.batch_date) - new Date(b.batch_date)),
      }));

      setItems(formattedData);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === "All Categories" || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, filterCategory]);

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.batchId === product.batchId);
      if (exists) {
        return prev.map((i) =>
          i.batchId === product.batchId
            ? {
                ...i,
                qty: i.qty + product.qty,
                subtotal: (i.qty + product.qty) * i.price,
              }
            : i
        );
      }
      return [...prev, product];
    });
    setIsCartOpen(true);
  };

  const handleFinalizeTransaction = async () => {
    if (cart.length === 0) return;
    setIsCompleting(true);
    try {
      const timestamp = new Date().getTime().toString().slice(-4);
      const invoiceNo = `INV-${new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "")}-${timestamp}`;

      const { data: trans, error: tErr } = await supabase
        .from("sales_transactions")
        .insert([
          {
            invoice_number: invoiceNo,
            customer_name: customer,
            total_amount: cart.reduce((sum, i) => sum + i.subtotal, 0),
            transaction_date: new Date().toISOString().split("T")[0],
          },
        ])
        .select()
        .single();

      if (tErr) throw tErr;

      for (const item of cart) {
        // 1. Record Sale Item
        await supabase.from("sales_items").insert([
          {
            transaction_id: trans.id,
            product_id: item.productId,
            product_name: `${item.title} (Batch: ${item.batchNo})`,
            quantity: item.qty,
            unit_price: item.price,
            subtotal: item.subtotal,
          },
        ]);

        // 2. Deduct from specific batch in inventory_batches
        await supabase
          .from("inventory_batches")
          .update({ current_stock: item.maxBatchStock - item.qty })
          .eq("id", item.batchId);

        // 3. Update master outbound_qty in hardware_inventory
        const { data: master } = await supabase
          .from("hardware_inventory")
          .select("outbound_qty, stock_balance")
          .eq("id", item.productId)
          .single();

        await supabase
          .from("hardware_inventory")
          .update({
            outbound_qty: (master.outbound_qty || 0) + item.qty,
            stock_balance: (master.stock_balance || 0) - item.qty,
          })
          .eq("id", item.productId);
      }

      alert("Sale Completed!");
      setCart([]);
      setView("browse");
      fetchInventory();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tighter">
          Record Sales
        </h1>
        <button
          onClick={() => setIsCartOpen(true)}
          className="bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-100 relative"
        >
          <ShoppingCart />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 mb-6 flex gap-4">
            <input
              type="text"
              placeholder="Search product name or SKU..."
              className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold text-xs uppercase outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <Loader2 className="animate-spin mx-auto mt-20" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ProductCard key={item.id} item={item} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-black rounded-3xl p-8 text-white h-fit sticky top-8">
          <p className="text-[10px] font-black uppercase opacity-40">
            Cart Total
          </p>
          <h2 className="text-4xl font-black italic">
            ₱{cart.reduce((s, i) => s + i.subtotal, 0).toLocaleString()}
          </h2>
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full mt-6 bg-white text-black py-4 rounded-2xl font-black uppercase text-xs"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Cart Drawer and Invoice Modals omitted for brevity - same logic as before */}
    </div>
  );
};

// --- PRODUCT CARD COMPONENT ---
const ProductCard = ({ item, onAdd }) => {
  const [selectedBatchId, setSelectedBatchId] = useState(
    item.batches[0]?.id || ""
  );
  const [qty, setQty] = useState(1);

  const selectedBatch = item.batches.find((b) => b.id === selectedBatchId);
  const outOfStock = !selectedBatch || selectedBatch.current_stock <= 0;

  return (
    <div
      className={`bg-white text-black rounded-3xl p-6 border-2 transition-all flex flex-col ${
        outOfStock
          ? "border-slate-100 opacity-60"
          : "border-slate-50 hover:border-black"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-100 rounded-2xl">
          <Package size={20} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase">
            Total Stock
          </p>
          <p className="font-black text-sm">
            {item.stock_balance} {item.unit}
          </p>
        </div>
      </div>

      <h3 className="font-black uppercase text-sm mb-1 h-10 line-clamp-2">
        {item.name}
      </h3>
      <p className="text-[10px] font-mono font-bold text-blue-600 mb-4 italic">
        SKU: {item.sku}
      </p>

      <p className="text-2xl font-black mb-6">
        ₱{item.displayPrice.toLocaleString()}
      </p>

      {/* BATCH SELECTION DROPDOWN */}
      <div className="mb-4">
        <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1">
          <Calendar size={10} /> Choose Batch (Arrival Date)
        </label>
        <select
          disabled={outOfStock}
          className="w-full p-3 bg-slate-50 rounded-xl font-bold text-[11px] uppercase outline-none border-2 border-transparent focus:border-black"
          value={selectedBatchId}
          onChange={(e) => {
            setSelectedBatchId(e.target.value);
            setQty(1);
          }}
        >
          {item.batches.length > 0 ? (
            item.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {new Date(b.batch_date).toLocaleDateString()} — {b.batch_number}{" "}
                ({b.current_stock} left)
              </option>
            ))
          ) : (
            <option>No available batches</option>
          )}
        </select>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="flex flex-1 border-2 border-slate-100 rounded-xl overflow-hidden h-12">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="px-4 bg-slate-50"
          >
            <Minus size={14} />
          </button>
          <input
            readOnly
            value={qty}
            className="w-full text-center font-black bg-white"
          />
          <button
            onClick={() =>
              setQty(Math.min(selectedBatch?.current_stock || 1, qty + 1))
            }
            className="px-4 bg-slate-50"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <button
        disabled={outOfStock}
        onClick={() =>
          onAdd({
            batchId: selectedBatch.id,
            productId: item.id,
            batchNo: selectedBatch.batch_number,
            title: item.name,
            qty: qty,
            maxBatchStock: selectedBatch.current_stock,
            price: item.displayPrice,
            subtotal: qty * item.displayPrice,
          })
        }
        className="w-full bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase disabled:bg-slate-200"
      >
        {outOfStock ? "Out of Stock" : "Add to Order"}
      </button>
    </div>
  );
};

export default RecordSales;
