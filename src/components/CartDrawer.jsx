// import { useEffect, useMemo, useRef, useState } from "react";
// import { Link } from "react-router-dom";
// import { AnimatePresence, motion } from "framer-motion";
// import { X, Check, ShoppingBag, Trash2, ArrowLeft, ArrowRight, LocateFixed, Store, Bike, Info } from "lucide-react";
// import WhatsAppIcon from "./WhatsAppIcon.jsx";
// import { useCart } from "../context/CartContext.jsx";
// import { useDialog } from "../lib/hooks.js";
// import { useOrderStatus } from "../lib/orderHours.js";
// import { menuById, useMenuVersion } from "../lib/menuStore.js";
// import { inr } from "../lib/format.js";
// import { business } from "../config/business.js";
// import {
//   buildOrderMessage, buildWhatsAppUrl, validateOrder, normalizePhone,
//   paymentConfig, needsPayment, payableAmount, makeOrderId, isValidUtr, cooldownLeft, markOrderSent,
// } from "../lib/whatsapp.js";
// import PaymentStep from "./PaymentStep.jsx";
// import QtyStepper from "./QtyStepper.jsx";
// import VegMark from "./VegMark.jsx";

// const canPickup = business.ordering.pickup;
// const canDeliver = business.ordering.delivery;
// const field = "w-full rounded-xl border border-ivory/15 bg-ivory/[0.06] px-4 py-3 text-[0.95rem] text-ivory placeholder:text-ivory/35 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30";

// function ConfirmSend({ count, subtotal, mode, onNo, onYes }) {
//   const noRef = useRef(null);
//   const yesRef = useRef(null);
//   useEffect(() => { noRef.current?.focus(); }, []);
//   const onKeyDown = (e) => {
//     if (e.key !== "Tab") return;
//     e.preventDefault();
//     e.stopPropagation();
//     (document.activeElement === noRef.current ? yesRef : noRef).current?.focus();
//   };
//   return (
//     <motion.div
//       className="absolute inset-0 z-20 grid place-items-center bg-ink/80 p-5 backdrop-blur-sm"
//       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
//       onClick={onNo}
//     >
//       <motion.div
//         role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc"
//         initial={{ opacity: 0, y: 28, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
//         transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
//         onClick={(e) => e.stopPropagation()}
//         onKeyDown={onKeyDown}
//         className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-lime/30 bg-gradient-to-br from-heritage via-forest to-ink p-7 text-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.95)]"
//       >
//         <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-lime/15 blur-3xl" aria-hidden="true" />
//         <motion.span
//           initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
//           transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
//           className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime/15 text-lime ring-1 ring-lime/40"
//         >
//           <WhatsAppIcon size={28} />
//         </motion.span>
//         <h3 id="confirm-title" className="relative mt-5 font-serif text-3xl font-semibold leading-tight">Send this order?</h3>
//         <p id="confirm-desc" className="relative mt-2 text-sm leading-relaxed text-ivory/70">
//           Are you sure you want to send your order to {business.shortName} on WhatsApp?
//         </p>

//         <div className="relative mt-5 flex items-center justify-between rounded-2xl border border-ivory/10 bg-ink/50 px-4 py-3 text-left">
//           <span className="text-xs uppercase tracking-widest text-ivory/55">{count} {count === 1 ? "item" : "items"} · {mode}</span>
//           <span className="font-serif text-2xl font-semibold text-lime">{inr(subtotal)}</span>
//         </div>

//         <div className="relative mt-6 grid grid-cols-2 gap-3">
//           <button ref={noRef} type="button" onClick={onNo} className="btn btn-ghost justify-center"><X size={16} /> No</button>
//           <button ref={yesRef} type="button" onClick={onYes} className="btn btn-lime justify-center"><Check size={16} /> Yes, send</button>
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// }

// export default function CartDrawer() {
//   useMenuVersion();
//   const orderStatus = useOrderStatus();
//   const { open, closeCart, lines, subtotal, setQty, remove, clear, count } = useCart();
//   const panel = useRef(null);
//   const [confirm, setConfirm] = useState(false);
//   useDialog(open, () => (confirm ? setConfirm(false) : closeCart()), panel);
//   useEffect(() => { if (!open) setConfirm(false); }, [open]);

