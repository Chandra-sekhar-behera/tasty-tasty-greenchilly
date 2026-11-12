// import { useEffect, useMemo, useRef, useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import QRCode from "qrcode";
// import { Copy, Check, ShieldCheck, Clock, ChevronRight, QrCode, RotateCcw, Lock, X, Smartphone } from "lucide-react";
// import { inr } from "../lib/format.js";
// import { paymentConfig, payableAmount, upiUri, upiAppLinks, isMobileDevice } from "../lib/whatsapp.js";

// const field = "w-full rounded-xl border border-ivory/15 bg-ivory/[0.06] px-4 py-3 text-[0.95rem] text-ivory placeholder:text-ivory/35 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30";
// const WINDOW_SECONDS = 10 * 60;
// const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// /**
//  * OFFICIAL APP LOGOS
//  * Put the real logo files here:  src/assets/pay/phonepe.png, gpay.png, paytm.png, upi.png
//  * (png, webp, jpg, jpeg or svg all work). Missing file = a coloured letter tile is shown instead.
//  */
// const logoFiles = import.meta.glob("../assets/pay/*.{png,jpg,jpeg,webp,svg}", { eager: true, query: "?url", import: "default" });
// const logoFor = (id) => Object.entries(logoFiles).find(([p]) => new RegExp(`/${id}\\.[a-z]+$`, "i").test(p))?.[1];

// function AppLogo({ app, size = 44 }) {
//   const src = logoFor(app.id === "any" ? "upi" : app.id);
//   const box = { width: size, height: size };
//   return src ? (
//     <span className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1.5" style={box}>
//       <img src={src} alt="" className="h-full w-full object-contain" />
//     </span>
//   ) : (
//     <span className="grid shrink-0 place-items-center rounded-xl text-base font-bold text-white" style={{ ...box, background: app.color }} aria-hidden="true">{app.label[0]}</span>
//   );
// }

// const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])';

// /** Bottom sheet: "Choose how to pay". Opens by itself when the payment step opens. */
// function PaySheet({ apps, amount, mobile, qr, choice, setChoice, onClose, onPay, onCopyUpi, copied }) {
//   const ref = useRef(null);
//   useEffect(() => { ref.current?.querySelector("[data-first]")?.focus(); }, []);
//   const onKeyDown = (e) => {
//     if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
//     if (e.key !== "Tab") return;
//     const items = [...ref.current.querySelectorAll(FOCUSABLE)];
//     const a = items[0], z = items[items.length - 1];
//     if (e.shiftKey && document.activeElement === a) { e.preventDefault(); e.stopPropagation(); z.focus(); }
//     else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); e.stopPropagation(); a.focus(); }
//     else e.stopPropagation();
//   };
//   const picked = apps.find((a) => a.id === choice);

//   return (
//     <motion.div className="fixed inset-0 z-[120]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
//       <div className="absolute inset-0 bg-ink/75 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
//       <motion.div
//         ref={ref} role="dialog" aria-modal="true" aria-labelledby="pay-sheet-title" onKeyDown={onKeyDown}
//         initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "tween", duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
//         className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-lime/25 bg-forest shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.9)] sm:left-auto sm:right-0 sm:w-full sm:max-w-md"
//       >
//         <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-ivory/20" aria-hidden="true" />
//         <header className="flex items-start justify-between gap-4 border-b border-ivory/10 px-5 pb-4 pt-3">
//           <div>
//             <h3 id="pay-sheet-title" className="font-serif text-2xl font-semibold">{mobile ? "Choose how to pay" : "Pay with UPI"}</h3>
//             <p className="mt-0.5 text-sm text-ivory/60">{inr(amount)} to {paymentConfig.payeeName}</p>
//           </div>
//           <button type="button" data-first onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ivory/20 text-ivory/80 transition hover:border-lime hover:text-lime"><X size={16} /></button>
//         </header>

