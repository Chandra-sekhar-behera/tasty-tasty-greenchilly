import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { menuById, useMenuVersion } from "../lib/menuStore.js";
import { subtotalOf } from "../lib/whatsapp.js";

const CartContext = createContext(null);
const KEY = "greenchilly-cart-v1";

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((l) => menuById[l?.id] && Number.isInteger(l.qty) && l.qty > 0).map(({ id, qty }) => ({ id, qty }))
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const mv = useMenuVersion();
  const [rawLines, setLines] = useState(load);
  // dishes deleted or marked out of stock in the admin panel disappear from the cart automatically
  const lines = useMemo(() => rawLines.filter((l) => menuById[l.id]?.available !== false && menuById[l.id]), [rawLines, mv]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(rawLines)); } catch { /* storage unavailable */ }
  }, [rawLines]);

  const add = useCallback((id) => {
    if (!menuById[id] || menuById[id].available === false) return;
    setLines((ls) => (ls.some((l) => l.id === id) ? ls.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + 1, 50) } : l)) : [...ls, { id, qty: 1 }]));
  }, []);
  const setQty = useCallback((id, qty) => {
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.id !== id) : ls.map((l) => (l.id === id ? { ...l, qty: Math.min(qty, 50) } : l))));
  }, []);
  const remove = useCallback((id) => setLines((ls) => ls.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: subtotalOf(lines),
      qtyOf: (id) => lines.find((l) => l.id === id)?.qty || 0,
      add, setQty, remove, clear,
      open, openCart: () => setOpen(true), closeCart: () => setOpen(false),
    }),
    [lines, open, add, setQty, remove, clear, mv]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
};