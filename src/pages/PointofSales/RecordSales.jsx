import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import {
  Search,
  ShoppingCart,
  X,
  Trash2,
  Loader2,
  Package,
  CheckCircle,
  ChevronLeft,
  Printer,
  Plus,
  Minus,
  Info,
  AlertCircle,
  Layers,
} from "lucide-react";

const RecordSales = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("browse");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hardware_inventory")
        .select(
          `
          *, 
          product_pricing (manual_retail_price),
          inventory_batches (*)
        `,
        )
        .order("name", { ascending: true });

      if (error) throw error;

      const formattedData = (data || []).map((item) => {
        // Verification: Link batches via hardware_inventory.id = inventory_batches.product_id
        // Filter by current_stock > 0
        const availableBatches = (item.inventory_batches || [])
          .filter((b) => b.current_stock > 0)
          .sort(
            (a, b) =>
              new Date(a.expiry_date || 0) - new Date(b.expiry_date || 0),
          );

        return {
          ...item,
          displayPrice: parseFloat(
            item.product_pricing?.manual_retail_price || 0,
          ),
          batches: availableBatches,
          // Set initial selected batch
          selectedBatchId:
            availableBatches.length > 0 ? availableBatches[0].id : null,
        };
      });

      setItems(formattedData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchChange = (itemId, batchId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, selectedBatchId: batchId } : item,
      ),
    );
  };

  const addToCart = (item) => {
    const selectedBatch = item.batches.find(
      (b) => b.id === item.selectedBatchId,
    );

    if (!selectedBatch) {
      alert("Please select an available batch.");
      return;
    }

    const cartId = `${item.id}-${selectedBatch.id}`;
    const exists = cart.find((c) => c.cartId === cartId);

    if (exists) {
      if (exists.quantity + 1 > selectedBatch.current_stock) {
        alert("Not enough stock in this specific batch.");
        return;
      }
      setCart(
        cart.map((c) =>
          c.cartId === cartId ? { ...c, quantity: c.quantity + 1 } : c,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          ...item,
          cartId,
          quantity: 1,
          activeBatch: selectedBatch,
        },
      ]);
    }
    setIsCartOpen(true);
  };

  const updateCartQty = (cartId, delta, maxStock) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId === cartId) {
          const newQty = Math.max(1, item.quantity + delta);
          if (newQty > maxStock) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const handleFinalizeOrder = async () => {
    if (cart.length === 0) return;
    setIsCompleting(true);
    try {
      const soNum = `SO-${Math.floor(100000 + Math.random() * 900000)}`;
      const totalAmount = cart.reduce(
        (sum, i) => sum + i.displayPrice * i.quantity,
        0,
      );

      const { data: txData, error: txErr } = await supabase
        .from("sales_transactions")
        .insert([
          {
            so_number: soNum,
            customer_name: customerName,
            total_amount: totalAmount,
            status: "Completed",
          },
        ])
        .select()
        .single();

      if (txErr) throw txErr;

      const itemRows = cart.map((item) => ({
        transaction_id: txData.id,
        product_id: item.id,
        id: item.activeBatch.id,
        item_name: `${item.name} (${item.activeBatch.batch_number})`,
        quantity: item.quantity,
        unit_price: item.displayPrice,
      }));

      const { error: itemsErr } = await supabase
        .from("sales_items")
        .insert(itemRows);
      if (itemsErr) throw itemsErr;

      setLastOrder({
        soNum,
        customerName,
        totalAmount,
        items: [...cart],
        date: new Date().toLocaleDateString(),
      });
      setCart([]);
      setIsCartOpen(false);
      setView("invoice");
      fetchInventory();
    } catch (err) {
      alert("Order failed: " + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [items, searchQuery]);

  if (view === "invoice")
    return <InvoiceView order={lastOrder} onBack={() => setView("browse")} />;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Record Sales
          </h1>
          <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">
            Inventory Terminal
          </p>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="bg-white p-5 rounded-2xl shadow-sm border-2 border-slate-200 hover:border-black transition-all relative"
        >
          <ShoppingCart />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-full border-4 border-slate-50">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white p-2 rounded-2xl border-2 border-slate-200 mb-8 flex gap-4 shadow-sm focus-within:border-black transition-all">
            <div className="p-4">
              <Search className="text-slate-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 outline-none font-bold uppercase text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-black uppercase text-slate-400">
                Syncing Batches...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const isOutOfStock = item.batches.length === 0;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-[2rem] border-2 p-6 transition-all flex flex-col justify-between ${isOutOfStock ? "opacity-60 border-slate-100" : "border-slate-100 hover:shadow-xl hover:border-blue-500"}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`p-3 rounded-xl ${isOutOfStock ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600"}`}
                        >
                          {isOutOfStock ? (
                            <AlertCircle size={20} />
                          ) : (
                            <Package size={20} />
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-300">
                          #{item.sku || "N/A"}
                        </span>
                      </div>
                      <h3 className="font-black uppercase text-sm mb-1 leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        Per {item.unit || "unit"}
                      </p>

                      {/* TAILWIND STYLED DROPDOWN */}
                      {!isOutOfStock && (
                        <div className="mt-4 group">
                          <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mb-1.5 ml-1">
                            <Layers size={10} className="text-blue-500" />{" "}
                            Select Batch
                          </label>
                          <div className="relative">
                            <select
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-[11px] font-bold appearance-none cursor-pointer outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-700 hover:bg-slate-100"
                              value={item.selectedBatchId}
                              onChange={(e) =>
                                handleBatchChange(item.id, e.target.value)
                              }
                            >
                              {item.batches.map((batch) => (
                                <option key={batch.id} value={batch.id}>
                                  {batch.batch_number} — ({batch.current_stock}{" "}
                                  available)
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                              <Plus size={14} className="rotate-45" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <div className="flex items-end justify-between mb-4">
                        <p className="text-2xl font-black italic">
                          ₱{item.displayPrice.toLocaleString()}
                        </p>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-300 uppercase">
                            Status
                          </p>
                          <p
                            className={`text-xs font-black ${isOutOfStock ? "text-red-500" : "text-emerald-500"}`}
                          >
                            {isOutOfStock ? "Sold Out" : "In Stock"}
                          </p>
                        </div>
                      </div>
                      <button
                        disabled={isOutOfStock}
                        onClick={() => addToCart(item)}
                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm active:scale-95 ${isOutOfStock ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-blue-600 shadow-blue-200"}`}
                      >
                        {isOutOfStock ? "No Stock Available" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] p-8 border-2 border-slate-100 shadow-sm sticky top-8">
            <h2 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2 text-slate-800">
              <Info size={18} className="text-blue-500" /> Summary
            </h2>
            <div className="border-t-2 border-slate-50 pt-6">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                Estimated Total
              </p>
              <h2 className="text-4xl font-black italic text-blue-600">
                ₱
                {cart
                  .reduce((s, i) => s + i.displayPrice * i.quantity, 0)
                  .toLocaleString()}
              </h2>
              <button
                disabled={cart.length === 0}
                onClick={() => setIsCartOpen(true)}
                className="w-full mt-8 bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all disabled:opacity-30"
              >
                Checkout ({cart.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full p-10 shadow-2xl flex flex-col border-l-2 border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                My Cart
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {cart.map((item) => (
                <div
                  key={item.cartId}
                  className="bg-white border-2 border-slate-50 p-5 rounded-3xl"
                >
                  <div className="flex justify-between mb-2">
                    <p className="font-black text-sm uppercase leading-tight w-2/3">
                      {item.name}
                    </p>
                    <button
                      onClick={() =>
                        setCart(cart.filter((c) => c.cartId !== item.cartId))
                      }
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-3">
                    Batch: {item.activeBatch.batch_number}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 border-2 border-slate-100 rounded-xl px-2 py-1">
                      <button
                        onClick={() =>
                          updateCartQty(
                            item.cartId,
                            -1,
                            item.activeBatch.current_stock,
                          )
                        }
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-black text-xs w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartQty(
                            item.cartId,
                            1,
                            item.activeBatch.current_stock,
                          )
                        }
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="font-black text-slate-900">
                      ₱{(item.displayPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-10 border-t-2 border-slate-50">
              <div className="flex justify-between items-end mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Grand Total
                </p>
                <p className="text-3xl font-black italic">
                  ₱
                  {cart
                    .reduce((s, i) => s + i.displayPrice * i.quantity, 0)
                    .toLocaleString()}
                </p>
              </div>
              <button
                disabled={cart.length === 0 || isCompleting}
                onClick={handleFinalizeOrder}
                className="w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl disabled:opacity-50 hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
              >
                {isCompleting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CheckCircle size={20} />
                )}{" "}
                Finalize Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InvoiceView = ({ order, onBack }) => (
  <div className="p-8 bg-slate-50 min-h-screen font-sans flex items-center justify-center">
    <div className="max-w-xl w-full">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 font-black uppercase text-[10px] text-slate-400 hover:text-black no-print"
      >
        <ChevronLeft size={16} /> New Transaction
      </button>
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border-2 border-slate-100">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-8 text-black">
          Sales Receipt
        </h1>
        <div className="space-y-4 mb-10">
          <div className="flex justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Customer
            </span>
            <span className="font-bold uppercase text-xs text-black">
              {order.customerName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase">
              SO #
            </span>
            <span className="font-mono font-bold text-blue-600 uppercase text-xs">
              {order.soNum}
            </span>
          </div>
        </div>
        <table className="w-full mb-10">
          <tbody className="divide-y divide-slate-50">
            {order.items.map((i, idx) => (
              <tr key={idx}>
                <td className="py-4">
                  <p className="font-black text-xs uppercase text-slate-800">
                    {i.name}
                  </p>
                  <p className="text-[9px] font-bold text-blue-500 uppercase tracking-tight">
                    Batch: {i.activeBatch.batch_number}
                  </p>
                </td>
                <td className="py-4 text-center font-bold text-slate-600 text-xs">
                  {i.quantity}
                </td>
                <td className="py-4 text-right font-black text-slate-800 text-sm">
                  ₱{(i.displayPrice * i.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pt-8 border-t-2 border-slate-100 flex flex-col items-end">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
            Total Paid
          </p>
          <p className="text-5xl font-black italic text-blue-600">
            ₱{order.totalAmount.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="mt-10 w-full flex items-center justify-center gap-2 py-4 bg-slate-50 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:text-black no-print transition-all"
        >
          <Printer size={16} /> Print Receipt
        </button>
      </div>
    </div>
  </div>
);

export default RecordSales;