//         {mobile ? (
//           <div role="radiogroup" aria-label="UPI app" className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
//             {apps.map((a) => {
//               const on = choice === a.id;
//               return (
//                 <button key={a.id} type="button" role="radio" aria-checked={on} onClick={() => setChoice(a.id)}
//                   className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${on ? "border-lime bg-lime/10" : "border-ivory/15 hover:border-ivory/40"}`}>
//                   <AppLogo app={a} />
//                   <span className="min-w-0 flex-1">
//                     <span className="block text-[0.95rem] font-semibold">{a.label}</span>
//                     <span className="block text-xs text-ivory/55">{a.sub}</span>
//                   </span>
//                   <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-lime bg-lime" : "border-ivory/30"}`} aria-hidden="true">{on && <Check size={12} className="text-ink" />}</span>
//                 </button>
//               );
//             })}
//             <p className="px-1 text-center text-xs text-ivory/45">The app opens with the amount filled in. You only enter your UPI PIN.</p>
//           </div>
//         ) : (
//           <div className="flex-1 overflow-y-auto px-5 py-5 text-center">
//             <div className="mx-auto grid h-[220px] w-[220px] place-items-center rounded-2xl bg-white p-2.5">
//               {qr ? <img src={qr} alt={`UPI QR code for ${inr(amount)}`} className="h-full w-full" /> : <span className="text-xs text-ink/60">Making QR…</span>}
//             </div>
//             <p className="mt-4 text-sm text-ivory/75">Open PhonePe, Google Pay, Paytm or any UPI app on your phone, tap Scan and pay {inr(amount)}.</p>
//             <div className="mt-4 flex items-center justify-center gap-3">{apps.slice(0, 3).map((a) => <AppLogo key={a.id} app={a} size={36} />)}</div>
//             <button type="button" onClick={onCopyUpi} className="mt-5 inline-flex items-center gap-2 rounded-full border border-ivory/15 px-4 py-2 text-xs text-ivory/80 transition hover:border-lime hover:text-lime">
//               {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "UPI ID copied" : paymentConfig.upiId}
//             </button>
//           </div>
//         )}

//         <footer className="grid grid-cols-2 gap-3 border-t border-ivory/10 bg-ink/40 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
//           <button type="button" onClick={onClose} className="btn btn-ghost justify-center">{mobile ? "Cancel" : "Close"}</button>
//           {mobile ? (
//             <button type="button" onClick={() => onPay(picked)} className="btn btn-lime justify-center"><Smartphone size={16} /> Pay {inr(amount)}</button>
//           ) : (
//             <button type="button" onClick={onClose} className="btn btn-lime justify-center"><Check size={16} /> I have scanned</button>
//           )}
//         </footer>
//       </motion.div>
//     </motion.div>
//   );
// }

// /** Pay half or full by UPI. A "Choose how to pay" sheet opens by itself with PhonePe / Google Pay / Paytm / any UPI app. */
// export default function PaymentStep({ subtotal, plan, setPlan, utr, setUtr, orderId, error }) {
//   const amount = payableAmount(subtotal, plan);
//   const uri = upiUri({ amount, orderId });
//   const apps = useMemo(() => upiAppLinks({ amount, orderId }), [amount, orderId]);
//   const mobile = useMemo(isMobileDevice, []);
//   const [qr, setQr] = useState("");
//   const [copied, setCopied] = useState("");
//   const [left, setLeft] = useState(WINDOW_SECONDS);
//   const [sheet, setSheet] = useState(true);       // opens automatically
//   const [choice, setChoice] = useState("phonepe");
//   const [launched, setLaunched] = useState(null);
//   const [back, setBack] = useState(false);
//   const [paid, setPaid] = useState(false);

//   useEffect(() => {
//     let live = true;
//     QRCode.toDataURL(uri, { margin: 1, width: 360, color: { dark: "#0a1a10", light: "#ffffff" } })
//       .then((u) => live && setQr(u)).catch(() => live && setQr(""));
//     return () => { live = false; };
//   }, [uri]);

//   useEffect(() => {
//     if (left <= 0) return undefined;
//     const t = setTimeout(() => setLeft((s) => s - 1), 1000);
//     return () => clearTimeout(t);
//   }, [left]);

//   useEffect(() => {
//     if (!launched) return undefined;
//     const on = () => { if (document.visibilityState === "visible") setBack(true); };
//     document.addEventListener("visibilitychange", on);
//     return () => document.removeEventListener("visibilitychange", on);
//   }, [launched]);