//   const [step, setStep] = useState("cart");
//   const [form, setForm] = useState({ name: "", phone: "", mode: canPickup ? "pickup" : "delivery", address: "", note: "" });
//   const [location, setLocation] = useState(null);
//   const [locState, setLocState] = useState({ busy: false, error: "" });
//   const [errors, setErrors] = useState({});
//   const [sent, setSent] = useState(false);
//   const [plan, setPlan] = useState("half");
//   const [utr, setUtr] = useState("");
//   const [utrErr, setUtrErr] = useState("");
//   const [sendErr, setSendErr] = useState("");
//   const [orderId, setOrderId] = useState(makeOrderId);
//   const mustPay = needsPayment(form.mode);
//   const payment = mustPay ? { plan, amount: payableAmount(subtotal, plan), utr: utr.replace(/\s/g, "") } : null;
//   const belowMin = paymentConfig.minimumOrder > 0 && subtotal < paymentConfig.minimumOrder;

//   const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
//   const customer = { ...form, location: form.mode === "delivery" ? location : null };
//   const message = useMemo(() => (lines.length ? buildOrderMessage({ lines, customer, orderId, payment }) : ""), [lines, form, location, plan, utr, orderId]);
//   const waUrl = message ? buildWhatsAppUrl(message) : "#";

//   function shareLocation() {
//     if (!("geolocation" in navigator)) return setLocState({ busy: false, error: "Location is not supported." });
//     setLocState({ busy: true, error: "" });
//     navigator.geolocation.getCurrentPosition(
//       (p) => { setLocation({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }); setLocState({ busy: false, error: "" }); },
//       () => setLocState({ busy: false, error: "Location permission denied." }),
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }

//   function goReview(e) {
//     e.preventDefault();
//     const errs = validateOrder(form);
//     setErrors(errs);
//     if (Object.keys(errs).length === 0) { setSent(false); setStep(mustPay ? "pay" : "review"); }
//   }

//   function goPay(e) {
//     e.preventDefault();
//     if (!isValidUtr(utr)) return setUtrErr("Enter the 12-digit UTR number.");
//     setUtrErr(""); setSent(false); setStep("review");
//   }

//   function confirmSend() {
//     setConfirm(false);
//     if (!orderStatus.open) return setSendErr(orderStatus.long);
//     const wait = cooldownLeft(orderId);
//     if (wait > 0) return setSendErr(`Please wait ${wait} minute before sending another.`);
//     setSendErr("");
//     markOrderSent(orderId);
//     setSent(true);
//     window.open(waUrl, "_blank", "noopener,noreferrer");
//   }

//   function finishOrder() {
//     clear(); setStep("cart"); setSent(false); setUtr(""); setPlan("half"); setSendErr(""); setOrderId(makeOrderId()); closeCart();
//   }

//   const title = step === "cart" ? "Your order" : step === "details" ? "Your details" : step === "pay" ? "Payment" : "Review & send";

//   return (
//     <AnimatePresence>
//       {open && (
//         <motion.div className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
//           <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={closeCart} aria-hidden="true" />
          
//           <motion.aside ref={panel} role="dialog" aria-modal="true" aria-labelledby="cart-title"
//             initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
//             className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-lime/20 bg-forest shadow-2xl">
            
//             <header className="flex items-center justify-between border-b border-ivory/10 px-6 py-5 bg-forest">
//               <div className="flex items-center gap-3">
//                 {step !== "cart" && (
//                   <button type="button" onClick={() => setStep(step === "review" ? (mustPay ? "pay" : "details") : step === "pay" ? "details" : "cart")} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full border border-ivory/25 bg-ivory/5 transition hover:border-lime hover:text-lime"><ArrowLeft size={16} /></button>
//                 )}
//                 <h2 id="cart-title" className="font-serif text-3xl font-semibold">{title}</h2>
//               </div>
//               <button type="button" onClick={closeCart} aria-label="Close order panel" data-autofocus className="grid h-10 w-10 place-items-center rounded-full border border-ivory/25 bg-ivory/5 transition hover:border-lime hover:text-lime"><X size={18} /></button>
//             </header>

