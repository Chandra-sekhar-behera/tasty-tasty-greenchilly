import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";
import {
  ArrowLeft, ArrowRight, Bike, Store, Clock, MapPin, LocateFixed, Lock, ShieldCheck, Check, X, Copy,
  ChevronRight, Loader2, ShoppingBag, Trash2, RotateCcw, Smartphone, User, Phone, StickyNote, Receipt,
} from "lucide-react";
import WhatsAppIcon from "../components/WhatsAppIcon.jsx";
import PayLogo from "../components/PayLogo.jsx";
import PaymentOptions from "../components/PaymentOptions.jsx";
import QtyStepper from "../components/QtyStepper.jsx";
import VegMark from "../components/VegMark.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useOrderStatus } from "../lib/orderHours.js";
import { menuById, useMenuVersion } from "../lib/menuStore.js";
import { usePageTitle } from "../lib/hooks.js";
import { inr } from "../lib/format.js";
import { business } from "../config/business.js";
import {
  buildOrderMessage, buildWhatsAppUrl, validateOrder, normalizePhone, paymentConfig, needsPayment, payableAmount,
  makeOrderId, isValidUtr, cooldownLeft, markOrderSent, upiUri, upiAppLinks, isMobileDevice, gatewayEnabled,
  etaLabel, etaWindow, deliveryEta,
} from "../lib/whatsapp.js";

const canPickup = business.ordering.pickup;
const canDeliver = business.ordering.delivery;
const SAVED = "gc-checkout-details";
const WINDOW_SECONDS = 10 * 60;
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const field = "w-full rounded-xl border border-ivory/15 bg-ivory/[0.06] px-4 py-3 text-[0.95rem] text-ivory placeholder:text-ivory/35 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30";

const SESSION = "gc-pay-session"; // keeps the payment step alive when the UPI app sends you back to a reloaded tab
const readSession = () => { try { const s = JSON.parse(sessionStorage.getItem(SESSION) || "null"); return s && Date.now() - s.at < WINDOW_SECONDS * 1000 ? s : null; } catch { return null; } };
const clearSession = () => { try { sessionStorage.removeItem(SESSION); } catch { /* ignore */ } };

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED) || "{}") || {}; } catch { return {}; }
}

