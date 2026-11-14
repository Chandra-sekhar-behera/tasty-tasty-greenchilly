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
  
  // Dishes deleted or marked out of stock in the admin panel disappear from the cart automatically
  const lines = useMemo(() => rawLines.filter((l) => menuById[l.id]?.available !== false && menuById[l.id]), [rawLines, mv]);
  const [open, setOpen] = useState(false);

  // Sync state across multiple tabs or browser instances using 'storage' event
  useEffect(() => {
    function handleStorageChange(e) {
      if (e.key === KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setLines(parsed.filter((l) => menuById[l?.id] && Number.isInteger(l.qty) && l.qty > 0).map(({ id, qty }) => ({ id, qty })));
          }
        } catch {
          /* ignore malformed sync data */
        }
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    try { 
      localStorage.setItem(KEY, JSON.stringify(rawLines)); 
    } catch { 
      /* storage unavailable */ 
    }
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

  // Optimized toggle handlers for mobile performance & smooth drawer animation states
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const subtotal = useMemo(() => subtotalOf(lines), [lines]);
  const qtyOf = useCallback((id) => lines.find((l) => l.id === id)?.qty || 0, [lines]);

  const value = useMemo(
    () => ({
      lines,
      count,
      subtotal,
      qtyOf,
      add, 
      setQty, 
      remove, 
      clear,
      open, 
      openCart, 
      closeCart,
    }),
    [lines, count, subtotal, qtyOf, add, setQty, remove, clear, open, openCart, closeCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
};