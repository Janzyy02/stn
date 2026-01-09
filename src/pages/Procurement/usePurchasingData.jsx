import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient";

export const usePurchasing = () => {
  const [view, setView] = useState("browse");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: inv } = await supabase
        .from("hardware_inventory")
        .select("*");
      const { data: pri } = await supabase.from("product_pricing").select("*");
      const { data: sup } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      const merged = (inv || []).map((item) => ({
        ...item,
        price: pri?.find((p) => p.product_id === item.id)?.supplier_cost || 0,
      }));

      setItems(merged);
      setSuppliers(sup || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addToCart = (product, quantity) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setIsCartOpen(true);
  };

  const handleCompleteTransaction = async () => {
    if (cart.length === 0) return;
    setIsCompleting(true);
    try {
      const now = new Date().toISOString();
      const grouped = cart.reduce((acc, item) => {
        if (!acc[item.supplier]) acc[item.supplier] = [];
        acc[item.supplier].push(item);
        return acc;
      }, {});

      for (const [supplierName, products] of Object.entries(grouped)) {
        const poNum = `PO-${Math.floor(100000 + Math.random() * 900000)}`;
        const total = products.reduce((s, p) => s + p.price * p.quantity, 0);

        const { error: poErr } = await supabase
          .from("purchase_orders")
          .insert([
            {
              po_number: poNum,
              supplier_name: supplierName,
              total_amount: total,
              status: "Pending",
            },
          ]);
        if (poErr) throw poErr;

        const sched = products.map((p) => ({
          order_number: poNum,
          product_id: p.id,
          item_name: p.name,
          quantity: p.quantity,
          unit_cost: p.price,
          supplier: p.supplier,
          date_ordered: now,
          status: "Pending",
        }));
        await supabase.from("order_scheduling").insert(sched);
      }
      alert("Success! Orders Finalized.");
      setCart([]);
      setView("browse");
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(
      (i) =>
        i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  return {
    view,
    setView,
    loading,
    items: filteredItems,
    suppliers,
    cart,
    setCart,
    isCartOpen,
    setIsCartOpen,
    searchTerm,
    setSearchTerm,
    fetchData,
    isCompleting,
    addToCart,
    handleCompleteTransaction,
  };
};
