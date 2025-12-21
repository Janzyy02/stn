import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  ChevronLeft,
  Printer,
  X,
  Trash2,
  Loader2,
  Package,
  CheckCircle,
} from "lucide-react";

const RecordSales = () => {
  // --- DATABASE & FILTER STATE ---
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");

  // --- NAVIGATION & UI STATE ---
  const [view, setView] = useState("browse");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // --- FORM STATE ---
  const [customer, setCustomer] = useState("Walk-in Customer");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [invoiceDate] = useState(new Date().toLocaleDateString());

  // --- DATA FETCHING ---
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hardware_inventory")
        .select(
          `
          id, 
          name, 
          sku, 
          category,
          quantity,
          outbound_qty,
          product_pricing (
            manual_retail_price
          )
        `
        )
        .order("name");

      if (error) throw error;

      const itemsWithPrice = (data || []).map((item) => ({
        ...item,
        displayPrice: parseFloat(
          item.product_pricing?.manual_retail_price || 0
        ),
      }));

      setItems(itemsWithPrice);
    } catch (err) {
      console.error("Error fetching sales inventory:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // --- BUSINESS LOGIC ---
  const categories = useMemo(() => {
    const cats = items.map((i) => i.category).filter(Boolean);
    return ["All Categories", ...new Set(cats)];
  }, [items]);

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
      const exists = prev.find((i) => i.id === product.id);
      if (exists) {
        return prev.map((i) =>
          i.id === product.id
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

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.qty + delta);
          return { ...item, qty: newQty, subtotal: newQty * item.price };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // --- FINALIZE TRANSACTION (RECORDING TO DB) ---
  const handleFinalizeTransaction = async () => {
    if (cart.length === 0) return;
    setIsCompleting(true);

    try {
      // 1. Generate Invoice Number
      const timestamp = new Date().getTime().toString().slice(-4);
      const datePart = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const generatedInvoiceNumber = `INV-${datePart}-${timestamp}`;

      // 2. Insert into sales_transactions (Header)
      const { data: transaction, error: transError } = await supabase
        .from("sales_transactions")
        .insert([
          {
            invoice_number: generatedInvoiceNumber,
            customer_name: customer,
            total_amount: cartTotal,
            payment_method: paymentMethod,
            is_delivery: false,
            transaction_date: new Date().toISOString().split("T")[0],
          },
        ])
        .select()
        .single();

      if (transError) throw transError;

      // 3. Prepare Line Items for sales_items
      const salesItemsToInsert = cart.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.id,
        product_name: item.title,
        quantity: item.qty,
        unit_price: item.price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from("sales_items")
        .insert(salesItemsToInsert);

      if (itemsError) throw itemsError;

      // 4. Update Hardware Inventory (Decrement Stock & Increment Outbound Qty)
      for (const cartItem of cart) {
        const { data: dbItem, error: fetchError } = await supabase
          .from("hardware_inventory")
          .select("quantity, outbound_qty")
          .eq("id", cartItem.id)
          .single();

        if (fetchError) throw fetchError;

        const currentQty = dbItem.quantity || 0;
        const currentOutbound = dbItem.outbound_qty || 0; // Fetch current outbound

        const { error: updateError } = await supabase
          .from("hardware_inventory")
          .update({
            quantity: currentQty - cartItem.qty,
            outbound_qty: currentOutbound + cartItem.qty, // Increment outbound
          })
          .eq("id", cartItem.id);

        if (updateError) throw updateError;
      }

      alert(`Transaction Recorded! Invoice: ${generatedInvoiceNumber}`);
      setCart([]);
      setView("browse");
      fetchInventory();
    } catch (err) {
      console.error("Transaction Error:", err.message);
      alert("Failed to complete transaction: " + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  // --- RENDER: INVOICE VIEW ---
  if (view === "invoice") {
    return (
      <div className="p-8 bg-[#f3f4f6] min-h-screen font-sans text-black">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setView("browse")}
            className="mb-4 flex items-center gap-2 font-black uppercase text-[10px] text-slate-500 hover:text-black print:hidden"
          >
            <ChevronLeft size={16} /> Back to Browse
          </button>

          <div className="bg-white p-12 rounded-3xl border-4 border-black shadow-2xl print:border-none print:shadow-none">
            <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
              <div>
                <h1 className="text-5xl font-black uppercase tracking-tighter">
                  Sales Invoice
                </h1>
                <p className="font-bold text-slate-400 mt-1 uppercase text-xs">
                  Date: {invoiceDate}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-xs text-slate-400 uppercase tracking-widest">
                  Customer
                </p>
                <p className="font-bold uppercase text-xl italic">{customer}</p>
              </div>
            </div>

            <table className="w-full text-left mb-12">
              <thead>
                <tr className="border-b-2 border-black text-[10px] font-black uppercase text-slate-400">
                  <th className="pb-4">Description</th>
                  <th className="pb-4 text-center">Qty</th>
                  <th className="pb-4 text-right">Price</th>
                  <th className="pb-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-5">
                      <p className="font-black text-sm uppercase">
                        {item.title}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {item.sku}
                      </p>
                    </td>
                    <td className="py-5 text-center font-bold">{item.qty}</td>
                    <td className="py-5 text-right">
                      ₱{item.price.toLocaleString()}
                    </td>
                    <td className="py-5 text-right font-black">
                      ₱{item.subtotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col items-end">
              <div className="w-64 space-y-1 border-t-4 border-black pt-4 text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Grand Total
                </p>
                <p className="text-5xl font-black tracking-tighter">
                  ₱{cartTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-white border-4 border-black py-4 rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <Printer size={20} /> Print Receipt
            </button>
            <button
              onClick={handleFinalizeTransaction}
              disabled={isCompleting}
              className="flex-[2] bg-black text-white py-4 rounded-2xl font-black uppercase shadow-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
            >
              {isCompleting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              Finalize Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: BROWSE VIEW ---
  return (
    <div className="p-8 bg-[#e5e7eb] min-h-screen font-sans text-black">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-black text-black uppercase tracking-tighter">
          Record Sales
        </h1>
        <button
          onClick={() => setIsCartOpen(true)}
          className="bg-white p-5 rounded-2xl shadow-sm relative border-2 border-transparent hover:border-black transition-all"
        >
          <ShoppingCart className="text-slate-600" size={28} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-full border-4 border-white">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-10">
              <div className="relative flex-1">
                <Search
                  className="absolute left-5 top-4.5 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="SEARCH ITEM NAME OR SKU..."
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-2 ring-black/5 text-black"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="bg-slate-50 px-6 py-4 rounded-2xl font-bold text-xs uppercase outline-none text-black"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin text-black" size={48} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <SalesItemCard key={item.id} item={item} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black rounded-3xl p-8 text-white shadow-2xl">
            <p className="text-[10px] font-black uppercase opacity-50 mb-1 tracking-widest">
              Running Total
            </p>
            <h2 className="text-4xl font-black tracking-tighter">
              ₱{cartTotal.toLocaleString()}
            </h2>
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full mt-8 bg-white text-black py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-100 transition-colors"
            >
              Review Cart List
            </button>
          </div>
        </div>
      </div>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-10 border-l-8 border-black">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black uppercase tracking-tight">
                Your Cart
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                  No items added yet
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 relative group hover:border-black transition-all"
                  >
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <p className="font-black text-xs uppercase text-black mb-1 pr-6">
                      {item.title}
                    </p>
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2 bg-white rounded-lg p-1 border">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="p-1 hover:bg-slate-50 rounded"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-black text-xs w-6 text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="p-1 hover:bg-slate-50 rounded"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="font-black text-lg text-black">
                        ₱{item.subtotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-8 border-t-4 border-black mt-8">
              <input
                type="text"
                placeholder="CUSTOMER NAME"
                className="w-full mb-3 p-4 border-2 border-slate-100 rounded-xl font-bold text-black text-xs outline-none focus:border-black uppercase"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
              <select
                className="w-full mb-6 p-4 border-2 border-slate-100 rounded-xl font-bold text-black text-xs outline-none focus:border-black uppercase bg-white cursor-pointer"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="GCash">GCash</option>
                <option value="Card">Card Transfer</option>
              </select>
              <div className="flex justify-between items-end mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Amount
                </span>
                <span className="text-4xl font-black text-black tracking-tighter">
                  ₱{cartTotal.toLocaleString()}
                </span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={() => {
                  setView("invoice");
                  setIsCartOpen(false);
                }}
                className="w-full py-6 bg-black text-white rounded-3xl font-black uppercase text-xs tracking-widest disabled:opacity-20 hover:scale-[1.02] transition-transform shadow-xl"
              >
                Review Invoice <ArrowRight size={18} className="inline ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CARD SUB-COMPONENT ---
const SalesItemCard = ({ item, onAdd }) => {
  const [qty, setQty] = useState(1);
  const outOfStock = (item.quantity || 0) <= 0;

  return (
    <div
      className={`bg-white rounded-3xl p-6 border-2 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden group ${
        outOfStock
          ? "opacity-60 border-slate-100"
          : "border-slate-50 hover:border-black"
      }`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div
            className={`p-3 rounded-2xl ${
              outOfStock
                ? "bg-slate-100 text-slate-400"
                : "bg-slate-50 group-hover:bg-black group-hover:text-white transition-colors"
            }`}
          >
            <Package size={20} />
          </div>
          <span
            className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase italic ${
              outOfStock
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {item.quantity || 0} In Stock
          </span>
        </div>
        <h3 className="font-black uppercase text-xs text-black mb-1 line-clamp-2 leading-tight h-8">
          {item.name}
        </h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest italic">
          {item.sku}
        </p>

        <p className="text-2xl font-black text-black mb-8 italic">
          ₱
          {item.displayPrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </p>

        <div className="space-y-1 mb-6">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Select Qty
          </label>
          <div className="flex border-2 border-slate-50 rounded-xl overflow-hidden h-12">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="px-4 bg-slate-50 hover:bg-slate-100"
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              className="w-full text-center font-black text-sm outline-none bg-white text-black"
            />
            <button
              onClick={() => setQty(qty + 1)}
              className="px-4 bg-slate-50 hover:bg-slate-100"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
      <button
        disabled={outOfStock}
        onClick={() =>
          onAdd({
            id: item.id,
            sku: item.sku,
            title: item.name,
            qty: qty,
            price: item.displayPrice,
            subtotal: qty * item.displayPrice,
          })
        }
        className="w-full bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {outOfStock ? "Sold Out" : "Add to Order"}
      </button>
    </div>
  );
};

export default RecordSales;
