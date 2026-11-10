import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShoppingBag, Phone, MapPin } from "lucide-react";
import Logo from "./Logo.jsx";
import WhatsAppIcon from "./WhatsAppIcon.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useDialog } from "../lib/hooks.js";
import { business, mapsDirectionsUrl } from "../config/business.js";
import { enquiryUrl } from "../lib/whatsapp.js";

/* Instagram: change the handle here */
const IG_HANDLE = "tastytastygreenchilly2";
const IG_URL = business.social.instagram || `https://www.instagram.com/${IG_HANDLE}/`;

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
  { to: "/visit-us", label: "Visit Us" },
];

const EASE = [0.76, 0, 0.24, 1];
const SOFT = [0.16, 1, 0.3, 1];

function InstagramIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* Each letter rolls up on hover and the same letter slides in from below */
function RollLink({ to, label, active, onClick, reduce }) {
  const cls = `inline-block no-underline transition-colors duration-300 ${active ? "text-lime" : "text-ivory hover:text-lime"}`;
  if (reduce) return <Link to={to} onClick={onClick} className={cls}>{label}</Link>;
  return (
    <Link to={to} onClick={onClick} className={`group/roll ${cls}`} aria-label={label}>
      <span aria-hidden="true" className="relative inline-block overflow-hidden align-middle leading-[1.1]">
        {[...label].map((ch, i) => (
          <span
            key={i}
            className="relative inline-block whitespace-pre transition-transform duration-500 ease-[cubic-bezier(0.625,0.05,0,1)] group-hover/roll:-translate-y-[1.2em] group-focus-visible/roll:-translate-y-[1.2em]"
            style={{ textShadow: "0 1.2em currentColor", transitionDelay: `${i * 0.015}s` }}
          >
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>
    </Link>
  );
}

function Bars({ open }) {
  const bar = "block h-0.5 w-full rounded bg-ivory transition-all duration-500 ease-in-out";
  return (
    <span className="flex w-6 flex-col items-center justify-center gap-[6px]" aria-hidden="true">
      <span className={`${bar} ${open ? "translate-y-[8px] rotate-45" : ""}`} />
      <span className={`${bar} ${open ? "scale-x-0 opacity-0" : ""}`} />
      <span className={`${bar} ${open ? "-translate-y-[8px] -rotate-45" : ""}`} />
    </span>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { count, openCart } = useCart();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const panel = useRef(null);
  const close = () => setOpen(false);
  useDialog(open, close, panel);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const clipFrom = "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";
  const clipOpen = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
  const clipTo = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)";

  // the content of the open menu reveals one piece after another
  const item = (i, y = 30) => ({
    initial: { opacity: 0, y: reduce ? 0 : y },
    animate: { opacity: 1, y: 0, transition: { duration: reduce ? 0.01 : 0.8, delay: reduce ? 0 : 0.75 + i * 0.07, ease: SOFT } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  });

  const socials = [
    { label: "Instagram", href: IG_URL, icon: <InstagramIcon /> },
    { label: "WhatsApp", href: enquiryUrl(), icon: <WhatsAppIcon size={24} /> },
    { label: "Call", href: `tel:${business.contact.phoneTel}`, icon: <Phone size={22} /> },
    { label: "Directions", href: mapsDirectionsUrl, icon: <MapPin size={22} /> },
  ];

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-[70] transition-all duration-500 ${open ? "bg-transparent" : scrolled ? "glass shadow-xl shadow-black/30" : "bg-gradient-to-b from-ink/70 to-transparent"}`}>
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:h-20">
          <Link to="/" aria-label={`${business.name} — home`} className="shrink-0"><Logo /></Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={openCart} className="btn btn-lime btn-sm relative" aria-label={`Open your order, ${count} items`}>
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Order</span>
              {count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.7rem] font-bold text-lime" aria-hidden="true">{count}</span>
              )}
            </button>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"} className="grid h-11 w-11 place-items-center rounded-full border border-ivory/20 text-ivory transition hover:border-lime">
              <Bars open={open} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu" ref={panel} role="dialog" aria-modal="true" aria-label="Site menu"
            initial={reduce ? { opacity: 0 } : { clipPath: clipFrom }}
            animate={reduce ? { opacity: 1 } : { clipPath: clipOpen }}
            exit={reduce ? { opacity: 0 } : { clipPath: clipTo }}
            transition={{ duration: reduce ? 0.2 : 0.95, ease: EASE }}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            className="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden overscroll-contain bg-forest [&::-webkit-scrollbar]:hidden"
          >
            <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-lime/10 blur-[110px]" aria-hidden="true" />
            <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-violet/15 blur-[110px]" aria-hidden="true" />

            <div className="relative mx-auto flex min-h-[100dvh] max-w-[100rem] flex-col justify-between gap-8 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-24 sm:px-12 sm:pt-28 lg:px-24">
              {/* brand block */}
              <div>
                <motion.h2 {...item(0, -12)} className="text-sm font-medium uppercase tracking-[0.2em] text-ivory/90">{business.name}</motion.h2>
                <motion.p {...item(1, -12)} className="mt-1 text-sm text-ivory/55">Indian · Chinese · Tandoor, freshly served in Jatni.</motion.p>
              </div>

              {/* links + photos */}
              <div className="flex flex-1 items-center">
                <nav aria-label="Main" className="flex flex-col">
                  {links.map((l, i) => {
                    const active = l.end ? pathname === l.to : pathname.startsWith(l.to);
                    return (
                      <motion.div key={l.to} {...item(i + 1)} className="font-serif text-[clamp(2.6rem,min(14vw,11vh),7.5rem)] font-semibold leading-[1.05]">
                        <RollLink to={l.to} label={l.label} active={active} onClick={close} reduce={reduce} />
                      </motion.div>
                    );
                  })}
                </nav>

              </div>

              {/* socials + place */}
              <div className="flex flex-wrap items-end justify-between gap-6">
                <ul className="flex items-center gap-3">
                  {socials.map((s, i) => (
                    <motion.li key={s.label} {...item(i + 5, 14)}>
                      <a href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" aria-label={s.label}
                        className="grid h-12 w-12 place-items-center rounded-full border border-ivory/20 text-ivory transition hover:border-lime hover:text-lime">
                        {s.icon}
                      </a>
                    </motion.li>
                  ))}
                </ul>
                <motion.p {...item(9, 10)} className="text-sm text-ivory/60">{business.address.line1}, Jatni · {business.hours.label}</motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}