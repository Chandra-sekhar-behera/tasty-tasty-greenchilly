// import { useEffect, useMemo, useRef, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { AnimatePresence, motion } from "framer-motion";
// import QRCode from "qrcode";
// import {
//   ArrowLeft, ArrowRight, Bike, Store, Clock, MapPin, LocateFixed, Lock, ShieldCheck, Check, X, Copy,
//   ChevronRight, Loader2, ShoppingBag, Trash2, RotateCcw, Smartphone, User, Phone, StickyNote, Receipt,
// } from "lucide-react";
// import WhatsAppIcon from "../components/WhatsAppIcon.jsx";
// import PayLogo from "../components/PayLogo.jsx";
// import PaymentOptions from "../components/PaymentOptions.jsx";
// import QtyStepper from "../components/QtyStepper.jsx";
// import VegMark from "../components/VegMark.jsx";
// import { useCart } from "../context/CartContext.jsx";
// import { useOrderStatus } from "../lib/orderHours.js";
// import { menuById, useMenuVersion } from "../lib/menuStore.js";
// import { usePageTitle } from "../lib/hooks.js";
// import { inr } from "../lib/format.js";
// import { business } from "../config/business.js";
// import {
//   buildOrderMessage, buildWhatsAppUrl, validateOrder, normalizePhone, paymentConfig, needsPayment, payableAmount,
//   makeOrderId, isValidUtr, cooldownLeft, markOrderSent, upiUri, upiAppLinks, isMobileDevice, gatewayEnabled,
//   etaLabel, etaWindow, deliveryEta,
// } from "../lib/whatsapp.js";

// const canPickup = business.ordering.pickup;
// const canDeliver = business.ordering.delivery;
// const SAVED = "gc-checkout-details";
// const WINDOW_SECONDS = 10 * 60;
// const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
// const field = "w-full rounded-xl border border-ivory/15 bg-ivory/[0.06] px-4 py-3 text-[0.95rem] text-ivory placeholder:text-ivory/35 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30";

// const SESSION = "gc-pay-session"; // keeps the payment step alive when the UPI app sends you back to a reloaded tab
// const readSession = () => { try { const s = JSON.parse(sessionStorage.getItem(SESSION) || "null"); return s && Date.now() - s.at < WINDOW_SECONDS * 1000 ? s : null; } catch { return null; } };
// const clearSession = () => { try { sessionStorage.removeItem(SESSION); } catch { /* ignore */ } };

// function loadSaved() {
//   try { return JSON.parse(localStorage.getItem(SAVED) || "{}") || {}; } catch { return {}; }
// }

// function Card({ icon: Icon, title, children, aside, id }) {
//   return (
//     <section id={id} className="rounded-2xl border border-ivory/10 bg-forest/70 p-5 sm:p-6">
//       <div className="mb-4 flex items-center justify-between gap-3">
//         <h2 className="flex items-center gap-2.5 font-serif text-xl font-semibold">
//           {Icon && <span className="grid h-8 w-8 place-items-center rounded-full bg-lime/15 text-lime"><Icon size={16} /></span>}
//           {title}
//         </h2>
//         {aside}
//       </div>
//       {children}
//     </section>
//   );
// }

// function Row({ label, value, strong, accent }) {
//   return (
//     <div className={`flex items-baseline justify-between gap-4 ${strong ? "border-t border-dashed border-ivory/20 pt-3 font-semibold" : "text-ivory/75"}`}>
//       <span className={strong ? "text-ivory" : ""}>{label}</span>
//       <span className={`tabular-nums ${accent ? "text-lime" : ""}`}>{value}</span>
//     </div>
//   );
// }

// /* ---------- full-screen "complete your payment" window ---------- */
// function PayWindow({ app, apps, slow, mobile, amount, orderId, qr, left, back, utr, setUtr, utrErr, onPaid, onCancel, copied, onCopy }) {
//   const ref = useRef(null);
//   useEffect(() => { ref.current?.focus(); }, []);
//   const expired = left <= 0;
//   return (
//     <motion.div className="fixed inset-0 z-[300] flex items-end justify-center bg-ink/85 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
//       <motion.div
//         ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="pw-title"
//         onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
//         initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
//         className="flex max-h-[96dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-lime/25 bg-forest shadow-[0_40px_100px_-20px_rgba(0,0,0,0.95)] outline-none sm:rounded-3xl"
//       >
//         <header className="flex items-center justify-between gap-4 border-b border-ivory/10 bg-ink/40 px-5 py-4">
//           <div className="min-w-0">
//             <p className="truncate text-sm font-semibold">{business.name}</p>
//             <p className="text-xs text-ivory/50">Order {orderId}</p>
//           </div>
//           <div className="text-right">
//             <p className="text-[0.65rem] uppercase tracking-widest text-ivory/50">To pay</p>
//             <p className="font-serif text-2xl font-semibold leading-none text-lime">{inr(amount)}</p>
//           </div>
//         </header>

//         <div className="flex-1 overflow-y-auto px-6 py-7 text-center">
//           {mobile ? (
//             <>
//               <div className="mx-auto w-fit"><PayLogo id={app.id} size={68} /></div>
//               {expired ? (
//                 <><h2 id="pw-title" className="mt-5 font-serif text-2xl font-semibold">Payment window ended</h2><p className="mt-2 text-sm text-ivory/65">Nothing was charged. Start again to get a fresh request.</p></>
//               ) : back ? (
//                 <><h2 id="pw-title" className="mt-5 font-serif text-2xl font-semibold">Did the payment go through?</h2><p className="mt-2 text-sm text-ivory/65">Look for the green "Payment successful" tick in {app.label}.</p></>
//               ) : (
//                 <><Loader2 size={22} className="mx-auto mt-5 animate-spin text-lime motion-reduce:animate-none" aria-hidden="true" /><h2 id="pw-title" className="mt-3 font-serif text-2xl font-semibold">Complete the payment in {app.label}</h2><p className="mt-2 text-sm text-ivory/65">Approve {inr(amount)} with your UPI PIN, then come back here.</p>
//                   {slow && (
//                     <div role="status" className="mt-4 rounded-xl border border-ivory/15 bg-ink/50 p-4 text-left text-sm leading-relaxed text-ivory/75">
//                       <p className="font-semibold text-ivory">{app.label} did not open?</p>
//                       <p className="mt-1">Make sure the app is installed, or <a href={app.href} className="text-lime underline">tap here to try again</a>. You can also pay manually to <button type="button" onClick={onCopy} className="font-semibold text-lime underline">{copied ? "UPI ID copied" : paymentConfig.upiId}</button> and come back.</p>
//                     </div>
//                   )}
//                 </>
//               )}
//             </>
//           ) : (
//             <>
//               <h2 id="pw-title" className="font-serif text-2xl font-semibold">Scan &amp; pay {inr(amount)}</h2>
//               <div className="mx-auto mt-4 grid h-[220px] w-[220px] place-items-center rounded-2xl bg-white p-2.5">
//                 {qr ? <img src={qr} alt={`UPI QR code for ${inr(amount)}`} className="h-full w-full" /> : <span className="text-xs text-ink/60">Making QR…</span>}
//               </div>
//               <p className="mt-4 text-sm text-ivory/70">Open PhonePe, Google Pay, Paytm or any UPI app → Scan → approve.</p>
//               <div className="mt-5 rounded-xl border border-ivory/10 p-4">
//                 <p className="text-xs text-ivory/60">On this phone? You cannot scan your own screen. Tap your app:</p>
//                 <div className="mt-3 space-y-2.5">
//                   {apps.filter((a) => a.id !== "any").map((a) => (
//                     <a key={a.id} href={a.href} className="flex items-center gap-3 rounded-xl border border-ivory/15 bg-ivory/[0.04] p-2.5 text-left transition hover:border-lime active:scale-[0.99]">
//                       <PayLogo id={a.id} size={38} />
//                       <span className="flex-1 text-sm font-semibold">Pay via {a.label}</span>
//                       <ChevronRight size={16} className="text-ivory/40" />
//                     </a>
//                   ))}
//                 </div>
//               </div>
//               <button type="button" onClick={onCopy} className="mt-4 inline-flex items-center gap-2 rounded-full border border-ivory/15 px-4 py-2 text-xs text-ivory/80 transition hover:border-lime hover:text-lime">
//                 {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "UPI ID copied" : paymentConfig.upiId}
//               </button>
//             </>
//           )}
//           {!expired && <p className="mt-4 inline-flex items-center gap-1.5 text-xs tabular-nums text-ivory/50"><Clock size={13} /> Valid for {mmss(left)}</p>}