function Card({ icon: Icon, title, children, aside, id }) {
  return (
    <section id={id} className="rounded-2xl border border-ivory/10 bg-forest/70 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-serif text-xl font-semibold">
          {Icon && <span className="grid h-8 w-8 place-items-center rounded-full bg-lime/15 text-lime"><Icon size={16} /></span>}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, strong, accent }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "border-t border-dashed border-ivory/20 pt-3 font-semibold" : "text-ivory/75"}`}>
      <span className={strong ? "text-ivory" : ""}>{label}</span>
      <span className={`tabular-nums ${accent ? "text-lime" : ""}`}>{value}</span>
    </div>
  );
}

/* ---------- full-screen "complete your payment" window ---------- */
function PayWindow({ app, apps, slow, mobile, amount, orderId, qr, left, back, utr, setUtr, utrErr, onPaid, onCancel, copied, onCopy }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const expired = left <= 0;
  return (
    <motion.div className="fixed inset-0 z-[300] flex items-end justify-center bg-ink/85 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="pw-title"
        onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex max-h-[96dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-lime/25 bg-forest shadow-[0_40px_100px_-20px_rgba(0,0,0,0.95)] outline-none sm:rounded-3xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-ivory/10 bg-ink/40 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{business.name}</p>
            <p className="text-xs text-ivory/50">Order {orderId}</p>
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] uppercase tracking-widest text-ivory/50">To pay</p>
            <p className="font-serif text-2xl font-semibold leading-none text-lime">{inr(amount)}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-7 text-center">
          {mobile ? (
            <>
              <div className="mx-auto w-fit"><PayLogo id={app.id} size={68} /></div>
              {expired ? (
                <><h2 id="pw-title" className="mt-5 font-serif text-2xl font-semibold">Payment window ended</h2><p className="mt-2 text-sm text-ivory/65">Nothing was charged. Start again to get a fresh request.</p></>
              ) : back ? (
                <><h2 id="pw-title" className="mt-5 font-serif text-2xl font-semibold">Did the payment go through?</h2><p className="mt-2 text-sm text-ivory/65">Look for the green "Payment successful" tick in {app.label}.</p></>
              ) : (
                <><Loader2 size={22} className="mx-auto mt-5 animate-spin text-lime motion-reduce:animate-none" aria-hidden="true" /><h2 id="pw-title" className="mt-3 font-serif text-2xl font-semibold">Complete the payment in {app.label}</h2><p className="mt-2 text-sm text-ivory/65">Approve {inr(amount)} with your UPI PIN, then come back here.</p>
                  {slow && (
                    <div role="status" className="mt-4 rounded-xl border border-ivory/15 bg-ink/50 p-4 text-left text-sm leading-relaxed text-ivory/75">
                      <p className="font-semibold text-ivory">{app.label} did not open?</p>
                      <p className="mt-1">Make sure the app is installed, or <a href={app.href} className="text-lime underline">tap here to try again</a>. You can also pay manually to <button type="button" onClick={onCopy} className="font-semibold text-lime underline">{copied ? "UPI ID copied" : paymentConfig.upiId}</button> and come back.</p>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <h2 id="pw-title" className="font-serif text-2xl font-semibold">Scan &amp; pay {inr(amount)}</h2>
              <div className="mx-auto mt-4 grid h-[220px] w-[220px] place-items-center rounded-2xl bg-white p-2.5">
                {qr ? <img src={qr} alt={`UPI QR code for ${inr(amount)}`} className="h-full w-full" /> : <span className="text-xs text-ink/60">Making QR…</span>}
              </div>
              <p className="mt-4 text-sm text-ivory/70">Open PhonePe, Google Pay, Paytm or any UPI app → Scan → approve.</p>
              <div className="mt-5 rounded-xl border border-ivory/10 p-4">
                <p className="text-xs text-ivory/60">On this phone? You cannot scan your own screen. Tap your app:</p>
                <div className="mt-3 space-y-2.5">
                  {apps.filter((a) => a.id !== "any").map((a) => (
                    <a key={a.id} href={a.href} className="flex items-center gap-3 rounded-xl border border-ivory/15 bg-ivory/[0.04] p-2.5 text-left transition hover:border-lime active:scale-[0.99]">
                      <PayLogo id={a.id} size={38} />
                      <span className="flex-1 text-sm font-semibold">Pay via {a.label}</span>
                      <ChevronRight size={16} className="text-ivory/40" />
                    </a>
                  ))}
                </div>
              </div>
              <button type="button" onClick={onCopy} className="mt-4 inline-flex items-center gap-2 rounded-full border border-ivory/15 px-4 py-2 text-xs text-ivory/80 transition hover:border-lime hover:text-lime">
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "UPI ID copied" : paymentConfig.upiId}
              </button>
            </>
          )}
          {!expired && <p className="mt-4 inline-flex items-center gap-1.5 text-xs tabular-nums text-ivory/50"><Clock size={13} /> Valid for {mmss(left)}</p>}

          {!expired && (
            <div className="mt-5 text-left">
              <label htmlFor="pw-utr" className="eyebrow mb-2 block text-ivory/55">UTR / reference <span className="text-ivory/35">(optional)</span></label>
              <input id="pw-utr" className={field} value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))} inputMode="numeric" autoComplete="off" placeholder="12-digit number, or skip and send a screenshot" aria-invalid={!!utrErr} />
              {utrErr && <p role="alert" className="mt-1.5 text-sm text-[#ff8a7a]">{utrErr}</p>}
            </div>
          )}
        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-ivory/10 bg-ink/40 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onCancel} className="btn btn-ghost justify-center">{expired ? "Close" : mobile ? "Another app" : "Cancel"}</button>
          {expired
            ? <button type="button" onClick={onCancel} className="btn btn-lime justify-center"><RotateCcw size={15} /> Try again</button>
            : <button type="button" onClick={onPaid} className="btn btn-lime justify-center"><Check size={16} /> I have paid</button>}
        </footer>
      </motion.div>
    </motion.div>
  );
}

/* ---------- order placed ---------- */
function Placed({ orderId, mode, sentAt, paidNow, balance, waUrl, onDone }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 20000); return () => clearInterval(t); }, []);
  const win = etaWindow(sentAt);
  const delivery = mode === "delivery";
  const total = (delivery ? deliveryEta.max : 20) * 60000;
  const pct = Math.min(100, Math.max(4, ((now - sentAt) / total) * 100));
  const steps = delivery
    ? [["Order sent to the restaurant", "Just now", true], ["Restaurant confirms & checks payment", "within ~5 min", false], ["Your food is cooked fresh", "~15 min", false], ["Out for delivery", "~10 min", false], ["Delivered to your door", `${win.from} – ${win.to}`, false]]
    : [["Order sent to the restaurant", "Just now", true], ["Restaurant confirms your order", "within ~5 min", false], ["Ready for pickup / dine-in", "~20 min", false]];
  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-5 py-8">
      <div className="text-center">
        <motion.span initial={{ scale: 0.4, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 240, damping: 14 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime/15 text-lime ring-1 ring-lime/40"><Check size={40} /></motion.span>
        <h1 className="mt-5 font-serif text-4xl font-semibold">Order sent!</h1>
        <p className="mt-1 text-sm text-ivory/60">Order ID <span className="font-semibold text-ivory">{orderId}</span></p>
      </div>
      <div className="rounded-2xl border border-lime/30 bg-gradient-to-br from-heritage/70 to-ink/70 p-6 text-center">
        <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-ivory/60"><Clock size={13} /> {delivery ? "Estimated delivery" : "Estimated ready time"}</p>
        <p className="mt-1 font-serif text-5xl font-semibold text-lime">{delivery ? etaLabel : "~20 minutes"}</p>
        {delivery && <p className="mt-1 text-sm text-ivory/70">Usually by {win.from} – {win.to}</p>}
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-ivory/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Estimated progress"><div className="h-full rounded-full bg-lime transition-all duration-700" style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-[0.7rem] text-ivory/45">Estimate. The clock starts once the restaurant confirms your order.</p>
      </div>
      <section aria-label="Order progress" className="rounded-2xl border border-ivory/10 bg-forest/70 p-5">
        <ol>
          {steps.map(([t, when, done], i) => (
            <li key={t} className="relative flex gap-3 pb-5 last:pb-0">
              {i < steps.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-px bg-ivory/15" aria-hidden="true" />}
              <span className={`relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold ${done ? "bg-lime text-ink" : "border border-ivory/25 text-ivory/50"}`}>{done ? <Check size={13} /> : i + 1}</span>
              <div className="min-w-0 flex-1"><p className={`text-sm ${done ? "font-semibold" : "text-ivory/75"}`}>{t}</p><p className="text-xs text-ivory/45">{when}</p></div>
            </li>
          ))}
        </ol>
      </section>
      {paidNow > 0 && <p className="rounded-xl border border-ivory/10 p-4 text-sm leading-relaxed text-ivory/75">Attach your <span className="font-semibold text-ivory">payment screenshot</span> in the WhatsApp chat so we can verify {inr(paidNow)} quickly.{balance > 0 ? ` Balance ${inr(balance)} is paid at delivery.` : ""}</p>}
      <p className="text-center text-xs text-ivory/45">WhatsApp did not open? <a href={waUrl} target="_blank" rel="noopener noreferrer" className="text-lime underline">Open it again</a></p>
      <button type="button" onClick={onDone} className="btn btn-lime w-full">Back to menu</button>
    </div>
  );
}

/* ---------- the page ---------- */
export default function Checkout() {
  useMenuVersion();
  usePageTitle("Checkout");
  const navigate = useNavigate();
  const orderStatus = useOrderStatus();
  const { lines, subtotal, count, setQty, remove, clear } = useCart();
  const saved = useMemo(loadSaved, []);
  const mobile = useMemo(isMobileDevice, []);
  const resume = useMemo(readSession, []);

  const [form, setForm] = useState(resume?.form || { name: saved.name || "", phone: saved.phone || "", address: saved.address || "", note: "", mode: canDeliver ? "delivery" : "pickup" });
  const [location, setLocation] = useState(null);
  const [locState, setLocState] = useState({ busy: false, error: "" });
  const [errors, setErrors] = useState({});
  const [plan, setPlan] = useState(resume?.plan || "half");
  const [choice, setChoice] = useState(resume?.choice || (gatewayEnabled ? "gateway" : mobile ? "phonepe" : "qr"));
  const [utr, setUtr] = useState("");
  const [utrErr, setUtrErr] = useState("");
  const [orderId, setOrderId] = useState(() => resume?.orderId || makeOrderId());
  const [stage, setStage] = useState(resume && lines.length ? "waiting" : "form"); // form | waiting | send | done
  const [left, setLeft] = useState(resume ? Math.max(0, WINDOW_SECONDS - Math.floor((Date.now() - resume.at) / 1000)) : WINDOW_SECONDS);
  const [slow, setSlow] = useState(false);
  const [back, setBack] = useState(Boolean(resume));
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gwError, setGwError] = useState("");
  const [sendErr, setSendErr] = useState("");
  const [sentAt, setSentAt] = useState(null);

  const mustPay = needsPayment(form.mode);
  const amount = payableAmount(subtotal, plan);
  const payment = mustPay ? { plan, amount, utr: utr.replace(/\s/g, "") } : null;
  const apps = useMemo(() => upiAppLinks({ amount, orderId }), [amount, orderId]);
  const uri = upiUri({ amount, orderId });
  const picked = apps.find((a) => a.id === choice);
  const viaQr = choice === "qr";
  const belowMin = paymentConfig.minimumOrder > 0 && subtotal < paymentConfig.minimumOrder;
  const delivery = form.mode === "delivery";

  const customer = { ...form, location: delivery ? location : null };
  const message = useMemo(() => (lines.length ? buildOrderMessage({ lines, customer, orderId, payment }) : ""), [lines, form, location, plan, utr, orderId]);
  const waUrl = message ? buildWhatsAppUrl(message) : "#";
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { try { localStorage.setItem(SAVED, JSON.stringify({ name: form.name, phone: form.phone, address: form.address })); } catch { /* ignore */ } }, [form.name, form.phone, form.address]);

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(uri, { margin: 1, width: 360, color: { dark: "#0a1a10", light: "#ffffff" } }).then((u) => live && setQr(u)).catch(() => live && setQr(""));
    return () => { live = false; };
  }, [uri]);

  useEffect(() => {
    if (stage !== "waiting" || left <= 0) return undefined;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, left]);

  useEffect(() => {
    if (stage !== "waiting" || !mobile) return undefined;
    const on = () => { if (document.visibilityState === "visible") setBack(true); };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, [stage, mobile]);

  // if the UPI app does not open within 3 seconds, tell the customer what to do
  useEffect(() => {
    if (stage !== "waiting" || viaQr) { setSlow(false); return undefined; }
    const t = setTimeout(() => setSlow(true), 3000);
    const gone = () => { if (document.visibilityState === "hidden") { clearTimeout(t); setSlow(false); } };
    document.addEventListener("visibilitychange", gone);
    return () => { clearTimeout(t); document.removeEventListener("visibilitychange", gone); };
  }, [stage, viaQr]);

  function shareLocation() {
    if (!("geolocation" in navigator)) return setLocState({ busy: false, error: "Location is not supported." });
    setLocState({ busy: true, error: "" });
    navigator.geolocation.getCurrentPosition(
      (p) => { setLocation({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }); setLocState({ busy: false, error: "" }); },
      () => setLocState({ busy: false, error: "Location permission denied." }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function validate() {
    const errs = validateOrder(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById("details")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    if (!orderStatus.open) { setSendErr(orderStatus.long); return false; }
    const wait = cooldownLeft(orderId);
    if (wait > 0) { setSendErr(`Please wait ${wait} minute before sending another order.`); return false; }
    setSendErr("");
    return true;
  }

  function sendWhatsApp() {
    if (!orderStatus.open) return setSendErr(orderStatus.long);
    markOrderSent(orderId);
    clearSession();
    setSentAt(Date.now());
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setStage("done");
  }

  async function openGateway() {
    setBusy(true); setGwError("");
    try {
      const Razorpay = await new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve(window.Razorpay);
        const el = document.createElement("script");
        el.src = "https://checkout.razorpay.com/v1/checkout.js"; el.async = true;
        el.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("load")));
        el.onerror = () => reject(new Error("load"));
        document.head.appendChild(el);
      });
      const rzp = new Razorpay({
        key: paymentConfig.razorpayKeyId, amount: Math.round(amount * 100), currency: "INR",
        name: business.name, description: `Order ${orderId}`,
        prefill: { name: form.name.trim(), contact: normalizePhone(form.phone) },
        notes: { order_id: orderId }, theme: { color: "#8bcb35" },
        method: { upi: true, card: false, netbanking: false, wallet: false, emi: false, paylater: false },
        handler: (r) => { setUtr(r.razorpay_payment_id); setBusy(false); setStage("send"); },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (r) => { setGwError(r?.error?.description || "Payment failed. Please try again."); setBusy(false); });
      rzp.open();
    } catch {
      setGwError("Could not open secure checkout. Check your internet and try again, or pick another option.");
      setBusy(false);
    }
  }

  // `which` = the button the customer tapped (phonepe / gpay / paytm / any / qr / gateway). No argument = current selection.
  function placeOrder(which) {
    const ch = typeof which === "string" ? which : choice;
    if (!validate()) return;
    if (!mustPay) return sendWhatsApp();
    setGwError(""); setChoice(ch);
    if (ch === "gateway" && gatewayEnabled) return openGateway();
    setBack(false); setLeft(WINDOW_SECONDS); setUtrErr(""); setStage("waiting");
    try { sessionStorage.setItem(SESSION, JSON.stringify({ orderId, plan, choice: ch, form, at: Date.now() })); } catch { /* ignore */ }
    const app = apps.find((a) => a.id === ch);
    if (ch !== "qr" && app) window.location.href = app.href;
  }

  function paid() {
    if (utr && !isValidUtr(utr)) return setUtrErr("UTR must be 12 digits. Leave it empty if you do not have it.");
    setUtrErr("");
    sendWhatsApp();
  }

  async function copyUpi() {
    try { await navigator.clipboard.writeText(paymentConfig.upiId); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }

  function finish() { clearSession(); clear(); setOrderId(makeOrderId()); setUtr(""); setPlan("half"); navigate("/menu"); }

  /* ---- empty cart ---- */
  if (stage === "form" && lines.length === 0) {
    return (
      <div className="grid min-h-[80vh] place-items-center px-6 pt-24 text-center">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full text-lime"><ShoppingBag size={36} /></span>
          <h1 className="mt-4 font-serif text-4xl font-semibold">Your order is empty</h1>
          <p className="mt-2 text-sm text-ivory/60">Pick something tasty from the menu first.</p>
          <Link to="/menu" className="btn btn-lime mt-8">Browse the menu <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  /* ---- send / done ---- */
  if (stage === "done") {
    return <Placed orderId={orderId} mode={form.mode} sentAt={sentAt || Date.now()} paidNow={payment ? payment.amount : 0} balance={payment ? Math.max(0, subtotal - payment.amount) : 0} waUrl={waUrl} onDone={finish} />;
  }
  if (stage === "send") {
    return (
      <div className="mx-auto w-full max-w-xl space-y-5 px-5 py-10 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime/15 text-lime ring-1 ring-lime/40"><Check size={40} /></span>
        <h1 className="font-serif text-4xl font-semibold">Payment received</h1>
        <p className="text-sm text-ivory/70">{inr(payment?.amount || 0)} paid{utr ? <> · Ref <span className="font-semibold text-ivory">{utr}</span></> : null}. <span className="text-lime">One last step:</span> send your order to the restaurant on WhatsApp so they can start cooking.</p>
        {sendErr && <p role="alert" className="rounded-xl border border-[#ff8a7a]/40 p-3 text-sm text-[#ff8a7a]">{sendErr}</p>}
        <button type="button" onClick={sendWhatsApp} className="btn btn-lime w-full justify-center text-base"><WhatsAppIcon size={18} /> Send order on WhatsApp</button>
      </div>
    );
  }

  /* ---- the checkout form ---- */
  const payLabel = !mustPay ? "Place order" : choice === "gateway" && gatewayEnabled ? `Pay ${inr(amount)} securely` : `Pay ${inr(amount)}`;
  const plans = [["half", `Half (${paymentConfig.halfPercent}%)`, payableAmount(subtotal, "half")], ["full", "Full", subtotal]];

  return (
    <div className="min-h-screen overflow-x-clip bg-ink pb-32 lg:pb-12">
      <header className="sticky top-0 z-40 border-b border-ivory/10 bg-forest/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate("/menu")} aria-label="Back to menu" className="grid h-10 w-10 place-items-center rounded-full border border-ivory/20 transition hover:border-lime hover:text-lime"><ArrowLeft size={18} /></button>
            <div>
              <h1 className="font-serif text-2xl font-semibold leading-none">Checkout</h1>
              <p className="mt-0.5 text-xs text-ivory/50">{business.name} · {count} {count === 1 ? "item" : "items"}</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-ivory/60 sm:inline-flex"><Lock size={13} className="text-lime" /> Safe &amp; secure checkout</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          {/* delivery / pickup + ETA */}
          <Card icon={delivery ? Bike : Store} title={delivery ? "Delivery" : "Pickup / Dine-in"}>
            {canPickup && canDeliver && (
              <div role="radiogroup" aria-label="Order type" className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-ink/60 p-1">
                {[["delivery", "Delivery", Bike], ["pickup", "Pickup / Dine-in", Store]].map(([v, l, Icon]) => (
                  <button key={v} type="button" role="radio" aria-checked={form.mode === v} onClick={() => setForm((f) => ({ ...f, mode: v }))}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${form.mode === v ? "bg-lime text-ink" : "text-ivory/70 hover:text-ivory"}`}>
                    <Icon size={16} /> {l}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-lime/25 bg-lime/10 px-4 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime/20 text-lime">{delivery ? <Bike size={20} /> : <Clock size={20} />}</span>
              <p className="text-sm leading-snug"><span className="font-semibold text-lime">{delivery ? `Delivery in ${etaLabel}` : "Ready in about 20 minutes"}</span><br /><span className="text-xs text-ivory/55">{delivery ? "after the restaurant confirms your order" : "we will confirm the exact time on WhatsApp"}</span></p>
            </div>
          </Card>

          {/* details */}
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
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="c-addr" className="eyebrow mb-2 block text-ivory/60">Full address</label>
                  <textarea id="c-addr" rows={3} className={field} value={form.address} onChange={set("address")} autoComplete="street-address" placeholder="House / plot no., street, landmark" aria-invalid={!!errors.address} />
                  {errors.address && <p role="alert" className="mt-1.5 text-sm text-[#ff8a7a]">{errors.address}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ivory/10 p-3">
                  <button type="button" onClick={shareLocation} disabled={locState.busy} className="btn btn-ghost btn-sm"><LocateFixed size={15} /> {locState.busy ? "Locating…" : location ? "Update location" : "Use my current location"}</button>
                  {location && <span className="text-sm text-lime">Location attached · <button type="button" onClick={() => setLocation(null)} className="underline">Remove</button></span>}
                  {locState.error && <span role="alert" className="text-sm text-[#ff8a7a]">{locState.error}</span>}
                </div>
              </div>
            )}
            <div className="mt-4">
              <label htmlFor="c-note" className="eyebrow mb-2 flex items-center gap-1.5 text-ivory/60"><StickyNote size={12} /> Cooking note (optional)</label>
              <input id="c-note" className={field} value={form.note} onChange={set("note")} maxLength={160} placeholder="Spice level, allergies, etc." />
            </div>
          </Card>

          {/* items */}
          <Card icon={ShoppingBag} title="Your order" aside={<Link to="/menu" className="text-xs uppercase tracking-widest text-lime hover:underline">+ Add items</Link>}>
            <ul className="divide-y divide-ivory/10">
              {lines.map(({ id, qty }) => {
                const it = menuById[id];
                return (
                  <li key={id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3.5">
                    <VegMark veg={it.veg} />
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="font-medium leading-snug">{it.name}</p>
                      <p className="text-xs text-ivory/50">{inr(it.price)} each</p>
                    </div>
                    <QtyStepper qty={qty} name={it.name} onChange={(q) => setQty(id, q)} />
                    <p className="w-16 text-right font-semibold tabular-nums">{inr(it.price * qty)}</p>
                    <button type="button" onClick={() => remove(id)} aria-label={`Remove ${it.name}`} className="text-ivory/40 transition hover:text-[#ff8a7a]"><Trash2 size={16} /></button>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* payment */}
          <Card icon={ShieldCheck} title="Payment" aside={mustPay ? <span className="inline-flex items-center gap-1.5 text-xs text-ivory/55"><Lock size={12} className="text-lime" /> UPI · Secure</span> : null}>
            {mustPay ? (
              <>
                <p className="eyebrow mb-3 text-ivory/55">How much to pay now?</p>
                <div role="radiogroup" aria-label="Amount to pay now" className="grid grid-cols-2 gap-3">
                  {plans.map(([v, label, amt]) => (
                    <button key={v} type="button" role="radio" aria-checked={plan === v} onClick={() => setPlan(v)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${plan === v ? "border-lime bg-lime/10 text-lime" : "border-ivory/15 text-ivory/75 hover:border-ivory/40"}`}>
                      <span className="block">{label}</span>
                      <span className="mt-0.5 block font-serif text-2xl font-semibold">{inr(amt)}</span>
                    </button>
                  ))}
                </div>
                {amount < subtotal && <p className="mt-2 text-xs text-ivory/55">Balance {inr(subtotal - amount)} is paid at delivery.</p>}

                <div className="mt-6">
                  <PaymentOptions apps={apps} amount={amount} choice={choice} onPay={placeOrder} disabled={belowMin || !orderStatus.open} busy={busy} gateway={gatewayEnabled} />
                </div>
                {gwError && <p role="alert" className="mt-3 rounded-xl border border-[#ff8a7a]/40 p-3 text-sm text-[#ff8a7a]">{gwError}</p>}
                <p className="mt-4 flex gap-2 text-xs leading-relaxed text-ivory/55"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-lime" /> Money goes straight to the restaurant's UPI account. Your order is confirmed after the restaurant checks your payment.</p>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-ivory/75">No advance payment needed for pickup / dine-in. Pay <span className="font-semibold text-lime">{inr(subtotal)}</span> at the restaurant.</p>
            )}
          </Card>
        </div>

        {/* bill */}
        <aside className="min-w-0 lg:sticky lg:top-24">
          <Card icon={Receipt} title="Bill details">
            <div className="space-y-2.5 text-sm">
              <Row label={`Item total (${count})`} value={inr(subtotal)} />
              <Row label="Delivery fee" value={delivery ? "Confirmed on WhatsApp" : "None"} />
              <Row label="Grand total" value={inr(subtotal)} strong />
              {mustPay && <Row label="To pay now" value={inr(amount)} accent />}
              {mustPay && amount < subtotal && <Row label="Pay at delivery" value={inr(subtotal - amount)} />}
            </div>
            {belowMin && <p role="alert" className="mt-4 text-sm text-[#ff8a7a]">Minimum order is {inr(paymentConfig.minimumOrder)}. Add {inr(paymentConfig.minimumOrder - subtotal)} more.</p>}
            {!orderStatus.open && <p role="alert" className="mt-4 text-sm text-[#ff8a7a]">{orderStatus.long}</p>}
            {sendErr && orderStatus.open && <p role="alert" className="mt-4 text-sm text-[#ff8a7a]">{sendErr}</p>}
            <div className="hidden lg:block">
              <button type="button" onClick={() => placeOrder()} disabled={belowMin || !orderStatus.open || busy} className="btn btn-lime mt-5 w-full justify-center">
                {busy ? <Loader2 size={16} className="animate-spin" /> : mustPay ? <Smartphone size={16} /> : <WhatsAppIcon size={17} />} {payLabel}
              </button>
            </div>
            <p className="mt-3 hidden text-center text-[0.7rem] text-ivory/45 lg:block">By placing the order you agree the restaurant will confirm availability and the final amount.</p>
          </Card>
        </aside>
      </div>

      {/* sticky bottom bar (phones & tablets) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ivory/10 bg-forest/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        {(!orderStatus.open || sendErr) && <p role="alert" className="mb-2 text-xs text-[#ff8a7a]">{!orderStatus.open ? orderStatus.long : sendErr}</p>}
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-widest text-ivory/50">{mustPay ? "To pay now" : "Total"}</p>
            <p className="font-serif text-2xl font-semibold leading-none text-lime">{inr(mustPay ? amount : subtotal)}</p>
          </div>
          <button type="button" onClick={() => placeOrder()} disabled={belowMin || !orderStatus.open || busy} className="btn btn-lime flex-1 justify-center">
            {busy ? <Loader2 size={16} className="animate-spin" /> : null} {payLabel} <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {stage === "waiting" && (
          <PayWindow app={picked || apps[0]} apps={apps} slow={slow} mobile={!viaQr} amount={amount} orderId={orderId} qr={qr} left={left} back={back}
            utr={utr} setUtr={setUtr} utrErr={utrErr} onPaid={paid} copied={copied} onCopy={copyUpi}
            onCancel={() => { clearSession(); setStage("form"); setBack(false); setSlow(false); setLeft(WINDOW_SECONDS); }} />
        )}
      </AnimatePresence>
    </div>
  );
}