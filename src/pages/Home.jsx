import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, MapPin, Clock, Phone, Navigation, ListChecks, UserRound, Send,
  Flame, Soup, Leaf, ChefHat, Star, UtensilsCrossed, Wallet, ChevronDown, Sparkles, Drumstick, Wheat,
  BadgePercent, Truck, Egg, Fish, Salad, RotateCw, PenLine, ExternalLink,
} from "lucide-react";
import WhatsAppIcon from "../components/WhatsAppIcon.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import FeaturedDish from "../components/FeaturedDish.jsx";
import StarRating from "../components/StarRating.jsx";
import VegMark from "../components/VegMark.jsx";
import { categories, featuredIds, menuById, menuItems, useMenuVersion } from "../lib/menuStore.js";
import { business, mapsDirectionsUrl, googleReviewsUrl } from "../config/business.js";
import { enquiryUrl } from "../lib/whatsapp.js";
import { inr } from "../lib/format.js";
import { usePageTitle } from "../lib/hooks.js";
import interior from "../assets/interior.webp";
import aisle from "../assets/interior-aisle.webp";
import biryani from "../assets/dish-biryani.webp";
import paneer from "../assets/dish-paneer-tikka.webp";
import chickenTikka from "../assets/dish-chicken-tikka.webp";
import heroVideo from "../assets/hero.mp4";
// Category photos: these 6 files must be inside src/assets with exactly these names
import catRoll from "../assets/Double Egg Kabab Roll.jpg";
import catSoup from "../assets/Veg Manchow Soup.jpg";
import catStarterVeg from "../assets/Crispy Baby Corn.jpg";
import catMutton from "../assets/Mutton Kasa.jpg";
import catEgg from "../assets/Egg Chilli.jpg";
import catRaitaPapad from "../assets/Fry Papad.jpg";

/** Google link for reviews (button + QR). Opens the restaurant's Google panel with the "Write a review" button. */
const REVIEW_URL = "https://www.google.com/search?q=tasty+tasty+green+chilly+haribhaina";

/* ------------------------------------------------------------------ */
/*  Slow directional entrance: slides in from left / right / up        */
/* ------------------------------------------------------------------ */
const EASE = [0.16, 1, 0.3, 1];

/** true on phones / tablets (no mouse hover). Used to flip cards by tap and to keep animations light. */
function useTouch() {
  const get = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(hover: none)").matches;
  const [v, setV] = useState(get);
  useEffect(() => {
    const m = window.matchMedia("(hover: none)");
    const f = () => setV(m.matches);
    m.addEventListener ? m.addEventListener("change", f) : m.addListener(f);
    return () => (m.removeEventListener ? m.removeEventListener("change", f) : m.removeListener(f));
  }, []);
  return v;
}

