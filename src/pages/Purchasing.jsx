import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";
import {
  ShoppingCart,
  Loader2,
  PackagePlus,
  UserPlus,
  Mail,
  Truck,
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

  // --- FORM & TRANSACTION STATE ---
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

  // Unique PO number logic
  const poDetails = useMemo(
    () => ({
      number: `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    }),
    [view]
  );

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: invData, error: invError } = await supabase
        .from("hardware_inventory")
        .select(
          `id, name, sku, category, supplier, unit, stock_balance, inbound_qty, product_pricing (supplier_cost)`
        )
        .order("name");

      const { data: supData } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (invError) throw invError;

      const processedItems = (invData || []).map((item) => ({
        ...item,
        price: item.product_pricing?.supplier_cost || 0,
      }));

      setItems(processedItems);
      setSuppliers(supData || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS ---
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
            stock_balance: 0,
            inbound_qty: 0,
          },
        ])
        .select()
        .single();

      if (invError) throw invError;

      const { error: priceError } = await supabase
        .from("product_pricing")
        .insert([
          {
            product_id: invItem.id,
            supplier_cost: parseFloat(newItem.price) || 0,
          },
        ]);

      if (priceError) throw priceError;

      alert("Item and Pricing recorded!");
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
      alert("Supplier added!");
      setNewSupplier({ name: "", contact: "", address: "", email: "" });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingSupplier(false);
    }
  };

  const addToCart = (item, quantity) => {
    if (cart.length > 0 && cart[0].supplier !== item.supplier)
      return alert("One PO per supplier only.");
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists)
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      return [...prev, { ...item, quantity }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      )
    );
  };

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  // --- TRANSACTION HANDLER: INCREMENTS INBOUND_QTY & STOCK_BALANCE ---
  const handleCompleteTransaction = async () => {
    if (cart.length === 0) return;
    setIsCompleting(true);
    try {
      // 1. Record the Purchase Order Header
      const { error: poError } = await supabase.from("purchase_orders").insert([
        {
          po_number: poDetails.number,
          supplier_name: cart[0].supplier,
          total_amount: cartTotal,
          status: "Completed",
        },
      ]);
      if (poError) throw poError;

      // 2. Record items
      const poItems = cart.map((item) => ({
        po_number: poDetails.number,
        item_name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price_per_unit: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(poItems);

      if (itemsError) throw itemsError;

      // 3. Increment stock_balance and Inbound_Qty in hardware_inventory
      const updatePromises = cart.map(async (item) => {
        const { data: currentItem, error: fetchError } = await supabase
          .from("hardware_inventory")
          .select("stock_balance, inbound_qty")
          .eq("id", item.id)
          .single();

        if (fetchError) throw fetchError;

        const currentStock = currentItem.stock_balance || 0;
        const currentInbound = currentItem.inbound_qty || 0;

        const { error: updateError } = await supabase
          .from("hardware_inventory")
          .update({
            stock_balance: currentStock + item.quantity, // Revised to use stock_balance
            inbound_qty: currentInbound + item.quantity,
          })
          .eq("id", item.id);

        if (updateError) throw updateError;
      });

      await Promise.all(updatePromises);

      alert("PO Recorded and Stock Balance Updated Successfully!");
      setCart([]);
      setView("browse");
      fetchData();
    } catch (err) {
      console.error("Transaction Error:", err.message);
      alert("Error finalizing purchase: " + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSupplier =
      filterSupplier === "All Suppliers" || item.supplier === filterSupplier;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSupplier && matchesSearch;
  });

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // --- RENDER VIEWS ---
  if (view === "checkout") {
    const sInfo = suppliers.find((s) => s.name === cart[0]?.supplier);
    return (
      <div className="p-8 bg-[#f3f4f6] min-h-screen font-sans text-black">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setView("browse")}
            className="flex items-center gap-2 mb-6 font-bold text-slate-500 hover:text-black"
          >
            <ChevronLeft size={20} /> Back to Browse
          </button>

          <div className="bg-white p-10 rounded-xl shadow-xl border border-slate-200">
            <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
              <div>
                <h1 className="text-5xl font-black uppercase tracking-tighter">
                  Purchase Order
                </h1>
                <p className="text-slate-500 font-bold mt-1">
                  {poDetails.number}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black uppercase text-xs text-slate-400">
                  Date Issued
                </p>
                <p className="font-bold">{poDetails.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-12">
              <div>
                <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2">
                  Vendor / Supplier
                </h3>
                <p className="text-xl font-black">
                  {sInfo?.name || cart[0]?.supplier}
                </p>
                <p className="text-sm text-slate-600">
                  {sInfo?.address || "No address provided"}
                </p>
                <p className="text-sm text-slate-600">{sInfo?.contact}</p>
              </div>
            </div>

            <table className="w-full mb-12">
              <thead>
                <tr className="border-b-2 border-black text-[10px] uppercase font-black text-slate-400">
                  <th className="py-3 text-left">Description</th>
                  <th className="py-3 text-center">Qty</th>
                  <th className="py-3 text-right">Unit Price</th>
                  <th className="py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4">
                      <p className="font-black uppercase text-sm">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {item.sku}
                      </p>
                    </td>
                    <td className="py-4 text-center font-bold">
                      {item.quantity}
                    </td>
                    <td className="py-4 text-right">
                      ₱{item.price.toLocaleString()}
                    </td>
                    <td className="py-4 text-right font-black">
                      ₱{(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end border-t-4 border-black pt-6">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Total Amount Due
                </p>
                <p className="text-5xl font-black">
                  ₱{cartTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl font-black uppercase shadow-lg"
            >
              <Printer size={20} /> Print PO
            </button>
            <button
              onClick={handleCompleteTransaction}
              disabled={isCompleting}
              className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-xl font-black uppercase shadow-lg disabled:opacity-50"
            >
              {isCompleting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              Confirm & Record
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#e5e7eb] min-h-screen text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-black uppercase">Purchase Order</h1>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative bg-white p-3 rounded-xl border border-slate-200 shadow-sm"
        >
          <ShoppingBag size={28} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 border mb-6 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">
            Search Item
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full p-2 pl-10 border rounded-lg h-11 text-black bg-white"
              placeholder="SKU or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">
            Filter Supplier
          </label>
          <select
            className="w-full p-2 border rounded-lg h-11 text-black bg-white font-bold"
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
          >
            <option>All Suppliers</option>
            {suppliers.map((s, i) => (
              <option key={i} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="text-xl font-black mb-4 uppercase">
            <PackagePlus className="inline mr-2" /> Add New Item
          </h2>
          <form onSubmit={handleAddItem} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <input
                required
                placeholder="Name"
                className="border p-2 rounded-lg h-11 text-sm bg-white"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
              />
              <input
                required
                placeholder="SKU"
                className="border p-2 rounded-lg h-11 text-sm bg-white"
                value={newItem.sku}
                onChange={(e) =>
                  setNewItem({ ...newItem, sku: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <input
                placeholder="Unit"
                className="border p-2 rounded-lg h-11 text-sm bg-white"
                value={newItem.unit}
                onChange={(e) =>
                  setNewItem({ ...newItem, unit: e.target.value })
                }
              />
              <input
                placeholder="Category"
                className="border p-2 rounded-lg h-11 text-sm bg-white"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem({ ...newItem, category: e.target.value })
                }
              />
              <input
                required
                type="number"
                step="0.01"
                placeholder="Cost"
                className="border p-2 rounded-lg h-11 text-sm bg-white font-bold"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
              />
            </div>
            <select
              required
              className="w-full border p-2 rounded-lg h-11 text-sm bg-white font-bold"
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
              className="w-full bg-[#a8d1cd] text-white py-3 rounded-lg font-black uppercase text-xs"
            >
              Save Item & Pricing
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="text-xl font-black mb-4 uppercase">
            <UserPlus className="inline mr-2" /> Register Supplier
          </h2>
          <form onSubmit={handleAddSupplier} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <input
                required
                placeholder="Name"
                className="border p-2 rounded-lg h-11 text-sm bg-white"
                value={newSupplier.name}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, name: e.target.value })
                }
              />
              <input
                placeholder="Contact #"
                className="border p-2 rounded-lg h-11 text-sm bg-white"
                value={newSupplier.contact}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, contact: e.target.value })
                }
              />
            </div>
            <input
              placeholder="Email"
              className="w-full border p-2 rounded-lg h-11 text-sm bg-white"
              value={newSupplier.email}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, email: e.target.value })
              }
            />
            <input
              placeholder="Address"
              className="w-full border p-2 rounded-lg h-11 text-sm bg-white"
              value={newSupplier.address}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, address: e.target.value })
              }
            />
            <button
              type="submit"
              disabled={submittingSupplier}
              className="w-full bg-[#a8d1cd] text-white py-3 rounded-lg font-black uppercase text-xs"
            >
              Add Supplier
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <h2 className="text-2xl font-black mb-6 uppercase flex items-center gap-2">
          <Tag className="text-[#a8d1cd]" /> Available Inventory
        </h2>
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-[#a8d1cd]" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
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
            <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
              <h2 className="text-2xl font-black uppercase italic">
                Current Order
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <p className="font-bold uppercase text-xs">
                    Your cart is empty
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border-2 border-slate-100"
                  >
                    <div className="flex-1 mr-4">
                      <p className="font-black text-sm uppercase">
                        {item.name}
                      </p>
                      <p className="text-xs font-bold text-[#a8d1cd]">
                        ₱{item.price.toLocaleString()} / unit
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                      <button
                        onClick={() => updateCartQty(item.id, -1)}
                        className="p-1"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-black w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.id, 1)}
                        className="p-1"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 ml-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="pt-8 border-t-2 border-black mt-6 space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-slate-400 uppercase italic">
                  Subtotal Amount
                </span>
                <span className="text-3xl font-black">
                  ₱{cartTotal.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => {
                  setView("checkout");
                  setIsCartOpen(false);
                }}
                disabled={cart.length === 0}
                className="w-full bg-black text-white py-5 rounded-xl font-black uppercase tracking-widest disabled:opacity-50"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ItemCard = ({ item, onAdd }) => {
  const [qty, setQty] = useState(1);
  return (
    <div className="bg-white rounded-xl p-5 border-2 border-slate-50 hover:border-[#a8d1cd] shadow-sm transition-all">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-black uppercase text-sm leading-tight max-w-[70%]">
          {item.name}
        </h3>
        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
          #{item.sku}
        </span>
      </div>
      <div className="flex flex-col gap-1 mb-6">
        <p className="text-[10px] font-black text-[#a8d1cd] uppercase flex items-center gap-1">
          <Truck size={12} /> {item.supplier}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-slate-800">
            ₱{item.price.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            / {item.unit || "pcs"}
          </span>
        </div>
        {/* Display Current Stock Balance */}
        <p className="text-[10px] font-bold text-slate-500 mt-1">
          Current Stock: {item.stock_balance || 0}
        </p>
      </div>
      <div className="flex justify-between items-center pt-4 border-t-2 border-slate-50">
        <div className="flex border-2 border-slate-100 rounded-lg h-10 overflow-hidden shadow-sm">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="px-3 hover:bg-slate-50"
          >
            <Minus size={14} />
          </button>
          <input
            readOnly
            value={qty}
            className="w-10 text-center text-xs font-black bg-white"
          />
          <button
            onClick={() => setQty(qty + 1)}
            className="px-3 hover:bg-slate-50"
          >
            <Plus size={14} />
          </button>
        </div>
        <button
          onClick={() => onAdd(item, qty)}
          className="bg-black text-white px-5 py-2.5 rounded-lg text-[10px] font-black uppercase shadow-lg"
        >
          Add to Order
        </button>
      </div>
    </div>
  );
};

export default Purchasing;
