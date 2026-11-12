import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  Search, X, SearchX, ShoppingBag, Plus, Clock,
  Flame, Soup, Leaf, ChefHat, Wheat, Drumstick, UtensilsCrossed, LayoutGrid, Beef, CookingPot, Salad, Fish,
  IndianRupee, ChevronLeft, ChevronRight, ArrowRight,
} from "lucide-react";
import QtyStepper from "../components/QtyStepper.jsx";
import SmartImg from "../components/SmartImg.jsx";
import VegMark from "../components/VegMark.jsx";
import { categories, menuItems, useMenuVersion } from "../lib/menuStore.js";
import { useCart } from "../context/CartContext.jsx";
import { inr } from "../lib/format.js";
import { usePageTitle } from "../lib/hooks.js";
import { useOrderStatus, ORDER_HOURS_LABEL } from "../lib/orderHours.js";
import interior from "../assets/interior.webp";
import biryaniPhoto from "../assets/dish-biryani.webp";
import paneerPhoto from "../assets/dish-paneer-tikka.webp";
import heroVideo from "../assets/hero.mp4";

const DIETS = [["all", "All"], ["veg", "Veg"], ["nonveg", "Non-veg"]];
const EASE = [0.16, 1, 0.3, 1];

const COLLECTIONS = [
  { id: "biryani", label: "Biryani", re: /\b(biryani|biriyani|pulao|pulav)\b/i },
  { id: "mutton", label: "Mutton", re: /\b(mutton|lamb|gosht|keema)\b/i },
  { id: "seafood", label: "Seafood", re: /\b(prawns?|fish|crab|shrimp|lobster|squid|seafood)\b/i },
  { id: "breads", label: "Roti & Naan", re: /\b(roti|rotis|naan|kulcha|paratha|parantha|chapati|bread|breads)\b/i },
];
const inCollection = (c, item) => c.re.test(item.name);

const px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`;
const pxHero = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop`;

const droppedItemPhotos = import.meta.glob("../assets/item-*.{webp,jpg,jpeg,png}", { eager: true, import: "default" });
const ownPhoto = (id) => {
  const hit = Object.entries(droppedItemPhotos).find(([p]) => p.includes(`/item-${id}.`));
  return hit ? hit[1] : null;
};

const droppedHero = import.meta.glob("../assets/menu-hero.{webp,jpg,jpeg,png}", { eager: true, import: "default" });
const HERO_BG = Object.values(droppedHero)[0] || pxHero(5410401);

const ITEM_PHOTOS = {
  "Chicken 65": px(37485646),
  "Chilly Chicken": px(12916900),
  "Chicken Lollipop": px(30195578),
  "Prawn Tikka": px(4316005),
  "Chilly Fish": px(5619),
  "Malai Paneer Tikka": paneerPhoto,
  "Tandoori Mushroom": px(4294490),
  "Tandoori Chicken (Half)": px(9738994),
  "Tandoori Chicken (Full)": px(9738994),
  "Chicken Malai Tikka": px(12312104),
  "Seekh Kebab": px(2233730),
  "Paneer Butter Masala": px(9609838),
  "Dal Makhani": px(12737916),
  "Veg Hakka Noodles": px(7138913),
  "Chicken Hakka Noodles": px(24738507),
  "Veg Sezwan Noodles": px(28895969),
  "Chicken Sezwan Noodles": px(5848496),
  "Egg Hakka Noodles": px(2764905),
  "Veg Fried Rice": px(4940832),
  "Egg Fried Rice": px(24738523),
  "Veg Manchurian": px(5339079),
  "Chicken Manchurian": px(28445826),
  "Chilly Fish Gravy": px(5618),
  "Chicken Hyderabadi Dum Biryani": px(5410401),
  "Chicken Biryani": biryaniPhoto,
  "Mutton Biryani": px(16229982),
  "Paneer Biryani": px(7353393),
  "Butter Chicken": px(29685054),
  "Chicken Curry": px(7353487),
};