//           {!expired && (
//             <div className="mt-5 text-left">
//               <label htmlFor="pw-utr" className="eyebrow mb-2 block text-ivory/55">UTR / reference <span className="text-ivory/35">(optional)</span></label>
//               <input id="pw-utr" className={field} value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))} inputMode="numeric" autoComplete="off" placeholder="12-digit number, or skip and send a screenshot" aria-invalid={!!utrErr} />
//               {utrErr && <p role="alert" className="mt-1.5 text-sm text-[#ff8a7a]">{utrErr}</p>}
//             </div>
//           )}
//         </div>

//         <footer className="grid grid-cols-2 gap-3 border-t border-ivory/10 bg-ink/40 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
//           <button type="button" onClick={onCancel} className="btn btn-ghost justify-center">{expired ? "Close" : mobile ? "Another app" : "Cancel"}</button>
//           {expired
//             ? <button type="button" onClick={onCancel} className="btn btn-lime justify-center"><RotateCcw size={15} /> Try again</button>
//             : <button type="button" onClick={onPaid} className="btn btn-lime justify-center"><Check size={16} /> I have paid</button>}
//         </footer>
//       </motion.div>
//     </motion.div>
//   );
// }

// /* ---------- order placed ---------- */
// function Placed({ orderId, mode, sentAt, paidNow, balance, waUrl, onDone }) {
//   const [now, setNow] = useState(Date.now());
//   useEffect(() => { const t = setInterval(() => setNow(Date.now()), 20000); return () => clearInterval(t); }, []);
//   const win = etaWindow(sentAt);
//   const delivery = mode === "delivery";
//   const total = (delivery ? deliveryEta.max : 20) * 60000;
//   const pct = Math.min(100, Math.max(4, ((now - sentAt) / total) * 100));
//   const steps = delivery
//     ? [["Order sent to the restaurant", "Just now", true], ["Restaurant confirms & checks payment", "within ~5 min", false], ["Your food is cooked fresh", "~15 min", false], ["Out for delivery", "~10 min", false], ["Delivered to your door", `${win.from} – ${win.to}`, false]]
//     : [["Order sent to the restaurant", "Just now", true], ["Restaurant confirms your order", "within ~5 min", false], ["Ready for pickup / dine-in", "~20 min", false]];
//   return (
//     <div className="mx-auto w-full max-w-xl space-y-5 px-5 py-8">
//       <div className="text-center">
//         <motion.span initial={{ scale: 0.4, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 240, damping: 14 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime/15 text-lime ring-1 ring-lime/40"><Check size={40} /></motion.span>
//         <h1 className="mt-5 font-serif text-4xl font-semibold">Order sent!</h1>
//         <p className="mt-1 text-sm text-ivory/60">Order ID <span className="font-semibold text-ivory">{orderId}</span></p>
//       </div>
//       <div className="rounded-2xl border border-lime/30 bg-gradient-to-br from-heritage/70 to-ink/70 p-6 text-center">
//         <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-ivory/60"><Clock size={13} /> {delivery ? "Estimated delivery" : "Estimated ready time"}</p>
//         <p className="mt-1 font-serif text-5xl font-semibold text-lime">{delivery ? etaLabel : "~20 minutes"}</p>
//         {delivery && <p className="mt-1 text-sm text-ivory/70">Usually by {win.from} – {win.to}</p>}
//         <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-ivory/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Estimated progress"><div className="h-full rounded-full bg-lime transition-all duration-700" style={{ width: `${pct}%` }} /></div>
//         <p className="mt-2 text-[0.7rem] text-ivory/45">Estimate. The clock starts once the restaurant confirms your order.</p>
//       </div>
//       <section aria-label="Order progress" className="rounded-2xl border border-ivory/10 bg-forest/70 p-5">
//         <ol>
//           {steps.map(([t, when, done], i) => (
//             <li key={t} className="relative flex gap-3 pb-5 last:pb-0">
//               {i < steps.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-px bg-ivory/15" aria-hidden="true" />}
//               <span className={`relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold ${done ? "bg-lime text-ink" : "border border-ivory/25 text-ivory/50"}`}>{done ? <Check size={13} /> : i + 1}</span>
//               <div className="min-w-0 flex-1"><p className={`text-sm ${done ? "font-semibold" : "text-ivory/75"}`}>{t}</p><p className="text-xs text-ivory/45">{when}</p></div>
//             </li>
//           ))}
//         </ol>
//       </section>
//       {paidNow > 0 && <p className="rounded-xl border border-ivory/10 p-4 text-sm leading-relaxed text-ivory/75">Attach your <span className="font-semibold text-ivory">payment screenshot</span> in the WhatsApp chat so we can verify {inr(paidNow)} quickly.{balance > 0 ? ` Balance ${inr(balance)} is paid at delivery.` : ""}</p>}
//       <p className="text-center text-xs text-ivory/45">WhatsApp did not open? <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-lime underline">Open it again</a></p>
//       <button type="button" onClick={onDone} className="btn btn-lime w-full">Back to menu</button>
//     </div>
//   );
// }

// /* ---------- the page ---------- */
// export default function Checkout() {
//   useMenuVersion();
//   usePageTitle("Checkout");
//   const navigate = useNavigate();
//   const orderStatus = useOrderStatus();
//   const { lines, subtotal, count, setQty, remove, clear } = useCart();
//   const saved = useMemo(loadSaved, []);
//   const mobile = useMemo(isMobileDevice, []);
//   const resume = useMemo(readSession, []);

//   const [form, setForm] = useState(resume?.form || { name: saved.name || "", phone: saved.phone || "", address: saved.address || "", note: "", mode: canDeliver ? "delivery" : "pickup" });
//   const [location, setLocation] = useState(null);
//   const [locState, setLocState] = useState({ busy: false, error: "" });
//   const [errors, setErrors] = useState({});
//   const [plan, setPlan] = useState(resume?.plan || "half");
//   const [choice, setChoice] = useState(resume?.choice || (gatewayEnabled ? "gateway" : mobile ? "phonepe" : "qr"));
//   const [utr, setUtr] = useState("");
//   const [utrErr, setUtrErr] = useState("");
//   const [orderId, setOrderId] = useState(() => resume?.orderId || makeOrderId());
//   const [stage, setStage] = useState(resume && lines.length ? "waiting" : "form"); // form | waiting | send | done
//   const [left, setLeft] = useState(resume ? Math.max(0, WINDOW_SECONDS - Math.floor((Date.now() - resume.at) / 1000)) : WINDOW_SECONDS);
//   const [slow, setSlow] = useState(false);
//   const [back, setBack] = useState(Boolean(resume));
//   const [qr, setQr] = useState("");
//   const [copied, setCopied] = useState(false);
//   const [busy, setBusy] = useState(false);
//   const [gwError, setGwError] = useState("");
//   const [sendErr, setSendErr] = useState("");
//   const [sentAt, setSentAt] = useState(null);

