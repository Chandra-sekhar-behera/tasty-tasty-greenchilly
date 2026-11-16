import { lazy, Suspense, useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Bike, Store, Clock, MapPin, Check, ChevronRight, ShoppingBag, Trash2,
  User, Phone, StickyNote, Receipt, Wallet, Plus, Copy, PhoneCall, ShieldCheck, Flame, Navigation, Sparkles,
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
  etaLabel, etaWindow,
} from "../lib/whatsapp.js";

const DeliveryMap = lazy(() => import("../components/DeliveryMap.jsx"));

const LOTTIE_SRC = "https://lottie.host/embed/3176e252-6334-4fcf-8de9-8b2fca91b06f/CtDaGP1Pp3.lottie";

const canPickup = business.ordering.pickup;
const canDeliver = business.ordering.delivery;
const maxKm = business.ordering.maxDeliveryKm;
const SAVED = "gc-checkout-details";
const field =
  "w-full rounded-xl border border-ivory/15 bg-ivory/[0.06] px-4 py-3 text-[0.95rem] text-ivory placeholder:text-ivory/35 transition focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED) || "{}") || {}; } catch { return {}; }
}

/* ------------------------------------------------------------------ */
/*  GPU-only CSS animations (transform/opacity) – zero JS per frame     */
/* ------------------------------------------------------------------ */
const CSS = `
@keyframes gc-rise{from{opacity:0;transform:translate3d(0,14px,0)}to{opacity:1;transform:none}}
.gc-rise{animation:gc-rise .4s cubic-bezier(.16,1,.3,1) both}
.gc-track{container-type:inline-size}
@keyframes gc-ride{0%{transform:translate3d(0,0,0);opacity:0}12%{opacity:1}88%{opacity:1}100%{transform:translate3d(calc(100cqw - 2.5rem),0,0);opacity:0}}
.gc-ride{animation:gc-ride 4s ease-in-out infinite;will-change:transform}
@keyframes gc-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-6px,0)}}
.gc-float{animation:gc-float 2.2s ease-in-out infinite}
@keyframes gc-confetti{0%{transform:translate3d(0,0,0) rotate(0);opacity:1}40%{transform:translate3d(calc(var(--x)*.7),var(--u),0) rotate(calc(var(--r)*.5));opacity:1}100%{transform:translate3d(var(--x),calc(var(--u) + 350px),0) rotate(var(--r));opacity:0}}
.gc-confetti{animation:gc-confetti 1.8s ease-out both;will-change:transform,opacity}
@media (prefers-reduced-motion:reduce){.gc-rise,.gc-ride,.gc-float,.gc-confetti{animation:none!important}}
.gc-zig{-webkit-mask:conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) 50%/14px 100%;mask:conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) 50%/14px 100%}
.gc-shine{position:relative;overflow:hidden}
.gc-shine::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);transform:translate3d(-120%,0,0);animation:gc-shine 3s ease-in-out 1s infinite}
@keyframes gc-shine{to{transform:translate3d(120%,0,0)}}
@media (prefers-reduced-motion:reduce){.gc-shine::after{animation:none}}
/* Leaflet must never paint above our sticky header / bottom bar */
.gc-map .leaflet-container{z-index:0}
`;
const styleTag = <style>{CSS}</style>;

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */
const idle = (cb) =>
  typeof requestIdleCallback === "function"
    ? { id: requestIdleCallback(cb, { timeout: 1500 }), idle: true }
    : { id: setTimeout(cb, 250), idle: false };
const cancelIdle = (h) => (h.idle ? cancelIdleCallback(h.id) : clearTimeout(h.id));

const isLowEnd = () => {
  if (typeof navigator === "undefined") return false;
  return !!(navigator.connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4));
};

