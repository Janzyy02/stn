import React from "react";
import { X, Trash2 } from "lucide-react";

const CartDrawer = ({ isOpen, onClose, cart, setCart, setView }) => {
  if (!isOpen) return null;

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-8 border-l-4 border-black">
        <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
          <h2 className="text-2xl font-black uppercase italic">
            Pending Order
          </h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {cart.length === 0 ? (
            <p className="text-center text-slate-400 font-bold py-10">
              Your cart is empty
            </p>
          ) : (
            cart.map((item) => (
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
            ))
          )}
        </div>

        <button
          disabled={cart.length === 0}
          onClick={() => {
            setView("checkout");
            onClose();
          }}
          className="w-full bg-black text-white py-5 rounded-xl font-black uppercase mt-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:bg-slate-300 disabled:shadow-none"
        >
          Proceed to Quotations
        </button>
      </div>
    </div>
  );
};

export default CartDrawer;