//   useEffect(() => { setPaid(false); setBack(false); setLaunched(null); setLeft(WINDOW_SECONDS); }, [amount]);

//   async function copy(text, key) {
//     try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 2000); } catch { /* ignore */ }
//   }

//   function pay(app) {
//     if (!app) return;
//     setLaunched(app.label); setBack(false); setSheet(false);
//     window.location.href = app.href;
//   }

//   const expired = left <= 0;
//   const plans = [["half", `Half (${paymentConfig.halfPercent}%)`, payableAmount(subtotal, "half")], ["full", "Full", subtotal]];

//   return (
//     <div className="space-y-5">
//       <fieldset>
//         <legend className="eyebrow mb-3 text-ivory/60">How much do you want to pay now?</legend>
//         <div className="grid grid-cols-2 gap-3">
//           {plans.map(([v, label, amt]) => (
//             <label key={v} className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lime ${plan === v ? "border-lime bg-lime/10 text-lime" : "border-ivory/15 text-ivory/75 hover:border-ivory/40"}`}>
//               <input type="radio" name="plan" value={v} checked={plan === v} onChange={() => setPlan(v)} className="sr-only" />
//               <span className="block">{label}</span>
//               <span className="mt-0.5 block font-serif text-2xl font-semibold">{inr(amt)}</span>
//             </label>
//           ))}
//         </div>
//         {amount < subtotal && <p className="mt-2 text-xs text-ivory/55">Balance {inr(subtotal - amount)} is paid at delivery. Delivery charge, if any, is extra.</p>}
//       </fieldset>

//       <section aria-label="Pay with UPI" className="overflow-hidden rounded-2xl border border-ivory/10 bg-ink/40">
//         <div className="flex items-center justify-between gap-3 border-b border-ivory/10 px-5 py-3 text-xs">
//           <span className="inline-flex items-center gap-1.5 text-ivory/60"><Lock size={13} className="text-lime" /> Secure UPI payment</span>
//           <span className={`inline-flex items-center gap-1.5 tabular-nums ${expired ? "text-[#ff8a7a]" : left < 60 ? "text-[#ffb36b]" : "text-ivory/60"}`} role="timer" aria-live="off">
//             <Clock size={13} /> {expired ? "Time over" : `Pay within ${mmss(left)}`}
//           </span>
//         </div>

//         <div className="px-5 py-6 text-center">
//           <p className="text-xs uppercase tracking-widest text-ivory/55">You are paying</p>
//           <p className="mt-1 font-serif text-5xl font-semibold text-lime">{inr(amount)}</p>
//           <p className="mt-2 text-sm text-ivory/75">to {paymentConfig.payeeName}</p>
//           <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
//             <button type="button" onClick={() => copy(paymentConfig.upiId, "upi")} className="inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3.5 py-1.5 text-xs text-ivory/80 transition hover:border-lime hover:text-lime">
//               {copied === "upi" ? <Check size={13} /> : <Copy size={13} />} {copied === "upi" ? "UPI ID copied" : paymentConfig.upiId}
//             </button>
//             {paymentConfig.payPhone && (
//               <button type="button" onClick={() => copy(paymentConfig.payPhone, "ph")} className="inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3.5 py-1.5 text-xs text-ivory/80 transition hover:border-lime hover:text-lime">
//                 {copied === "ph" ? <Check size={13} /> : <Smartphone size={13} />} {copied === "ph" ? "Number copied" : `PhonePe / GPay: ${paymentConfig.payPhone}`}
//               </button>
//             )}
//           </div>
//           <p className="mt-3 text-[0.7rem] text-ivory/45">Order ID <span className="font-semibold text-ivory/70">{orderId}</span> is added to the payment note.</p>
//         </div>

//         <div className="border-t border-ivory/10 px-5 py-5">
//           {expired ? (
//             <div className="text-center">
//               <p className="text-sm text-ivory/70">This payment window has ended. Start a fresh one, nothing was charged.</p>
//               <button type="button" onClick={() => { setLeft(WINDOW_SECONDS); setBack(false); setLaunched(null); setSheet(true); }} className="btn btn-lime mt-3"><RotateCcw size={15} /> Start again</button>
//             </div>
//           ) : (
//             <button type="button" onClick={() => setSheet(true)} className="btn btn-lime w-full justify-center">
//               {mobile ? <Smartphone size={16} /> : <QrCode size={16} />} {mobile ? `Choose app · Pay ${inr(amount)}` : `Show QR · Pay ${inr(amount)}`} <ChevronRight size={16} />
//             </button>
//           )}
//         </div>
//       </section>

