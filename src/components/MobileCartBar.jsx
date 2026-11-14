import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../context/CartContext.jsx";
import { inr } from "../lib/format.js";

export default function MobileCartBar() {
  const { count, subtotal, open, openCart } = useCart();
  return (
    <AnimatePresence>
      {count > 0 && !open && (
        <motion.div 
          initial={{ y: 80, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} 
          className="fixed inset-x-3 bottom-3 z-40 lg:hidden gpu-accelerated"
        >
          <button 
            type="button" 
            onClick={openCart}
            className="btn btn-lime flex w-full !justify-between !px-6 shadow-2xl" 
            aria-label={`View order, ${count} items, ${inr(subtotal)}`}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={18} /> View order · {count} {count === 1 ? "item" : "items"}
            </span>
            <span>{inr(subtotal)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}