//   const mustPay = needsPayment(form.mode);
//   const amount = payableAmount(subtotal, plan);
//   const payment = mustPay ? { plan, amount, utr: utr.replace(/\s/g, "") } : null;
//   const apps = useMemo(() => upiAppLinks({ amount, orderId }), [amount, orderId]);
//   const uri = upiUri({ amount, orderId });
//   const picked = apps.find((a) => a.id === choice);
//   const viaQr = choice === "qr";
//   const belowMin = paymentConfig.minimumOrder > 0 && subtotal < paymentConfig.minimumOrder;
//   const delivery = form.mode === "delivery";

//   const customer = { ...form, location: delivery ? location : null };
//   const message = useMemo(() => (lines.length ? buildOrderMessage({ lines, customer, orderId, payment }) : ""), [lines, form, location, plan, utr, orderId]);
//   const waUrl = message ? buildWhatsAppUrl(message) : "#";
//   const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

//   useEffect(() => { try { localStorage.setItem(SAVED, JSON.stringify({ name: form.name, phone: form.phone, address: form.address })); } catch { /* ignore */ } }, [form.name, form.phone, form.address]);

//   useEffect(() => {
//     let live = true;
//     QRCode.toDataURL(uri, { margin: 1, width: 360, color: { dark: "#0a1a10", light: "#ffffff" } }).then((u) => live && setQr(u)).catch(() => live && setQr(""));
//     return () => { live = false; };
//   }, [uri]);

//   useEffect(() => {
//     if (stage !== "waiting" || left <= 0) return undefined;
//     const t = setTimeout(() => setLeft((s) => s - 1), 1000);
//     return () => clearTimeout(t);
//   }, [stage, left]);

//   useEffect(() => {
//     if (stage !== "waiting" || !mobile) return undefined;
//     const on = () => { if (document.visibilityState === "visible") setBack(true); };
//     document.addEventListener("visibilitychange", on);
//     return () => document.removeEventListener("visibilitychange", on);
//   }, [stage, mobile]);

//   // if the UPI app does not open within 3 seconds, tell the customer what to do
//   useEffect(() => {
//     if (stage !== "waiting" || viaQr) { setSlow(false); return undefined; }
//     const t = setTimeout(() => setSlow(true), 3000);
//     const gone = () => { if (document.visibilityState === "hidden") { clearTimeout(t); setSlow(false); } };
//     document.addEventListener("visibilitychange", gone);
//     return () => { clearTimeout(t); document.removeEventListener("visibilitychange", gone); };
//   }, [stage, viaQr]);

//   function shareLocation() {
//     if (!("geolocation" in navigator)) return setLocState({ busy: false, error: "Location is not supported." });
//     setLocState({ busy: true, error: "" });
//     navigator.geolocation.getCurrentPosition(
//       (p) => { setLocation({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }); setLocState({ busy: false, error: "" }); },
//       () => setLocState({ busy: false, error: "Location permission denied." }),
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }

//   function validate() {
//     const errs = validateOrder(form);
//     setErrors(errs);
//     if (Object.keys(errs).length) {
//       document.getElementById("details")?.scrollIntoView({ behavior: "smooth", block: "center" });
//       return false;
//     }
//     if (!orderStatus.open) { setSendErr(orderStatus.long); return false; }
//     const wait = cooldownLeft(orderId);
//     if (wait > 0) { setSendErr(`Please wait ${wait} minute before sending another order.`); return false; }
//     setSendErr("");
//     return true;
//   }

//   function sendWhatsApp() {
//     if (!orderStatus.open) return setSendErr(orderStatus.long);
//     markOrderSent(orderId);
//     clearSession();
//     setSentAt(Date.now());
//     window.open(waUrl, "_blank", "noopener,noreferrer");
//     setStage("done");
//   }

//   async function openGateway() {
//     setBusy(true); setGwError("");
//     try {
//       const Razorpay = await new Promise((resolve, reject) => {
//         if (window.Razorpay) return resolve(window.Razorpay);
//         const el = document.createElement("script");
//         el.src = "https://checkout.razorpay.com/v1/checkout.js"; el.async = true;
//         el.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("load")));
//         el.onerror = () => reject(new Error("load"));
//         document.head.appendChild(el);
//       });
//       const rzp = new Razorpay({
//         key: paymentConfig.razorpayKeyId, amount: Math.round(amount * 100), currency: "INR",
//         name: business.name, description: `Order ${orderId}`,
//         prefill: { name: form.name.trim(), contact: normalizePhone(form.phone) },
//         notes: { order_id: orderId }, theme: { color: "#8bcb35" },
//         method: { upi: true, card: false, netbanking: false, wallet: false, emi: false, paylater: false },
//         handler: (r) => { setUtr(r.razorpay_payment_id); setBusy(false); setStage("send"); },
//         modal: { ondismiss: () => setBusy(false) },
//       });
//       rzp.on("payment.failed", (r) => { setGwError(r?.error?.description || "Payment failed. Please try again."); setBusy(false); });
//       rzp.open();
//     } catch {
//       setGwError("Could not open secure checkout. Check your internet and try again, or pick another option.");
//       setBusy(false);
//     }
//   }

//   // `which` = the button the customer tapped (phonepe / gpay / paytm / any / qr / gateway). No argument = current selection.
//   function placeOrder(which) {
//     const ch = typeof which === "string" ? which : choice;
//     if (!validate()) return;
//     if (!mustPay) return sendWhatsApp();
//     setGwError(""); setChoice(ch);
//     if (ch === "gateway" && gatewayEnabled) return openGateway();
//     setBack(false); setLeft(WINDOW_SECONDS); setUtrErr(""); setStage("waiting");
//     try { sessionStorage.setItem(SESSION, JSON.stringify({ orderId, plan, choice: ch, form, at: Date.now() })); } catch { /* ignore */ }
//     const app = apps.find((a) => a.id === ch);
//     if (ch !== "qr" && app) window.location.href = app.href;
//   }

//   function paid() {
//     if (utr && !isValidUtr(utr)) return setUtrErr("UTR must be 12 digits. Leave it empty if you do not have it.");
//     setUtrErr("");
//     sendWhatsApp();
//   }

//   async function copyUpi() {
//     try { await navigator.clipboard.writeText(paymentConfig.upiId); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
//   }

//   function finish() { clearSession(); clear(); setOrderId(makeOrderId()); setUtr(""); setPlan("half"); navigate("/menu"); }

//   /* ---- empty cart ---- */
//   if (stage === "form" && lines.length === 0) {
//     return (
//       <div className="grid min-h-[80vh] place-items-center px-6 pt-24 text-center">
//         <div>
//           <span className="mx-auto grid h-16 w-16 place-items-center rounded-full text-lime"><ShoppingBag size={36} /></span>
//           <h1 className="mt-4 font-serif text-4xl font-semibold">Your order is empty</h1>
//           <p className="mt-2 text-sm text-ivory/60">Pick something tasty from the menu first.</p>
//           <Link to="/menu" className="btn btn-lime mt-8">Browse the menu <ArrowRight size={16} /></Link>
//         </div>
//       </div>
//     );
//   }

//   /* ---- send / done ---- */
//   if (stage === "done") {
//     return <Placed orderId={orderId} mode={form.mode} sentAt={sentAt || Date.now()} paidNow={payment ? payment.amount : 0} balance={payment ? Math.max(0, subtotal - payment.amount) : 0} waUrl={waUrl} onDone={finish} />;
//   }
//   if (stage === "send") {
//     return (
//       <div className="mx-auto w-full max-w-xl space-y-5 px-5 py-10 text-center">
//         <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime/15 text-lime ring-1 ring-lime/40"><Check size={40} /></span>
//         <h1 className="font-serif text-4xl font-semibold">Payment received</h1>
//         <p className="text-sm text-ivory/70">{inr(payment?.amount || 0)} paid{utr ? <> · Ref <span className="font-semibold text-ivory">{utr}</span></> : null}. <span className="text-lime">One last step:</span> send your order to the restaurant on WhatsApp so they can start cooking.</p>
//         {sendErr && <p role="alert" className="rounded-xl border border-[#ff8a7a]/40 p-3 text-sm text-[#ff8a7a]">{sendErr}</p>}
//         <button type="button" onClick={sendWhatsApp} className="btn btn-lime w-full justify-center text-base"><WhatsAppIcon size={18} /> Send order on WhatsApp</button>
//       </div>
//     );
//   }

