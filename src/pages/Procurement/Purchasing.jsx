import React, { useMemo, useState } from "react";
import { usePurchasing } from "./usePurchasingData";
import { ItemRegistry, SupplierRegistry } from "./RegistryForms";
import CheckoutView from "./CheckoutView";
import {
  ShoppingCart,
  Search,
  Loader2,
  Trash2,
  X,
  Plus,
  Minus,
  Filter,
} from "lucide-react";

const Purchasing = () => {
  const data = usePurchasing();
  const [selectedSupplier, setSelectedSupplier] = useState("All");

  // Filter logic para sa Catalog
  const filteredCatalog = useMemo(() => {
    let list = data.items;
    if (selectedSupplier !== "All") {
      list = list.filter((item) => item.supplier === selectedSupplier);
    }
    return list;
  }, [data.items, selectedSupplier]);

  // Logic para sa grouping na kailangan ng CheckoutView
  const groupedOrders = useMemo(() => {
    return data.cart.reduce((acc, item) => {
      if (!acc[item.supplier]) acc[item.supplier] = [];
      acc[item.supplier].push(item);
      return acc;
    }, {});
  }, [data.cart]);

  if (data.loading)
    return (
      <div className="h-screen flex items-center justify-center font-black">
        LOADING SYSTEM...
      </div>
    );

  return (
    <div className="p-8 bg-white min-h-screen text-black font-sans">
      {/* 1. TOP NAVIGATION & FILTERS (Hidden on Checkout) */}
      {data.view !== "checkout" && (
        <div className="space-y-6 mb-10 no-print">
          <div className="flex justify-between items-center">
            <div className="flex bg-slate-100 p-2 rounded-2xl border-2 border-black">
              {["browse", "addItem", "addSupplier"].map((v) => (
                <button
                  key={v}
                  onClick={() => data.setView(v)}
                  className={`px-6 py-2 rounded-xl font-black uppercase text-[10px] ${
                    data.view === v ? "bg-black text-white" : ""
                  }`}
                >
                  {v === "browse"
                    ? "Catalog"
                    : v === "addItem"
                    ? "New Item"
                    : "New Supplier"}
                </button>
              ))}
            </div>
            <button
              onClick={() => data.setIsCartOpen(true)}
              className="bg-black text-white p-4 rounded-xl relative shadow-[4px_4px_0px_0px_rgba(168,209,205,1)]"
            >
              <ShoppingCart size={24} />
              {data.cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold border-2 border-white">
                  {data.cart.length}
                </span>
              )}
            </button>
          </div>

          {/* SUPPLIER FILTER BAR - Only visible in Browse Mode */}
          {data.view === "browse" && (
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Filter size={18} className="text-slate-400" />
              <span className="text-xs font-black uppercase italic text-slate-500">
                Filter Supplier:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedSupplier("All")}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 border-black whitespace-nowrap ${
                    selectedSupplier === "All"
                      ? "bg-blue-500 text-white"
                      : "bg-white"
                  }`}
                >
                  {" "}
                  All Vendors{" "}
                </button>
                {data.suppliers.map((sup) => (
                  <button
                    key={sup.id}
                    onClick={() => setSelectedSupplier(sup.name)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 border-black whitespace-nowrap ${
                      selectedSupplier === sup.name
                        ? "bg-blue-500 text-white"
                        : "bg-white"
                    }`}
                  >
                    {" "}
                    {sup.name}{" "}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. VIEWS SWITCHER */}
      {data.view === "browse" && (
        <>
          <div className="mb-8 relative no-print">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              className="w-full pl-12 pr-4 py-4 border-2 border-black rounded-2xl font-bold"
              value={data.searchTerm}
              onChange={(e) => data.setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
            {filteredCatalog.map((item) => (
              <ProductCard key={item.id} item={item} onAdd={data.addToCart} />
            ))}
          </div>
        </>
      )}

      {data.view === "addItem" && (
        <ItemRegistry
          suppliers={data.suppliers}
          onRefresh={() => {
            data.fetchData();
            data.setView("browse");
          }}
        />
      )}
      {data.view === "addSupplier" && (
        <SupplierRegistry
          onRefresh={() => {
            data.fetchData();
            data.setView("browse");
          }}
        />
      )}

      {/* RENDER CHECKOUT VIEW */}
      {data.view === "checkout" && (
        <CheckoutView
          groupedOrders={groupedOrders}
          suppliers={data.suppliers}
          setView={data.setView}
          cart={data.cart}
          handleCompleteTransaction={data.handleCompleteTransaction}
          isCompleting={data.isCompleting}
        />
      )}

      {/* 3. CART DRAWER */}
      {data.isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => data.setIsCartOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full border-l-[10px] border-black p-8 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
              <h2 className="text-xl font-black uppercase italic">
                Current Order
              </h2>
              <button onClick={() => data.setIsCartOpen(false)}>
                <X size={30} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {data.cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 p-4 rounded-xl border-2 border-black flex justify-between items-center"
                >
                  <div>
                    <p className="font-black text-xs uppercase">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 italic">
                      ₱{item.price} x {item.quantity}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      data.setCart(data.cart.filter((c) => c.id !== item.id))
                    }
                    className="text-red-500 hover:scale-110 transition-transform"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                data.setView("checkout");
                data.setIsCartOpen(false);
              }}
              disabled={data.cart.length === 0}
              className="mt-8 bg-black text-white py-6 rounded-3xl font-black uppercase text-lg hover:bg-blue-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1"
            >
              Generate Quotations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// PRODUCT CARD
const ProductCard = ({ item, onAdd }) => {
  const [qty, setQty] = useState(1);
  return (
    <div className="bg-white p-6 rounded-[2rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:-translate-y-1 transition-all">
      <div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          {item.sku}
        </span>
        <h3 className="text-md font-black uppercase mt-1 leading-tight h-10 overflow-hidden">
          {item.name}
        </h3>
        <p className="text-[9px] font-bold text-blue-500 mb-4">
          {item.supplier}
        </p>
        <div className="bg-slate-50 p-3 rounded-xl border-2 border-black border-dashed mb-4">
          <p className="text-xl font-black text-emerald-600">
            ₱{Number(item.price).toLocaleString()}{" "}
            <span className="text-[10px] text-slate-400">/ {item.unit}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 mb-4 bg-slate-100 p-2 rounded-xl border border-black">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-8 h-8 bg-white border border-black rounded-lg font-black"
          >
            -
          </button>
          <span className="flex-1 text-center font-black">{qty}</span>
          <button
            onClick={() => setQty(qty + 1)}
            className="w-8 h-8 bg-white border border-black rounded-lg font-black"
          >
            +
          </button>
        </div>
      </div>
      <button
        onClick={() => {
          onAdd(item, qty);
          setQty(1);
        }}
        className="w-full bg-[#a8d1cd] py-4 rounded-xl border-2 border-black font-black text-[10px] uppercase hover:bg-black hover:text-white transition-all"
      >
        Add to Order
      </button>
    </div>
  );
};

export default Purchasing;
