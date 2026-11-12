import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Flame, Soup, Utensils, UtensilsCrossed, Star, Wallet, Sparkles, MapPin, ZoomIn, X, Leaf, ChevronDown,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading.jsx";
import { business } from "../config/business.js";
import { categories, menuItems, useMenuVersion } from "../lib/menuStore.js";
import { usePageTitle } from "../lib/hooks.js";
import interior from "../assets/interior.webp";
import mural from "../assets/interior-mural.webp";
import tree from "../assets/interior-tree.webp";
import aisle from "../assets/interior-aisle.webp";
import biryani from "../assets/dish-biryani.webp";
import paneer from "../assets/dish-paneer-tikka.webp";
import chicken from "../assets/dish-chicken-tikka.webp";
import heroVideo from "../assets/hero.mp4";

const HERO_BG = interior;
const EASE = [0.16, 1, 0.3, 1];

const kitchens = [
  { Icon: Utensils, t: "Indian", d: "Paneer and dal curries, butter chicken, chicken curry and dum biryani.", from: "left" },
  { Icon: Soup, t: "Chinese", d: "Hakka and Sezwan noodles, fried rice, Manchurian and chilli favourites.", from: "up" },
  { Icon: Flame, t: "Tandoor", d: "Tikkas, malai chaap, kebabs and tandoori chicken from the clay oven.", from: "right" },
];