//   /* ---- the checkout form ---- */
//   const payLabel = !mustPay ? "Place order" : choice === "gateway" && gatewayEnabled ? `Pay ${inr(amount)} securely` : `Pay ${inr(amount)}`;
//   const plans = [["half", `Half (${paymentConfig.halfPercent}%)`, payableAmount(subtotal, "half")], ["full", "Full", subtotal]];

//   return (
//     <div className="min-h-screen overflow-x-clip bg-ink pb-32 lg:pb-12">
//       <header className="sticky top-0 z-40 border-b border-ivory/10 bg-forest/90 backdrop-blur">
//         <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
//           <div className="flex items-center gap-3">
//             <button type="button" onClick={() => navigate("/menu")} aria-label="Back to menu" className="grid h-10 w-10 place-items-center rounded-full border border-ivory/20 transition hover:border-lime hover:text-lime"><ArrowLeft size={18} /></button>
//             <div>
//               <h1 className="font-serif text-2xl font-semibold leading-none">Checkout</h1>
//               <p className="mt-0.5 text-xs text-ivory/50">{business.name} · {count} {count === 1 ? "item" : "items"}</p>
//             </div>
//           </div>
//           <span className="hidden items-center gap-1.5 text-xs text-ivory/60 sm:inline-flex"><Lock size={13} className="text-lime" /> Safe &amp; secure checkout</span>
//         </div>
//       </header>

//       <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[1fr_22rem] lg:items-start">
//         <div className="min-w-0 space-y-5">
//           {/* delivery / pickup + ETA */}
//           <Card icon={delivery ? Bike : Store} title={delivery ? "Delivery" : "Pickup / Dine-in"}>
//             {canPickup && canDeliver && (
//               <div role="radiogroup" aria-label="Order type" className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-ink/60 p-1">
//                 {[["delivery", "Delivery", Bike], ["pickup", "Pickup / Dine-in", Store]].map(([v, l, Icon]) => (
//                   <button key={v} type="button" role="radio" aria-checked={form.mode === v} onClick={() => setForm((f) => ({ ...f, mode: v }))}
//                     className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${form.mode === v ? "bg-lime text-ink" : "text-ivory/70 hover:text-ivory"}`}>
//                     <Icon size={16} /> {l}
//                   </button>
//                 ))}
//               </div>
//             )}
//             <div className="flex items-center gap-3 rounded-xl border border-lime/25 bg-lime/10 px-4 py-3">
//               <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime/20 text-lime">{delivery ? <Bike size={20} /> : <Clock size={20} />}</span>
//               <p className="text-sm leading-snug"><span className="font-semibold text-lime">{delivery ? `Delivery in ${etaLabel}` : "Ready in about 20 minutes"}</span><br /><span className="text-xs text-ivory/55">{delivery ? "after the restaurant confirms your order" : "we will confirm the exact time on WhatsApp"}</span></p>
//             </div>
//           </Card>

//           {/* details */}
//           <Card id="details" icon={MapPin} title={delivery ? "Delivery address" : "Your details"}>
//             <div className="grid gap-4 sm:grid-cols-2">
//               <div>
//                 <label htmlFor="c-name" className="eyebrow mb-2 flex items-center gap-1.5 text-ivory/60"><User size={12} /> Name</label>
//                 <input id="c-name" className={field} value={form.name} onChange={set("name")} autoComplete="name" placeholder="e.g. Asha Rani" aria-invalid={!!errors.name} />
//                 {errors.name && <p role="alert" className="mt-1.5 text-sm text-[#ff8a7a]">{errors.name}</p>}
//               </div>
//               <div>
//                 <label htmlFor="c-phone" className="eyebrow mb-2 flex items-center gap-1.5 text-ivory/60"><Phone size={12} /> Mobile number</label>
//                 <input id="c-phone" className={field} value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" aria-invalid={!!errors.phone} />
//                 {errors.phone && <p role="alert" className="mt-1.5 text-sm text-[#ff8a7a]">{errors.phone}</p>}
//               </div>
//             </div>
//             {delivery && (
//               <div className="mt-4 space-y-3">
//                 <div>
//                   <label htmlFor="c-addr" className="eyebrow mb-2 block text-ivory/60">Full address</label>
//                   <textarea id="c-addr" rows={3} className={field} value={form.address} onChange={set("address")} autoComplete="street-address" placeholder="House / plot no., street, landmark" aria-invalid={!!errors.address} />
//                   {errors.address && <p role="alert" className="mt-1.5 text-sm text-[#ff8a7a]">{errors.address}</p>}
//                 </div>
//                 <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ivory/10 p-3">
//                   <button type="button" onClick={shareLocation} disabled={locState.busy} className="btn btn-ghost btn-sm"><LocateFixed size={15} /> {locState.busy ? "Locating…" : location ? "Update location" : "Use my current location"}</button>
//                   {location && <span className="text-sm text-lime">Location attached · <button type="button" onClick={() => setLocation(null)} className="underline">Remove</button></span>}
//                   {locState.error && <span role="alert" className="text-sm text-[#ff8a7a]">{locState.error}</span>}
//                 </div>
//               </div>
//             )}
//             <div className="mt-4">
//               <label htmlFor="c-note" className="eyebrow mb-2 flex items-center gap-1.5 text-ivory/60"><StickyNote size={12} /> Cooking note (optional)</label>
//               <input id="c-note" className={field} value={form.note} onChange={set("note")} maxLength={160} placeholder="Spice level, allergies, etc." />
//             </div>
//           </Card>

//           {/* items */}
//           <Card icon={ShoppingBag} title="Your order" aside={<Link to="/menu" className="text-xs uppercase tracking-widest text-lime hover:underline">+ Add items</Link>}>
//             <ul className="divide-y divide-ivory/10">
//               {lines.map(({ id, qty }) => {
//                 const it = menuById[id];
//                 return (
//                   <li key={id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3.5">
//                     <VegMark veg={it.veg} />
//                     <div className="min-w-0 flex-1 basis-40">
//                       <p className="font-medium leading-snug">{it.name}</p>
//                       <p className="text-xs text-ivory/50">{inr(it.price)} each</p>
//                     </div>
//                     <QtyStepper qty={qty} name={it.name} onChange={(q) => setQty(id, q)} />
//                     <p className="w-16 text-right font-semibold tabular-nums">{inr(it.price * qty)}</p>
//                     <button type="button" onClick={() => remove(id)} aria-label={`Remove ${it.name}`} className="text-ivory/40 transition hover:text-[#ff8a7a]"><Trash2 size={16} /></button>
//                   </li>
//                 );
//               })}
//             </ul>
//           </Card>