const categoryIcon = {
  "starter-non-veg": Drumstick,
  "tandoori-veg": Flame,
  "tandoori-non-veg": Beef,
  "indian-veg-curry": CookingPot,
  "chinese-noodles": Soup,
  "rice": Wheat,
  "chinese-curry-veg": Salad,
  "chinese-curry-non-veg": UtensilsCrossed,
  "biryani-and-non-veg-curries": ChefHat,
};
const iconFor = (id = "") =>
  categoryIcon[id] ||
  (/bread|roti|naan/.test(id) ? Wheat : /seafood|fish|prawn/.test(id) ? Fish : /mutton/.test(id) ? Beef : /biryani/.test(id) ? ChefHat : /soup/.test(id) ? Soup : UtensilsCrossed);

const hiRes = (src) => (typeof src === "string" && src.includes("images.pexels.com") ? src.replace("w=800&h=600", "w=1400&h=1050") : src);

function ClosedButton({ className = "" }) {
  return (
    <span className={`flex items-center justify-center gap-1.5 rounded-full border border-ivory/20 px-3 py-2 text-center text-[0.65rem] font-medium uppercase tracking-[0.12em] text-ivory/55 ${className}`}>
      <Clock size={13} aria-hidden="true" /> Ordering closed
    </span>
  );
}