//             {lines.length === 0 ? (
//               <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
//                 <span className="grid h-16 w-16 place-items-center rounded-full text-lime animate-pulse">
//                   <ShoppingBag size={36} />
//                 </span>
//                 <p className="mt-4 font-serif text-3xl font-semibold">Your order is empty</p>
//                 <p className="mt-2 text-sm text-ivory/60">Pick something from the menu and it will appear here.</p>
//                 <Link to="/menu" onClick={closeCart} className="btn btn-lime mt-8">Browse the menu <ArrowRight size={16} /></Link>
//               </div>
//             ) : step === "cart" ? (
//               <>
//                 <ul className="flex-1 divide-y divide-ivory/10 overflow-y-auto px-6">
//                   {lines.map(({ id, qty }) => {
//                     const it = menuById[id];
//                     return (
//                       <li key={id} className="py-5">
//                         <div className="flex items-start gap-3">
//                           <VegMark veg={it.veg} />
//                           <div className="min-w-0 flex-1">
//                             <p className="font-serif text-xl font-semibold leading-tight">{it.name}</p>
//                             <p className="mt-1 text-sm text-ivory/55">{inr(it.price)} each</p>
//                           </div>
//                           <p className="font-serif text-xl font-semibold text-lime">{inr(it.price * qty)}</p>
//                         </div>
//                         <div className="mt-3 flex items-center justify-between pl-7">
//                           <QtyStepper qty={qty} name={it.name} onChange={(q) => setQty(id, q)} />
//                           <button type="button" onClick={() => remove(id)} className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-ivory/50 hover:text-[#ff8a7a]" aria-label={`Remove ${it.name}`}><Trash2 size={14} /> Remove</button>
//                         </div>
//                       </li>
//                     );
//                   })}
//                 </ul>
//                 <footer className="border-t border-ivory/10 bg-ink/40 px-6 py-5">
//                   <div className="flex items-baseline justify-between"><span className="text-sm uppercase tracking-widest text-ivory/60">Subtotal ({count})</span><span className="font-serif text-3xl font-semibold text-lime">{inr(subtotal)}</span></div>
//                   <p className="mt-1 text-xs text-ivory/45">Delivery charge, if any, is confirmed by the restaurant.</p>
//                   {belowMin && <p role="alert" className="mt-2 text-sm text-[#ff8a7a]">Minimum order is {inr(paymentConfig.minimumOrder)}. Add {inr(paymentConfig.minimumOrder - subtotal)} more to continue.</p>}
//                   {!orderStatus.open && <p role="alert" className="mt-2 text-sm text-[#ff8a7a]">{orderStatus.long}</p>}
//                   <button type="button" onClick={() => setStep("details")} disabled={belowMin || !orderStatus.open} className="btn btn-lime mt-4 w-full disabled:opacity-50">Continue <ArrowRight size={16} /></button>
//                   <button type="button" onClick={clear} className="mt-3 w-full text-center text-xs uppercase tracking-widest text-ivory/45 hover:text-ivory">Clear order</button>
//                 </footer>
//               </>
//             ) : step === "details" ? (
//               <form onSubmit={goReview} noValidate className="flex min-h-0 flex-1 flex-col">
//                 <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
//                   {canPickup && canDeliver && (
//                     <fieldset>
//                       <legend className="eyebrow mb-3 text-ivory/60">Order type</legend>
//                       <div className="grid grid-cols-2 gap-3">
//                         {[["pickup", "Pickup / Dine-in", Store], ["delivery", "Delivery", Bike]].map(([v, l, Icon]) => (
//                           <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${form.mode === v ? "border-lime bg-lime/10 text-lime" : "border-ivory/15 text-ivory/75 hover:border-ivory/40"}`}>
//                             <input type="radio" name="mode" value={v} checked={form.mode === v} onChange={set("mode")} className="sr-only" />
//                             <Icon size={16} /> {l}
//                           </label>
//                         ))}
//                       </div>
//                     </fieldset>
//                   )}
//                   <div>
//                     <label htmlFor="c-name" className="eyebrow mb-2 block text-ivory/60">Your name</label>
//                     <input id="c-name" className={field} value={form.name} onChange={set("name")} placeholder="e.g. Asha Rani" />
//                     {errors.name && <p className="mt-1.5 text-sm text-[#ff8a7a]">{errors.name}</p>}
//                   </div>
//                   <div>
//                     <label htmlFor="c-phone" className="eyebrow mb-2 block text-ivory/60">Mobile number</label>
//                     <input id="c-phone" className={field} value={form.phone} onChange={set("phone")} inputMode="tel" placeholder="10-digit mobile number" />
//                     {errors.phone && <p className="mt-1.5 text-sm text-[#ff8a7a]">{errors.phone}</p>}
//                   </div>
//                   {form.mode === "delivery" && (
//                     <div className="space-y-3">
//                       <div>
//                         <label htmlFor="c-addr" className="eyebrow mb-2 block text-ivory/60">Delivery address</label>
//                         <textarea id="c-addr" rows={3} className={field} value={form.address} onChange={set("address")} placeholder="House / plot no., street, landmark" />
//                         {errors.address && <p className="mt-1.5 text-sm text-[#ff8a7a]">{errors.address}</p>}
//                       </div>
//                       <div className="rounded-xl border border-ivory/10 p-4">
//                         <button type="button" onClick={shareLocation} disabled={locState.busy} className="btn btn-ghost btn-sm"><LocateFixed size={15} /> {locState.busy ? "Locating…" : location ? "Update my location" : "Share my location (optional)"}</button>
//                         {location && <p className="mt-2 text-sm text-lime">Location attached. <button type="button" onClick={() => setLocation(null)} className="underline">Remove</button></p>}
//                         {locState.error && <p className="mt-2 text-sm text-[#ff8a7a]" role="alert">{locState.error}</p>}
//                       </div>
//                     </div>
//                   )}
//                   <div>
//                     <label htmlFor="c-note" className="eyebrow mb-2 block text-ivory/60">Note (optional)</label>
//                     <input id="c-note" className={field} value={form.note} onChange={set("note")} maxLength={160} placeholder="Spice level, allergies, etc." />
//                   </div>
//                 </div>
//                 <footer className="border-t border-ivory/10 bg-ink/40 px-6 py-5">
//                   <button type="submit" className="btn btn-lime w-full">{mustPay ? "Continue to payment" : "Review order"} <ArrowRight size={16} /></button>
//                 </footer>
//               </form>
//             ) : step === "pay" ? (
//               <form onSubmit={goPay} noValidate className="flex min-h-0 flex-1 flex-col">
//                 <div className="flex-1 overflow-y-auto px-6 py-6">
//                   <PaymentStep subtotal={subtotal} plan={plan} setPlan={setPlan} utr={utr} setUtr={setUtr} orderId={orderId} error={utrErr} />
//                 </div>
//                 <footer className="border-t border-ivory/10 bg-ink/40 px-6 py-5">
//                   <button type="submit" className="btn btn-lime w-full">I have paid · Review order <ArrowRight size={16} /></button>
//                 </footer>
//               </form>
//             ) : (
//               <>
//                 <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
//                   <section aria-label="Items" className="rounded-2xl border border-ivory/10 p-5">
//                     <ul className="space-y-2.5 text-sm">
//                       {lines.map(({ id, qty }) => (
//                         <li key={id} className="flex justify-between gap-4"><span>{qty} × {menuById[id].name}</span><span className="tabular-nums text-ivory/80">{inr(menuById[id].price * qty)}</span></li>
//                       ))}
//                     </ul>
//                     <div className="mt-4 flex justify-between border-t border-ivory/10 pt-4 font-serif text-2xl font-semibold"><span>Subtotal</span><span className="text-lime">{inr(subtotal)}</span></div>
//                   </section>
//                   <section aria-label="Your details" className="rounded-2xl border border-ivory/10 p-5 text-sm leading-relaxed text-ivory/80">
//                     <p><span className="text-ivory/50">Name:</span> {form.name.trim()}</p>
//                     <p><span className="text-ivory/50">Phone:</span> +91 {normalizePhone(form.phone)}</p>
//                     <p><span className="text-ivory/50">Type:</span> {form.mode === "delivery" ? "Delivery" : "Pickup / Dine-in"}</p>
//                     {form.mode === "delivery" && <p><span className="text-ivory/50">Address:</span> {form.address.trim()}</p>}
//                   </section>
//                   {payment && (
//                     <section aria-label="Payment" className="rounded-2xl border border-lime/25 p-5 text-sm leading-relaxed text-ivory/80">
//                       <p><span className="text-ivory/50">Paid now:</span> <span className="font-semibold text-lime">{inr(payment.amount)}</span></p>
//                       <p><span className="text-ivory/50">UTR:</span> {payment.utr}</p>
//                     </section>
//                   )}
//                   {sendErr && <p role="alert" className="rounded-xl border border-[#ff8a7a]/40 p-4 text-sm text-[#ff8a7a]">{sendErr}</p>}
//                 </div>
//                 <footer className="border-t border-ivory/10 bg-ink/40 px-6 py-5">
//                   {!orderStatus.open && <p role="alert" className="mb-3 text-sm text-[#ff8a7a]">{orderStatus.long}</p>}
//                   <button type="button" onClick={() => setConfirm(true)} disabled={!orderStatus.open} className="btn btn-lime w-full"><WhatsAppIcon size={17} /> Send on WhatsApp</button>
//                 </footer>
//               </>
//             )}
//             <AnimatePresence>
//               {confirm && (
//                 <ConfirmSend count={count} subtotal={subtotal} mode={form.mode === "delivery" ? "Delivery" : "Pickup / Dine-in"} onNo={() => setConfirm(false)} onYes={confirmSend} />
//               )}
//             </AnimatePresence>
//           </motion.aside>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }


import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShoppingBag, Trash2, ArrowRight, Bike } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { useDialog } from "../lib/hooks.js";
import { useOrderStatus } from "../lib/orderHours.js";
import { menuById, useMenuVersion } from "../lib/menuStore.js";
import { inr } from "../lib/format.js";
import { paymentConfig, etaLabel } from "../lib/whatsapp.js";
import { business } from "../config/business.js";
import QtyStepper from "./QtyStepper.jsx";
import VegMark from "./VegMark.jsx";

/** Side cart. "Proceed to checkout" opens the full /checkout page (address, payment, order tracking). */
export default function CartDrawer() {
  useMenuVersion();
  const navigate = useNavigate();
  const orderStatus = useOrderStatus();
  const { open, closeCart, lines, subtotal, setQty, remove, clear, count } = useCart();
  const panel = useRef(null);
  useDialog(open, closeCart, panel);
  const belowMin = paymentConfig.minimumOrder > 0 && subtotal < paymentConfig.minimumOrder;

  const checkout = () => { closeCart(); navigate("/checkout"); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={closeCart} aria-hidden="true" />
          <motion.aside ref={panel} role="dialog" aria-modal="true" aria-labelledby="cart-title"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-lime/20 bg-forest shadow-2xl">
            <header className="flex items-center justify-between border-b border-ivory/10 bg-forest px-6 py-5">
              <div>
                <h2 id="cart-title" className="font-serif text-3xl font-semibold">Your order</h2>
                <p className="mt-0.5 text-xs text-ivory/50">{business.shortName} · {count} {count === 1 ? "item" : "items"}</p>
              </div>
              <button type="button" onClick={closeCart} aria-label="Close order panel" data-autofocus className="grid h-10 w-10 place-items-center rounded-full border border-ivory/25 bg-ivory/5 transition hover:border-lime hover:text-lime"><X size={18} /></button>
            </header>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full text-lime animate-pulse"><ShoppingBag size={36} /></span>
                <p className="mt-4 font-serif text-3xl font-semibold">Your order is empty</p>
                <p className="mt-2 text-sm text-ivory/60">Pick something from the menu and it will appear here.</p>
                <Link to="/menu" onClick={closeCart} className="btn btn-lime mt-8">Browse the menu <ArrowRight size={16} /></Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-ivory/10 overflow-y-auto px-6">
                  {lines.map(({ id, qty }) => {
                    const it = menuById[id];
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
                          <button type="button" onClick={() => remove(id)} className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-ivory/50 hover:text-[#ff8a7a]" aria-label={`Remove ${it.name}`}><Trash2 size={14} /> Remove</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <footer className="border-t border-ivory/10 bg-ink/40 px-6 py-5">
                  <div className="flex items-baseline justify-between"><span className="text-sm uppercase tracking-widest text-ivory/60">Subtotal ({count})</span><span className="font-serif text-3xl font-semibold text-lime">{inr(subtotal)}</span></div>
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