//       {launched && back && !paid && !expired && (
//         <div role="status" className="rounded-2xl border border-lime/30 bg-lime/10 p-5">
//           <p className="font-serif text-xl font-semibold">Did the {launched} payment go through?</p>
//           <p className="mt-1 text-sm text-ivory/70">Check for the green "Payment successful" tick in your UPI app.</p>
//           <div className="mt-4 grid grid-cols-2 gap-3">
//             <button type="button" onClick={() => { setLaunched(null); setBack(false); setSheet(true); }} className="btn btn-ghost justify-center">No, try again</button>
//             <button type="button" onClick={() => { setPaid(true); setBack(false); }} className="btn btn-lime justify-center"><Check size={16} /> Yes, paid</button>
//           </div>
//         </div>
//       )}
//       {paid && (
//         <div role="status" className="flex gap-3 rounded-2xl border border-lime/40 bg-lime/10 p-4 text-sm leading-relaxed text-ivory/85">
//           <Check size={18} className="mt-0.5 shrink-0 text-lime" />
//           <p><span className="font-semibold text-lime">Payment of {inr(amount)} noted.</span> Add your UTR below if you can see it, then tap Review order.</p>
//         </div>
//       )}

//       <div>
//         <label htmlFor="c-utr" className="eyebrow mb-2 block text-ivory/60">UTR / UPI reference number <span className="text-ivory/40">(Optional)</span></label>
//         <input id="c-utr" className={field} value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))} inputMode="numeric" autoComplete="off" placeholder="12-digit number from your UPI app" aria-invalid={!!error} aria-describedby={error ? "e-utr" : undefined} />
//         {error && <p id="e-utr" className="mt-1.5 text-sm text-[#ff8a7a]">{error}</p>}
//         <p className="mt-2 text-xs text-ivory/50">UTR nahi mila toh chhod do, bas WhatsApp par payment screenshot bhej dena.</p>
//       </div>

//       <p className="flex gap-2 rounded-xl bg-lime/10 p-4 text-sm leading-relaxed text-ivory/80"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-lime" /> Money goes straight to the restaurant's UPI account. Your order is confirmed after the restaurant checks your payment. Next, you will send the order on WhatsApp and attach your payment screenshot.</p>

//       <AnimatePresence>
//         {sheet && !expired && (
//           <PaySheet apps={apps} amount={amount} mobile={mobile} qr={qr} choice={choice} setChoice={setChoice}
//             onClose={() => setSheet(false)} onPay={pay} onCopyUpi={() => copy(paymentConfig.upiId, "upi")} copied={copied === "upi"} />
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }



import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";
import { Copy, Check, ShieldCheck, Clock, ChevronRight, QrCode, RotateCcw, Lock, X, Smartphone, Bike, Loader2 } from "lucide-react";
import { inr } from "../lib/format.js";
import { business } from "../config/business.js";
import { paymentConfig, payableAmount, upiUri, upiAppLinks, isMobileDevice, gatewayEnabled, etaLabel } from "../lib/whatsapp.js";

const field = "w-full rounded-xl border border-ivory/15 bg-ivory/[0.06] px-4 py-3 text-[0.95rem] text-ivory placeholder:text-ivory/35 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30";
const WINDOW_SECONDS = 10 * 60;
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/**
 * OFFICIAL APP LOGOS
 * Put the real logo files in:  src/assets/pay/  named  phonepe.png, gpay.png, paytm.png, upi.png
 * (png, webp, jpg, jpeg or svg all work). A missing file shows a coloured letter tile instead.
 */
const logoFiles = import.meta.glob("../assets/pay/*.{png,jpg,jpeg,webp,svg}", { eager: true, query: "?url", import: "default" });
const logoFor = (id) => Object.entries(logoFiles).find(([p]) => new RegExp(`/${id}\\.[a-z]+$`, "i").test(p))?.[1];

