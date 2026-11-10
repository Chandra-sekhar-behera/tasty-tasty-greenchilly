import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, MapPin, Clock, Phone, Navigation, ListChecks, UserRound, Send,
  Flame, Soup, Leaf, ChefHat, Star, UtensilsCrossed, Wallet, ChevronDown, Sparkles, Drumstick, Wheat,
  BadgePercent, Truck, Egg, Fish, Salad,
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

/* ------------------------------------------------------------------ */
/*  Slow directional entrance: slides in from left / right / up        */
/* ------------------------------------------------------------------ */
const EASE = [0.16, 1, 0.3, 1];

function Slide({ from = "left", delay = 0, duration = 1.6, distance = 140, className = "", as = "div", children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  const d = reduce ? 0 : distance;
  const start = {
    opacity: 0,
    x: from === "left" ? -d : from === "right" ? d : 0,
    y: from === "up" ? Math.min(d, 70) : 0,
  };
  return (
    <Tag
      className={className}
      initial={start}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: reduce ? 0.01 : duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  FlipCard: flips when the mouse enters, returns when it leaves      */
/*  (also flips on keyboard focus). Touch screens do not flip, so a    */
/*  tap still opens the link / dish normally.                          */
/* ------------------------------------------------------------------ */
const faceStyle = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };

function FlipCard({ as: Tag = "div", front, back, fill = false, className = "", ...rest }) {
  const reduce = useReducedMotion();
  const [flip, setFlip] = useState(false);
  const mouse = (e, v) => { if (e.pointerType === "mouse") setFlip(v); };
  return (
    <Tag
      className={className}
      style={{ perspective: 1400 }}
      onPointerEnter={(e) => mouse(e, true)}
      onPointerLeave={(e) => mouse(e, false)}
      onFocus={() => setFlip(true)}
      onBlur={() => setFlip(false)}
      {...rest}
    >
      <motion.div
        className={fill ? "absolute inset-0" : "relative h-full"}
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flip ? 180 : 0 }}
        transition={{ duration: reduce ? 0.01 : 0.85, ease: EASE }}
      >
        <div className={fill ? "absolute inset-0" : "h-full"} style={faceStyle}>{front}</div>
        <div className="absolute inset-0" style={{ ...faceStyle, transform: "rotateY(180deg)" }}>{back}</div>
      </motion.div>
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/*  HERO                                                               */
/* ------------------------------------------------------------------ */
function HeroVideo() {
  const [failed, setFailed] = useState(false);
  const reduce = useReducedMotion();
  const conn = typeof navigator !== "undefined" ? navigator.connection : undefined;
  const skip = reduce || conn?.saveData || failed;
  if (skip) {
    return <img src={biryani} alt="A plate of biryani served with sides" width="783" height="1020" fetchPriority="high" className="h-full w-full object-cover" />;
  }
  return (
    <video
      className="h-full w-full scale-[1.04] object-cover"
      src={heroVideo}
      poster={biryani}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-label="Freshly served dishes at Tasty Tasty Greenchilly"
      onError={() => setFailed(true)}
    />
  );
}

function RotatingBadge() {
  return (
    <div className="absolute -right-3 -top-5 z-10 h-28 w-28 sm:-right-10 sm:-top-8 sm:h-36 sm:w-36" aria-hidden="true">
      <motion.svg viewBox="0 0 120 120" className="h-full w-full" animate={{ rotate: 360 }} transition={{ duration: 28, ease: "linear", repeat: Infinity }}>
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
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const mediaY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -50]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);

  return (
    <section ref={ref} className="noise relative isolate flex min-h-[100svh] items-center overflow-hidden bg-ink" aria-labelledby="hero-title">
      {/* ambient background */}
      <img src={interior} alt="" aria-hidden="true" decoding="async" className="absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-30 blur-[3px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-forest/50" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/70" aria-hidden="true" />
      <motion.div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-violet/25 blur-[120px]" animate={{ x: [0, 60, 0], y: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-lime/15 blur-[120px]" animate={{ x: [0, -70, 0], y: [0, -30, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-24 pt-28 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:pb-20 lg:pt-32">
        {/* LEFT: copy slides in from the left */}
        <motion.div style={{ y: textY, opacity: fade }} className="lg:col-span-7">
          <Slide from="left" distance={90} duration={1.4}>
            <p className="eyebrow flex items-center gap-3 text-lime">
              <span className="h-px w-10 bg-lime/70" />
              <span className="sm:hidden">Indian · Chinese · Tandoor</span>
              <span className="hidden sm:inline">Jatni · Indian · Chinese · Tandoor</span>
            </p>
          </Slide>

          <h1 id="hero-title" className="mt-5 font-serif text-[2.8rem] font-semibold leading-[0.95] sm:mt-7 sm:text-7xl lg:text-[6.6rem]">
            <span className="block overflow-hidden pb-1">
              <Slide from="left" distance={260} duration={1.8} delay={0.15} as="span" className="block">Bold Flavours.</Slide>
            </span>
            <span className="block overflow-hidden pb-2">
              <Slide from="right" distance={260} duration={1.9} delay={0.45} as="span" className="block">
                <em className="text-lime-gradient pr-2 font-medium italic">Freshly Served.</em>
              </Slide>
            </span>
          </h1>

          <Slide from="left" distance={110} duration={1.6} delay={0.7}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory/75 sm:mt-7 sm:text-xl">
              Explore Indian favourites, Chinese classics and tandoor-inspired flavours at {business.name}.
            </p>
          </Slide>

          <Slide from="left" distance={110} duration={1.6} delay={0.9} className="mt-8 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
            <Link to="/menu" className="btn btn-lime">Explore Menu <ArrowRight size={16} /></Link>
            <a href={enquiryUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><WhatsAppIcon size={16} /> Order on WhatsApp</a>
          </Slide>

          <Slide from="left" distance={110} duration={1.6} delay={1.1} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ivory/65">
            <span className="flex items-center gap-2"><MapPin size={16} className="text-lime" /> {business.address.line1}, Jatni</span>
            <span className="flex items-center gap-2"><Clock size={16} className="text-lime" /> Listed {business.hours.label}</span>
          </Slide>
        </motion.div>

        {/* RIGHT: video arch slides in from the right */}
        <motion.div style={{ y: mediaY }} className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <Slide from="right" distance={220} duration={2} delay={0.3}>
            <div className="relative mx-auto aspect-[4/5] w-[78%] sm:w-[68%] lg:w-[78%]">
              <motion.div aria-hidden="true" className="absolute -inset-4 rounded-t-[999px] rounded-b-[2.5rem] border border-dashed border-lime/25" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
              <div className="absolute inset-0 overflow-hidden rounded-t-[999px] rounded-b-3xl border border-lime/30 bg-forest shadow-[0_40px_90px_-20px_rgba(0,0,0,0.85),0_0_80px_-20px_rgba(139,203,53,0.35)]">
                <HeroVideo />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                <div className="pointer-events-none absolute inset-0 rounded-t-[999px] rounded-b-3xl ring-1 ring-inset ring-ivory/10" />
              </div>

              <RotatingBadge />

              {/* paneer card slides from the left */}
              <Slide from="left" distance={160} duration={1.9} delay={1.2} className="absolute -left-6 bottom-12 w-40 sm:-left-14 sm:w-52">
                <div className="drift overflow-hidden rounded-2xl border border-ivory/25 shadow-2xl">
                  <img src={paneer} alt="Paneer tikka served sizzling" width="800" height="457" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                </div>
              </Slide>

              {/* rating card slides from the right */}
              <Slide from="right" distance={160} duration={1.9} delay={1.5} className="absolute -right-2 bottom-10 sm:-right-8">
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

      {/* scroll cue */}
      <motion.a href="#glance" aria-label="Scroll down" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-ivory/50 hover:text-lime sm:flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4, duration: 1 }}>
        <span className="eyebrow !text-[0.6rem]">Scroll</span>
        <motion.span animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}><ChevronDown size={18} /></motion.span>
      </motion.a>
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
  const facts = [
    { k: "Cuisine", v: "Indian · Chinese · Tandoor", Icon: UtensilsCrossed, from: "left" },
    { k: "Location", v: "Hari Bhaina Chhaka, Jatni", Icon: MapPin, from: "left" },
    { k: "Google rating", v: `${business.rating.value} / 5 · ${business.rating.count} reviews`, Icon: Star, from: "right" },
    { k: "Typical spend", v: business.priceRange, Icon: Wallet, from: "right" },
  ];
  return (
    <section id="glance" aria-label="At a glance" className="relative overflow-x-clip border-y border-lime/15 bg-forest">
      <div className="marquee py-5" aria-hidden="true">
        <div className="marquee-track">
          {[...words, ...words, ...words, ...words].map(({ t, Icon }, i) => (
            <span key={i} className="flex items-center font-serif text-3xl italic text-ivory/80 sm:text-4xl">
              <span className="px-8">{t}</span><Icon size={22} className="text-lime" strokeWidth={1.7} />
            </span>
          ))}
        </div>
      </div>
      <div className="hairline" />
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-5 py-10 sm:px-8 lg:grid-cols-4">
        {facts.map(({ k, v, Icon, from }, i) => (
          <Slide key={k} from={from} distance={80} duration={1.4} delay={i * 0.12} className="group border-l border-lime/25 pl-5">
            <dt className="eyebrow flex items-center gap-2 text-lime"><Icon size={14} /> {k}</dt>
            <dd className="mt-2 font-serif text-xl leading-snug sm:text-2xl">{v}</dd>
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
    <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-lime/30 bg-gradient-to-br from-heritage via-forest to-ink p-7 text-ivory shadow-[0_30px_70px_-35px_rgba(0,0,0,0.9)]">
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
        <Slide from="left" distance={100}>
          <SectionHeading light eyebrow="From the menu" title="Dishes to" accent="start with">
            A few plates from our menu, each shown with a photograph of the dish itself. The full menu has {categories.reduce((n, c) => n + c.count, 0)} dishes across Indian, Chinese and tandoor.
          </SectionHeading>
        </Slide>
        <h2 id="featured-title" className="sr-only">Featured dishes</h2>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {items.map((it, i) => (
            <Slide key={it.id} from={dirs[i % 3]} distance={130} duration={1.7} delay={i * 0.15}>
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
/*  SIGNATURE: what makes the place different                          */
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
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-lime/10 blur-[130px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Slide from="right" distance={100}>
          <SectionHeading eyebrow="Why Greenchilly" title="Three cuisines," accent="one table" />
        </Slide>
        <h2 id="sig-title" className="sr-only">What makes us different</h2>
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ Icon, t, d }, i) => (
            <Slide key={t} from={i % 2 === 0 ? "left" : "right"} distance={120} duration={1.7} delay={(i % 2) * 0.15}
              className="group relative overflow-hidden rounded-3xl border border-lime/15 bg-ink/50 p-7 transition-colors duration-500 hover:border-lime/50">
              <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lime/10 blur-2xl" aria-hidden="true" />
              <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-lime/15 text-lime transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"><Icon size={26} strokeWidth={1.6} /></span>
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
/*  CATEGORIES: photo cards that flip on hover                         */
/* ------------------------------------------------------------------ */
const pexels = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900&h=1100&fit=crop`;

// Your own photos: put src/assets/cat-<category-id>.webp (or .jpg/.png) and it is used automatically
const droppedPhotos = import.meta.glob("../assets/cat-*.{webp,jpg,jpeg,png}", { eager: true, import: "default" });
const ownPhoto = (id) => {
  const hit = Object.entries(droppedPhotos).find(([p]) => p.includes(`/cat-${id}.`));
  return hit ? hit[1] : null;
};

// Works for any category name: the photo is picked by a keyword in the category name.
// Save the file as src/assets/cat-<key>.webp (keys: roll, soup, starter-veg, mutton, egg, raita-papad, dal, bread, seafood)
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
// A category can match several rules (e.g. "Breads, Raita & Papad"): every match is kept, the first one that has a photo wins
const rulesFor = (c) => {
  const text = `${c.id} ${c.name}`.toLowerCase();
  return keywordRules.filter((r) => r.test.test(text) && !(r.not && r.not.test(text)));
};
const keyPhotos = { roll: catRoll, soup: catSoup, "starter-veg": catStarterVeg, mutton: catMutton, egg: catEgg, "raita-papad": catRaitaPapad };
// dal / bread / seafood: optional, drop src/assets/cat-dal.webp, cat-bread.webp, cat-seafood.webp when you have photos
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
  const [bad, setBad] = useState(false);
  const src = !bad ? ownPhoto(c.id) || keywordPhoto(c) || categoryPhotos[c.id] : null;
  const Icon = categoryIcon[c.id] || keywordIcon(c) || UtensilsCrossed;
  const sample = menuItems.filter((m) => m.categoryId === c.id && m.available !== false).slice(0, 4);

  const front = (
    <div className="absolute inset-0 overflow-hidden rounded-3xl border border-lime/15 bg-forest shadow-[0_30px_70px_-35px_rgba(0,0,0,0.9)]">
      {src ? (
        <motion.img
          src={src}
          alt={`${c.name} at Tasty Tasty Greenchilly`}
          loading="lazy"
          decoding="async"
          onError={() => setBad(true)}
          initial={{ scale: reduce ? 1 : 1.4 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 2.4, ease: EASE }}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-heritage via-deep to-ink" aria-hidden="true">
          <Icon className="absolute -right-6 top-1/4 h-56 w-56 -rotate-12 text-lime/15" strokeWidth={1} />
          <span className="absolute left-1/4 top-1/3 h-40 w-40 rounded-full bg-lime/20 blur-[70px]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" aria-hidden="true" />

      <motion.span
        className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-ink/65 px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-lime backdrop-blur"
        animate={reduce ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon size={14} /> {String(i + 1).padStart(2, "0")}
      </motion.span>

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <h3 className="font-serif text-2xl font-semibold leading-tight drop-shadow sm:text-3xl">{c.name}</h3>
        <div className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm text-ivory/75">{c.count} dishes · from {inr(c.from)}</p>
          <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-lime py-1.5 pl-4 pr-1.5 text-xs font-semibold uppercase tracking-widest text-ink shadow-[0_10px_30px_-8px_rgba(139,203,53,0.7)] sm:py-2 sm:pr-2">
            View dishes
            <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-lime"><ArrowUpRight size={15} /></span>
          </span>
        </div>
      </div>
    </div>
  );

  const back = (
    <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-3xl border border-lime/40 bg-gradient-to-br from-heritage via-forest to-ink p-5 shadow-[0_35px_90px_-30px_rgba(139,203,53,0.4)] sm:p-7">
      <Icon className="pointer-events-none absolute -right-8 -top-4 h-52 w-52 -rotate-12 text-lime/10" strokeWidth={1} aria-hidden="true" />
      <span className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-lime/15 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <p className="eyebrow flex items-center gap-2 text-lime"><Icon size={14} /> {c.count} dishes · from {inr(c.from)}</p>
        <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight">{c.name}</h3>
        {sample.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-ivory/10 pt-5 text-[0.95rem] text-ivory/75">
            {sample.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${m.veg ? "bg-green-500" : "bg-red-500"}`} aria-hidden="true" /><span className="truncate">{m.name}</span></span>
                <span className="shrink-0 font-serif text-lime">{inr(m.price)}</span>
              </li>
            ))}
            {c.count > sample.length && <li className="pt-1 text-sm text-ivory/45">+ {c.count - sample.length} more</li>}
          </ul>
        )}
      </div>
      <span className="relative mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-lime py-2 pl-5 pr-2 text-xs font-semibold uppercase tracking-widest text-ink shadow-[0_10px_30px_-8px_rgba(139,203,53,0.7)]">
        Open section
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-lime"><ArrowUpRight size={15} /></span>
      </span>
    </div>
  );

  return (
    <Slide from={i % 3 === 0 ? "left" : i % 3 === 2 ? "right" : "up"} distance={120} duration={1.8} delay={(i % 3) * 0.14}>
      <FlipCard
        as={Link}
        to={`/menu?cat=${c.id}`}
        fill
        front={front}
        back={back}
        aria-label={`${c.name}: ${c.count} dishes, from ${inr(c.from)}`}
        className="relative block aspect-[4/5] rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-lime/70"
      />
    </Slide>
  );
}

/* ------------------------------------------------------------------ */
/*  DIRECT ORDER: gentle nudge away from delivery-app fees             */
/* ------------------------------------------------------------------ */
function DirectOrderBanner() {
  const perks = [
    { Icon: BadgePercent, t: "Straight from our kitchen", d: "Your order comes to us directly, with no delivery-app commission in between." },
    { Icon: Truck, t: "Pickup or delivery", d: "Choose what suits you. Delivery orders are confirmed on WhatsApp." },
    { Icon: Flame, t: "Made fresh to order", d: "Every dish is cooked fresh once your order reaches the kitchen." },
  ];
  return (
    <Slide from="up" distance={80} duration={1.4} className="relative mt-14 overflow-hidden rounded-[2rem] border border-lime/25 bg-gradient-to-br from-heritage/70 via-forest to-ink p-7 sm:mt-16 sm:p-10">
      <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lime/15 blur-[90px]" aria-hidden="true" />
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
  return (
    <section className="relative overflow-hidden bg-ink py-24 sm:py-32" aria-label="Menu categories">
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-heritage/30 blur-[120px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-lime/10 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Slide from="left" distance={100}>
          <SectionHeading eyebrow="The menu" title="Choose your" accent="craving">From tandoor starters to dum biryani, there is a section for every craving. Hover a card to peek inside, tap to jump straight in.</SectionHeading>
        </Slide>
        <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => <li key={c.id}><CategoryCard c={c} i={i} /></li>)}
        </ul>
        <DirectOrderBanner />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  ATMOSPHERE                                                         */
/* ------------------------------------------------------------------ */
function Atmosphere() {
  return (
    <section className="relative overflow-x-clip bg-forest py-24 sm:py-32" aria-labelledby="atm-title">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-12">
        <Slide from="left" distance={200} duration={1.9} className="lg:col-span-7">
          <div className="relative">
            <img src={interior} alt="Inside Tasty Tasty Greenchilly: green walls, colourful paintings, steel chairs with green seats and balloons on the ceiling" loading="lazy" width="1360" height="766"
              className="aspect-[16/10] w-full rounded-[2rem] border border-lime/20 object-cover shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]" />
            <Slide from="right" distance={160} duration={2} delay={0.5} className="absolute -bottom-8 -right-3 hidden w-2/5 sm:block lg:-right-8">
              <img src={aisle} alt="Rows of dining tables with green seats" loading="lazy" width="1000" height="449"
                className="w-full rounded-2xl border-4 border-forest object-cover shadow-2xl" />
            </Slide>
          </div>
        </Slide>
        <Slide from="right" distance={200} duration={1.9} delay={0.15} className="lg:col-span-5">
          <p className="eyebrow flex items-center gap-2 text-lime"><Leaf size={14} /> The room</p>
          <h2 id="atm-title" className="mt-4 font-serif text-4xl font-semibold leading-[1.05] sm:text-5xl">A fresh green room, <em className="text-lime-gradient font-medium italic">made for sharing.</em></h2>
          <p className="mt-6 text-lg leading-relaxed text-ivory/70">Leaf-green walls, stone-patterned panels, bold hand-painted art and soft violet accent lighting. It is a bright, easy space for family meals and get-togethers.</p>
          <Link to="/about" className="btn btn-ghost mt-8">See the restaurant <ArrowRight size={16} /></Link>
        </Slide>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  RATING                                                             */
/* ------------------------------------------------------------------ */
function Rating() {
  const r = business.rating;
  return (
    <section className="overflow-x-clip bg-ink py-24 sm:py-28" aria-labelledby="rating-title">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Slide from="left" distance={180} duration={1.9} className="glass relative overflow-hidden rounded-[2rem] p-8 sm:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet/20 blur-[90px]" aria-hidden="true" />
          <div className="relative grid items-center gap-10 md:grid-cols-[auto_1fr]">
            <Slide from="left" distance={80} delay={0.4} className="text-center md:text-left">
              <p className="font-serif text-8xl font-semibold leading-none text-lime-gradient">{r.value}</p>
              <div className="mt-3 flex justify-center md:justify-start"><StarRating value={r.value} size={22} /></div>
              <p className="mt-2 text-sm uppercase tracking-widest text-ivory/55">out of {r.outOf}</p>
            </Slide>
            <Slide from="right" distance={120} delay={0.6}>
              <p className="eyebrow flex items-center gap-2 text-lime"><Star size={14} fill="currentColor" /> What guests say</p>
              <h2 id="rating-title" className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">Rated {r.value} from {r.count} reviews on Google</h2>
              <p className="mt-4 text-ivory/65">Figures are taken from the {r.source} and may change over time. Read the latest reviews directly on Google.</p>
              <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-7">Read reviews on Google <ArrowUpRight size={16} /></a>
            </Slide>
          </div>
        </Slide>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  HOW TO ORDER                                                       */
/* ------------------------------------------------------------------ */
function HowToOrder() {
  const steps = [
    { Icon: ListChecks, t: "Pick your dishes", d: "Browse the menu and add what you like. Change quantities any time.", from: "left" },
    { Icon: UserRound, t: "Share your details", d: "Add your name and number. Choose pickup, or delivery with your address.", from: "up" },
    { Icon: Send, t: "Send on WhatsApp", d: "Your order opens in WhatsApp, ready to send. The restaurant confirms availability and the final amount.", from: "right" },
  ];
  return (
    <section className="relative overflow-hidden bg-deep py-24 sm:py-28" aria-labelledby="order-title">
      <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-lime/10 blur-[110px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Slide from="left" distance={100}><SectionHeading eyebrow="Direct ordering" title="Order in" accent="three steps" /></Slide>
        <h2 id="order-title" className="sr-only">How to order</h2>
        <ol className="relative mt-16 grid gap-6 md:grid-cols-3">
          <span className="pointer-events-none absolute left-[16%] right-[16%] top-[3.7rem] hidden h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent md:block" aria-hidden="true" />
          {steps.map(({ Icon, t, d, from }, i) => (
            <Slide as="li" key={t} from={from} distance={130} duration={1.7} delay={i * 0.15} className="group relative rounded-3xl border border-ivory/10 bg-ink/40 p-8 transition-colors duration-500 hover:border-lime/40">
              <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-full bg-lime/15 text-lime transition-transform duration-500 group-hover:scale-110"><Icon size={22} /></span><span className="font-serif text-5xl italic text-ivory/15">{i + 1}</span></div>
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

/* ------------------------------------------------------------------ */
/*  VISIT                                                              */
/* ------------------------------------------------------------------ */
function VisitTeaser() {
  return (
    <section className="overflow-x-clip bg-ink py-24 sm:py-32" aria-labelledby="visit-title">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
        <Slide from="left" distance={180} duration={1.8}>
          <p className="eyebrow flex items-center gap-2 text-lime"><MapPin size={14} /> Visit us</p>
          <h2 id="visit-title" className="mt-4 font-serif text-5xl font-semibold leading-[1.02] sm:text-6xl">Find us in <em className="text-lime-gradient font-medium italic">Jatni.</em></h2>
          <address className="mt-8 not-italic leading-relaxed text-ivory/75">
            <p className="font-serif text-2xl text-ivory">{business.name}</p>
            <p className="mt-2">{business.address.line1}</p><p>{business.address.line2}</p>
            <p className="mt-1 text-sm text-ivory/50">Plus code {business.address.plusCode}</p>
          </address>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-lime"><Navigation size={16} /> Get directions</a>
            <a href={`tel:${business.contact.phoneTel}`} className="btn btn-ghost"><Phone size={16} /> Call</a>
          </div>
        </Slide>
        <Slide from="right" distance={180} duration={1.8} delay={0.15} className="glass rounded-[2rem] p-8 sm:p-10">
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