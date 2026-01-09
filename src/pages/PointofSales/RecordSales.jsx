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
        .select(`*, product_pricing (manual_retail_price)`)
        .order("name", { ascending: true });

      if (error) throw error;
      setItems(
        (data || []).map((item) => ({
          ...item,
          displayPrice: parseFloat(
            item.product_pricing?.manual_retail_price || 0
          ),
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    if (item.stock_balance <= 0) return;
    const exists = cart.find((c) => c.id === item.id);
    if (exists) {
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const updateCartQty = (id, delta, currentStock) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          if (newQty > currentStock) {
            alert(
              `Stock Limit Reached: Only ${currentStock} ${item.unit} available.`
            );
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleFinalizeOrder = async () => {
    if (cart.length === 0) return;
    setIsCompleting(true);
    try {
      const soNum = `SO-${Math.floor(100000 + Math.random() * 900000)}`;
      const totalAmount = cart.reduce(
        (sum, i) => sum + i.displayPrice * i.quantity,
        0
      );

      // 1. Insert into sales_transactions (The Parent)
      // We do NOT send an 'id' so the DB uses the default gen_random_uuid()
      const { data: txData, error: txErr } = await supabase
        .from("sales_transactions")
        .insert([
          {
            so_number: soNum,
            customer_name: customerName,
            total_amount: totalAmount,
            status: "Pending",
          },
        ])
        .select() // This returns the newly created row including the generated ID
        .single();

      if (txErr) throw txErr;

      // 2. Insert into sales_items (The Children)
      const itemRows = cart.map((item) => ({
        transaction_id: txData.id, // Links to the UUID from step 1
        product_id: item.id,
        item_name: item.name,
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
        i.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  if (view === "invoice")
    return <InvoiceView order={lastOrder} onBack={() => setView("browse")} />;

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
            Record Sales
          </h1>
          <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">
            Inventory Terminal
          </p>
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="bg-white p-5 rounded-2xl shadow-sm border-2 border-slate-200 hover:border-black transition-all relative group"
        >
          <ShoppingCart className="group-hover:scale-110 transition-transform" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-full border-4 border-slate-50">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white p-2 rounded-2xl border-2 border-slate-200 mb-8 flex gap-4 focus-within:border-black transition-all shadow-sm">
            <div className="p-4">
              <Search className="text-slate-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="Search products or SKU..."
              className="flex-1 outline-none font-bold uppercase text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Updating Inventory List...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const isOutOfStock = item.stock_balance <= 0;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-[2rem] border-2 p-6 transition-all flex flex-col justify-between ${
                      isOutOfStock
                        ? "opacity-60 border-slate-100 grayscale-[0.5]"
                        : "border-slate-100 hover:shadow-xl hover:border-blue-500"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`p-3 rounded-xl ${
                            isOutOfStock
                              ? "bg-slate-100 text-slate-400"
                              : "bg-blue-50 text-blue-600"
                          }`}
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
                      <h3
                        className={`font-black uppercase text-sm mb-1 leading-tight ${
                          isOutOfStock ? "text-slate-400" : ""
                        }`}
                      >
                        {item.name}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        Per {item.unit || "pc"}
                      </p>
                    </div>
                    <div className="mt-8">
                      <div className="flex items-end justify-between mb-6">
                        <p
                          className={`text-2xl font-black italic ${
                            isOutOfStock ? "text-slate-300" : ""
                          }`}
                        >
                          ₱{item.displayPrice.toLocaleString()}
                        </p>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-300 uppercase">
                            Status
                          </p>
                          <p
                            className={`text-xs font-black ${
                              isOutOfStock ? "text-red-500" : "text-slate-900"
                            }`}
                          >
                            {isOutOfStock
                              ? "Sold Out"
                              : `${item.stock_balance} ${item.unit}`}
                          </p>
                        </div>
                      </div>
                      <button
                        disabled={isOutOfStock}
                        onClick={() => addToCart(item)}
                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95 ${
                          isOutOfStock
                            ? "bg-slate-100 text-slate-400"
                            : "bg-slate-900 text-white hover:bg-blue-600"
                        }`}
                      >
                        {isOutOfStock ? "Unavailable" : "Add To Cart"}
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
            <h2 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2">
              <Info size={18} className="text-blue-500" /> Order
            </h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-400 font-bold text-xs uppercase">
                <span>Items Selected</span>
                <span>{cart.length}</span>
              </div>
            </div>
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
                className="w-full mt-8 bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-[6px_6px_0px_0px_rgba(37,99,235,1)] disabled:opacity-30"
              >
                Review Order
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
            <div className="mb-8">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Customer Details
              </label>
              <input
                type="text"
                className="w-full border-2 border-slate-100 p-4 rounded-2xl font-bold focus:border-black outline-none"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border-2 border-slate-50 p-5 rounded-3xl group hover:border-slate-200 transition-all"
                >
                  <div className="flex justify-between mb-4">
                    <p className="font-black text-sm uppercase leading-tight w-2/3">
                      {item.name}
                    </p>
                    <button
                      onClick={() =>
                        setCart(cart.filter((c) => c.id !== item.id))
                      }
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 border-2 border-slate-100 rounded-xl px-2 py-1">
                      <button
                        onClick={() =>
                          updateCartQty(item.id, -1, item.stock_balance)
                        }
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-black text-xs w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartQty(item.id, 1, item.stock_balance)
                        }
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="font-black text-blue-600">
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
                Finalize Sales Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// InvoiceView component remains the same as in your original file
const InvoiceView = ({ order, onBack }) => (
  <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 font-black uppercase text-[10px] text-slate-400 hover:text-black no-print"
      >
        <ChevronLeft size={16} /> Back to Terminal
      </button>
      <div className="bg-white border-2 border-slate-100 p-12 rounded-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-[10rem] font-black text-slate-50/50 -rotate-12 select-none pointer-events-none z-0">
          PAID
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-16">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                  <CheckCircle size={20} />
                </div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                  Sales Invoice
                </h1>
              </div>
              <p className="font-mono text-blue-600 font-bold tracking-widest text-sm">
                {order.soNum}
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-slate-900 text-white p-4 rounded-2xl no-print hover:bg-blue-600 transition-all active:scale-95"
            >
              <Printer size={20} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-10 mb-16">
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-white shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Bill To
              </p>
              <p className="text-xl font-black uppercase text-slate-800">
                {order.customerName}
              </p>
            </div>
            <div className="p-6 text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Date Issued
              </p>
              <p className="text-lg font-black text-slate-800">{order.date}</p>
            </div>
          </div>
          <table className="w-full mb-16">
            <thead className="border-b-2 border-slate-100 text-[10px] font-black uppercase text-slate-400 text-left">
              <tr>
                <th className="pb-4">Description</th>
                <th className="pb-4 text-center">Qty</th>
                <th className="pb-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {order.items.map((i, idx) => (
                <tr key={idx}>
                  <td className="py-6">
                    <p className="font-black text-sm uppercase text-slate-800">
                      {i.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      ₱{i.displayPrice.toLocaleString()} / {i.unit}
                    </p>
                  </td>
                  <td className="py-6 text-center font-bold text-slate-600">
                    {i.quantity}
                  </td>
                  <td className="py-6 text-right font-black text-slate-800 text-sm">
                    ₱{(i.displayPrice * i.quantity).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col items-end pt-8 border-t-2 border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Total Amount
            </p>
            <p className="text-6xl font-black italic text-blue-600 leading-none">
              ₱{order.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
    <style
      dangerouslySetInnerHTML={{
        __html: `@media print { .no-print { display: none !important; } .bg-slate-50 { background: white !important; } .shadow-xl { box-shadow: none !important; } }`,
      }}
    />
  </div>
);

export default RecordSales;
