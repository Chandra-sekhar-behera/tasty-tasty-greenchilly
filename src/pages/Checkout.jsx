import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

const SESSION = "gc-pay-session";
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

function PayWindow({ app, apps, slow, mobile, amount, orderId, qr, left, back, utr, setUtr, utrErr, onPaid, onCancel, copied, onCopy }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const expired = left <= 0;
  return (
    <motion.div className="fixed inset-0 z-[300] flex items-end justify-center bg-ink/85 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="pw-title"
        onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ duration: 0.25 }}
        className="flex max-h-[96dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-lime/25 bg-forest shadow-2xl outline-none sm:rounded-3xl"
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
                <><Loader2 size={22} className="mx-auto mt-5 animate-spin text-lime" aria-hidden="true" /><h2 id="pw-title" className="mt-3 font-serif text-2xl font-semibold">Complete payment in {app.label}</h2><p className="mt-2 text-sm text-ivory/65">Approve {inr(amount)} with your UPI PIN, then come back.</p>
                  {slow && (
                    <div role="status" className="mt-4 rounded-xl border border-ivory/15 bg-ink/50 p-4 text-left text-sm text-ivory/75">
                      <p className="font-semibold text-ivory">{app.label} didn't open?</p>
                      <p className="mt-1"><a href={app.href} className="text-lime underline">Tap here to try again</a> or copy UPI ID: <button type="button" onClick={onCopy} className="font-semibold text-lime underline">{copied ? "Copied" : paymentConfig.upiId}</button></p>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <h2 id="pw-title" className="font-serif text-2xl font-semibold">Scan &amp; pay {inr(amount)}</h2>
              <div className="mx-auto mt-4 grid h-[200px] w-[200px] place-items-center rounded-2xl bg-white p-2">
                {qr ? <img src={qr} alt="UPI QR" className="h-full w-full" /> : <span className="text-xs text-ink/60">Making QR…</span>}
              </div>
              <div className="mt-5 rounded-xl border border-ivory/10 p-4 text-left">
                <p className="text-xs text-ivory/60">Pay via desktop app:</p>
                <div className="mt-3 space-y-2">
                  {apps.filter((a) => a.id !== "any").map((a) => (
                    <a key={a.id} href={a.href} className="flex items-center gap-3 rounded-xl border border-ivory/15 bg-ivory/[0.04] p-2 text-sm font-semibold hover:border-lime">
                      <PayLogo id={a.id} size={32} /> Pay via {a.label}
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
          {!expired && <p className="mt-4 inline-flex items-center gap-1.5 text-xs tabular-nums text-ivory/50"><Clock size={13} /> Valid for {mmss(left)}</p>}

          {!expired && (
            <div className="mt-5 text-left">
              <label htmlFor="pw-utr" className="eyebrow mb-2 block text-ivory/55">UTR / Reference <span className="text-ivory/35">(optional)</span></label>
              <input id="pw-utr" className={field} value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))} inputMode="numeric" placeholder="12-digit number" />
              {utrErr && <p role="alert" className="mt-1.5 text-sm text-[#ff8a7a]">{utrErr}</p>}
            </div>
          )}
        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-ivory/10 bg-ink/40 px-5 py-4">
          <button type="button" onClick={onCancel} className="btn btn-ghost justify-center">{expired ? "Close" : "Cancel"}</button>
          {expired ? <button type="button" onClick={onCancel} className="btn btn-lime justify-center"><RotateCcw size={15} /> Retry</button> : <button type="button" onClick={onPaid} className="btn btn-lime justify-center"><Check size={16} /> I Have Paid</button>}
        </footer>
      </motion.div>
    </motion.div>
  );
}