/* Mobile-optimized lightweight slide entrance */
function Slide({ from = "left", delay = 0, duration = 0.8, distance = 40, className = "", as = "div", children }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  const d = reduce ? 0 : distance;
  return (
    <Tag
      className={`${className} will-change-transform`}
      initial={{ opacity: 0, x: from === "left" ? -d : from === "right" ? d : 0, y: from === "up" ? d : 0 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: reduce ? 0.01 : duration, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

function Lightbox({ photo, onClose }) {
  useEffect(() => {
    if (!photo) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo, onClose]);
  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          role="dialog" aria-modal="true" aria-label={photo.alt}
          className="fixed inset-0 z-[80] grid place-items-center bg-ink/92 p-5 backdrop-blur-md"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button type="button" onClick={onClose} aria-label="Close photo" className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-ivory/30 text-ivory transition hover:border-lime hover:text-lime"><X size={20} /></button>
          <motion.img
            src={photo.src} alt={photo.alt}
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="max-h-[88vh] max-w-full rounded-2xl border border-lime/20 object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GalleryTile({ photo, onOpen, className = "", imgClass = "" }) {
  return (
    <button type="button" onClick={() => onOpen(photo)} aria-label={`Enlarge photo: ${photo.alt}`}
      className={`group relative block h-full w-full overflow-hidden rounded-3xl border border-lime/15 text-left transition-colors duration-500 hover:border-lime/60 ${className}`}>
      <img src={photo.src} alt={photo.alt} loading="lazy" width={photo.w} height={photo.h}
        className={`h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105 ${imgClass}`} />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
      <span className="absolute bottom-4 right-4 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-lime text-ink opacity-0 shadow-xl transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ZoomIn size={18} /></span>
    </button>
  );
}

export default function About() {
  useMenuVersion();
  usePageTitle("About");
  const reduce = useReducedMotion();
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 30]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -20]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0]);
  
  const [photo, setPhoto] = useState(null);
  const conn = typeof navigator !== "undefined" ? navigator.connection : undefined;
  const noVideo = reduce || conn?.saveData; // Removed window.innerWidth check so mobile plays video nicely

  const stats = [
    { Icon: UtensilsCrossed, v: `${menuItems.length}`, l: "Dishes on the menu", from: "left" },
    { Icon: Sparkles, v: `${categories.length}`, l: "Menu sections", from: "left" },
    { Icon: Star, v: `${business.rating.value} / 5`, l: `${business.rating.count} Google reviews`, from: "right" },
    { Icon: Wallet, v: business.priceRange, l: "Typical spend", from: "right" },
  ];

  const dishes = [
    { src: biryani, t: "Chicken Biryani", d: "Layered basmati rice and tender chicken." },
    { src: paneer, t: "Paneer Tikka", d: "Grilled in the tandoor until smoky." },
    { src: chicken, t: "Chicken Tikka", d: "Yoghurt-marinated, grilled over charcoal." },
  ];

  const gallery = {
    mural: { src: mural, alt: "A large cubist-style painting of faces in orange, blue and red on a green wall", w: 900, h: 555 },
    tree: { src: tree, alt: "A hand-painted autumn tree against a glowing sunset", w: 450, h: 1680 },
    aisle: { src: aisle, alt: "Dining tables with green seats under balloons", w: 1000, h: 449 },
  };

  return (
    <>
      {/* HERO */}
      <section ref={heroRef} className="noise relative isolate flex min-h-[90svh] items-end overflow-hidden bg-ink pb-12 pt-36 sm:pb-16">
        <motion.div style={{ y: bgY }} className="absolute inset-x-0 -top-[5%] -z-20 h-[110%]" aria-hidden="true">
          <img
            src={HERO_BG} alt="" fetchPriority="high"
            className="h-full w-full object-cover object-center"
          />
        </motion.div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/65 to-ink/40" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent" aria-hidden="true" />

        <motion.div style={{ y: textY, opacity: fade }} className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="max-w-4xl">
            <Slide from="left" distance={30} duration={0.8}>
              <p className="eyebrow flex items-center gap-3 text-lime"><span className="h-px w-14 bg-lime/70" /> <Leaf size={14} /> About us</p>
            </Slide>
            <h1 className="mt-5 font-serif text-5xl font-semibold leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">
              <span className="block overflow-hidden pb-1"><Slide from="left" distance={60} duration={1} delay={0.1} as="span" className="block">A green room in</Slide></span>
              <span className="block overflow-hidden pb-2"><Slide from="right" distance={60} duration={1} delay={0.2} as="span" className="block"><em className="text-lime-gradient font-medium italic">Jatni.</em></Slide></span>
            </h1>
            <Slide from="left" distance={40} duration={0.9} delay={0.3}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ivory/80 sm:text-lg">
                {business.name} is a restaurant at {business.address.line1}, Jatni. The menu brings together {business.cuisines.join(", ")} cooking, so one table can order a dum biryani, a plate of tikka and a bowl of Hakka noodles.
              </p>
            </Slide>
            <Slide from="left" distance={40} duration={0.9} delay={0.4} className="mt-8 flex flex-wrap gap-3">
              <Link to="/menu" className="btn btn-lime">Explore Menu <ArrowRight size={16} /></Link>
              <Link to="/visit-us" className="btn btn-ghost"><MapPin size={16} /> Visit Us</Link>
            </Slide>
          </div>

          <Slide from="up" distance={50} duration={1} delay={0.5} className="mt-14 sm:mt-16">
            <div className="glass grid grid-cols-1 divide-y divide-lime/15 rounded-2xl sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="flex items-center gap-3 px-6 py-4">
                <Star size={18} className="text-lime" />
                <span className="leading-tight"><span className="block font-serif text-lg font-semibold">{business.rating.value} / 5</span><span className="block text-[0.65rem] uppercase tracking-widest text-ivory/55">{business.rating.count} Google reviews</span></span>
              </div>
              <div className="flex items-center gap-3 px-6 py-4">
                <Wallet size={18} className="text-lime" />
                <span className="leading-tight"><span className="block font-serif text-lg font-semibold">{business.priceRange}</span><span className="block text-[0.65rem] uppercase tracking-widest text-ivory/55">Typical spend</span></span>
              </div>
              <div className="flex items-center gap-3 px-6 py-4">
                <MapPin size={18} className="text-lime" />
                <span className="leading-tight"><span className="block font-serif text-lg font-semibold">{business.address.line1}</span><span className="block text-[0.65rem] uppercase tracking-widest text-ivory/55">Jatni</span></span>
              </div>
            </div>
          </Slide>
        </motion.div>
      </section>

      {/* AT A GLANCE */}
      <section aria-label="At a glance" className="overflow-x-clip border-y border-lime/15 bg-ink">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-5 py-10 sm:px-8 lg:grid-cols-4">
          {stats.map(({ Icon, v, l, from }, i) => (
            <Slide key={l} from={from} distance={40} duration={0.8} delay={i * 0.08} className="border-l border-lime/25 pl-4">
              <dt className="eyebrow flex items-center gap-2 text-lime"><Icon size={14} /> {l}</dt>
              <dd className="mt-2 font-serif text-2xl leading-snug sm:text-3xl">{v}</dd>
            </Slide>
          ))}
        </dl>
      </section>

      {/* THREE KITCHENS */}
      <section className="on-ivory overflow-x-clip bg-ivory py-20 text-charcoal sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Slide from="left" distance={40}>
            <SectionHeading light eyebrow="What we serve" title="Three kitchens," accent="one table">
              {categories.length} menu sections, from tandoor starters to dum biryani, all in one place.
            </SectionHeading>
          </Slide>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {kitchens.map(({ Icon, t, d, from }, i) => (
              <Slide key={t} from={from} distance={50} duration={0.9} delay={i * 0.1}
                className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-md ring-1 ring-charcoal/5 transition duration-300 hover:-translate-y-1 hover:ring-heritage/30">
                <span className="relative grid h-12 w-12 place-items-center rounded-full bg-heritage/10 text-heritage"><Icon size={22} /></span>
                <h3 className="relative mt-6 font-serif text-2xl font-semibold">{t}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-charcoal/65">{d}</p>
              </Slide>
            ))}
          </div>
        </div>
      </section>

      {/* FROM OUR KITCHEN */}
      <section className="relative overflow-hidden bg-forest py-20 sm:py-28" aria-labelledby="dishes-title">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <Slide from="right" distance={40}>
            <SectionHeading eyebrow="From our kitchen" title="Plates people" accent="come for">A few dishes from the restaurant, photographed as served.</SectionHeading>
          </Slide>
          <h2 id="dishes-title" className="sr-only">Dishes from our kitchen</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {dishes.map((d, i) => (
              <Slide key={d.t} from={i === 0 ? "left" : i === 2 ? "right" : "up"} distance={50} duration={0.9} delay={i * 0.1}>
                <figure className="group relative aspect-[4/5] overflow-hidden rounded-3xl border border-lime/15 shadow-xl transition-colors duration-500 hover:border-lime/60">
                  <img src={d.src} alt={d.t} loading="lazy" className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" aria-hidden="true" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-6">
                    <span className="mb-2 block h-px w-8 bg-lime/70" aria-hidden="true" />
                    <h3 className="font-serif text-2xl font-semibold">{d.t}</h3>
                    <p className="mt-1 text-xs text-ivory/70">{d.d}</p>
                  </figcaption>
                </figure>
              </Slide>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="overflow-x-clip bg-ink py-20 sm:py-28" aria-labelledby="gallery-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Slide from="left" distance={40}>
            <SectionHeading eyebrow="Inside the restaurant" title="Colour on" accent="every wall">
              Leaf-green walls, stone-patterned panels, hand-painted art and soft violet lighting. Photographs are from the restaurant itself. Tap any photo to enlarge it.
            </SectionHeading>
          </Slide>
          <h2 id="gallery-title" className="sr-only">Restaurant photographs</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-12 md:grid-rows-[auto_auto]">
            <Slide from="left" distance={50} duration={1} className="md:col-span-8">
              <GalleryTile photo={gallery.mural} onOpen={setPhoto} />
            </Slide>
            <Slide from="right" distance={50} duration={1} delay={0.1} className="md:col-span-4 md:row-span-2">
              <GalleryTile photo={gallery.tree} onOpen={setPhoto} imgClass="max-h-[500px] md:max-h-none" />
            </Slide>
            <Slide from="left" distance={50} duration={1} delay={0.2} className="md:col-span-8">
              <GalleryTile photo={gallery.aisle} onOpen={setPhoto} />
            </Slide>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden bg-deep py-24 sm:py-32">
        {noVideo ? (
          <img src={interior} alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" />
        ) : (
          <video className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" src={heroVideo} poster={interior} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" onError={(e) => (e.currentTarget.style.display = "none")} />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-deep via-deep/70 to-deep/90" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <Slide from="up" duration={0.8}>
            <p className="eyebrow flex items-center justify-center gap-2 text-lime"><Flame size={14} /> Tasty Tasty Greenchilly</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-6xl">Hungry? <em className="text-lime-gradient font-medium italic">Let's eat.</em></h2>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/menu" className="btn btn-lime">Explore Menu <ArrowRight size={16} /></Link>
              <Link to="/visit-us" className="btn btn-ghost">Visit Us</Link>
            </div>
          </Slide>
        </div>
      </section>

      <Lightbox photo={photo} onClose={() => setPhoto(null)} />
    </>
  );
}