//           {/* payment */}
//           <Card icon={ShieldCheck} title="Payment" aside={mustPay ? <span className="inline-flex items-center gap-1.5 text-xs text-ivory/55"><Lock size={12} className="text-lime" /> UPI · Secure</span> : null}>
//             {mustPay ? (
//               <>
//                 <p className="eyebrow mb-3 text-ivory/55">How much to pay now?</p>
//                 <div role="radiogroup" aria-label="Amount to pay now" className="grid grid-cols-2 gap-3">
//                   {plans.map(([v, label, amt]) => (
//                     <button key={v} type="button" role="radio" aria-checked={plan === v} onClick={() => setPlan(v)}
//                       className={`rounded-xl border px-4 py-3 text-left text-sm transition ${plan === v ? "border-lime bg-lime/10 text-lime" : "border-ivory/15 text-ivory/75 hover:border-ivory/40"}`}>
//                       <span className="block">{label}</span>
//                       <span className="mt-0.5 block font-serif text-2xl font-semibold">{inr(amt)}</span>
//                     </button>
//                   ))}
//                 </div>
//                 {amount < subtotal && <p className="mt-2 text-xs text-ivory/55">Balance {inr(subtotal - amount)} is paid at delivery.</p>}

//                 <div className="mt-6">
//                   <PaymentOptions apps={apps} amount={amount} choice={choice} onPay={placeOrder} disabled={belowMin || !orderStatus.open} busy={busy} gateway={gatewayEnabled} />
//                 </div>
//                 {gwError && <p role="alert" className="mt-3 rounded-xl border border-[#ff8a7a]/40 p-3 text-sm text-[#ff8a7a]">{gwError}</p>}
//                 <p className="mt-4 flex gap-2 text-xs leading-relaxed text-ivory/55"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-lime" /> Money goes straight to the restaurant's UPI account. Your order is confirmed after the restaurant checks your payment.</p>
//               </>
//             ) : (
//               <p className="text-sm leading-relaxed text-ivory/75">No advance payment needed for pickup / dine-in. Pay <span className="font-semibold text-lime">{inr(subtotal)}</span> at the restaurant.</p>
//             )}
//           </Card>
//         </div>

//         {/* bill */}
//         <aside className="min-w-0 lg:sticky lg:top-24">
//           <Card icon={Receipt} title="Bill details">
//             <div className="space-y-2.5 text-sm">
//               <Row label={`Item total (${count})`} value={inr(subtotal)} />
//               <Row label="Delivery fee" value={delivery ? "Confirmed on WhatsApp" : "None"} />
//               <Row label="Grand total" value={inr(subtotal)} strong />
//               {mustPay && <Row label="To pay now" value={inr(amount)} accent />}
//               {mustPay && amount < subtotal && <Row label="Pay at delivery" value={inr(subtotal - amount)} />}
//             </div>
//             {belowMin && <p role="alert" className="mt-4 text-sm text-[#ff8a7a]">Minimum order is {inr(paymentConfig.minimumOrder)}. Add {inr(paymentConfig.minimumOrder - subtotal)} more.</p>}
//             {!orderStatus.open && <p role="alert" className="mt-4 text-sm text-[#ff8a7a]">{orderStatus.long}</p>}
//             {sendErr && orderStatus.open && <p role="alert" className="mt-4 text-sm text-[#ff8a7a]">{sendErr}</p>}
//             <div className="hidden lg:block">
//               <button type="button" onClick={() => placeOrder()} disabled={belowMin || !orderStatus.open || busy} className="btn btn-lime mt-5 w-full justify-center">
//                 {busy ? <Loader2 size={16} className="animate-spin" /> : mustPay ? <Smartphone size={16} /> : <WhatsAppIcon size={17} />} {payLabel}
//               </button>
//             </div>
//             <p className="mt-3 hidden text-center text-[0.7rem] text-ivory/45 lg:block">By placing the order you agree the restaurant will confirm availability and the final amount.</p>
//           </Card>
//         </aside>
//       </div>

//       {/* sticky bottom bar (phones & tablets) */}
//       <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ivory/10 bg-forest/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
//         {(!orderStatus.open || sendErr) && <p role="alert" className="mb-2 text-xs text-[#ff8a7a]">{!orderStatus.open ? orderStatus.long : sendErr}</p>}
//         <div className="mx-auto flex max-w-xl items-center gap-4">
//           <div className="min-w-0">
//             <p className="text-[0.65rem] uppercase tracking-widest text-ivory/50">{mustPay ? "To pay now" : "Total"}</p>
//             <p className="font-serif text-2xl font-semibold leading-none text-lime">{inr(mustPay ? amount : subtotal)}</p>
//           </div>
//           <button type="button" onClick={() => placeOrder()} disabled={belowMin || !orderStatus.open || busy} className="btn btn-lime flex-1 justify-center">
//             {busy ? <Loader2 size={16} className="animate-spin" /> : null} {payLabel} <ChevronRight size={16} />
//           </button>
//         </div>
//       </div>

//       <AnimatePresence>
//         {stage === "waiting" && (
//           <PayWindow app={picked || apps[0]} apps={apps} slow={slow} mobile={!viaQr} amount={amount} orderId={orderId} qr={qr} left={left} back={back}
//             utr={utr} setUtr={setUtr} utrErr={utrErr} onPaid={paid} copied={copied} onCopy={copyUpi}
//             onCancel={() => { clearSession(); setStage("form"); setBack(false); setSlow(false); setLeft(WINDOW_SECONDS); }} />
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }




import { lazy, Suspense, useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Bike, Store, Clock, MapPin, LocateFixed, Check, ChevronRight, ShoppingBag, Trash2,
  User, Phone, StickyNote, Receipt, Banknote, Plus, Copy, PhoneCall, ShieldCheck, Flame, Navigation, Sparkles,
} from "lucide-react";
import WhatsAppIcon from "../components/WhatsAppIcon.jsx";
import QtyStepper from "../components/QtyStepper.jsx";
import VegMark from "../components/VegMark.jsx";
import SmartImg from "../components/SmartImg.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useOrderStatus } from "../lib/orderHours.js";
import { featuredIds, isPhoto, menuById, menuItems, useMenuVersion } from "../lib/menuStore.js";
import { usePageTitle } from "../lib/hooks.js";
import { inr } from "../lib/format.js";
import { business } from "../config/business.js";
import { RESTAURANT, haversineKm, reverseGeocode } from "../lib/geo.js";
import {
  buildOrderMessage, buildWhatsAppUrl, validateOrder, makeOrderId, cooldownLeft, markOrderSent,
  etaLabel, deliveryEta, etaWindow,
} from "../lib/whatsapp.js";

const DeliveryMap = lazy(() => import("../components/DeliveryMap.jsx"));

const LOTTIE_SRC = "https://lottie.host/embed/3176e252-6334-4fcf-8de9-8b2fca91b06f/CtDaGP1Pp3.lottie";

const LottieEmbed = memo(function LottieEmbed({ className = "" }) {
  return (
    <iframe
      src={LOTTIE_SRC}
      title="Delivery animation"
      loading="lazy"
      tabIndex={-1}
      aria-hidden="true"
      className={`pointer-events-none border-0 bg-transparent ${className}`}
      style={{ colorScheme: "normal" }}
    />
  );
});

const canPickup = business.ordering.pickup;
const canDeliver = business.ordering.delivery;
const maxKm = business.ordering.maxDeliveryKm;
const SAVED = "gc-checkout-details";
const field = "w-full rounded-xl border border-ivory/15 bg-ivory/[0.06] px-4 py-3 text-[0.95rem] text-ivory placeholder:text-ivory/35 transition focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED) || "{}") || {}; } catch { return {}; }
}

/* ------------------------------------------------------------------ */
/*  Optimized building blocks                                          */
/* ------------------------------------------------------------------ */
const Card = memo(function Card({ icon: Icon, title, children, aside, id, delay = 0 }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-ivory/10 bg-forest/70 p-5 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-serif text-xl font-semibold">
          {Icon && <span className="grid h-8 w-8 place-items-center rounded-full bg-lime/15 text-lime"><Icon size={16} /></span>}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </motion.section>
  );
});