function AppLogo({ app, size = 44 }) {
  const box = { width: size, height: size };
  if (app.id === "gateway") {
    return <span className="grid shrink-0 place-items-center rounded-xl bg-lime text-ink" style={box} aria-hidden="true"><ShieldCheck size={size * 0.55} /></span>;
  }
  const src = logoFor(app.id === "any" ? "upi" : app.id);
  return src ? (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1.5" style={box}>
      <img src={src} alt="" className="h-full w-full object-contain" />
    </span>
  ) : (
    <span className="grid shrink-0 place-items-center rounded-xl text-base font-bold text-white" style={{ ...box, background: app.color }} aria-hidden="true">{app.label[0]}</span>
  );
}

/** Razorpay secure checkout (only used when business.payment.razorpayKeyId is set). */
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "https://checkout.razorpay.com/v1/checkout.js";
    el.async = true;
    el.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("load")));
    el.onerror = () => reject(new Error("load"));
    document.head.appendChild(el);
  });
}

const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Checkout window: "Choose how to pay" → "Complete the payment in your app". Opens by itself. */
function CheckoutSheet({ apps, amount, orderId, mobile, qr, choice, setChoice, view, back, busy, failure, left, onClose, onPay, onPaid, onRetry, onCopyUpi, copied }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.querySelector("[data-first]")?.focus(); }, [view]);
  const onKeyDown = (e) => {
    if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
    if (e.key !== "Tab") return;
    const items = [...ref.current.querySelectorAll(FOCUSABLE)];
    const a = items[0], z = items[items.length - 1];
    e.stopPropagation();
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };
  const picked = apps.find((a) => a.id === choice);
  const waiting = view === "waiting";

  return createPortal(
    <motion.div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-[3px]" onClick={waiting ? undefined : onClose} aria-hidden="true" />
      <motion.div
        ref={ref} role="dialog" aria-modal="true" aria-labelledby="pay-sheet-title" onKeyDown={onKeyDown}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-lime/25 bg-forest text-ivory shadow-[0_40px_100px_-20px_rgba(0,0,0,0.95)] sm:rounded-3xl"
      >
        {/* merchant header, like an online checkout */}
        <header className="flex items-center justify-between gap-4 border-b border-ivory/10 bg-ink/40 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{business.name}</p>
            <p className="text-xs text-ivory/50">Order {orderId}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[0.65rem] uppercase tracking-widest text-ivory/50">Amount</p>
              <p id="pay-sheet-title" className="font-serif text-2xl font-semibold leading-none text-lime">{inr(amount)}</p>
            </div>
            <button type="button" data-first onClick={onClose} aria-label="Close payment window" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ivory/20 text-ivory/80 transition hover:border-lime hover:text-lime"><X size={16} /></button>
          </div>
        </header>

        <div className="flex items-center gap-2 border-b border-ivory/10 bg-lime/[0.07] px-5 py-2.5 text-xs text-ivory/75">
          <Bike size={14} className="shrink-0 text-lime" /> Delivery in <span className="font-semibold text-lime">{etaLabel}</span> after confirmation
        </div>

        {waiting ? (
          <div className="flex-1 overflow-y-auto px-6 py-8 text-center">
            {picked && <div className="mx-auto w-fit"><AppLogo app={picked} size={64} /></div>}
            {back ? (
              <>
                <h3 className="mt-5 font-serif text-2xl font-semibold">Did the payment go through?</h3>
                <p className="mt-2 text-sm text-ivory/65">Look for the green "Payment successful" tick in {picked?.label}.</p>
              </>
            ) : (
              <>
                <Loader2 size={22} className="mx-auto mt-5 animate-spin text-lime motion-reduce:animate-none" aria-hidden="true" />
                <h3 className="mt-3 font-serif text-2xl font-semibold">Complete the payment in {picked?.label}</h3>
                <p className="mt-2 text-sm text-ivory/65">Approve {inr(amount)} with your UPI PIN. Then come back here.</p>
              </>
            )}
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs tabular-nums text-ivory/50"><Clock size={13} /> Request valid for {mmss(Math.max(0, left))}</p>
          </div>
        ) : mobile ? (
          <div role="radiogroup" aria-label="Payment option" className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
            <p className="eyebrow text-ivory/55">Pay with UPI</p>
            {apps.map((a) => {
              const on = choice === a.id;
              return (
                <button key={a.id} type="button" role="radio" aria-checked={on} onClick={() => setChoice(a.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${on ? "border-lime bg-lime/10" : "border-ivory/15 hover:border-ivory/40"}`}>
                  <AppLogo app={a} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.95rem] font-semibold">{a.label}</span>
                    <span className="block text-xs text-ivory/55">{a.sub}</span>
                  </span>
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-lime bg-lime" : "border-ivory/30"}`} aria-hidden="true">{on && <Check size={12} className="text-ink" />}</span>
                </button>
              );
            })}
            {failure && <p role="alert" className="rounded-xl border border-[#ff8a7a]/40 p-3 text-sm text-[#ff8a7a]">{failure}</p>}
            <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-ivory/45"><Lock size={12} /> 100% secure UPI. Money goes straight to the restaurant.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {gatewayEnabled && (
              <>
                <button type="button" onClick={() => onPay(apps.find((a) => a.id === "gateway"))} disabled={busy} className="btn btn-lime w-full justify-center">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Pay {inr(amount)} · Secure checkout
                </button>
                {failure && <p role="alert" className="mt-3 rounded-xl border border-[#ff8a7a]/40 p-3 text-sm text-[#ff8a7a]">{failure}</p>}
                <p className="my-4 text-center text-xs uppercase tracking-widest text-ivory/40">or scan QR</p>
              </>
            )}
            <div className="text-center">
              <div className="mx-auto grid h-[210px] w-[210px] place-items-center rounded-2xl bg-white p-2.5">
                {qr ? <img src={qr} alt={`UPI QR code for ${inr(amount)}`} className="h-full w-full" /> : <span className="text-xs text-ink/60">Making QR…</span>}
              </div>
              <p className="mt-4 text-sm text-ivory/75">Open PhonePe, Google Pay, Paytm or any UPI app on your phone → Scan → pay {inr(amount)}.</p>
              <div className="mt-4 flex items-center justify-center gap-3">{apps.filter((a) => a.id !== "gateway").slice(0, 3).map((a) => <AppLogo key={a.id} app={a} size={36} />)}</div>
              <button type="button" onClick={onCopyUpi} className="mt-5 inline-flex items-center gap-2 rounded-full border border-ivory/15 px-4 py-2 text-xs text-ivory/80 transition hover:border-lime hover:text-lime">
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "UPI ID copied" : paymentConfig.upiId}
              </button>
            </div>
          </div>
        )}

        <footer className="grid grid-cols-2 gap-3 border-t border-ivory/10 bg-ink/40 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {waiting ? (
            <>
              <button type="button" onClick={onRetry} className="btn btn-ghost justify-center">Another app</button>
              <button type="button" onClick={onPaid} className="btn btn-lime justify-center"><Check size={16} /> I have paid</button>
            </>
          ) : mobile ? (
            <>
              <button type="button" onClick={onClose} className="btn btn-ghost justify-center">Cancel</button>
              <button type="button" onClick={() => onPay(picked)} disabled={busy} className="btn btn-lime justify-center">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />} Pay {inr(amount)}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="btn btn-ghost justify-center">Close</button>
              <button type="button" onClick={onPaid} className="btn btn-lime justify-center"><Check size={16} /> I have paid</button>
            </>
          )}
        </footer>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/** Pay half or full by UPI. A checkout window opens by itself with PhonePe / Google Pay / Paytm / any UPI app (and Razorpay secure checkout if configured). */