function Slide({ from = "left", delay = 0, duration = 1.6, distance = 140, className = "", as = "div", children, ...rest }) {
  const reduce = useReducedMotion();
  const touch = useTouch();
  const Tag = motion[as] || motion.div;
  const d = reduce ? 0 : touch ? Math.min(distance, 20) : distance;
  const start = touch
    ? { opacity: 0, x: 0, y: d }
    : { opacity: 0, x: from === "left" ? -d : from === "right" ? d : 0, y: from === "up" ? Math.min(d, 50) : 0 };
  if (touch) { duration = Math.min(duration, 0.5); delay = Math.min(delay, 0.1); }
  return (
    <Tag
      className={className}
      initial={start}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: reduce ? 0.01 : duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  FlipCard: flips when mouse enters / tapped on touch screen         */
/* ------------------------------------------------------------------ */
const faceStyle = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };

function FlipCard({ as: Tag = "div", front, back, fill = false, className = "", ...rest }) {
  const reduce = useReducedMotion();
  const touch = useTouch();
  const [flip, setFlip] = useState(false);
  const mouse = (e, v) => { if (e.pointerType === "mouse") setFlip(v); };
  const key = (e) => { if (e.target.matches && e.target.matches(":focus-visible")) setFlip(true); };
  const toggle = (e) => { e.preventDefault(); e.stopPropagation(); setFlip((f) => !f); };
  return (
    <Tag
      className={className}
      style={{ perspective: 1400 }}
      onPointerEnter={(e) => mouse(e, true)}
      onPointerLeave={(e) => mouse(e, false)}
      onFocus={key}
      onBlur={() => setFlip(false)}
      {...rest}
    >
      <motion.div
        className={fill ? "absolute inset-0" : "relative h-full"}
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flip ? 180 : 0 }}
        transition={{ duration: reduce ? 0.01 : touch ? 0.4 : 0.7, ease: EASE }}
      >
        <div className={fill ? "absolute inset-0" : "h-full"} style={{ ...faceStyle, pointerEvents: flip ? "none" : "auto" }}>{front}</div>
        <div className="absolute inset-0" style={{ ...faceStyle, transform: "rotateY(180deg)", pointerEvents: flip ? "auto" : "none" }}>{back}</div>
      </motion.div>
      {touch && (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={flip}
          aria-label={flip ? "Show front of card" : "Show details"}
          className="absolute right-3 top-3 z-20 grid h-10 w-10 touch-manipulation [-webkit-tap-highlight-color:transparent] place-items-center rounded-full border border-ivory/25 bg-ink/75 text-lime shadow-lg backdrop-blur-sm active:scale-90"
        >
          <RotateCw size={17} className={flip ? "-scale-x-100" : ""} />
        </button>
      )}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  HERO (Optimized Mobile Video Handler)                              */
/* ------------------------------------------------------------------ */
function HeroVideo() {
  const [failed, setFailed] = useState(false);
  const reduce = useReducedMotion();
  const reduceMotion = useReducedMotion();
  
  // Only fallback if reduced motion or explicit error occurs, keeping mobile video fully enabled
  const skip = reduceMotion || failed;
  
  if (skip) {
    return <img src={biryani} alt="A plate of biryani served with sides" width="783" height="1020" fetchPriority="high" className="h-full w-full object-cover" />;
  }
  return (
    <video
      className="absolute inset-0 -z-10 h-full w-full object-cover"
      src={heroVideo}
      poster={biryani}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      onError={() => setFailed(true)}
    />
  );
}

function RotatingBadge() {
  const touch = useTouch();
  return (
    <div className="absolute -right-3 -top-5 z-10 h-28 w-28 sm:-right-10 sm:-top-8 sm:h-36 sm:w-36" aria-hidden="true">
      <motion.svg viewBox="0 0 120 120" className="h-full w-full" animate={touch ? undefined : { rotate: 360 }} transition={{ duration: 28, ease: "linear", repeat: Infinity }}>
        <defs><path id="badge-circle" d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" /></defs>
        <circle cx="60" cy="60" r="58" fill="#08140e" fillOpacity="0.72" stroke="#8bcb35" strokeOpacity="0.5" />
        <text fill="#b7e36b" fontSize="10.5" letterSpacing="3.2" fontWeight="600" style={{ textTransform: "uppercase" }}>
          <textPath href="#badge-circle">Indian • Chinese • Tandoor •</textPath>
        </text>
      </motion.svg>
      <span className="absolute inset-0 grid place-items-center text-lime"><Flame size={30} strokeWidth={1.6} /></span>
    </div>
  );
}

function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const touch = useTouch();
  const calm = reduce || touch; 
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, calm ? 0 : 40]);
  const mediaY = useTransform(scrollYProgress, [0, 1], [0, calm ? 0 : -20]);

  return (
    <section ref={ref} className="relative isolate flex min-h-[90svh] items-center overflow-hidden bg-ink" aria-labelledby="hero-title">
      <img src={interior} alt="" aria-hidden="true" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-forest/40" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/60" aria-hidden="true" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pb-20 pt-24 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:py-28">
        <motion.div style={{ y: textY }} className="lg:col-span-7">
          <Slide from="left" distance={60} duration={1.2}>
            <p className="eyebrow flex items-center gap-3 text-lime">
              <span className="h-px w-10 bg-lime/70" />
              <span>Jatni · Indian · Chinese · Tandoor</span>
            </p>
          </Slide>

          <h1 id="hero-title" className="mt-5 font-serif text-[2.6rem] font-semibold leading-[0.95] sm:mt-6 sm:text-6xl lg:text-[6rem]">
            <span className="block overflow-hidden pb-1">
              <Slide from="left" distance={150} duration={1.4} delay={0.1} as="span" className="block">Bold Flavours.</Slide>
            </span>
            <span className="block overflow-hidden pb-2">
              <Slide from="right" distance={150} duration={1.5} delay={0.3} as="span" className="block">
                <em className="text-lime-gradient pr-2 font-medium italic">Freshly Served.</em>
              </Slide>
            </span>
          </h1>

          <Slide from="left" distance={70} duration={1.3} delay={0.5}>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ivory/75 sm:mt-6 sm:text-xl">
              Explore Indian favourites, Chinese classics and tandoor-inspired flavours at {business.name}.
            </p>
          </Slide>

          <Slide from="left" distance={70} duration={1.3} delay={0.7} className="mt-7 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
            <Link to="/menu" className="btn btn-lime">Explore Menu <ArrowRight size={16} /></Link>
            <a href={enquiryUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><WhatsAppIcon size={16} /> Order on WhatsApp</a>
          </Slide>

          <Slide from="left" distance={70} duration={1.3} delay={0.9} className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ivory/65">
            <span className="flex items-center gap-2"><MapPin size={16} className="text-lime" /> {business.address.line1}, Jatni</span>
            <span className="flex items-center gap-2"><Clock size={16} className="text-lime" /> Listed {business.hours.label}</span>
          </Slide>
        </motion.div>

        <motion.div style={{ y: mediaY }} className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <Slide from="right" distance={120} duration={1.6} delay={0.2}>
            <div className="relative mx-auto aspect-[4/5] w-[78%] sm:w-[68%] lg:w-[78%]">
              <div aria-hidden="true" className="absolute -inset-4 rounded-t-[999px] rounded-b-[2.5rem] border border-dashed border-lime/30" />
              <div className="absolute inset-0 overflow-hidden rounded-t-[999px] rounded-b-3xl border border-lime/30 bg-forest shadow-2xl">
                <HeroVideo />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
              </div>

              <RotatingBadge />

              <Slide from="left" distance={90} duration={1.4} delay={0.8} className="absolute -left-6 bottom-12 w-40 sm:-left-14 sm:w-52">
                <div className="overflow-hidden rounded-2xl border border-ivory/25 shadow-2xl">
                  <img src={paneer} alt="Paneer tikka" width="800" height="457" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                </div>
              </Slide>

              <Slide from="right" distance={90} duration={1.4} delay={1} className="absolute -right-2 bottom-10 sm:-right-8">
                <div className="glass rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1.5 text-lime"><Star size={14} fill="currentColor" /><span className="eyebrow !text-[0.6rem]">Google rated</span></div>
                  <p className="mt-1.5 font-serif text-2xl font-semibold leading-none">{business.rating.value}<span className="text-sm text-ivory/55"> / 5</span></p>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-widest text-ivory/55">{business.rating.count} reviews</p>
                </div>
              </Slide>
            </div>
          </Slide>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  STRIP: icon marquee + at-a-glance facts                            */
/* ------------------------------------------------------------------ */
function Strip() {
  const words = [
    { t: "Indian Curries", Icon: Soup },
    { t: "Tandoori Grills", Icon: Flame },
    { t: "Indo-Chinese", Icon: UtensilsCrossed },
    { t: "Hyderabadi Biryani", Icon: ChefHat },
    { t: "Hakka Noodles", Icon: Wheat },
    { t: "Fried Rice", Icon: Leaf },
    { t: "Kebabs", Icon: Drumstick },
    { t: "Sizzling Starters", Icon: Sparkles },
  ];
  const [spend, per] = String(business.priceRange).split(/\s+per\s+/i);
  const facts = [
    { k: "Cuisine", v: "Indian · Chinese · Tandoor", Icon: UtensilsCrossed, from: "left" },
    { k: "Location", v: "Hari Bhaina Chhaka, Jatni", Icon: MapPin, from: "left" },
    { k: "Google rating", big: String(business.rating.value), unit: "/ 5", note: `${business.rating.count} reviews on Google`, Icon: Star, from: "right" },
    { k: "Typical spend", big: spend, note: per ? `per person` : "", Icon: Wallet, from: "right", accent: true },
  ];
  return (
    <section id="glance" aria-label="At a glance" className="relative overflow-x-clip border-y border-lime/15 bg-forest">
      <div className="marquee py-4 sm:py-5" aria-hidden="true">
        <div className="marquee-track">
          {[...words, ...words, ...words, ...words].map(({ t, Icon }, i) => (
            <span key={i} className="flex items-center font-serif text-2xl italic text-ivory/80 sm:text-4xl">
              <span className="px-6 sm:px-8">{t}</span><Icon size={20} className="text-lime" strokeWidth={1.7} />
            </span>
          ))}
        </div>
      </div>
      <div className="hairline" />
      <dl className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-5 py-8 min-[480px]:grid-cols-2 sm:gap-4 sm:px-8 sm:py-10 lg:grid-cols-4">
        {facts.map(({ k, v, big, unit, note, Icon, from, accent }, i) => (
          <Slide key={k} from={from} distance={60} duration={1} delay={i * 0.05}
            className={`relative min-w-0 overflow-hidden rounded-2xl border p-5 sm:p-6 ${accent ? "border-lime/40 bg-gradient-to-br from-lime/15 via-forest to-ink" : "border-ivory/10 bg-ink/45"}`}>
            <dt className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/15 text-lime"><Icon size={19} strokeWidth={1.8} /></span>
              <span className="eyebrow text-lime">{k}</span>
            </dt>
            <dd className="mt-4">
              {big ? (
                <>
                  <span className="font-serif text-3xl font-semibold leading-none text-ivory sm:text-4xl">{big}</span>
                  {unit && <span className="ml-1.5 text-base text-ivory/55">{unit}</span>}
                  {note && <span className="mt-2 block text-sm text-ivory/60">{note}</span>}
                </>
              ) : (
                <span className="block font-serif text-xl leading-snug text-ivory sm:text-2xl">{v}</span>
              )}
            </dd>
          </Slide>
        ))}
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FEATURED: dish cards flip on hover                                 */
/* ------------------------------------------------------------------ */
function FeaturedBack({ item }) {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-lime/30 bg-gradient-to-br from-heritage via-forest to-ink p-7 text-ivory shadow-2xl">
      <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime/15 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <p className="eyebrow flex items-center gap-2 text-lime"><Sparkles size={14} /> Chef's pick</p>
        <h3 className="mt-4 font-serif text-3xl font-semibold leading-tight">{item.name}</h3>
        <div className="mt-4 flex items-center gap-3">
          <span className="font-serif text-2xl font-semibold text-lime">{inr(item.price)}</span>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-ivory/90"><VegMark veg={item.veg} /></span>
        </div>
        <p className="mt-5 text-[0.95rem] leading-relaxed text-ivory/70">{item.desc}</p>
      </div>
      <Link to={item.categoryId ? `/menu?cat=${item.categoryId}` : "/menu"} className="btn btn-lime relative mt-6 w-full justify-center">
        See in menu <ArrowRight size={16} />
      </Link>
    </div>
  );
}

function Featured() {
  const items = featuredIds.map((id) => menuById[id]).filter((i) => i && i.available);
  const dirs = ["left", "up", "right"];
  return (
    <section className="on-ivory overflow-x-clip bg-ivory py-24 text-charcoal sm:py-32" aria-labelledby="featured-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Slide from="left" distance={70}>
          <SectionHeading eyebrow="From the menu" title="Dishes to" accent="start with">
            A few plates from our menu, each shown with a photograph of the dish itself.
          </SectionHeading>
        </Slide>
        <h2 id="featured-title" className="sr-only">Featured dishes</h2>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {items.map((it, i) => (
            <Slide key={it.id} from={dirs[i % 3]} distance={80} duration={1.2} delay={i * 0.1}>
              <FlipCard front={<FeaturedDish item={it} />} back={<FeaturedBack item={it} />} />
            </Slide>
          ))}
        </div>
        <Slide from="up" className="mt-14 text-center">
          <Link to="/menu" className="btn btn-dark">View full menu <ArrowRight size={16} /></Link>
        </Slide>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SIGNATURE                                                          */
/* ------------------------------------------------------------------ */
function Signature() {
  const pillars = [
    { Icon: Flame, t: "Tandoor grills", d: "Kebabs, tikkas and breads with that smoky, charred tandoor character." },
    { Icon: Soup, t: "Indo-Chinese wok", d: "Hakka noodles, fried rice and sizzling starters, tossed to order." },
    { Icon: Leaf, t: "A fresh green room", d: "Leaf-green walls, hand-painted art and soft lighting for easy family meals." },
    { Icon: WhatsAppIcon, t: "Order on WhatsApp", d: "Pick dishes on the site and send your order straight to the restaurant." },
  ];
  return (
    <section className="relative overflow-hidden bg-forest py-24 sm:py-32" aria-labelledby="sig-title">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Slide from="right" distance={70}>
          <SectionHeading eyebrow="Why Greenchilly" title="Three cuisines," accent="one table" />
        </Slide>
        <h2 id="sig-title" className="sr-only">What makes us different</h2>
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ Icon, t, d }, i) => (
            <Slide key={t} from={i % 2 === 0 ? "left" : "right"} distance={80} duration={1.2} delay={(i % 2) * 0.1}
              className="group relative overflow-hidden rounded-3xl border border-lime/15 bg-ink/50 p-7 transition-colors duration-500 hover:border-lime/50">
              <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-lime/15 text-lime"><Icon size={26} strokeWidth={1.6} /></span>
              <h3 className="relative mt-6 font-serif text-2xl font-semibold">{t}</h3>
              <p className="relative mt-2 text-[0.95rem] leading-relaxed text-ivory/65">{d}</p>
            </Slide>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CATEGORIES                                                         */
/* ------------------------------------------------------------------ */
const pexels = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900&h=1100&fit=crop`;
const droppedPhotos = import.meta.glob("../assets/cat-*.{webp,jpg,jpeg,png}", { eager: true, import: "default" });
const ownPhoto = (id) => {
  const hit = Object.entries(droppedPhotos).find(([p]) => p.includes(`/cat-${id}.`));
  return hit ? hit[1] : null;
};

const keywordRules = [
  { test: /roll/, key: "roll" },
  { test: /soup/, key: "soup" },
  { test: /starter/, not: /non/, key: "starter-veg" },
  { test: /mutton/, key: "mutton" },
  { test: /sea\s?food|prawn|fish/, key: "seafood" },
  { test: /egg/, key: "egg" },
  { test: /\bdal\b|lentil/, key: "dal" },
  { test: /bread|roti|naan|kulcha|paratha/, key: "bread" },
  { test: /raita|papad|salad/, key: "raita-papad" },
];

const rulesFor = (c) => {
  const text = `${c.id} ${c.name}`.toLowerCase();
  return keywordRules.filter((r) => r.test.test(text) && !(r.not && r.not.test(text)));
};
const keyPhotos = { roll: catRoll, soup: catSoup, "starter-veg": catStarterVeg, mutton: catMutton, egg: catEgg, "raita-papad": catRaitaPapad };
const keywordPhoto = (c) => { for (const r of rulesFor(c)) { const p = keyPhotos[r.key] || ownPhoto(r.key); if (p) return p; } return null; };
const keywordIcon = (c) => {
  const k = rulesFor(c)[0]?.key;
  return { roll: Wheat, soup: Soup, "starter-veg": Leaf, mutton: Drumstick, seafood: Fish, egg: Egg, dal: Soup, bread: Wheat, "raita-papad": Salad }[k];
};

const categoryPhotos = {
  "starter-non-veg": pexels(3926125),
  "tandoori-veg": paneer,
  "tandoori-non-veg": chickenTikka,
  "indian-veg-curry": pexels(12737805),
  "chinese-noodles": pexels(7138913),
  "rice": pexels(4940832),
  "chinese-curry-veg": pexels(5339079),
  "chinese-curry-non-veg": pexels(28445826),
  "biryani-and-non-veg-curries": biryani,
};

const categoryIcon = {
  "starter-non-veg": Drumstick,
  "tandoori-veg": Flame,
  "tandoori-non-veg": Flame,
  "indian-veg-curry": Soup,
  "chinese-noodles": Wheat,
  "rice": UtensilsCrossed,
  "chinese-curry-veg": Soup,
  "chinese-curry-non-veg": Soup,
  "biryani-and-non-veg-curries": ChefHat,
};

function CategoryCard({ c, i }) {
  const reduce = useReducedMotion();
  const touch = useTouch();
  const [bad, setBad] = useState(false);
  const src = !bad ? ownPhoto(c.id) || keywordPhoto(c) || categoryPhotos[c.id] : null;
  const Icon = categoryIcon[c.id] || keywordIcon(c) || UtensilsCrossed;
  const sample = menuItems.filter((m) => m.categoryId === c.id && m.available !== false).slice(0, 4);

  const front = (
    <div className="absolute inset-0 overflow-hidden rounded-3xl border border-lime/15 bg-forest shadow-2xl">
      {src ? (
        <img
          src={src}
          alt={c.name}
          loading="lazy"
          decoding="async"
          onError={() => setBad(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-heritage via-deep to-ink" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-ink/75 px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-lime">
        <Icon size={14} /> {String(i + 1).padStart(2, "0")}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <h3 className="font-serif text-2xl font-semibold leading-tight drop-shadow sm:text-3xl">{c.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-ivory/75">{c.count} dishes · from {inr(c.from)}</p>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-lime py-1.5 pl-4 pr-1.5 text-xs font-semibold uppercase tracking-widest text-ink">
            View <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-lime"><ArrowUpRight size={15} /></span>
          </span>
        </div>
      </div>
    </div>
  );

  const back = (
    <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-lime/40 bg-gradient-to-br from-heritage via-forest to-ink p-5 sm:p-7">
      <div className="relative">
        <p className="eyebrow flex items-center gap-2 text-lime"><Icon size={14} /> {c.count} dishes · from {inr(c.from)}</p>
        <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight">{c.name}</h3>
        {sample.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-ivory/10 pt-5 text-[0.95rem] text-ivory/75">
            {sample.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${m.veg ? "bg-green-500" : "bg-red-500"}`} /><span className="truncate">{m.name}</span></span>
                <span className="shrink-0 font-serif text-lime">{inr(m.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-lime py-2 pl-5 pr-2 text-xs font-semibold uppercase tracking-widest text-ink">
        Open section <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-lime"><ArrowUpRight size={15} /></span>
      </span>
    </div>
  );

  return (
    <Slide from={i % 3 === 0 ? "left" : i % 3 === 2 ? "right" : "up"} distance={80} duration={1.2} delay={(i % 3) * 0.1}>
      <FlipCard as={Link} to={`/menu?cat=${c.id}`} fill front={front} back={back} className="relative block aspect-[4/5] touch-manipulation rounded-3xl outline-none" />
    </Slide>
  );
}

function DirectOrderBanner() {
  const perks = [
    { Icon: BadgePercent, t: "Straight from our kitchen", d: "Your order comes to us directly, with no delivery-app commission in between." },
    { Icon: Truck, t: "Pickup or delivery", d: "Choose what suits you. Delivery orders are confirmed on WhatsApp." },
    { Icon: Flame, t: "Made fresh to order", d: "Every dish is cooked fresh once your order reaches the kitchen." },
  ];
  return (
    <Slide from="up" distance={60} duration={1.2} className="relative mt-14 overflow-hidden rounded-[2rem] border border-lime/25 bg-gradient-to-br from-heritage/70 via-forest to-ink p-7 sm:mt-16 sm:p-10">
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow flex items-center gap-2 text-lime"><BadgePercent size={14} /> Order direct</p>
          <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            Order from us directly and <em className="text-lime-gradient font-medium italic">save on app fees.</em>
          </h3>
          <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ivory/70">
            Delivery apps add their own charges on top. Pick your dishes here, send the order on WhatsApp, and it goes straight to the restaurant.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/menu" className="btn btn-lime">Order now <ArrowRight size={16} /></Link>
            <a href={enquiryUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><WhatsAppIcon size={16} /> Ask on WhatsApp</a>
          </div>
        </div>
        <ul className="grid gap-3">
          {perks.map(({ Icon, t, d }) => (
            <li key={t} className="flex items-start gap-4 rounded-2xl border border-ivory/10 bg-ink/40 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/15 text-lime"><Icon size={20} strokeWidth={1.7} /></span>
              <span className="min-w-0">
                <span className="block font-serif text-lg font-semibold leading-tight">{t}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-ivory/60">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Slide>
  );
}

function Categories() {
  const touch = useTouch();
  return (
    <section className="relative overflow-hidden bg-ink py-24 sm:py-32" aria-label="Menu categories">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Slide from="left" distance={70}>
          <SectionHeading eyebrow="The menu" title="Choose your" accent="craving">From tandoor starters to dum biryani, there is a section for every craving.</SectionHeading>
        </Slide>
        <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => <li key={c.id}><CategoryCard c={c} i={i} /></li>)}
        </ul>
        <DirectOrderBanner />
      </div>
    </section>
  );
}

function Atmosphere() {
  return (
    <section className="relative overflow-x-clip bg-forest py-24 sm:py-32" aria-labelledby="atm-title">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-12">
        <Slide from="left" distance={100} duration={1.3} className="lg:col-span-7">
          <div className="relative">
            <img src={interior} alt="Inside restaurant" loading="lazy" width="1360" height="766" className="aspect-[16/10] w-full rounded-[2rem] border border-lime/20 object-cover shadow-2xl" />
          </div>
        </Slide>
        <Slide from="right" distance={100} duration={1.3} delay={0.1} className="lg:col-span-5">
          <p className="eyebrow flex items-center gap-2 text-lime"><Leaf size={14} /> The room</p>
          <h2 id="atm-title" className="mt-4 font-serif text-4xl font-semibold leading-[1.05] sm:text-5xl">A fresh green room, <em className="text-lime-gradient font-medium italic">made for sharing.</em></h2>
          <p className="mt-6 text-lg leading-relaxed text-ivory/70">Leaf-green walls, stone-patterned panels, bold hand-painted art and soft violet accent lighting. It is a bright, easy space for family meals.</p>
          <Link to="/about" className="btn btn-ghost mt-8">See the restaurant <ArrowRight size={16} /></Link>
        </Slide>
      </div>
    </section>
  );
}

function Rating() {
  const r = business.rating;
  const writeUrl = REVIEW_URL;
  const [qr, setQr] = useState("");
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(writeUrl, { margin: 1, width: 400, errorCorrectionLevel: "M", color: { dark: "#08140e", light: "#ffffff" } })
      .then((u) => live && setQr(u)).catch(() => {});
    return () => { live = false; };
  }, [writeUrl]);

  return (
    <section className="overflow-x-clip bg-ink py-20 sm:py-28" aria-labelledby="rating-title">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Slide from="up" distance={50} duration={1.1} className="relative overflow-hidden rounded-[1.75rem] border border-lime/20 bg-gradient-to-br from-forest via-ink to-ink sm:rounded-[2rem]">
          <div className="relative grid gap-px bg-ivory/10 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_auto]">
            <div className="flex flex-col items-center justify-center bg-forest/80 p-8 text-center sm:p-10 lg:items-start lg:text-left">
              <p className="eyebrow flex items-center gap-2 text-lime"><Star size={14} fill="currentColor" /> Google rating</p>
              <p className="mt-4 font-serif text-7xl font-semibold leading-none text-lime-gradient sm:text-8xl">{r.value}</p>
              <div className="mt-4"><StarRating value={r.value} size={22} /></div>
              <p className="mt-3 text-sm text-ivory/65">out of {r.outOf} · {r.count} reviews</p>
            </div>

            <div className="flex flex-col justify-center bg-ink/90 p-7 sm:p-10">
              <p className="eyebrow flex items-center gap-2 text-lime"><PenLine size={14} /> What guests say</p>
              <h2 id="rating-title" className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
                Enjoyed your meal? <em className="text-lime-gradient font-medium italic">Leave us a review.</em>
              </h2>
              <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ivory/65">
                Your review takes less than a minute and helps other people in Jatni find us.
              </p>
              <div className="mt-7 flex flex-col gap-3 min-[480px]:flex-row">
                <a href={writeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-lime justify-center"><PenLine size={16} /> Write a review</a>
                <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost justify-center">Read reviews <ExternalLink size={15} /></a>
              </div>
            </div>

            <div className="hidden flex-col items-center justify-center gap-3 bg-forest/80 p-8 sm:flex sm:p-10">
              <div className="rounded-2xl bg-white p-3 shadow-2xl">
                {qr ? <img src={qr} alt="QR code" width="176" height="176" className="h-44 w-44" /> : <span className="block h-44 w-44" />}
              </div>
              <p className="text-center text-sm font-medium text-ivory">Scan to review</p>
            </div>
          </div>
        </Slide>
      </div>
    </section>
  );
}

function HowToOrder() {
  const steps = [
    { Icon: ListChecks, t: "Pick your dishes", d: "Browse the menu and add what you like. Change quantities any time.", from: "left" },
    { Icon: UserRound, t: "Share your details", d: "Add your name and number. Choose pickup, or delivery with your address.", from: "up" },
    { Icon: Send, t: "Send on WhatsApp", d: "Your order opens in WhatsApp, ready to send. The restaurant confirms availability.", from: "right" },
  ];
  return (
    <section className="relative overflow-hidden bg-deep py-24 sm:py-28" aria-labelledby="order-title">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Slide from="left" distance={70}><SectionHeading eyebrow="Direct ordering" title="Order in" accent="three steps" /></Slide>
        <h2 id="order-title" className="sr-only">How to order</h2>
        <ol className="relative mt-16 grid gap-6 md:grid-cols-3">
          {steps.map(({ Icon, t, d, from }, i) => (
            <Slide as="li" key={t} from={from} distance={80} duration={1.2} delay={i * 0.1} className="group relative rounded-3xl border border-ivory/10 bg-ink/40 p-8">
              <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-full bg-lime/15 text-lime"><Icon size={22} /></span><span className="font-serif text-5xl italic text-ivory/15">{i + 1}</span></div>
              <h3 className="mt-6 font-serif text-2xl font-semibold">{t}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ivory/65">{d}</p>
            </Slide>
          ))}
        </ol>
        <Slide from="up" className="mt-12 text-center"><Link to="/menu" className="btn btn-lime">Start your order <ArrowRight size={16} /></Link></Slide>
      </div>
    </section>
  );
}

function VisitTeaser() {
  return (
    <section className="overflow-x-clip bg-ink py-24 sm:py-32" aria-labelledby="visit-title">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
        <Slide from="left" distance={100} duration={1.3}>
          <p className="eyebrow flex items-center gap-2 text-lime"><MapPin size={14} /> Visit us</p>
          <h2 id="visit-title" className="mt-4 font-serif text-5xl font-semibold leading-[1.02] sm:text-6xl">Find us in <em className="text-lime-gradient font-medium italic">Jatni.</em></h2>
          <address className="mt-8 not-italic leading-relaxed text-ivory/75">
            <p className="font-serif text-2xl text-ivory">{business.name}</p>
            <p className="mt-2">{business.address.line1}</p><p>{business.address.line2}</p>
          </address>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-lime"><Navigation size={16} /> Get directions</a>
            <a href={`tel:${business.contact.phoneTel}`} className="btn btn-ghost"><Phone size={16} /> Call</a>
          </div>
        </Slide>
        <Slide from="right" distance={100} duration={1.3} delay={0.1} className="glass rounded-[2rem] p-8 sm:p-10">
          <p className="eyebrow flex items-center gap-2 text-lime"><Clock size={14} /> Opening hours</p>
          <p className="mt-4 font-serif text-5xl font-semibold">{business.hours.label}</p>
          <p className="mt-4 text-sm leading-relaxed text-ivory/60">{business.hours.note}</p>
          <Link to="/visit-us" className="mt-8 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-lime hover:underline">All visit details <ArrowRight size={15} /></Link>
        </Slide>
      </div>
    </section>
  );
}

export default function Home() {
  useMenuVersion();
  usePageTitle("");
  return (
    <>
      <Hero />
      <Strip />
      <Featured />
      <Signature />
      <Categories />
      <Atmosphere />
      <Rating />
      <HowToOrder />
      <VisitTeaser />
    </>
  );
}