function Placed({ orderId, mode, sentAt, paidNow, balance, waUrl, onDone }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const win = etaWindow(sentAt);
  const delivery = mode === "delivery";
  const total = (delivery ? deliveryEta.max : 20) * 60000;
  const pct = Math.min(100, Math.max(4, ((now - sentAt) / total) * 100));
  return (
    <div className="mx-auto w-full max-w-xl space-y-5 px-5 py-8 text-center">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime/15 text-lime ring-1 ring-lime/40"><Check size={40} /></span>
      <h1 className="font-serif text-4xl font-semibold">Order sent!</h1>
      <p className="text-sm text-ivory/60">Order ID <span className="font-semibold text-ivory">{orderId}</span></p>
      <div className="rounded-2xl border border-lime/30 bg-forest/70 p-6">
        <p className="text-xs uppercase tracking-widest text-ivory/60">Estimated {delivery ? "delivery" : "ready time"}</p>
        <p className="mt-1 font-serif text-4xl font-semibold text-lime">{delivery ? etaLabel : "~20 minutes"}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ivory/10"><div className="h-full bg-lime transition-all duration-700" style={{ width: `${pct}%` }} /></div>
      </div>
      <button type="button" onClick={onDone} className="btn btn-lime w-full">Back to menu</button>
    </div>
  );
}

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
  const [stage, setStage] = useState(resume && lines.length ? "waiting" : "form");
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
  
  // Optimized: Save to localStorage only on field blur instead of every keystroke
  const handleBlurSave = useCallback(() => {
    try { localStorage.setItem(SAVED, JSON.stringify({ name: form.name, phone: form.phone, address: form.address })); } catch { /* ignore */ }
  }, [form.name, form.phone, form.address]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(uri, { margin: 1, width: 300, color: { dark: "#0a1a10", light: "#ffffff" } }).then((u) => live && setQr(u)).catch(() => {});
    return () => { live = false; };
  }, [uri]);

  useEffect(() => {
    if (stage !== "waiting" || left <= 0) return undefined;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, left]);

  function validate() {
    const errs = validateOrder(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById("details")?.scrollIntoView({ behavior: "smooth" });
      return false;
    }
    if (!orderStatus.open) { setSendErr(orderStatus.long); return false; }
    return true;
  }

  function sendWhatsApp() {
    markOrderSent(orderId);
    clearSession();
    setSentAt(Date.now());
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setStage("done");
  }

  function placeOrder(which) {
    const ch = typeof which === "string" ? which : choice;
    if (!validate()) return;
    if (!mustPay) return sendWhatsApp();
    setChoice(ch);
    setBack(false); setLeft(WINDOW_SECONDS); setUtrErr(""); setStage("waiting");
    try { sessionStorage.setItem(SESSION, JSON.stringify({ orderId, plan, choice: ch, form, at: Date.now() })); } catch {}
    const app = apps.find((a) => a.id === ch);
    if (ch !== "qr" && app) window.location.href = app.href;
  }

  if (stage === "form" && lines.length === 0) {
    return (
      <div className="grid min-h-[80vh] place-items-center px-6 pt-24 text-center">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full text-lime"><ShoppingBag size={36} /></span>
          <h1 className="mt-4 font-serif text-4xl font-semibold">Your order is empty</h1>
          <Link to="/menu" className="btn btn-lime mt-8">Browse the menu <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  if (stage === "done") return <Placed orderId={orderId} mode={form.mode} sentAt={sentAt || Date.now()} paidNow={payment ? payment.amount : 0} balance={payment ? Math.max(0, subtotal - payment.amount) : 0} waUrl={waUrl} onDone={() => { clearSession(); clear(); navigate("/menu"); }} />;

  const payLabel = !mustPay ? "Place order" : `Pay ${inr(amount)}`;

  return (
    <div className="min-h-screen bg-ink pb-32 lg:pb-12">
      <header className="sticky top-0 z-40 border-b border-ivory/10 bg-forest/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate("/menu")} className="grid h-10 w-10 place-items-center rounded-full border border-ivory/20 text-ivory hover:text-lime"><ArrowLeft size={18} /></button>
            <h1 className="font-serif text-2xl font-semibold">Checkout</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5" onBlur={handleBlurSave}>
          <Card icon={delivery ? Bike : Store} title={delivery ? "Delivery" : "Pickup"}>
            {canPickup && canDeliver && (
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-ink/60 p-1">
                {[["delivery", "Delivery", Bike], ["pickup", "Pickup", Store]].map(([v, l, Icon]) => (
                  <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, mode: v }))} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium ${form.mode === v ? "bg-lime text-ink" : "text-ivory/70"}`}><Icon size={16} /> {l}</button>
                ))}
              </div>
            )}
          </Card>

          <Card id="details" icon={MapPin} title="Your details">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="eyebrow mb-2 block text-ivory/60">Name</label>
                <input className={field} value={form.name} onChange={set("name")} placeholder="Your name" />
                {errors.name && <p className="mt-1 text-sm text-[#ff8a7a]">{errors.name}</p>}
              </div>
              <div>
                <label className="eyebrow mb-2 block text-ivory/60">Mobile Number</label>
                <input className={field} value={form.phone} onChange={set("phone")} inputMode="tel" placeholder="10-digit mobile" />
                {errors.phone && <p className="mt-1 text-sm text-[#ff8a7a]">{errors.phone}</p>}
              </div>
            </div>
            {delivery && (
              <div className="mt-4">
                <label className="eyebrow mb-2 block text-ivory/60">Full Address</label>
                <textarea rows={3} className={field} value={form.address} onChange={set("address")} placeholder="House no, street, landmark" />
                {errors.address && <p className="mt-1 text-sm text-[#ff8a7a]">{errors.address}</p>}
              </div>
            )}
          </Card>

          <Card icon={ShoppingBag} title="Your order">
            <ul className="divide-y divide-ivory/10">
              {lines.map(({ id, qty }) => {
                const it = menuById[id];
                return (
                  <li key={id} className="flex items-center gap-3 py-3">
                    <VegMark veg={it.veg} />
                    <span className="flex-1 font-medium">{it.name}</span>
                    <QtyStepper qty={qty} name={it.name} onChange={(q) => setQty(id, q)} />
                    <span className="font-semibold">{inr(it.price * qty)}</span>
                    <button type="button" onClick={() => remove(id)} className="text-ivory/40 hover:text-[#ff8a7a]"><Trash2 size={16} /></button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card icon={ShieldCheck} title="Payment">
            <PaymentOptions apps={apps} amount={amount} choice={choice} onPay={placeOrder} disabled={belowMin || !orderStatus.open} busy={busy} gateway={gatewayEnabled} />
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card icon={Receipt} title="Bill details">
            <div className="space-y-2.5 text-sm">
              <Row label={`Item total (${count})`} value={inr(subtotal)} />
              <Row label="Grand total" value={inr(subtotal)} strong />
              {mustPay && <Row label="To pay now" value={inr(amount)} accent />}
            </div>
            <button type="button" onClick={() => placeOrder()} disabled={belowMin || !orderStatus.open || busy} className="btn btn-lime mt-5 w-full justify-center">
              {payLabel} <ChevronRight size={16} />
            </button>
          </Card>
        </aside>
      </div>

      <AnimatePresence>
        {stage === "waiting" && (
          <PayWindow app={picked || apps[0]} apps={apps} slow={slow} mobile={!viaQr} amount={amount} orderId={orderId} qr={qr} left={left} back={back}
            utr={utr} setUtr={setUtr} utrErr={utrErr} onPaid={() => sendWhatsApp()} copied={copied} onCopy={() => navigator.clipboard.writeText(paymentConfig.upiId)}
            onCancel={() => { clearSession(); setStage("form"); }} />
        )}
      </AnimatePresence>
    </div>
  );
}