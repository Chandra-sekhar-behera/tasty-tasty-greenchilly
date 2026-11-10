import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Phone, Navigation, Clock, MapPin, Copy, Check, Info, ArrowUpRight, UtensilsCrossed, ArrowRight } from "lucide-react";
import WhatsAppIcon from "../components/WhatsAppIcon.jsx";
import { business, mapsDirectionsUrl } from "../config/business.js";
import { enquiryUrl } from "../lib/whatsapp.js";
import { usePageTitle } from "../lib/hooks.js";
import interior from "../assets/interior.webp";

const EASE = [0.16, 1, 0.3, 1];
const HERO_BG = "https://images.pexels.com/photos/8818732/pexels-photo-8818732.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop";
const MAP_SRC = `https://www.google.com/maps?q=${encodeURIComponent(`${business.address.plusCode} Jatni, Odisha`)}&z=16&output=embed`;

/* slow directional entrance */
function Slide({ from = "left", delay = 0, duration = 1.6, distance = 130, className = "", as = "div", children }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  const d = reduce ? 0 : distance;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, x: from === "left" ? -d : from === "right" ? d : 0, y: from === "up" ? Math.min(d, 70) : 0 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0.01 : duration, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

export default function VisitUs() {
  usePageTitle("Visit Us");
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [bgReady, setBgReady] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(business.address.full);
    } catch {
      const t = document.createElement("textarea");
      t.value = business.address.full; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      t.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  }

  const card = "glass group relative overflow-hidden rounded-3xl p-8 transition-colors duration-500 hover:border-lime/40";
  const iconWrap = "grid h-14 w-14 place-items-center rounded-2xl bg-lime/15 text-lime transition duration-500 group-hover:-rotate-6 group-hover:scale-110";

  const quick = [
    { Icon: Phone, t: "Call", s: business.contact.phoneDisplay, href: `tel:${business.contact.phoneTel}`, from: "left" },
    { Icon: WhatsAppIcon, t: "WhatsApp", s: "Order or ask", href: enquiryUrl(), ext: true, from: "up" },
    { Icon: Navigation, t: "Directions", s: "Open in Maps", href: mapsDirectionsUrl, ext: true, from: "right" },
  ];

  return (
    <>
      {/* HERO with background photo */}
      <section className="noise relative isolate overflow-hidden bg-forest pb-28 pt-36 sm:pb-32 sm:pt-44">
        <img src={interior} alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        <motion.img
          src={HERO_BG}
          alt=""
          aria-hidden="true"
          onLoad={() => setBgReady(true)}
          onError={(e) => (e.currentTarget.style.display = "none")}
          initial={{ scale: reduce ? 1 : 1.15 }}
          animate={{ scale: 1, opacity: bgReady ? 0.55 : 0 }}
          transition={{ scale: { duration: 14, ease: "easeOut" }, opacity: { duration: 1.6 } }}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-forest/40" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-transparent to-ink/60" aria-hidden="true" />
        <motion.div aria-hidden="true" className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-violet/25 blur-[110px]" animate={{ x: [0, -50, 0], y: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div aria-hidden="true" className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-lime/15 blur-[110px]" animate={{ x: [0, 60, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <Slide from="left" distance={90} duration={1.4}>
            <p className="eyebrow flex items-center gap-3 text-lime"><span className="h-px w-10 bg-lime/70" /> <MapPin size={14} /> Visit us</p>
          </Slide>
          <h1 className="mt-4 font-serif text-6xl font-semibold leading-[0.95] sm:text-8xl">
            <span className="block overflow-hidden pb-2">
              <Slide from="left" distance={240} duration={1.8} delay={0.1} as="span" className="block">Come</Slide>
            </span>
            <span className="block overflow-hidden pb-2">
              <Slide from="right" distance={240} duration={1.9} delay={0.35} as="span" className="block"><em className="text-lime-gradient pr-2 font-medium italic">hungry.</em></Slide>
            </span>
          </h1>
          <Slide from="left" distance={110} duration={1.6} delay={0.6}>
            <p className="mt-6 max-w-2xl text-lg text-ivory/75">Find us at Hari Bhaina Chhaka in Jatni. Call ahead, or message us on WhatsApp to place an order.</p>
          </Slide>
          <Slide from="left" distance={110} duration={1.6} delay={0.8} className="mt-8 flex flex-wrap gap-3">
            <Link to="/menu" className="btn btn-lime"><UtensilsCrossed size={16} /> See the menu <ArrowRight size={16} /></Link>
            <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><Navigation size={16} /> Get directions</a>
          </Slide>
        </div>
      </section>

      <section className="relative overflow-x-clip bg-ink pb-16 sm:pb-24" aria-label="Contact details">
        {/* quick actions overlapping the hero */}
        <div className="relative z-10 mx-auto -mt-16 grid max-w-7xl gap-4 px-5 sm:-mt-20 sm:px-8 md:grid-cols-3">
          {quick.map(({ Icon, t, s, href, ext, from }, i) => (
            <Slide key={t} from={from} distance={120} duration={1.7} delay={i * 0.14}>
              <a href={href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="glass group flex items-center gap-4 rounded-2xl border-lime/20 bg-forest/80 p-5 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-lime/60">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-lime text-ink transition duration-500 group-hover:scale-110"><Icon size={20} /></span>
                <span className="min-w-0 flex-1 leading-tight"><span className="block font-serif text-2xl font-semibold">{t}</span><span className="block truncate text-sm text-ivory/60">{s}</span></span>
                <ArrowUpRight size={18} className="shrink-0 text-ivory/40 transition duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime" />
              </a>
            </Slide>
          ))}
        </div>

        <div className="mx-auto mt-8 grid max-w-7xl gap-6 px-5 sm:px-8 lg:grid-cols-12">
          <Slide from="left" className={`${card} lg:col-span-7`}>
            <span className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-lime/10 blur-2xl" aria-hidden="true" />
            <span className={iconWrap}><MapPin size={26} /></span>
            <h2 className="mt-5 font-serif text-4xl font-semibold">Address</h2>
            <address className="mt-4 text-lg not-italic leading-relaxed text-ivory/80">
              <p className="font-serif text-2xl text-ivory">{business.name}</p>
              <p>{business.address.line1}</p><p>{business.address.line2}</p>
              <p className="mt-2 text-sm text-ivory/50">Plus code: {business.address.plusCode}</p>
            </address>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-lime"><Navigation size={16} /> Get directions</a>
              <button type="button" onClick={copy} className="btn btn-ghost">{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy address"}</button>
              <span className="sr-only" role="status">{copied ? "Address copied to clipboard" : ""}</span>
            </div>
          </Slide>

          <Slide from="right" delay={0.12} className={`${card} lg:col-span-5`}>
            <span className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet/15 blur-2xl" aria-hidden="true" />
            <span className={iconWrap}><Clock size={26} /></span>
            <h2 className="mt-5 font-serif text-4xl font-semibold">Opening hours</h2>
            <p className="mt-4 font-serif text-5xl font-semibold text-lime-gradient">{business.hours.label}</p>
            <p className="mt-2 text-sm text-ivory/60">Daily, as listed</p>
            <p className="mt-5 flex gap-2 text-sm leading-relaxed text-ivory/60"><Info size={15} className="mt-0.5 shrink-0 text-lime" /> {business.hours.note}</p>
          </Slide>

          <Slide from="left" className={`${card} lg:col-span-6`}>
            <span className={iconWrap}><Phone size={26} /></span>
            <h2 className="mt-5 font-serif text-4xl font-semibold">Call us</h2>
            <p className="mt-3 text-ivory/60">For tables, questions and orders.</p>
            <a href={`tel:${business.contact.phoneTel}`} className="mt-6 inline-flex items-center gap-2 font-serif text-4xl font-semibold transition hover:text-lime">{business.contact.phoneDisplay}</a>
            <div className="mt-6"><a href={`tel:${business.contact.phoneTel}`} className="btn btn-ghost"><Phone size={16} /> Call now</a></div>
          </Slide>

          <Slide from="right" delay={0.12} className={`${card} lg:col-span-6`}>
            <span className={iconWrap}><WhatsAppIcon size={26} /></span>
            <h2 className="mt-5 font-serif text-4xl font-semibold">WhatsApp</h2>
            <p className="mt-3 text-ivory/60">Message us directly, or build your order on the menu page and send it in one tap.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={enquiryUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-lime"><WhatsAppIcon size={16} /> Message us</a>
              <Link to="/menu" className="btn btn-ghost">Build an order</Link>
            </div>
          </Slide>
        </div>

        {/* REAL GOOGLE MAP */}
        <Slide from="up" distance={80} duration={1.6} className="mx-auto mt-6 max-w-7xl px-5 sm:px-8">
          <div className="group relative overflow-hidden rounded-[2rem] border border-lime/20 bg-forest shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
            <iframe
              title={`Map showing the location of ${business.name} in Jatni`}
              src={MAP_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="block h-[26rem] w-full border-0 [filter:grayscale(0.35)_contrast(1.05)] transition duration-700 group-hover:[filter:none] sm:h-[34rem]"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink/60 to-transparent" aria-hidden="true" />

            <div className="absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-2xl border border-lime/25 bg-ink/85 p-4 shadow-2xl backdrop-blur-xl sm:left-6 sm:top-6 sm:max-w-sm sm:p-5">
              <p className="eyebrow flex items-center gap-2 text-lime"><MapPin size={13} /> Find us here</p>
              <p className="mt-2 font-serif text-2xl font-semibold leading-tight">{business.name}</p>
              <p className="mt-1 text-sm text-ivory/65">{business.address.line1}, Jatni</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-lime btn-sm"><Navigation size={14} /> Directions</a>
                <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">Open in Maps <ArrowUpRight size={14} /></a>
              </div>
            </div>
          </div>
        </Slide>
      </section>
    </>
  );
}