export default function PaymentStep({ subtotal, plan, setPlan, utr, setUtr, orderId, error }) {
  const amount = payableAmount(subtotal, plan);
  const uri = upiUri({ amount, orderId });
  const apps = useMemo(() => {
    const list = upiAppLinks({ amount, orderId });
    return gatewayEnabled
      ? [{ id: "gateway", label: "Secure checkout", sub: "UPI apps, confirmed automatically", color: "#8bcb35", href: "" }, ...list]
      : list;
  }, [amount, orderId]);
  const mobile = useMemo(isMobileDevice, []);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState("");
  const [left, setLeft] = useState(WINDOW_SECONDS);
  const [sheet, setSheet] = useState(true);
  const [view, setView] = useState("choose");
  const [choice, setChoice] = useState(gatewayEnabled ? "gateway" : "phonepe");
  const [launched, setLaunched] = useState(null);
  const [back, setBack] = useState(false);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const gatewayRef = /^pay_/.test(utr);

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(uri, { margin: 1, width: 360, color: { dark: "#0a1a10", light: "#ffffff" } })
      .then((u) => live && setQr(u)).catch(() => live && setQr(""));
    return () => { live = false; };
  }, [uri]);

  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  useEffect(() => {
    if (!launched) return undefined;
    const on = () => { if (document.visibilityState === "visible") setBack(true); };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [launched]);

  useEffect(() => { setPaid(false); setBack(false); setLaunched(null); setView("choose"); setLeft(WINDOW_SECONDS); }, [amount]);

  async function copy(text, key) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 2000); } catch { /* ignore */ }
  }

  async function openGateway() {
    setBusy(true); setFailure("");
    try {
      const Razorpay = await loadRazorpay();
      const rzp = new Razorpay({
        key: paymentConfig.razorpayKeyId,
        amount: Math.round(amount * 100),
        currency: "INR",
        name: business.name,
        description: `Order ${orderId}`,
        notes: { order_id: orderId },
        theme: { color: "#8bcb35" },
        method: { upi: true, card: false, netbanking: false, wallet: false, emi: false, paylater: false },
        handler: (r) => { setUtr(r.razorpay_payment_id); setPaid(true); setSheet(false); setBusy(false); },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (r) => { setFailure(r?.error?.description || "Payment failed. Please try again."); setBusy(false); });
      rzp.open();
    } catch {
      setFailure("Could not open secure checkout. Check your internet and try again, or use another option.");
      setBusy(false);
    }
  }

  function pay(app) {
    if (!app) return;
    if (app.id === "gateway") return openGateway();
    setLaunched(app.label); setBack(false); setView("waiting");
    window.location.href = app.href;
  }

  const closeSheet = () => { setSheet(false); setView("choose"); };
  const markPaid = () => { setPaid(true); setBack(false); closeSheet(); };
  const retry = () => { setLaunched(null); setBack(false); setView("choose"); };
  const reopen = () => { setView("choose"); setSheet(true); };

  const expired = left <= 0;
  const plans = [["half", `Half (${paymentConfig.halfPercent}%)`, payableAmount(subtotal, "half")], ["full", "Full", subtotal]];

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="eyebrow mb-3 text-ivory/60">How much do you want to pay now?</legend>
        <div className="grid grid-cols-2 gap-3">
          {plans.map(([v, label, amt]) => (
            <label key={v} className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lime ${plan === v ? "border-lime bg-lime/10 text-lime" : "border-ivory/15 text-ivory/75 hover:border-ivory/40"}`}>
              <input type="radio" name="plan" value={v} checked={plan === v} onChange={() => setPlan(v)} className="sr-only" />
              <span className="block">{label}</span>
              <span className="mt-0.5 block font-serif text-2xl font-semibold">{inr(amt)}</span>
            </label>
          ))}
        </div>
        {amount < subtotal && <p className="mt-2 text-xs text-ivory/55">Balance {inr(subtotal - amount)} is paid at delivery. Delivery charge, if any, is extra.</p>}
      </fieldset>

      <section aria-label="Pay with UPI" className="overflow-hidden rounded-2xl border border-ivory/10 bg-ink/40">
        <div className="flex items-center justify-between gap-3 border-b border-ivory/10 px-5 py-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-ivory/60"><Lock size={13} className="text-lime" /> Secure UPI payment</span>
          <span className={`inline-flex items-center gap-1.5 tabular-nums ${expired ? "text-[#ff8a7a]" : left < 60 ? "text-[#ffb36b]" : "text-ivory/60"}`} role="timer" aria-live="off">
            <Clock size={13} /> {expired ? "Time over" : `Pay within ${mmss(left)}`}
          </span>
        </div>

        <div className="px-5 py-6 text-center">
          <p className="text-xs uppercase tracking-widest text-ivory/55">You are paying</p>
          <p className="mt-1 font-serif text-5xl font-semibold text-lime">{inr(amount)}</p>
          <p className="mt-2 text-sm text-ivory/75">to {paymentConfig.payeeName}</p>
          <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-lime/10 px-3.5 py-1.5 text-xs text-ivory/85"><Bike size={14} className="text-lime" /> Delivery in <span className="font-semibold text-lime">{etaLabel}</span></p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => copy(paymentConfig.upiId, "upi")} className="inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3.5 py-1.5 text-xs text-ivory/80 transition hover:border-lime hover:text-lime">
              {copied === "upi" ? <Check size={13} /> : <Copy size={13} />} {copied === "upi" ? "UPI ID copied" : paymentConfig.upiId}
            </button>
            {paymentConfig.payPhone && (
              <button type="button" onClick={() => copy(paymentConfig.payPhone, "ph")} className="inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3.5 py-1.5 text-xs text-ivory/80 transition hover:border-lime hover:text-lime">
                {copied === "ph" ? <Check size={13} /> : <Smartphone size={13} />} {copied === "ph" ? "Number copied" : `PhonePe / GPay: ${paymentConfig.payPhone}`}
              </button>
            )}
          </div>
          <p className="mt-3 text-[0.7rem] text-ivory/45">Order ID <span className="font-semibold text-ivory/70">{orderId}</span> is added to the payment note.</p>
        </div>

        <div className="border-t border-ivory/10 px-5 py-5">
          {expired ? (
            <div className="text-center">
              <p className="text-sm text-ivory/70">This payment window has ended. Start a fresh one, nothing was charged.</p>
              <button type="button" onClick={() => { setLeft(WINDOW_SECONDS); setBack(false); setLaunched(null); reopen(); }} className="btn btn-lime mt-3"><RotateCcw size={15} /> Start again</button>
            </div>
          ) : (
            <button type="button" onClick={reopen} className="btn btn-lime w-full justify-center">
              {mobile ? <Smartphone size={16} /> : <QrCode size={16} />} {mobile ? `Pay ${inr(amount)} · PhonePe / GPay` : `Pay ${inr(amount)} · Scan QR`} <ChevronRight size={16} />
            </button>
          )}
        </div>
      </section>

      {paid && (
        <div role="status" className="flex gap-3 rounded-2xl border border-lime/40 bg-lime/10 p-4 text-sm leading-relaxed text-ivory/85">
          <Check size={18} className="mt-0.5 shrink-0 text-lime" />
          <p><span className="font-semibold text-lime">Payment of {inr(amount)} noted.</span> {gatewayRef ? `Reference ${utr} added automatically.` : "Add your UTR below if you can see it,"} Tap Review order to continue.</p>
        </div>
      )}

      <div>
        <label htmlFor="c-utr" className="eyebrow mb-2 block text-ivory/60">UTR / UPI reference number <span className="text-ivory/40">(Optional)</span></label>
        <input id="c-utr" className={field} value={utr} readOnly={gatewayRef} onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))} inputMode="numeric" autoComplete="off" placeholder="12-digit number from your UPI app" aria-invalid={!!error} aria-describedby={error ? "e-utr" : undefined} />
        {error && <p id="e-utr" className="mt-1.5 text-sm text-[#ff8a7a]">{error}</p>}
        <p className="mt-2 text-xs text-ivory/50">UTR nahi mila toh chhod do, bas WhatsApp par payment screenshot bhej dena.</p>
      </div>

      <p className="flex gap-2 rounded-xl bg-lime/10 p-4 text-sm leading-relaxed text-ivory/80"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-lime" /> Money goes straight to the restaurant's UPI account. Your order is confirmed after the restaurant checks your payment. Next, you will send the order on WhatsApp and attach your payment screenshot.</p>

      <AnimatePresence>
        {sheet && !expired && (
          <CheckoutSheet apps={apps} amount={amount} orderId={orderId} mobile={mobile} qr={qr} choice={choice} setChoice={setChoice}
            view={view} back={back} busy={busy} failure={failure} left={left}
            onClose={closeSheet} onPay={pay} onPaid={markPaid} onRetry={retry} onCopyUpi={() => copy(paymentConfig.upiId, "upi")} copied={copied === "upi"} />
        )}
      </AnimatePresence>
    </div>
  );
}