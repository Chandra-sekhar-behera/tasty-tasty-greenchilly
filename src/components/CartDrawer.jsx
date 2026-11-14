import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShoppingBag, Trash2, ArrowRight, Bike, Percent, CheckCircle2 } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { useDialog } from "../lib/hooks.js";
import { useOrderStatus } from "../lib/orderHours.js";
import { menuById, useMenuVersion } from "../lib/menuStore.js";
import { inr } from "../lib/format.js";
import { paymentConfig, etaLabel } from "../lib/whatsapp.js";
import { business } from "../config/business.js";
import QtyStepper from "./QtyStepper.jsx";
import VegMark from "./VegMark.jsx";

/** Direct Savings Banner Component for Cart */
function CartSavingsBanner() {
  return (
    <div className="mx-6 my-2 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-lime/30 rounded-2xl p-3.5 shadow-md overflow-hidden">
      <div className="flex items-start gap-3 relative z-10">
        <div className="bg-lime text-ink font-black p-2 rounded-xl shadow-sm flex items-center justify-center">
          <Percent className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-ivory">Direct Order Advantage</h4>
            <span className="bg-lime/20 text-lime text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Best Price</span>
          </div>
          <p className="text-[11px] text-ivory/70 leading-relaxed font-medium">
            Skip Swiggy & Zomato commissions! Order directly from us for better prices and hot delivery in Jatni. 🎯
          </p>
        </div>
      </div>
    </div>
  );
}

/** Side cart. "Proceed to checkout" opens the full /checkout page. */
export default function CartDrawer() {
  useMenuVersion();
  const navigate = useNavigate();
  const orderStatus = useOrderStatus();
  const { open, closeCart, lines, subtotal, setQty, remove, clear, count } = useCart();
  const panel = useRef(null);
  useDialog(open, closeCart, panel);
  const belowMin = paymentConfig.minimumOrder > 0 && subtotal < paymentConfig.minimumOrder;

  const checkout = () => { 
    closeCart(); 
    setTimeout(() => {
      navigate("/checkout");
    }, 50); 
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="fixed inset-0 z-[100]" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-ink/75 backdrop-blur-[2px]" onClick={closeCart} aria-hidden="true" />
          <motion.aside 
            ref={panel} 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="cart-title"
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }} 
            transition={{ type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-lime/20 bg-forest shadow-2xl will-change-transform gpu-accelerated"
          >
            
            <header className="flex items-center justify-between border-b border-ivory/10 bg-forest px-6 py-5">
              <div>
                <h2 id="cart-title" className="font-serif text-3xl font-semibold">Your order</h2>
                <p className="mt-0.5 text-xs text-ivory/50">{business.shortName} · {count} {count === 1 ? "item" : "items"}</p>
              </div>
              <button 
                type="button" 
                onClick={closeCart} 
                aria-label="Close order panel" 
                data-autofocus 
                className="grid h-10 w-10 place-items-center rounded-full border border-ivory/25 bg-ivory/5 transition hover:border-lime hover:text-lime"
              >
                <X size={18} />
              </button>
            </header>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full text-lime"><ShoppingBag size={36} /></span>
                <p className="mt-4 font-serif text-3xl font-semibold">Your order is empty</p>
                <p className="mt-2 text-sm text-ivory/60">Pick something from the menu and it will appear here.</p>
                <Link to="/menu" onClick={closeCart} className="btn btn-lime mt-8">Browse the menu <ArrowRight size={16} /></Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-ivory/10 overflow-y-auto px-6 scroll-hide">
                  {lines.map(({ id, qty }) => {
                    const it = menuById[id];
                    if (!it) return null;
                    return (
                      <li key={id} className="py-5">
                        <div className="flex items-start gap-3">
                          <VegMark veg={it.veg} />
                          <div className="min-w-0 flex-1">
                            <p className="font-serif text-xl font-semibold leading-tight">{it.name}</p>
                            <p className="mt-1 text-sm text-ivory/55">{inr(it.price)} each</p>
                          </div>
                          <p className="font-serif text-xl font-semibold text-lime">{inr(it.price * qty)}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between pl-7">
                          <QtyStepper qty={qty} name={it.name} onChange={(q) => setQty(id, q)} />
                          <button 
                            type="button" 
                            onClick={() => remove(id)} 
                            className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-ivory/50 hover:text-[#ff8a7a]" 
                            aria-label={`Remove ${it.name}`}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Cart Savings Banner Placed Right Before Footer */}
                <CartSavingsBanner />

                <footer className="border-t border-ivory/10 bg-ink/40 px-6 py-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm uppercase tracking-widest text-ivory/60">Subtotal ({count})</span>
                    <span className="font-serif text-3xl font-semibold text-lime">{inr(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ivory/45">Delivery charge, if any, is confirmed by the restaurant.</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-lime"><Bike size={14} /> Delivery in {etaLabel}</p>
                  {belowMin && <p role="alert" className="mt-2 text-sm text-[#ff8a7a]">Minimum order is {inr(paymentConfig.minimumOrder)}. Add {inr(paymentConfig.minimumOrder - subtotal)} more to continue.</p>}
                  {!orderStatus.open && <p role="alert" className="mt-2 text-sm text-[#ff8a7a]">{orderStatus.long}</p>}
                  <button type="button" onClick={checkout} disabled={belowMin || !orderStatus.open} className="btn btn-lime mt-4 w-full disabled:opacity-50">Proceed to checkout <ArrowRight size={16} /></button>
                  <button type="button" onClick={clear} className="mt-3 w-full text-center text-xs uppercase tracking-widest text-ivory/45 hover:text-ivory">Clear order</button>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}