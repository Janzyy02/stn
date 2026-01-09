import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import {
  ShoppingCart,
  Loader2,
  PackagePlus,
  UserPlus,
  Mail,
  Plus,
  Minus,
  X,
  Trash2,
  ShoppingBag,
  Search,
  ChevronLeft,
  Printer,
  Tag,
  CheckCircle,
} from "lucide-react";

const Purchasing = () => {
  // --- DATABASE STATE ---
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NAVIGATION & UI STATE ---
  const [view, setView] = useState("browse");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("All Suppliers");

  // --- FORM STATE ---
  const [submittingItem, setSubmittingItem] = useState(false);
  const [submittingSupplier, setSubmittingSupplier] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    unit: "pcs",
    category: "",
    supplier: "",
    price: "",
  });

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact: "",
    address: "",
    email: "",
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: invData } = await supabase
        .from("hardware_inventory")
        .select(
          `id, name, sku, category, supplier, unit, product_pricing (supplier_cost)`
        )
        .order("name");
      const { data: supData } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      setItems(
        (invData || []).map((item) => ({
          ...item,
          price: item.product_pricing?.supplier_cost || 0,
        }))
      );
      setSuppliers(supData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- CART FUNCTIONALITY ---
  const addToCart = (item, quantity) => {
    setCart((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      if (existingItem) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const groupedOrders = useMemo(() => {
    return cart.reduce((acc, item) => {
      const sup = item.supplier || "Unassigned Vendor";
      if (!acc[sup]) acc[sup] = [];
      acc[sup].push(item);
      return acc;
    }, {});
  }, [cart]);

  // --- PRINT & DISPATCH ---
  const handlePrintQuotation = (supplierIdx) => {
    document.body.classList.add("printing-po");
    const el = document.getElementById(`quote-${supplierIdx}`);
    if (el) {
      el.classList.add("print-this-only");
      window.print();
      el.classList.remove("print-this-only");
      document.body.classList.remove("printing-po");
    }
  };

  const handleGmailSend = (supplierName, items) => {
    const supplierObj = suppliers.find((s) => s.name === supplierName);
    const email = supplierObj?.email || "";
    const subject = encodeURIComponent(
      `Quotation Request: QTN-${Date.now().toString().slice(-6)}`
    );
    const body = encodeURIComponent(
      `Items Requested:\n` +
        items
          .map((i) => `- ${i.name} (${i.sku}): ${i.quantity} ${i.unit}`)
          .join("\n")
    );
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`,
      "_blank"
    );
  };

  // --- FORM HANDLERS ---
  const handleAddItem = async (e) => {
    e.preventDefault();
    setSubmittingItem(true);
    try {
      const { data: invItem, error: invError } = await supabase
        .from("hardware_inventory")
        .insert([
          {
            name: newItem.name,
            sku: newItem.sku,
            unit: newItem.unit,
            category: newItem.category,
            supplier: newItem.supplier,
          },
        ])
        .select()
        .single();
      if (invError) throw invError;
      await supabase.from("product_pricing").insert([
        {
          product_id: invItem.id,
          supplier_cost: parseFloat(newItem.price) || 0,
        },
      ]);
      alert("Item added to inventory!");
      setNewItem({
        name: "",
        sku: "",
        unit: "pcs",
        category: "",
        supplier: "",
        price: "",
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setSubmittingSupplier(true);
    try {
      const { error } = await supabase.from("suppliers").insert([newSupplier]);
      if (error) throw error;
      alert("Supplier registered!");
      setNewSupplier({ name: "", contact: "", address: "", email: "" });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingSupplier(false);
    }
  };

  // FIXED: Recording transactions and updating stock levels
  const handleCompleteTransaction = async () => {
    if (cart.length === 0) return;
    setIsCompleting(true);
    try {
      for (const item of cart) {
        const batchNo = `${item.sku}-${Date.now().toString().slice(-4)}`;

        // 1. Update Aggregate Hardware Inventory (Master Table)
        const { data: current, error: fError } = await supabase
          .from("hardware_inventory")
          .select("inbound_qty, stock_balance")
          .eq("id", item.id)
          .single();
        if (fError) throw fError;

        const { error: uError } = await supabase
          .from("hardware_inventory")
          .update({
            inbound_qty: (current.inbound_qty || 0) + item.quantity,
            stock_balance: (current.stock_balance || 0) + item.quantity,
          })
          .eq("id", item.id);
        if (uError) throw uError;

        // 2. Insert Batch Entry (No separate daily_inbound column needed)
        const { error: bError } = await supabase
          .from("inventory_batches")
          .insert([
            {
              product_id: item.id,
              batch_number: batchNo,
              batch_date: new Date().toISOString(),
              current_stock: item.quantity,
              unit_cost: item.price,
            },
          ]);
        if (bError) throw bError;
      }
      alert("Inbound finalized and batches created.");
      setCart([]);
      setView("browse");
      fetchData();
    } catch (err) {
      alert("Transaction Failed: " + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  if (view === "checkout") {
    return (
      <div className="w-full min-h-screen p-8 bg-white text-slate-900 font-sans">
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .print-this-only, .print-this-only * { visibility: visible !important; }
            .print-this-only { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; border: none !important; }
            .no-print { display: none !important; }
          }
        `}</style>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setView("browse")}
            className="no-print flex items-center gap-2 mb-6 font-bold text-slate-500"
          >
            <ChevronLeft size={20} /> Return to Browse
          </button>

          {Object.entries(groupedOrders).map(([sup, items], idx) => (
            <div
              key={sup}
              id={`quote-${idx}`}
              className="quote-container mb-12 border-2 border-black rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="bg-black text-white p-4 flex justify-between items-center no-print">
                <h2 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                  <Tag size={16} /> {sup}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrintQuotation(idx)}
                    className="flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-slate-200"
                  >
                    <Printer size={14} /> Print PO
                  </button>
                  <button
                    onClick={() => handleGmailSend(sup, items)}
                    className="flex items-center gap-2 bg-[#ea4335] px-3 py-1.5 rounded-lg text-[10px] font-black text-white"
                  >
                    <Mail size={14} /> Gmail
                  </button>
                </div>
              </div>

              <div className="p-8">
                <h1 className="text-3xl font-black uppercase italic tracking-tighter border-b-4 border-black pb-2 mb-4">
                  Purchase Quotation
                </h1>
                <div className="flex justify-between font-bold text-sm mb-6">
                  <span>Vendor: {sup}</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
                <table className="w-full text-left">
                  <thead className="border-b-2 border-slate-100 text-[10px] uppercase font-black text-slate-400">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id} className="border-b border-slate-50">
                        <td className="p-2 text-sm font-bold uppercase">
                          {i.name}
                        </td>
                        <td className="p-2 text-center font-black">
                          {i.quantity}
                        </td>
                        <td className="p-2 text-right font-black">
                          ₱{(i.price * i.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <button
            onClick={handleCompleteTransaction}
            disabled={isCompleting}
            className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase tracking-widest no-print mt-4 shadow-xl flex items-center justify-center gap-3"
          >
            {isCompleting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <CheckCircle />
            )}
            Finalize Arrival & Update Stock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#f3f4f6] min-h-screen text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">
          Procurement
        </h1>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative bg-white p-3 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all"
        >
          <ShoppingBag size={28} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border-2 border-slate-100 shadow-sm">
          <h2 className="text-xl font-black mb-4 uppercase flex items-center gap-2 text-blue-600">
            <PackagePlus size={20} /> Item Registry
          </h2>
          <form onSubmit={handleAddItem} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <input
                required
                placeholder="Name"
                className="border-2 border-slate-100 p-2 rounded-lg text-sm bg-slate-50 outline-none"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
              />
              <input
                required
                placeholder="SKU"
                className="border-2 border-slate-100 p-2 rounded-lg text-sm bg-slate-50 outline-none"
                value={newItem.sku}
                onChange={(e) =>
                  setNewItem({ ...newItem, sku: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <input
                placeholder="Unit"
                className="border-2 border-slate-100 p-2 rounded-lg text-sm bg-slate-50 outline-none"
                value={newItem.unit}
                onChange={(e) =>
                  setNewItem({ ...newItem, unit: e.target.value })
                }
              />
              <input
                placeholder="Category"
                className="border-2 border-slate-100 p-2 rounded-lg text-sm bg-slate-50 outline-none"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
              />
              <input
                required
                type="number"
                placeholder="Cost"
                className="border-2 border-slate-100 p-2 rounded-lg text-sm bg-slate-50 font-bold"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
              />
            </div>
            <select
              required
              className="w-full border-2 border-slate-100 p-2 rounded-lg text-sm bg-slate-50 font-bold"
              value={newItem.supplier}
              onChange={(e) =>
                setNewItem({ ...newItem, supplier: e.target.value })
              }
            >
              <option value="">Select Supplier...</option>
              {suppliers.map((s, i) => (
                <option key={i} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submittingItem}
              className="w-full bg-black text-white py-3 rounded-lg font-black uppercase text-xs"
            >
              {submittingItem ? "Saving..." : "Save Item"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-slate-100 shadow-sm">
          <h2 className="text-xl font-black mb-4 uppercase flex items-center gap-2 text-blue-600">
            <UserPlus size={20} /> Vendor Registry
          </h2>
          <form onSubmit={handleAddSupplier} className="space-y-3">
            <input
              required
              placeholder="Vendor Name"
              className="w-full border-2 border-slate-100 p-2 rounded-lg text-sm bg-slate-50"
              value={newSupplier.name}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, name: e.target.value })
              }
            />
            <input
              placeholder="Email"
              className="w-full border-2 border-slate-100 p-2 rounded-lg text-sm bg-slate-50"
              value={newSupplier.email}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, email: e.target.value })
              }
            />
            <input
              placeholder="Address"
              className="w-full border-2 border-slate-100 p-2 rounded-lg text-sm bg-slate-50"
              value={newSupplier.address}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, address: e.target.value })
              }
            />
            <button
              type="submit"
              disabled={submittingSupplier}
              className="w-full bg-black text-white py-3 rounded-lg font-black uppercase text-xs"
            >
              {submittingSupplier ? "Registering..." : "Register Vendor"}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border-2 border-black shadow-sm">
        <h2 className="text-2xl font-black mb-6 uppercase flex items-center gap-2 italic">
          Product Library
        </h2>
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} onAdd={addToCart} />
            ))}
          </div>
        )}
      </div>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-8 border-l-4 border-black">
            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
              <h2 className="text-2xl font-black uppercase italic">
                Pending Order
              </h2>
              <button onClick={() => setIsCartOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 flex justify-between items-center"
                >
                  <div>
                    <p className="font-black text-sm uppercase leading-tight">
                      {item.name}
                    </p>
                    <p className="text-xs font-bold text-blue-600">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setView("checkout");
                setIsCartOpen(false);
              }}
              className="w-full bg-black text-white py-5 rounded-xl font-black uppercase mt-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Proceed to Quotations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ItemCard = ({ item, onAdd }) => {
  const [qty, setQty] = useState(1);
  return (
    <div className="bg-white rounded-xl p-5 border-2 border-slate-100 hover:border-black shadow-sm group">
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
          className="bg-black text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase hover:bg-slate-800 transition-all"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default Purchasing;