function Slide({ from = "left", delay = 0, duration = 1.2, distance = 70, className = "", children }) {
  const reduce = useReducedMotion();
  const d = reduce ? 0 : distance;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: from === "left" ? -d : from === "right" ? d : 0, y: from === "up" ? Math.min(d, 50) : 0 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0.01 : duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function MenuCard({ item, index, onOpen, orderOpen }) {
  const { qtyOf, add, setQty } = useCart();
  const qty = qtyOf(item.id);
  const [badSrc, setBadSrc] = useState([]);
  const src = [ownPhoto(item.id), item.image, ITEM_PHOTOS[item.name]].find((s) => s && !badSrc.includes(s)) || null;
  const Icon = iconFor(item.categoryId);
  const open = () => onOpen({ item, src });

  return (
    <Slide from="up" distance={32} duration={0.9} delay={(index % 4) * 0.07} className="h-full">
      <article className={`${item.available === false ? "opacity-60 grayscale-[40%] " : ""}group flex h-full flex-col overflow-hidden rounded-2xl border border-ivory/[0.08] bg-ivory/[0.035] transition duration-500 hover:-translate-y-1 hover:border-lime/40 hover:shadow-[0_24px_60px_-30px_rgba(139,203,53,0.35)]`}>
        <div
          role="button"
          tabIndex={0}
          aria-label={`View details of ${item.name}`}
          onClick={open}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
          className="flex flex-1 cursor-pointer flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-lime/70"
        >
          <div className="relative aspect-[16/11] overflow-hidden bg-forest">
            {src ? (
              <SmartImg
                src={src}
                alt={item.name}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onGiveUp={() => setBadSrc((b) => [...b, src])}
                className="h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-heritage via-deep to-ink" aria-hidden="true">
                <Icon className="absolute -right-3 top-1/4 h-28 w-28 -rotate-12 text-lime/15 transition duration-[1400ms] group-hover:rotate-0 group-hover:scale-110" strokeWidth={1} />
                <span className="absolute left-1/4 top-1/4 h-20 w-20 rounded-full bg-lime/20 blur-[40px]" />
                <span className="absolute bottom-2.5 left-3 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-ivory/35">Photo coming soon</span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden="true" />
            <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-ivory/20 to-transparent transition-transform duration-[1200ms] ease-out group-hover:translate-x-[420%]" aria-hidden="true" />
            <span className="absolute left-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full bg-ivory/90 shadow"><VegMark veg={item.veg} /></span>
            <span className="absolute right-2.5 top-2.5 rounded-full bg-lime px-2.5 py-1 font-serif text-sm font-semibold leading-none text-ink shadow-[0_8px_22px_-8px_rgba(139,203,53,0.7)] sm:text-base">{inr(item.price)}</span>
          </div>

          <div className="min-w-0 flex-1 p-3 pb-2 sm:p-4 sm:pb-3">
            <h3 className="line-clamp-2 font-serif text-base font-semibold leading-snug text-ivory sm:text-lg">{item.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ivory/55">{item.desc}</p>
          </div>
        </div>

        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          {item.available === false ? (
            <span className="block rounded-full border border-ivory/20 px-3 py-1.5 text-center text-[0.65rem] font-medium uppercase tracking-[0.14em] text-ivory/50">Out of stock</span>
          ) : !orderOpen ? (
            <ClosedButton />
          ) : qty === 0 ? (
            <button type="button" onClick={() => add(item.id)} aria-label={`Add ${item.name} to order`} className="btn btn-lime btn-sm w-full justify-center"><Plus size={14} /> Add</button>
          ) : (
            <div className="flex justify-center"><QtyStepper qty={qty} name={item.name} onChange={(q) => setQty(item.id, q)} /></div>
          )}
        </div>
      </article>
    </Slide>
  );
}

const photoOf = (item) => ownPhoto(item.id) || item.image || ITEM_PHOTOS[item.name] || null;

function PickCard({ item, onOpen, orderOpen }) {
  const { qtyOf, add, setQty } = useCart();
  const qty = qtyOf(item.id);
  const [badSrc, setBadSrc] = useState([]);
  const src = [ownPhoto(item.id), item.image, ITEM_PHOTOS[item.name]].find((s) => s && !badSrc.includes(s)) || null;
  const Icon = iconFor(item.categoryId);
  const open = () => onOpen({ item, src });

  return (
    <article className="group flex w-[14.5rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-ivory/10 bg-ink/60 transition duration-500 hover:-translate-y-1 hover:border-lime/40 hover:shadow-[0_24px_60px_-30px_rgba(139,203,53,0.35)] sm:w-[16rem]">
      <div
        role="button"
        tabIndex={0}
        aria-label={`View details of ${item.name}`}
        onClick={open}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
        className="flex flex-1 cursor-pointer flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-lime/70"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-forest">
          {src ? (
            <SmartImg
              src={src}
              alt={item.name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onGiveUp={() => setBadSrc((b) => [...b, src])}
              className="h-full w-full object-cover object-center transition duration-[1400ms] ease-out group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-heritage via-deep to-ink" aria-hidden="true">
              <Icon className="absolute -right-3 top-1/4 h-28 w-28 -rotate-12 text-lime/15" strokeWidth={1} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden="true" />
          <span className="absolute left-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full bg-ivory/90 shadow"><VegMark veg={item.veg} /></span>
          <span className="absolute right-2.5 top-2.5 rounded-full bg-lime px-2.5 py-1 font-serif text-base font-semibold leading-none text-ink shadow-[0_8px_22px_-8px_rgba(139,203,53,0.7)]">{inr(item.price)}</span>
        </div>
        <div className="min-w-0 flex-1 p-3.5 pb-2.5">
          <p className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-lime/80">{item.category}</p>
          <h3 className="mt-1 line-clamp-2 font-serif text-lg font-semibold leading-snug text-ivory">{item.name}</h3>
        </div>
      </div>

      <div className="px-3.5 pb-3.5">
        {!orderOpen ? (
          <ClosedButton />
        ) : qty === 0 ? (
          <button type="button" onClick={() => add(item.id)} aria-label={`Add ${item.name} to order`} className="btn btn-lime btn-sm w-full justify-center"><Plus size={14} /> Add</button>
        ) : (
          <div className="flex justify-center"><QtyStepper qty={qty} name={item.name} onChange={(q) => setQty(item.id, q)} /></div>
        )}
      </div>
    </article>
  );
}

function OfferCarousel({ items, onOpen, orderOpen, onSeeAll }) {
  const reduce = useReducedMotion();
  const trackRef = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const check = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const start = el.scrollLeft < 8;
    const end = el.scrollWidth - el.scrollLeft - el.clientWidth < 8;
    setEdge((p) => (p.start === start && p.end === end ? p : { start, end }));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;
    ro?.observe(el);
    return () => { el.removeEventListener("scroll", check); ro?.disconnect(); };
  }, [check, items.length]);

  const go = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  const fade = `linear-gradient(to right, ${edge.start ? "#000" : "transparent"}, #000 ${edge.start ? "0%" : "5%"}, #000 ${edge.end ? "100%" : "94%"}, ${edge.end ? "#000" : "transparent"})`;
  const arrow = "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-lime/40 bg-ink/90 text-lime shadow-xl backdrop-blur transition hover:bg-lime hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/70 md:grid";

  return (
    <Slide from="up" distance={40} duration={1} className="mb-12 sm:mb-16">
      <section aria-label="Best value dishes" className="relative overflow-hidden rounded-3xl border border-lime/20 bg-gradient-to-br from-heritage/60 via-forest to-ink p-5 sm:p-8">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-lime/10 blur-[90px]" aria-hidden="true" />
        <div className="relative grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-lime/15 text-lime ring-1 ring-lime/30"><IndianRupee size={22} /></span>
            <p className="eyebrow mt-5 text-lime">Order direct</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold leading-[1.05] sm:text-4xl">
              Save the extra.<br /><em className="text-lime-gradient pr-1 font-medium italic">Pay the right price.</em>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ivory/70 sm:text-base">
              Order straight from Tasty Tasty Greenchilly and get every dish at its honest menu price, with no app mark-up.
            </p>
            <button type="button" onClick={onSeeAll} className="btn btn-ghost mt-6">See all dishes <ArrowRight size={16} /></button>
            <p className="mt-4 text-[0.7rem] leading-relaxed text-ivory/40">Delivery charge, if any, is confirmed by the restaurant on WhatsApp.</p>
          </div>

          <div className="relative min-w-0 lg:col-span-8">
            <div
              ref={trackRef}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-3 pt-2 sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitMaskImage: fade, maskImage: fade }}
              role="list"
              aria-label="Best value dishes. Swipe or use the arrows."
            >
              {items.map((it) => (
                <div key={it.id} role="listitem" className="flex"><PickCard item={it} onOpen={onOpen} orderOpen={orderOpen} /></div>
              ))}
            </div>
            {!edge.start && <button type="button" onClick={() => go(-1)} aria-label="Scroll dishes left" className={`${arrow} left-1`}><ChevronLeft size={20} /></button>}
            {!edge.end && <button type="button" onClick={() => go(1)} aria-label="Scroll dishes right" className={`${arrow} right-1`}><ChevronRight size={20} /></button>}
          </div>
        </div>
      </section>
    </Slide>
  );
}

const modalList = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } };
const modalItem = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

function DishModal({ open, onClose, orderOpen }) {
  const reduce = useReducedMotion();
  const [hiOk, setHiOk] = useState(false);
  useEffect(() => { setHiOk(false); }, [open?.item?.id]);
  const { qtyOf, add, setQty } = useCart();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const item = open?.item;
  const src = open?.src;
  const Icon = item ? iconFor(item.categoryId) : UtensilsCrossed;
  const qty = item ? qtyOf(item.id) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="dish-modal"
          className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto p-4 sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.35 }}
        >
          <div className="absolute inset-0 bg-ink/85 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
          <div
            role="dialog" aria-modal="true" aria-label={item.name}
            className="relative z-10 grid w-full max-w-3xl overflow-hidden rounded-3xl border border-lime/25 bg-forest shadow-[0_50px_120px_-30px_rgba(0,0,0,0.95)] md:grid-cols-2"
          >
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-ivory/25 bg-ink/60 text-ivory backdrop-blur transition hover:border-lime hover:text-lime"><X size={18} /></button>

            <motion.div
              initial={{ opacity: 0, scale: reduce ? 1 : 1.06 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduce ? 0.01 : 0.7, ease: EASE }}
              className="relative aspect-[4/3] overflow-hidden bg-deep md:aspect-auto md:min-h-[26rem]"
            >
              {src ? (
                <>
                  <SmartImg src={src} alt={item.name} referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover object-center" />
                  {hiRes(src) !== src && (
                    <img
                      src={hiRes(src)} alt="" aria-hidden="true" referrerPolicy="no-referrer"
                      onLoad={() => setHiOk(true)}
                      className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ${hiOk ? "opacity-100" : "opacity-0"}`}
                    />
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-heritage via-deep to-ink" aria-hidden="true">
                  <Icon className="absolute -right-6 top-1/4 h-60 w-60 -rotate-12 text-lime/15" strokeWidth={1} />
                  <span className="absolute bottom-4 left-5 text-xs font-medium uppercase tracking-[0.18em] text-ivory/35">Photo coming soon</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" aria-hidden="true" />
            </motion.div>

            <motion.div variants={modalList} initial="hidden" animate="show" className="flex flex-col p-6 sm:p-8">
              <motion.p variants={modalItem} className="eyebrow flex items-center gap-2 text-lime"><Icon size={14} /> {item.category}</motion.p>
              <motion.h2 variants={modalItem} className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">{item.name}</motion.h2>
              <motion.div variants={modalItem} className="mt-4 flex items-center gap-3">
                <span className="font-serif text-3xl font-semibold text-lime">{inr(item.price)}</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-ivory/15 px-3 py-1 text-xs text-ivory/70">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-ivory/90"><VegMark veg={item.veg} /></span>
                  {item.veg ? "Vegetarian" : "Non-vegetarian"}
                </span>
              </motion.div>
              <motion.p variants={modalItem} className="mt-5 flex-1 leading-relaxed text-ivory/70">{item.desc}</motion.p>
              <motion.div variants={modalItem} className="mt-6 border-t border-ivory/10 pt-5">
                {item.available === false ? (
                  <span className="inline-block rounded-full border border-ivory/20 px-5 py-2 text-xs font-medium uppercase tracking-[0.16em] text-ivory/50">Out of stock</span>
                ) : !orderOpen ? (
                  <ClosedButton className="!py-3 !text-xs" />
                ) : qty === 0 ? (
                  <button type="button" onClick={() => add(item.id)} className="btn btn-lime w-full justify-center"><Plus size={16} /> Add to order</button>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <QtyStepper qty={qty} name={item.name} onChange={(q) => setQty(item.id, q)} />
                    <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Done</button>
                  </div>
                )}
                <p className="mt-4 text-[0.7rem] leading-relaxed text-ivory/40">Photo is for illustration. Availability is confirmed by the restaurant.</p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuHero({ status }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const [bg] = useState(HERO_BG);
  const [videoFailed, setVideoFailed] = useState(false);
  const reduceMotion = useReducedMotion();
  
  // Mobile par video chalane ke liye saveData aur reduced motion ke alawa baaki sab checks hata diye hain
  const skip = reduceMotion || videoFailed;

  const stats = [
    { Icon: UtensilsCrossed, v: `${menuItems.length}`, l: "Dishes" },
    { Icon: LayoutGrid, v: `${categories.length}`, l: "Sections" },
    { Icon: Flame, v: "Tandoor", l: "Grills" },
    { Icon: Leaf, v: "Veg & Non-veg", l: "Both" },
  ];

  return (
    <section ref={ref} className="noise relative isolate flex min-h-[80svh] items-end overflow-hidden bg-ink pb-14 pt-40 sm:pb-16">
      <motion.div style={{ y: bgY }} className="absolute inset-x-0 -top-[10%] -z-20 h-[120%]" aria-hidden="true">
        {skip ? (
          <motion.img
            src={bg} alt="" fetchPriority="high"
            initial={{ scale: reduce ? 1 : 1.18 }} animate={{ scale: 1 }}
            transition={{ duration: 3, ease: EASE }}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <video
            src={heroVideo} poster={bg}
            autoPlay muted loop playsInline preload="auto" tabIndex={-1} aria-hidden="true"
            onError={() => setVideoFailed(true)}
            className="h-full w-full object-cover object-center"
          />
        )}
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/35" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/35 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <Slide from="left" distance={60} duration={1.4}>
            <p className="eyebrow flex items-center gap-3 text-lime"><span className="h-px w-12 bg-lime/70" /> Tasty Tasty Greenchilly</p>
          </Slide>
          <h1 className="mt-5 font-serif text-6xl font-semibold leading-[0.95] tracking-tight sm:text-8xl lg:text-9xl">
            <span className="block overflow-hidden pb-1"><Slide from="left" distance={160} duration={1.7} delay={0.1}>Our</Slide></span>
            <span className="block overflow-hidden pb-2"><Slide from="right" distance={160} duration={1.8} delay={0.3}><em className="text-lime-gradient pr-2 font-medium italic">Menu</em></Slide></span>
          </h1>
          <Slide from="left" distance={60} duration={1.5} delay={0.5}>
            <p className="mt-6 max-w-xl text-lg text-ivory/80">{menuItems.length} dishes across Indian, Chinese and tandoor. Prices are in rupees; the restaurant confirms availability when your order arrives.</p>
          </Slide>
          <Slide from="left" distance={60} duration={1.5} delay={0.6}>
            <p className={`mt-5 inline-flex max-w-full items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium ${status.open ? "border-lime/40 bg-lime/10 text-lime" : "border-ivory/20 bg-ink/50 text-ivory/80"}`} role="status">
              <span className={`h-2 w-2 shrink-0 rounded-full ${status.open ? "bg-lime" : "bg-ivory/40"}`} aria-hidden="true" />
              {status.short}
              <span className="hidden text-ivory/45 sm:inline">· {ORDER_HOURS_LABEL}</span>
            </p>
          </Slide>
          <Slide from="left" distance={60} duration={1.5} delay={0.7} className="mt-8 flex flex-wrap gap-3">
            {stats.map(({ Icon, v, l }) => (
              <span key={v} className="glass inline-flex items-center gap-3 rounded-2xl px-4 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-lime/15 text-lime"><Icon size={17} /></span>
                <span className="leading-tight"><span className="block font-serif text-lg font-semibold">{v}</span><span className="block text-[0.65rem] uppercase tracking-widest text-ivory/50">{l}</span></span>
              </span>
            ))}
          </Slide>
        </div>
      </div>
    </section>
  );
}

export default function Menu() {
  usePageTitle("Menu");
  const mv = useMenuVersion();
  const status = useOrderStatus();
  const reduce = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const { count, subtotal, openCart } = useCart();
  const [collapsed, setCollapsed] = useState(false);
  const [openDish, setOpenDish] = useState(null);
  const resultsRef = useRef(null);
  const chipsRef = useRef(null);
  const barRef = useRef(null);
  const holdRef = useRef(0);
  const listRef = useRef(null);
  const closeDish = useCallback(() => setOpenDish(null), []);

  const cat = categories.some((c) => c.id === params.get("cat")) ? params.get("cat") : "all";
  const diet = DIETS.some(([k]) => k === params.get("diet")) ? params.get("diet") : "all";
  const collections = useMemo(
    () => COLLECTIONS.map((c) => ({ ...c, count: menuItems.filter((i) => inCollection(c, i)).length })).filter((c) => c.count > 0),
    [mv]
  );
  const colId = collections.some((c) => c.id === params.get("col")) ? params.get("col") : "all";
  const col = collections.find((c) => c.id === colId) || null;
  const q = params.get("q") || "";

  const update = (patch) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => (!v || v === "all" ? next.delete(k) : next.set(k, v)));
      return next;
    }, { replace: true });
  };

  const goToResults = () => resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  const hold = () => { holdRef.current = Date.now() + 1200; };
  const pick = (id) => { hold(); update({ cat: id, col: "all" }); goToResults(); };
  const pickCol = (id) => { hold(); update({ col: id, cat: "all" }); goToResults(); };

  useEffect(() => {
    if (params.get("cat")) { const t = setTimeout(goToResults, 450); return () => clearTimeout(t); }
  }, []);

  useEffect(() => {
    chipsRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [cat, colId, reduce, collapsed]);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const run = () => {
      ticking = false;
      const el = barRef.current;
      if (!el) return;
      const y = window.scrollY;
      const stuckAt = parseFloat(getComputedStyle(el).top) || 72;
      const stuck = el.getBoundingClientRect().top <= stuckAt + 4;
      if (!stuck) { setCollapsed(false); lastY = y; return; }
      if (Date.now() < holdRef.current) { lastY = y; return; }
      const dy = y - lastY;
      if (Math.abs(dy) < 6) return;
      setCollapsed(dy > 0);
      lastY = y;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const results = useMemo(() => {
    const normalize = (value) =>
      String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase()
        .trim()
        .replace(/\s+/g, " ");
    const needle = normalize(q);
    return menuItems.filter((item) => {
      const searchableText = normalize(`${item.name} ${item.desc} ${item.category} ${item.categoryId}`);
      return (
        (cat === "all" || item.categoryId === cat) &&
        (!col || inCollection(col, item)) &&
        (diet === "all" || (diet === "veg") === item.veg) &&
        (!needle || searchableText.includes(needle))
      );
    });
  }, [cat, colId, diet, q, mv]);

  const groups = useMemo(
    () => (col ? [{ id: col.id, name: col.label, items: results }] : categories.map((c) => ({ ...c, items: results.filter((i) => i.categoryId === c.id) })).filter((g) => g.items.length)),
    [results, col]
  );
  const picks = useMemo(() => {
    const live = menuItems.filter((i) => i.available !== false);
    const withPhoto = live.filter((i) => photoOf(i));
    return [...(withPhoto.length >= 4 ? withPhoto : live)].sort((a, b) => a.price - b.price).slice(0, 8);
  }, [mv]);
  const seeAll = () => listRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  const activeFilters = (diet !== "all" ? 1 : 0) + (q.trim() ? 1 : 0);
  const filtered = cat !== "all" || !!col || activeFilters > 0;
  const resetAll = () => { setParams({}, { replace: true }); };
  const tab = (active) => `relative shrink-0 whitespace-nowrap px-3 py-3 text-[0.82rem] font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:text-lime ${active ? "text-ivory" : "text-ivory/50 hover:text-ivory/85"}`;
  const underline = (active) => <span className={`absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-lime transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />;

  return (
    <>
      <MenuHero status={status} />

      <div ref={barRef} className="sticky top-[4.5rem] z-30 h-0 lg:top-20">
        <div className={`absolute inset-x-0 top-0 border-b border-ivory/10 bg-ink/95 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.95)] backdrop-blur-xl transition-[transform,opacity] duration-500 ease-out ${collapsed ? "pointer-events-none -translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="flex items-center gap-2 pt-3 sm:gap-4">
              <div className="relative min-w-0 flex-1 sm:max-w-sm sm:flex-none sm:basis-80">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory/40" aria-hidden="true" />
                <input
                  id="menu-search-inline"
                  type="search"
                  value={q}
                  onChange={(e) => update({ q: e.target.value })}
                  placeholder="Search dishes"
                  aria-label="Search menu dishes"
                  autoComplete="off"
                  className="h-10 w-full min-w-0 rounded-xl border border-ivory/15 bg-ivory/[0.04] pl-10 pr-9 text-sm text-ivory outline-none transition placeholder:text-ivory/40 hover:border-ivory/25 focus:border-lime/60 focus:ring-2 focus:ring-lime/15"
                />
                {q && (
                  <button type="button" onClick={() => update({ q: "" })} aria-label="Clear search" className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ivory/55 transition hover:text-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/70"><X size={15} /></button>
                )}
              </div>

              <div role="group" aria-label="Filter by diet" className="inline-flex shrink-0 rounded-xl border border-ivory/15 bg-ivory/[0.04] p-0.5">
                {DIETS.map(([key, label]) => (
                  <button
                    key={key} type="button" aria-pressed={diet === key} onClick={() => update({ diet: key })}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-[0.6rem] px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/70 sm:px-3.5 ${diet === key ? "bg-lime text-ink" : "text-ivory/65 hover:text-ivory"}`}
                  >
                    {key !== "all" && <span className="hidden sm:inline-flex"><VegMark veg={key === "veg"} /></span>}
                    {label}
                  </button>
                ))}
              </div>

              <p className="ml-auto hidden text-xs text-ivory/45 lg:block" aria-hidden="true">{results.length} {results.length === 1 ? "dish" : "dishes"}</p>
            </div>

            <div
              ref={chipsRef} role="group" aria-label="Browse by section"
              className="-mx-4 mt-1 flex min-w-0 items-stretch overflow-x-auto px-4 pr-10 [scrollbar-width:none] sm:-mx-8 sm:px-8 [&::-webkit-scrollbar]:hidden"
              style={{ WebkitMaskImage: "linear-gradient(to right, #000 92%, transparent)", maskImage: "linear-gradient(to right, #000 92%, transparent)" }}
            >
              <button type="button" aria-pressed={cat === "all" && !col} onClick={() => pick("all")} className={tab(cat === "all" && !col)}>
                All<span className="ml-1.5 text-[0.7rem] text-ivory/35">{menuItems.length}</span>{underline(cat === "all" && !col)}
              </button>
              {categories.map((c) => (
                <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => pick(c.id)} className={tab(cat === c.id)}>
                  {c.name}<span className="ml-1.5 text-[0.7rem] text-ivory/35">{c.count}</span>{underline(cat === c.id)}
                </button>
              ))}
              {collections.length > 0 && <span className="mx-2 my-3 w-px shrink-0 bg-ivory/15" aria-hidden="true" />}
              {collections.map((c) => (
                <button key={c.id} type="button" aria-pressed={colId === c.id} onClick={() => pickCol(c.id)} className={tab(colId === c.id)}>
                  {c.label}<span className="ml-1.5 text-[0.7rem] text-ivory/35">{c.count}</span>{underline(colId === c.id)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section ref={resultsRef} className="scroll-mt-[4.5rem] overflow-x-clip bg-ink pb-16 pt-32 sm:pb-20 sm:pt-36 lg:scroll-mt-20 lg:pb-24" aria-label="Menu items">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {!status.open && (
            <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-ivory/15 bg-ivory/[0.04] p-4 text-sm leading-relaxed text-ivory/75 sm:items-center">
              <Clock size={18} className="mt-0.5 shrink-0 text-lime sm:mt-0" aria-hidden="true" />
              <span>{status.long}</span>
            </div>
          )}
          {!filtered && picks.length >= 3 && <OfferCarousel items={picks} onOpen={setOpenDish} orderOpen={status.open} onSeeAll={seeAll} />}
          <p className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ivory/55 sm:mb-10 sm:text-sm" role="status" aria-live="polite">
            Showing {results.length} of {menuItems.length} dishes
            {q.trim() && (
              <button type="button" onClick={() => update({ q: "" })} className="inline-flex items-center gap-1.5 rounded-full border border-lime/30 px-3 py-1 text-xs text-lime hover:bg-lime/10">“{q.trim()}” <X size={12} /></button>
            )}
            {filtered && <button type="button" onClick={resetAll} className="uppercase tracking-widest text-lime hover:underline">Reset filters</button>}
          </p>

          {results.length === 0 ? (
            <div className="mx-auto max-w-md py-20 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-lime/30 text-lime"><SearchX size={26} /></span>
              <h2 className="mt-6 font-serif text-4xl font-semibold">No dishes found</h2>
              <p className="mt-3 text-ivory/60">Nothing matches {q ? `“${q}” ` : "these filters"}. Try another word or clear the filters.</p>
              <button type="button" onClick={resetAll} className="btn btn-lime mt-8">Show all dishes</button>
            </div>
          ) : (
            <div ref={listRef} className="scroll-mt-44 space-y-12 sm:space-y-16">
              {groups.map((g) => {
                const Icon = iconFor(g.id);
                return (
                  <section key={g.id} aria-labelledby={`cat-${g.id}`}>
                    <Slide from="left" distance={50} duration={1.1} className="mb-6 flex items-end gap-3 sm:gap-4">
                      <span className="mb-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime/15 text-lime"><Icon size={20} /></span>
                      <h2 id={`cat-${g.id}`} className="font-serif text-3xl font-semibold sm:text-4xl">{g.name}</h2>
                      <span className="mb-2 h-px flex-1 bg-gradient-to-r from-lime/40 to-transparent" aria-hidden="true" />
                      <span className="mb-1.5 whitespace-nowrap text-sm text-ivory/45">{g.items.length} {g.items.length === 1 ? "dish" : "dishes"}</span>
                    </Slide>
                    <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
                      {g.items.map((it, i) => <MenuCard key={it.id} item={it} index={i} onOpen={setOpenDish} orderOpen={status.open} />)}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <p className="mt-20 border-t border-ivory/10 pt-6 text-xs leading-relaxed text-ivory/40">
            Photographs are for illustration and may differ slightly from the dish served. Menu items, prices and availability are subject to confirmation by the restaurant.
          </p>
        </div>
      </section>

      {count > 0 && status.open && (
        <div className="sticky bottom-4 z-30 mx-auto hidden w-fit lg:block">
          <button type="button" onClick={openCart} className="btn btn-lime shadow-2xl"><ShoppingBag size={17} /> View order · {count} · {inr(subtotal)}</button>
        </div>
      )}

      <DishModal open={openDish} onClose={closeDish} orderOpen={status.open} />
    </>
  );
}