const Money = memo(function Money({ value, className }) {
  const ref = useRef(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || prev.current === value) { el.textContent = inr(value); prev.current = value; return; }
    const c = animate(prev.current, value, { duration: 0.4, ease: "easeOut", onUpdate: (v) => { el.textContent = inr(Math.round(v)); } });
    prev.current = value;
    return () => c.stop();
  }, [value, reduce]);
  return <span ref={ref} className={className}>{inr(value)}</span>;
});

const Row = memo(function Row({ label, children, strong }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "border-t border-dashed border-ivory/20 pt-3 font-semibold" : "text-ivory/75"}`}>
      <span className={strong ? "text-ivory" : ""}>{label}</span>
      <span className="tabular-nums">{children}</span>
    </div>
  );
});

const Stepper = memo(function Stepper({ step }) {
  const items = ["Cart", "Details", "Confirm"];
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Checkout progress">
      {items.map((t, i) => {
        const n = i + 1;
        const done = n < step;
        const cur = n === step;
        return (
          <li key={t} className="flex items-center gap-2 sm:gap-3" aria-current={cur ? "step" : undefined}>
            <motion.span
              animate={{ scale: cur ? 1.05 : 1 }}
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors ${done ? "bg-lime text-ink" : cur ? "border-2 border-lime text-lime" : "border border-ivory/25 text-ivory/45"}`}
            >
              {done ? <Check size={14} /> : n}
            </motion.span>
            <span className={`hidden text-xs sm:inline ${cur || done ? "text-ivory" : "text-ivory/45"}`}>{t}</span>
            {i < 2 && (
              <span className="relative h-px w-5 overflow-hidden bg-ivory/15 sm:w-10">
                <motion.span className="absolute inset-0 origin-left bg-lime" initial={false} animate={{ scaleX: done ? 1 : 0 }} transition={{ duration: 0.4 }} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
});

const RouteStrip = memo(function RouteStrip({ delivery }) {
  const reduce = useReducedMotion();
  const Mover = delivery ? Bike : ShoppingBag;
  const End = delivery ? MapPin : User;
  return (
    <div className="relative mt-6 h-14" aria-hidden="true">
      <span className="absolute left-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-lime text-ink shadow-[0_8px_24px_-8px_rgba(139,203,53,0.8)]"><Store size={20} /></span>
      <span className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-lime/40 bg-ink text-lime">
        {!reduce && <motion.span className="absolute inset-0 rounded-full border border-lime/60" animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />}
        <End size={20} />
      </span>
      <span className="absolute left-14 right-14 top-1/2 border-t-2 border-dashed border-lime/30" />
      <motion.span
        className="absolute top-1/2 -mt-5 grid h-10 w-10 place-items-center rounded-full bg-ivory text-ink shadow-lg"
        style={{ left: "12%" }}
        animate={reduce ? undefined : { left: ["12%", "76%"] }}
        transition={{ left: { duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.3 } }}
      >
        <Mover size={20} />
      </motion.span>
    </div>
  );
});

const EtaCard = memo(function EtaCard({ delivery, km }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-lime/30 bg-gradient-to-br from-heritage/80 via-forest to-ink p-5 sm:p-6"
    >
      <span className="pointer-events-none absolute -right-10 -top-10 hidden h-44 w-44 rounded-full bg-lime/15 blur-3xl md:block" aria-hidden="true" />
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="eyebrow inline-flex items-center justify-center sm:justify-start gap-1.5 text-lime"><Clock size={13} /> {delivery ? "Estimated delivery" : "Estimated ready time"}</p>
          <p className="mt-1 font-serif text-4xl font-semibold leading-none text-lime sm:text-5xl">{delivery ? etaLabel : "~20 min"}</p>
          <p className="mt-2 text-sm text-ivory/65">{delivery ? "after the restaurant confirms your order" : "we will confirm the exact time on WhatsApp"}</p>
          {delivery && km != null && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-lime/30 bg-ink/50 px-3 py-1.5 text-xs font-medium text-ivory/85"><Navigation size={13} className="text-lime" /> {km.toFixed(1)} km from the kitchen</span>
          )}
        </div>
        {delivery && (
          <div className="flex shrink-0 items-center justify-center rounded-2xl bg-ink/40 p-3 sm:bg-transparent sm:p-0">
            <LottieEmbed className="h-40 w-40 sm:h-48 sm:w-48 drop-shadow-md" />
          </div>
        )}
      </div>
      <RouteStrip delivery={delivery} />
    </motion.div>
  );
});

const Thumb = memo(function Thumb({ item }) {
  const [bad, setBad] = useState(false);
  if (!isPhoto(item.image) || bad) {
    return <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ink/60"><VegMark veg={item.veg} /></span>;
  }
  return <SmartImg src={item.image} alt="" loading="lazy" onGiveUp={() => setBad(true)} className="h-14 w-14 shrink-0 rounded-xl object-cover" />;
});

/* ------------------------------------------------------------------ */
/*  Order Placed Component                                             */
/* ------------------------------------------------------------------ */
function Confetti() {
  const reduce = useReducedMotion();
  const bits = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    x: (Math.random() - 0.5) * 400, up: -(90 + Math.random() * 150), r: (Math.random() - 0.5) * 500,
    c: ["#8bcb35", "#b7e36b", "#f7f7f0", "#7c5cff", "#ffd23f"][i % 5], d: Math.random() * 0.15, w: 5 + Math.random() * 5,
  })), []);
  if (reduce) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-20 flex justify-center overflow-visible">
      {bits.map((b, i) => (
        <motion.span key={i} className="absolute rounded-sm" style={{ width: b.w, height: b.w * 0.55, background: b.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.up, b.up + 350], opacity: [1, 1, 0], rotate: b.r }}
          transition={{ duration: 1.8, delay: b.d, ease: "easeOut" }} />
      ))}
    </div>
  );
}

function Placed({ orderId, mode, sentAt, subtotal, waUrl, onDone }) {
  const delivery = mode === "delivery";
  const win = useMemo(() => etaWindow(sentAt), [sentAt]);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(orderId); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }, [orderId]);

  return (
    <div className="relative mx-auto w-full max-w-xl space-y-5 overflow-x-clip px-5 py-8">
      <Confetti />
      <div className="relative text-center">
        <svg viewBox="0 0 80 80" className="mx-auto h-24 w-24" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="rgba(139,203,53,0.12)" />
          <motion.circle cx="40" cy="40" r="36" fill="none" stroke="#8bcb35" strokeWidth="3.5" strokeLinecap="round" style={{ rotate: -90, transformOrigin: "40px 40px" }} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} />
          <motion.path d="M25 41 L35 51 L56 29" fill="none" stroke="#8bcb35" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.5 }} />
        </svg>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-4 font-serif text-4xl font-semibold">Order sent!</motion.h1>
        <p className="mt-1.5 text-sm text-ivory/60">Finish sending it in WhatsApp if it did not open automatically.</p>
        <button type="button" onClick={copy} className="mt-3 inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3.5 py-1.5 text-sm transition hover:border-lime">
          Order ID <span className="font-semibold">{orderId}</span> {copied ? <Check size={14} className="text-lime" /> : <Copy size={14} className="text-ivory/50" />}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative overflow-hidden rounded-2xl border border-lime/30 bg-gradient-to-br from-heritage/70 to-ink/70 p-6 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-ivory/60"><Clock size={13} /> {delivery ? "Estimated delivery" : "Estimated ready time"}</p>
        <p className="mt-1 font-serif text-5xl font-semibold text-lime">{delivery ? etaLabel : "~20 minutes"}</p>
        {delivery && <p className="mt-1 text-sm text-ivory/70">around {win.from} to {win.to} if confirmed now</p>}
        <p className="mt-3 text-sm text-ivory/80">Payment: <span className="font-semibold text-lime">{delivery ? "Cash on Delivery" : "Pay at the restaurant"} ({inr(subtotal)})</span></p>
        <RouteStrip delivery={delivery} />
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <a href={`tel:${business.contact.phoneTel}`} className="btn btn-ghost justify-center"><PhoneCall size={16} /> Call us</a>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost justify-center"><WhatsAppIcon size={16} /> Open WhatsApp</a>
      </div>
      <button type="button" onClick={onDone} className="btn btn-lime w-full justify-center">Back to menu</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Checkout Component                                            */