/* ------------------------------------------------------------------ */
/*  Lottie: loads only when visible + browser idle + device can afford  */
/* ------------------------------------------------------------------ */
const LottieEmbed = memo(function LottieEmbed({ className = "" }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLowEnd() || !ref.current || typeof IntersectionObserver === "undefined") return;
    let h;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { h = idle(() => setShow(true)); io.disconnect(); }
    }, { rootMargin: "100px" });
    io.observe(ref.current);
    return () => { io.disconnect(); if (h) cancelIdle(h); };
  }, []);

  return (
    <div ref={ref} className={`relative grid place-items-center ${className}`} aria-hidden="true">
      {!show && <span className="grid h-20 w-20 place-items-center rounded-full bg-lime/10 text-lime"><Bike size={36} /></span>}
      {show && (
        <iframe
          src={LOTTIE_SRC}
          title="Delivery animation"
          loading="lazy"
          tabIndex={-1}
          className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-transparent"
          style={{ colorScheme: "normal" }}
        />
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Building blocks                                                    */
/* ------------------------------------------------------------------ */
const Card = memo(function Card({ icon: Icon, title, children, aside, id, delay = 0 }) {
  return (
    <section
      id={id}
      className="gc-rise rounded-2xl border border-ivory/10 bg-forest/70 p-5 sm:p-6"
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
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
});

const Money = memo(function Money({ value, className }) {
  const ref = useRef(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || prev.current === value) { el.textContent = inr(value); prev.current = value; return; }
    const c = animate(prev.current, value, { duration: 0.35, ease: "easeOut", onUpdate: (v) => { el.textContent = inr(Math.round(v)); } });
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

/* Brand-consistent rupee marks (replaces the generic banknote icon) */
const RupeeIcon = ({ size = 16 }) => (
  <span aria-hidden="true" className="font-serif font-bold leading-none" style={{ fontSize: size }}>₹</span>
);
const RupeeCoin = memo(function RupeeCoin() {
  return (
    <span aria-hidden="true" className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#d6ee8a] to-lime text-ink shadow-[inset_0_-3px_0_rgba(0,0,0,0.16),0_8px_18px_-8px_rgba(139,203,53,0.75)]">
      <span className="absolute inset-[4px] rounded-full border border-ink/25" />
      <span className="relative font-serif text-xl font-bold leading-none">₹</span>
    </span>
  );
});

const STEPS = ["Cart", "Details", "Confirm"];
const Stepper = memo(function Stepper({ step }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Checkout progress">
      {STEPS.map((t, i) => {
        const n = i + 1;
        const done = n < step;
        const cur = n === step;
        return (
          <li key={t} className="flex items-center gap-2 sm:gap-3" aria-current={cur ? "step" : undefined}>
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-all duration-300 ${cur ? "scale-105" : ""} ${done ? "bg-lime text-ink" : cur ? "border-2 border-lime text-lime" : "border border-ivory/25 text-ivory/45"}`}>
              {done ? <Check size={14} /> : n}
            </span>
            <span className={`hidden text-xs sm:inline ${cur || done ? "text-ivory" : "text-ivory/45"}`}>{t}</span>
            {i < 2 && (
              <span className="relative h-px w-5 overflow-hidden bg-ivory/15 sm:w-10">
                <span className="absolute inset-0 origin-left bg-lime transition-transform duration-500" style={{ transform: `scaleX(${done ? 1 : 0})` }} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
});

/* Pure CSS: runs on the compositor, no layout, no JS */
const RouteStrip = memo(function RouteStrip({ delivery }) {
  const Mover = delivery ? Bike : ShoppingBag;
  const End = delivery ? MapPin : User;
  return (
    <div className="relative mt-6 h-14" aria-hidden="true">
      <span className="absolute left-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-lime text-ink shadow-[0_8px_24px_-8px_rgba(139,203,53,0.8)]"><Store size={20} /></span>
      <span className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-lime/40 bg-ink text-lime">
        <span className="absolute inset-0 animate-ping rounded-full border border-lime/60 motion-reduce:hidden" />
        <End size={20} />
      </span>
      <span className="absolute left-14 right-14 top-1/2 border-t-2 border-dashed border-lime/30" />
      <div className="gc-track absolute left-14 right-14 top-1/2 -mt-5 h-10">
        <span className="gc-ride grid h-10 w-10 place-items-center rounded-full bg-ivory text-ink shadow-lg"><Mover size={20} /></span>
      </div>
    </div>
  );
});

const EtaCard = memo(function EtaCard({ delivery, km }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-lime/30 bg-gradient-to-br from-heritage/80 via-forest to-ink p-5 sm:p-6">
      <div className="relative flex flex-col items-center justify-between gap-5 sm:flex-row">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="eyebrow inline-flex items-center justify-center gap-1.5 text-lime sm:justify-start"><Clock size={13} /> {delivery ? "Estimated delivery" : "Estimated ready time"}</p>
          <p className="mt-1 font-serif text-4xl font-semibold leading-none text-lime sm:text-5xl">{delivery ? etaLabel : "~20 min"}</p>
          <p className="mt-2 text-sm text-ivory/65">{delivery ? "after the restaurant confirms your order" : "we will confirm the exact time on WhatsApp"}</p>
          {delivery && km != null && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-lime/30 bg-ink/50 px-3 py-1.5 text-xs font-medium text-ivory/85"><Navigation size={13} className="text-lime" /> {km.toFixed(1)} km from the kitchen</span>
          )}
        </div>
        {delivery && <LottieEmbed className="h-40 w-40 shrink-0 sm:h-48 sm:w-48" />}
      </div>
      <RouteStrip delivery={delivery} />
    </div>
  );
});

const Thumb = memo(function Thumb({ item }) {
  const [bad, setBad] = useState(false);
  if (!isPhoto(item.image) || bad) {
    return <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ink/60"><VegMark veg={item.veg} /></span>;
  }
  return <SmartImg src={item.image} alt="" loading="lazy" decoding="async" onGiveUp={() => setBad(true)} className="h-14 w-14 shrink-0 rounded-xl object-cover" />;
});

/* ------------------------------------------------------------------ */
/*  Map shell – fixes "map jumps over the page while scrolling"         */
/*   1. isolate + z-0 + overflow hidden: Leaflet's internal z-indexes   */
/*      (400-1000) can no longer escape and cover header / bottom bar   */
/*   2. Mounts only when the user scrolls near it (saves CPU + data)    */
/*   3. On touch screens the map is "locked" so a normal swipe scrolls  */
/*      the page; tap once to unlock, auto-locks when it leaves view    */
/* ------------------------------------------------------------------ */
const MapShell = memo(function MapShell({ children }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const coarse = useMemo(() => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setNear(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setNear(true);
      else setUnlocked(false);
    }, { rootMargin: "300px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="gc-map relative isolate z-0 h-[300px] overflow-hidden rounded-2xl bg-ink/60 sm:h-[360px]"
      style={{ contain: "layout paint" }}
    >
      {near ? children : <div className="grid h-full animate-pulse place-items-center text-sm text-ivory/40">Loading map…</div>}
      {near && coarse && !unlocked && (
        <button
          type="button"
          onClick={() => setUnlocked(true)}
          aria-label="Tap to move the map"
          className="absolute inset-0 grid place-items-end justify-center bg-transparent pb-4"
          style={{ zIndex: 1100, touchAction: "pan-y" }}
        >
          <span className="rounded-full bg-ink/85 px-4 py-2 text-xs font-semibold text-ivory shadow-lg">Tap to move the map</span>
        </button>
      )}
      {near && coarse && unlocked && (
        <button
          type="button"
          onClick={() => setUnlocked(false)}
          className="absolute right-3 top-3 rounded-full bg-lime px-3.5 py-1.5 text-xs font-bold text-ink shadow-lg"
          style={{ zIndex: 1100 }}
        >
          Done
        </button>
      )}
    </div>
  );
});

const MapSection = memo(function MapSection({ location, onChange, onLocate, locating }) {
  return (
    <MapShell>
      <Suspense fallback={<div className="grid h-full animate-pulse place-items-center text-sm text-ivory/40">Loading map…</div>}>
        <DeliveryMap restaurant={RESTAURANT} value={location} onChange={onChange} onLocate={onLocate} locating={locating} />
      </Suspense>
    </MapShell>
  );
});

/* ------------------------------------------------------------------ */
/*  Order list + suggestions (memoised: typing in a form field does     */
/*  not re-render them)                                                 */
/* ------------------------------------------------------------------ */
const OrderList = memo(function OrderList({ lines, setQty, remove }) {
  return (
    <ul className="divide-y divide-ivory/10">
      <AnimatePresence initial={false} mode="popLayout">
        {lines.map(({ id, qty }) => {
          const it = menuById[id];
          if (!it) return null;
          return (
            <motion.li
              key={id}
              layout="position"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3.5"
            >
              <Thumb item={it} />
              <div className="min-w-0 flex-1 basis-40">
                <p className="flex items-center gap-2 font-medium leading-snug"><VegMark veg={it.veg} /> <span className="min-w-0">{it.name}</span></p>
                <p className="mt-0.5 text-xs text-ivory/50">{inr(it.price)} each</p>
              </div>
              <QtyStepper qty={qty} name={it.name} onChange={(q) => setQty(id, q)} />
              <p className="w-16 text-right font-semibold tabular-nums">{inr(it.price * qty)}</p>
              <button type="button" onClick={() => remove(id)} aria-label={`Remove ${it.name}`} className="p-1 text-ivory/40 transition hover:text-[#ff8a7a]"><Trash2 size={16} /></button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
});

const Suggestions = memo(function Suggestions({ items, onAdd }) {
  if (!items.length) return null;
  return (
    <Card icon={Sparkles} title="Add something more?">
      <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((m) => (
          <li key={m.id} className="w-40 shrink-0 snap-start rounded-xl border border-ivory/10 bg-ink/50 p-3">
            <div className="flex items-center gap-2"><VegMark veg={m.veg} /><p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug">{m.name}</p></div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-serif text-lg text-lime">{inr(m.price)}</span>
              <button type="button" onClick={() => onAdd(m.id)} aria-label={`Add ${m.name}`} className="grid h-9 w-9 place-items-center rounded-full bg-lime text-ink transition active:scale-95"><Plus size={16} /></button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
});

/* ------------------------------------------------------------------ */
/*  Order placed                                                       */
/* ------------------------------------------------------------------ */
const CONFETTI_COLORS = ["#8bcb35", "#b7e36b", "#f7f7f0", "#7c5cff", "#ffd23f"];

const Confetti = memo(function Confetti() {
  const reduce = useReducedMotion();
  const bits = useMemo(() => {
    const n = isLowEnd() ? 10 : 18;
    return Array.from({ length: n }, (_, i) => ({
      x: Math.round((Math.random() - 0.5) * 400),
      u: -Math.round(90 + Math.random() * 150),
      r: Math.round((Math.random() - 0.5) * 500),
      c: CONFETTI_COLORS[i % 5],
      d: (Math.random() * 0.15).toFixed(2),
      w: Math.round(5 + Math.random() * 5),
    }));
  }, []);
  if (reduce) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-20 flex justify-center overflow-visible">
      {bits.map((b, i) => (
        <span
          key={i}
          className="gc-confetti absolute rounded-sm"
          style={{ width: b.w, height: b.w * 0.55, background: b.c, animationDelay: `${b.d}s`, "--x": `${b.x}px`, "--u": `${b.u}px`, "--r": `${b.r}deg` }}
        />
      ))}
    </div>
  );
});

const TIMELINE = (delivery) => [
  ["Order prepared", "Your cart and details are ready"],
  ["Send on WhatsApp", "Tap Send in the chat that opened"],
  ["Kitchen confirms", "We confirm the price and time"],
  [delivery ? "Out for delivery" : "Ready to collect", delivery ? "Fresh from the kitchen to your door" : "Pick it up hot at the counter"],
];

const Timeline = memo(function Timeline({ delivery }) {
  const items = TIMELINE(delivery);
  return (
    <ol className="space-y-0" aria-label="What happens next">
      {items.map(([t, s], i) => {
        const done = i === 0;
        const cur = i === 1;
        return (
          <li key={t} className="relative flex gap-3 pb-5 last:pb-0">
            {i < items.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px ${done ? "bg-lime" : "bg-ivory/15"}`} aria-hidden="true" />}
            <span className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-lime text-ink" : cur ? "border-2 border-lime text-lime" : "border border-ivory/25 text-ivory/40"}`}>
              {cur && <span className="absolute inset-0 animate-ping rounded-full border border-lime/60 motion-reduce:hidden" aria-hidden="true" />}
              {done ? <Check size={14} /> : i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={`text-sm font-semibold leading-tight ${done || cur ? "text-ivory" : "text-ivory/50"}`}>{t}</p>
              <p className="mt-0.5 text-xs text-ivory/50">{s}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
});

const ReceiptSlip = memo(function ReceiptSlip({ orderId, sentAt, lines, customer, delivery, subtotal }) {
  const when = useMemo(() => new Date(sentAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }), [sentAt]);
  return (
    <div className="gc-zig bg-ivory px-5 pb-9 pt-5 text-ink shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-xl font-semibold leading-tight">{business.name}</p>
          <p className="mt-0.5 text-[0.7rem] uppercase tracking-widest text-ink/55">{delivery ? "Delivery order" : "Pickup order"}</p>
        </div>
        <div className="text-right text-[0.7rem] leading-tight text-ink/60">
          <p className="font-semibold text-ink">#{orderId}</p>
          <p className="mt-0.5">{when}</p>
        </div>
      </div>
      <div className="my-4 border-t border-dashed border-ink/25" />
      <ul className="space-y-2 text-sm">
        {lines.map(({ id, qty }) => {
          const it = menuById[id];
          if (!it) return null;
          return (
            <li key={id} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate"><span className="font-semibold tabular-nums">{qty}×</span> {it.name}</span>
              <span className="shrink-0 tabular-nums">{inr(it.price * qty)}</span>
            </li>
          );
        })}
      </ul>
      <div className="my-4 border-t border-dashed border-ink/25" />
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">Total</span>
        <span className="font-serif text-2xl font-semibold tabular-nums">{inr(subtotal)}</span>
      </div>
      <p className="mt-1 text-xs text-ink/60">{delivery ? "Cash on Delivery · delivery fee confirmed on WhatsApp" : "Pay at the restaurant"}</p>
      <div className="my-4 border-t border-dashed border-ink/25" />
      <div className="space-y-0.5 text-xs text-ink/70">
        <p className="font-semibold text-ink">{customer.name} · {customer.phone}</p>
        {delivery && customer.address && <p className="line-clamp-3">{customer.address}</p>}
        {customer.note && <p className="italic">Note: {customer.note}</p>}
      </div>
    </div>
  );
});

function Placed({ orderId, mode, sentAt, subtotal, lines, customer, onSent, onEdit, onBack }) {
  const delivery = mode === "delivery";
  const win = useMemo(() => etaWindow(sentAt), [sentAt]);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(orderId); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }, [orderId]);

  return (
    <div className="relative mx-auto w-full max-w-xl space-y-5 overflow-x-clip px-5 py-8">
      {styleTag}
      <Confetti />

      <div className="relative text-center">
        <svg viewBox="0 0 80 80" className="mx-auto h-20 w-20" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="rgba(139,203,53,0.12)" />
          <motion.circle cx="40" cy="40" r="36" fill="none" stroke="#8bcb35" strokeWidth="3.5" strokeLinecap="round" style={{ rotate: -90, transformOrigin: "40px 40px" }} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} />
          <motion.path d="M25 41 L35 51 L56 29" fill="none" stroke="#8bcb35" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.5 }} />
        </svg>
        <h1 className="gc-rise mt-3 font-serif text-4xl font-semibold" style={{ animationDelay: "0.3s" }}>Your order is ready!</h1>
        <p className="mt-1.5 text-sm text-ivory/65">One last step: tap <span className="font-semibold text-lime">Send</span> in WhatsApp to place it with the kitchen.</p>
        <button type="button" onClick={copy} className="mt-3 inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3.5 py-1.5 text-sm transition hover:border-lime">
          Order ID <span className="font-semibold">{orderId}</span> {copied ? <Check size={14} className="text-lime" /> : <Copy size={14} className="text-ivory/50" />}
        </button>
      </div>

      <div className="rounded-2xl border border-lime/30 bg-lime/10 p-4 text-center">
        <p className="text-sm text-ivory/80">Your order message is ready. Tap <span className="font-semibold text-lime">Yes, Sent</span> to open WhatsApp and send it to the kitchen.</p>
        <div className="mt-3 grid grid-cols-[auto_1fr] gap-3">
          <button type="button" onClick={onEdit} className="btn btn-ghost justify-center">Edit order</button>
          <button type="button" onClick={onSent} className="btn btn-lime gc-shine justify-center"><WhatsAppIcon size={17} /> Yes, Sent</button>
        </div>
        <p className="mt-2 text-[0.7rem] text-ivory/50">Your cart stays saved until you tap Yes, Sent.</p>
      </div>

      <div className="gc-rise rounded-2xl border border-lime/30 bg-gradient-to-br from-heritage/70 to-ink/70 p-5 text-center" style={{ animationDelay: "0.15s" }}>
        <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-ivory/60"><Clock size={13} /> {delivery ? "Estimated delivery" : "Estimated ready time"}</p>
        <p className="mt-1 font-serif text-5xl font-semibold text-lime">{delivery ? etaLabel : "~20 minutes"}</p>
        {delivery && <p className="mt-1 text-sm text-ivory/70">around {win.from} to {win.to} if confirmed now</p>}
        <RouteStrip delivery={delivery} />
      </div>

      <div className="gc-rise" style={{ animationDelay: "0.25s" }}>
        <ReceiptSlip orderId={orderId} sentAt={sentAt} lines={lines} customer={customer} delivery={delivery} subtotal={subtotal} />
      </div>

      <Card icon={Navigation} title="What happens next">
        <Timeline delivery={delivery} />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <a href={`tel:${business.contact.phoneTel}`} className="btn btn-ghost justify-center"><PhoneCall size={16} /> Call us</a>
        <button type="button" onClick={onBack} className="btn btn-ghost justify-center">Back to menu</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
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
  const [waUrl, setWaUrl] = useState("#");
  const [snap, setSnap] = useState(null);
  const geoAbort = useRef(null);

  const delivery = form.mode === "delivery";
  const km = useMemo(() => (delivery && location ? haversineKm(RESTAURANT, location) : null), [delivery, location]);
  const tooFar = km != null && maxKm && km > maxKm;

  const set = useCallback((k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  }, []);

  const detailsOk = useMemo(() => Object.keys(validateOrder(form)).length === 0, [form]);
  const step = lines.length === 0 ? 1 : detailsOk ? 3 : 2;

  // Debounced save: no localStorage write on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(SAVED, JSON.stringify({ name: form.name, phone: form.phone, address: form.address })); } catch {}
    }, 500);
    return () => clearTimeout(t);
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
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
    if (wait > 0) { setSendErr(`Please wait ${wait} more minute${wait > 1 ? "s" : ""} before placing another new order.`); return false; }
    setSendErr("");
    return true;
  }, [form, orderStatus, orderId, reduce]);

  // The WhatsApp message is built ONLY when the user taps "Place Order",
  // not on every keystroke like before.
  const placeOrder = useCallback(() => {
    if (!validate()) return;
    const customer = { ...form, location: delivery ? location : null };
    const url = buildWhatsAppUrl(buildOrderMessage({ lines, customer, orderId, payment: { plan: "cod", amount: subtotal } }));
    markOrderSent(orderId);
    setSnap({ lines: lines.map((l) => ({ ...l })), customer, subtotal });
    setWaUrl(url);
    setSentAt(Date.now());
    setStage("done");
    window.scrollTo({ top: 0 });
  }, [validate, form, delivery, location, lines, orderId, subtotal]);

  // "Yes, Sent": open WhatsApp with the saved order message, then clear the cart.
  // window.open is called directly inside the click handler so browsers do not block it.
  const confirmSent = useCallback(() => {
    if (!waUrl || waUrl === "#") return;
    const w = window.open(waUrl, "_blank");
    if (w) w.opener = null;
    clear();
    setSnap(null);
    setOrderId(makeOrderId());
    if (w) navigate("/menu");
    else window.location.href = waUrl; // popup blocked (some in-app browsers): open in this tab
  }, [waUrl, clear, navigate]);
  // Same order ID on edit, so the 5-minute new-order wait never triggers when fixing an order.
  const editOrder = useCallback(() => { setStage("form"); window.scrollTo({ top: 0 }); }, []);
  const backToMenu = useCallback(() => navigate("/menu"), [navigate]);

  const suggestions = useMemo(() => {
    const inCart = new Set(lines.map((l) => l.id));
    const pool = menuItems.filter((m) => m.available !== false && !inCart.has(m.id));
    const feat = pool.filter((m) => featuredIds.includes(m.id));
    return [...feat, ...pool].filter((m, i, a) => a.indexOf(m) === i).slice(0, 6);
  }, [lines]);

  const setDelivery = useCallback(() => setForm((f) => ({ ...f, mode: "delivery" })), []);
  const setPickup = useCallback(() => setForm((f) => ({ ...f, mode: "pickup" })), []);

  if (stage === "form" && lines.length === 0) {
    return (
      <div className="grid min-h-[80vh] place-items-center px-6 pt-24 text-center">
        {styleTag}
        <div className="gc-rise">
          <span className="gc-float mx-auto grid h-20 w-20 place-items-center rounded-full bg-lime/10 text-lime ring-1 ring-lime/30"><ShoppingBag size={36} /></span>
          <h1 className="mt-5 font-serif text-4xl font-semibold">Your order is empty</h1>
          <p className="mt-2 text-sm text-ivory/60">Pick something tasty from the menu first.</p>
          <Link to="/menu" className="btn btn-lime mt-8">Browse the menu <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  if (stage === "done" && snap) {
    return <Placed orderId={orderId} mode={form.mode} sentAt={sentAt || Date.now()} subtotal={snap.subtotal} lines={snap.lines} customer={snap.customer} onSent={confirmSent} onEdit={editOrder} onBack={backToMenu} />;
  }

  const buttonLabel = delivery ? "Place Order · Cash on Delivery" : "Place Order · Pay at restaurant";

  return (
    <div className="min-h-screen overflow-x-clip bg-ink pb-36 lg:pb-12">
      {styleTag}
      {/* No backdrop-blur: it is very expensive on mid/low-end phones while scrolling */}
      <header className="sticky top-0 z-50 border-b border-ivory/10 bg-forest">
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
        <div className="h-0.5 origin-left bg-lime transition-transform duration-500 ease-out" style={{ transform: `scaleX(${step / 3})` }} />
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="min-w-0 space-y-5">
          <Card icon={delivery ? Bike : Store} title={delivery ? "Delivery" : "Pickup / Dine-in"}>
            {canPickup && canDeliver && (
              <div role="radiogroup" aria-label="Order type" className="relative mb-4 grid grid-cols-2 gap-1 rounded-xl bg-ink/60 p-1">
                {[["delivery", "Delivery", Bike, setDelivery], ["pickup", "Pickup / Dine-in", Store, setPickup]].map(([v, l, Icon, fn]) => (
                  <button key={v} type="button" role="radio" aria-checked={form.mode === v} onClick={fn}
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
                <input id="c-name" className={field} value={form.name} onChange={set("name")} autoComplete="name" enterKeyHint="next" placeholder="e.g. Asha Rani" aria-invalid={!!errors.name} />
                {errors.name && <p role="alert" className="mt-1.5 text-sm text-[#ff8a7a]">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="c-phone" className="eyebrow mb-2 flex items-center gap-1.5 text-ivory/60"><Phone size={12} /> Mobile number</label>
                <input id="c-phone" className={field} value={form.phone} onChange={set("phone")} type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" maxLength={16} placeholder="10-digit mobile number" aria-invalid={!!errors.phone} />
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
              <input id="c-note" className={field} value={form.note} onChange={set("note")} maxLength={160} enterKeyHint="done" placeholder="Spice level, allergies, etc." />
            </div>
          </Card>

          {delivery && (
            <Card icon={Navigation} title="Pin your location" aside={km != null ? <span className="rounded-full bg-lime/15 px-3 py-1 text-xs font-semibold text-lime">{km.toFixed(1)} km</span> : null}>
              <p className="mb-3 text-sm text-ivory/60">Drop the pin on your door so the rider finds you faster. The exact spot is sent to the restaurant on WhatsApp.</p>
              <MapSection location={location} onChange={applyLocation} onLocate={shareLocation} locating={locState.busy} />
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
            <OrderList lines={lines} setQty={setQty} remove={remove} />
          </Card>

          <Suggestions items={suggestions} onAdd={add} />

          <Card icon={Wallet} title="Payment method">
            <div role="radiogroup" aria-label="Payment method">
              <div role="radio" aria-checked="true" className="flex items-center gap-4 rounded-xl border border-lime/40 bg-ink/50 p-4 ring-1 ring-inset ring-lime/10">
                <RupeeCoin />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{delivery ? "Cash on Delivery" : "Pay at the restaurant"}</p>
                  <p className="mt-1 text-xs leading-snug text-ivory/60">{delivery ? "Pay in cash when your food arrives. Please keep change handy." : "Pay when you collect your order or at the table."}</p>
                </div>
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-lime" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-lime" /></span>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ivory/50"><ShieldCheck size={13} className="text-lime" /> No online payment or advance needed.</p>
          </Card>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <Card icon={Receipt} title="Bill details" delay={0.1}>
            <div className="space-y-2.5 text-sm">
              <Row label={`Item total (${count})`}><Money value={subtotal} /></Row>
              <Row label="Delivery fee">{delivery ? "Confirmed on WhatsApp" : "None"}</Row>
              <Row label="Grand total" strong><Money value={subtotal} className="font-serif text-2xl text-lime" /></Row>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ivory/50"><span className="text-lime"><RupeeIcon size={13} /></span> {delivery ? "Pay cash on delivery" : "Pay at the restaurant"}</p>
            {!orderStatus.open && <p role="alert" className="mt-4 text-sm text-[#ff8a7a]">{orderStatus.long}</p>}
            {sendErr && orderStatus.open && <p role="alert" className="mt-4 text-sm text-[#ff8a7a]">{sendErr}</p>}
            <div className="hidden lg:block">
              <button type="button" onClick={placeOrder} disabled={!orderStatus.open} className="btn btn-lime mt-5 w-full justify-center transition-transform active:scale-[0.98]">
                <WhatsAppIcon size={17} /> {buttonLabel}
              </button>
            </div>
            <p className="mt-3 hidden text-center text-[0.7rem] text-ivory/45 lg:block">Your order opens in WhatsApp, ready to send.</p>
            <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-ivory/10 pt-4 text-center text-[0.68rem] leading-tight text-ivory/60">
              {[[ShieldCheck, "Direct from kitchen"], [Flame, "Cooked fresh"], [RupeeIcon, delivery ? "Cash on delivery" : "Pay at counter"]].map(([I, t]) => (
                <li key={t} className="flex flex-col items-center gap-1.5"><span className="grid h-9 w-9 place-items-center rounded-full bg-lime/10 text-lime"><I size={16} /></span>{t}</li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      {/* Mobile sticky bar – solid background (no blur), z-50 so the map can never cover it */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ivory/10 bg-forest px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden">
        {(!orderStatus.open || sendErr) && <p role="alert" className="mb-2 text-xs text-[#ff8a7a]">{!orderStatus.open ? orderStatus.long : sendErr}</p>}
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0">
            <p className="text-[0.65rem] uppercase tracking-widest text-ivory/50">{delivery ? "Total · COD" : "Total"}</p>
            <Money value={subtotal} className="font-serif text-2xl font-semibold leading-none text-lime" />
          </div>
          <button type="button" onClick={placeOrder} disabled={!orderStatus.open} className="btn btn-lime flex-1 justify-center transition-transform active:scale-[0.97]">
            Place Order <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}