/* ------------------------------------------------------------------ */
export default function Checkout() {
  useMenuVersion();
  usePageTitle("Checkout");
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const orderStatus = useOrderStatus();
  const { lines, subtotal, count, setQty, remove, add, clear } = useCart();
  const saved = useMemo(loadSaved, []);

  const [form, setForm] = useState({ name: saved.name || "", phone: saved.phone || "", address: saved.address || "", note: "", mode: canDeliver ? "delivery" : "pickup" });
  const [location, setLocation] = useState(null);
  const [locState, setLocState] = useState({ busy: false, error: "" });
  const [place, setPlace] = useState("");
  const [errors, setErrors] = useState({});
  const [orderId, setOrderId] = useState(() => makeOrderId());
  const [stage, setStage] = useState("form");
  const [sendErr, setSendErr] = useState("");
  const [sentAt, setSentAt] = useState(null);
  const geoAbort = useRef(null);

  const delivery = form.mode === "delivery";
  const customer = useMemo(() => ({ ...form, location: delivery ? location : null }), [form, delivery, location]);
  const km = useMemo(() => (delivery && location ? haversineKm(RESTAURANT, location) : null), [delivery, location]);
  const tooFar = km != null && maxKm && km > maxKm;

  const message = useMemo(
    () => (lines.length ? buildOrderMessage({ lines, customer, orderId, payment: { plan: "cod", amount: subtotal } }) : ""),
    [lines, customer, orderId, subtotal]
  );
  const waUrl = useMemo(() => (message ? buildWhatsAppUrl(message) : "#"), [message]);

  const set = useCallback((k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  }, []);

  const detailsOk = useMemo(() => Object.keys(validateOrder(form)).length === 0, [form]);
  const step = lines.length === 0 ? 1 : detailsOk ? 3 : 2;

  useEffect(() => {
    try { localStorage.setItem(SAVED, JSON.stringify({ name: form.name, phone: form.phone, address: form.address })); } catch {}
  }, [form.name, form.phone, form.address]);
  
  useEffect(() => () => geoAbort.current?.abort(), []);

  const applyLocation = useCallback((loc) => {
    setLocation(loc);
    setPlace("");
    geoAbort.current?.abort();
    const ac = new AbortController();
    geoAbort.current = ac;
    reverseGeocode(loc.lat, loc.lng, ac.signal)
      .then((t) => {
        if (!t) return;
        setPlace(t);
        setForm((f) => (f.address.trim() ? f : { ...f, address: t }));
      })
      .catch(() => {});
  }, []);

  const shareLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return setLocState({ busy: false, error: "Location is not supported on this device." });
    setLocState({ busy: true, error: "" });
    navigator.geolocation.getCurrentPosition(
      (p) => { applyLocation({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }); setLocState({ busy: false, error: "" }); },
      () => setLocState({ busy: false, error: "Location permission denied. Tap the map to drop your pin." }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [applyLocation]);

  const validate = useCallback(() => {
    const errs = validateOrder(form);
    setErrors(errs);
    const first = ["name", "phone", "address"].find((k) => errs[k]);
    if (first) {
      const el = document.getElementById({ name: "c-name", phone: "c-phone", address: "c-addr" }[first]);
      el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      setTimeout(() => el?.focus({ preventScroll: true }), 300);
      return false;
    }
    if (!orderStatus.open) { setSendErr(orderStatus.long); return false; }
    const wait = cooldownLeft(orderId);
    if (wait > 0) { setSendErr(`Please wait ${wait} minute before sending another order.`); return false; }
    setSendErr("");
    return true;
  }, [form, orderStatus, orderId, reduce]);

  const placeOrder = useCallback(() => {
    if (!validate()) return;
    markOrderSent(orderId);
    setSentAt(Date.now());
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setStage("done");
    window.scrollTo({ top: 0 });
  }, [validate, orderId, waUrl]);

  const finish = useCallback(() => { clear(); setOrderId(makeOrderId()); navigate("/menu"); }, [clear, navigate]);

  const suggestions = useMemo(() => {
    const inCart = new Set(lines.map((l) => l.id));
    const pool = menuItems.filter((m) => m.available !== false && !inCart.has(m.id));
    const feat = pool.filter((m) => featuredIds.includes(m.id));
    return [...feat, ...pool].filter((m, i, a) => a.indexOf(m) === i).slice(0, 6);
  }, [lines]);

  if (stage === "form" && lines.length === 0) {
    return (
      <div className="grid min-h-[80vh] place-items-center px-6 pt-24 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <motion.span animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime/10 text-lime ring-1 ring-lime/30"><ShoppingBag size={36} /></motion.span>
          <h1 className="mt-5 font-serif text-4xl font-semibold">Your order is empty</h1>
          <p className="mt-2 text-sm text-ivory/60">Pick something tasty from the menu first.</p>
          <Link to="/menu" className="btn btn-lime mt-8">Browse the menu <ArrowRight size={16} /></Link>
        </motion.div>
      </div>
    );
  }

  if (stage === "done") {
    return <Placed orderId={orderId} mode={form.mode} sentAt={sentAt || Date.now()} subtotal={subtotal} waUrl={waUrl} onDone={finish} />;
  }

  const buttonLabel = delivery ? "Place Order · Cash on Delivery" : "Place Order · Pay at restaurant";

  return (
    <div className="min-h-screen overflow-x-clip bg-ink pb-36 lg:pb-12">
      <header className="sticky top-0 z-40 border-b border-ivory/10 bg-forest/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => navigate("/menu")} aria-label="Back to menu" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ivory/20 transition hover:border-lime hover:text-lime"><ArrowLeft size={18} /></button>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-semibold leading-none">Checkout</h1>
              <p className="mt-0.5 truncate text-xs text-ivory/50">{business.name} · {count} {count === 1 ? "item" : "items"}</p>
            </div>
          </div>
          <Stepper step={step} />
        </div>
        <motion.div className="h-0.5 origin-left bg-lime" initial={false} animate={{ scaleX: step / 3 }} transition={{ duration: 0.4, ease: "easeOut" }} />
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          <Card icon={delivery ? Bike : Store} title={delivery ? "Delivery" : "Pickup / Dine-in"}>
            {canPickup && canDeliver && (
              <div role="radiogroup" aria-label="Order type" className="relative mb-4 grid grid-cols-2 gap-1 rounded-xl bg-ink/60 p-1">
                {[["delivery", "Delivery", Bike], ["pickup", "Pickup / Dine-in", Store]].map(([v, l, Icon]) => (
                  <button key={v} type="button" role="radio" aria-checked={form.mode === v} onClick={() => setForm((f) => ({ ...f, mode: v }))}
                    className={`relative flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${form.mode === v ? "text-ink" : "text-ivory/70 hover:text-ivory"}`}>
                    {form.mode === v && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-lg bg-lime" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
                    <span className="relative flex items-center gap-2"><Icon size={16} /> {l}</span>
                  </button>
                ))}
              </div>
            )}
            <EtaCard delivery={delivery} km={km} />
          </Card>

          <Card id="details" icon={MapPin} title={delivery ? "Delivery address" : "Your details"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-name" className="eyebrow mb-2 flex items-center gap-1.5 text-ivory/60"><User size={12} /> Name</label>
                <input id="c-name" className={field} value={form.name} onChange={set("name")} autoComplete="name" placeholder="e.g. Asha Rani" aria-invalid={!!errors.name} />
                {errors.name && <p role="alert" className="mt-1.5 text-sm text-[#ff8a7a]">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="c-phone" className="eyebrow mb-2 flex items-center gap-1.5 text-ivory/60"><Phone size={12} /> Mobile number</label>
                <input id="c-phone" className={field} value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" aria-invalid={!!errors.phone} />
                {errors.phone && <p role="alert" className="mt-1.5 text-sm text-[#ff8a7a]">{errors.phone}</p>}
              </div>
            </div>
            {delivery && (
              <div className="mt-4">
                <label htmlFor="c-addr" className="eyebrow mb-2 block text-ivory/60">Full address</label>
                <textarea id="c-addr" rows={3} className={field} value={form.address} onChange={set("address")} autoComplete="street-address" placeholder="House / plot no., street, landmark" aria-invalid={!!errors.address} />
                {errors.address && <p role="alert" className="mt-1.5 text-sm text-[#ff8a7a]">{errors.address}</p>}
              </div>
            )}
            <div className="mt-4">
              <label htmlFor="c-note" className="eyebrow mb-2 flex items-center gap-1.5 text-ivory/60"><StickyNote size={12} /> Cooking note (optional)</label>
              <input id="c-note" className={field} value={form.note} onChange={set("note")} maxLength={160} placeholder="Spice level, allergies, etc." />
            </div>
          </Card>

          {delivery && (
            <Card icon={Navigation} title="Pin your location" aside={km != null ? <span className="rounded-full bg-lime/15 px-3 py-1 text-xs font-semibold text-lime">{km.toFixed(1)} km</span> : null}>
              <p className="mb-3 text-sm text-ivory/60">Drop the pin on your door so the rider finds you faster. The exact spot is sent to the restaurant on WhatsApp.</p>
              <Suspense fallback={<div className="grid h-[300px] animate-pulse place-items-center rounded-2xl bg-ink/60 text-sm text-ivory/40 sm:h-[360px]">Loading map…</div>}>
                <DeliveryMap restaurant={RESTAURANT} value={location} onChange={applyLocation} onLocate={shareLocation} locating={locState.busy} />
              </Suspense>
              <AnimatePresence>
                {location && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-lime/25 bg-lime/10 px-4 py-3 text-sm">
                      <Check size={16} className="shrink-0 text-lime" />
                      <span className="min-w-0 flex-1 basis-48 text-ivory/85">{place || "Location attached"}</span>
                      {place && place !== form.address && <button type="button" onClick={() => setForm((f) => ({ ...f, address: place }))} className="text-xs font-semibold uppercase tracking-wider text-lime underline">Use as address</button>}
                      <button type="button" onClick={() => { setLocation(null); setPlace(""); }} className="text-xs uppercase tracking-wider text-ivory/55 underline">Remove</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {tooFar && <p role="alert" className="mt-3 text-sm text-[#ffcf7a]">This is {km.toFixed(1)} km away. The restaurant will confirm on WhatsApp if it can deliver.</p>}
              {locState.error && <p role="alert" className="mt-3 text-sm text-[#ff8a7a]">{locState.error}</p>}
            </Card>
          )}

          <Card icon={ShoppingBag} title="Your order" aside={<Link to="/menu" className="text-xs uppercase tracking-widest text-lime hover:underline">+ Add items</Link>}>
            <ul className="divide-y divide-ivory/10">
              <AnimatePresence initial={false} mode="popLayout">
                {lines.map(({ id, qty }) => {
                  const it = menuById[id];
                  return (
                    <motion.li key={id} layout="position" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3.5">
                      <Thumb item={it} />
                      <div className="min-w-0 flex-1 basis-40">
                        <p className="flex items-center gap-2 font-medium leading-snug"><VegMark veg={it.veg} /> <span className="min-w-0">{it.name}</span></p>
                        <p className="mt-0.5 text-xs text-ivory/50">{inr(it.price)} each</p>
                      </div>
                      <QtyStepper qty={qty} name={it.name} onChange={(q) => setQty(id, q)} />
                      <p className="w-16 text-right font-semibold tabular-nums">{inr(it.price * qty)}</p>
                      <button type="button" onClick={() => remove(id)} aria-label={`Remove ${it.name}`} className="text-ivory/40 transition hover:text-[#ff8a7a]"><Trash2 size={16} /></button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </Card>

          {suggestions.length > 0 && (
            <Card icon={Sparkles} title="Add something more?">
              <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {suggestions.map((m) => (
                  <li key={m.id} className="w-40 shrink-0 snap-start rounded-xl border border-ivory/10 bg-ink/50 p-3">
                    <div className="flex items-center gap-2"><VegMark veg={m.veg} /><p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug">{m.name}</p></div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-serif text-lg text-lime">{inr(m.price)}</span>
                      <button type="button" onClick={() => add(m.id)} aria-label={`Add ${m.name}`} className="grid h-8 w-8 place-items-center rounded-full bg-lime text-ink transition active:scale-95"><Plus size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card icon={Receipt} title="Payment method">
            <div className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-lime/30 bg-lime/10 p-4">
              <motion.span animate={reduce ? undefined : { rotate: [-4, 4, -4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime text-ink"><Banknote size={26} /></motion.span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-lime">{delivery ? "Cash on Delivery (COD)" : "Pay at the restaurant"}</p>
                <p className="mt-0.5 text-xs text-ivory/65">{delivery ? "Pay cash when your food arrives." : "Pay when you collect your order or at the table."}</p>
              </div>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime text-ink"><Check size={18} /></span>
            </div>
          </Card>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <Card icon={Receipt} title="Bill details" delay={0.1}>
            <div className="space-y-2.5 text-sm">
              <Row label={`Item total (${count})`}><Money value={subtotal} /></Row>
              <Row label="Delivery fee">{delivery ? "Confirmed on WhatsApp" : "None"}</Row>
              <Row label="Grand total" strong><Money value={subtotal} className="font-serif text-2xl text-lime" /></Row>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ivory/50"><Banknote size={13} className="text-lime" /> {delivery ? "Pay cash on delivery" : "Pay at the restaurant"}</p>
            {!orderStatus.open && <p role="alert" className="mt-4 text-sm text-[#ff8a7a]">{orderStatus.long}</p>}
            {sendErr && orderStatus.open && <p role="alert" className="mt-4 text-sm text-[#ff8a7a]">{sendErr}</p>}
            <div className="hidden lg:block">
              <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={placeOrder} disabled={!orderStatus.open} className="btn btn-lime mt-5 w-full justify-center">
                <WhatsAppIcon size={17} /> {buttonLabel}
              </motion.button>
            </div>
            <p className="mt-3 hidden text-center text-[0.7rem] text-ivory/45 lg:block">Your order opens in WhatsApp, ready to send.</p>
            <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-ivory/10 pt-4 text-center text-[0.68rem] leading-tight text-ivory/60">
              {[[ShieldCheck, "Direct from kitchen"], [Flame, "Cooked fresh"], [Banknote, delivery ? "Cash on delivery" : "Pay at counter"]].map(([I, t]) => (
                <li key={t} className="flex flex-col items-center gap-1.5"><span className="grid h-9 w-9 place-items-center rounded-full bg-lime/10 text-lime"><I size={16} /></span>{t}</li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ivory/10 bg-forest/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        {(!orderStatus.open || sendErr) && <p role="alert" className="mb-2 text-xs text-[#ff8a7a]">{!orderStatus.open ? orderStatus.long : sendErr}</p>}
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-widest text-ivory/50">{delivery ? "Total · COD" : "Total"}</p>
            <Money value={subtotal} className="font-serif text-2xl font-semibold leading-none text-lime" />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={placeOrder} disabled={!orderStatus.open} className="btn btn-lime flex-1 justify-center">
            Place Order <ChevronRight size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}