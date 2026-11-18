import { Flame, Leaf, Fish, ChefHat, Sparkles } from "lucide-react";
import chickenTikka from "../assets/dish-chicken-tikka.webp";
import paneerTikka from "../assets/dish-paneer-tikka.webp";
import muttonKasa from "../assets/Mutton Kasa.jpg";
import eggChilli from "../assets/Egg Chilli.jpg";
import eggRoll from "../assets/Double Egg Kabab Roll.jpg";
import manchowSoup from "../assets/Veg Manchow Soup.jpg";
import babyCorn from "../assets/Crispy Baby Corn.jpg";

/**
 * Menu loader — zero JavaScript timers, zero re-renders, no framer-motion.
 * Everything animates with CSS (opacity/transform only), so it stays smooth even on cheap phones.
 * Colours come from the site's own tokens: ink / lime / ivory / forest.
 */

const FALLBACK_COUNT = 269;
const STEP = 1.2; // seconds per message

const lastCount = () => {
  try { return Number(localStorage.getItem("greenchilly-menu-count")) || FALLBACK_COUNT; } catch { return FALLBACK_COUNT; }
};

const buildSteps = (n) => [
  { Icon: Flame, photo: chickenTikka, station: "Tandoor", text: "Firing up the clay oven for authentic smoky Tandoori" },
  { Icon: Leaf, photo: paneerTikka, station: "Spice Market", text: "Selecting farm-fresh spices & herbs from local markets" },
  { Icon: Fish, photo: muttonKasa, station: "Marination", text: "Marinating fresh prawns & tender chicken cuts" },
  { Icon: ChefHat, photo: eggChilli, station: "Wok Station", text: "Wok-tossing sizzling Chinese noodles & fiery Chilli Chicken" },
  { Icon: Sparkles, photo: eggRoll, station: "The Pass", text: `Plating ${n} authentic flavors crafted with passion` },
];

const EMBERS = [
  { l: "8%", s: 3, d: "0s", t: "7s", x: "18px" },
  { l: "19%", s: 2, d: "2.2s", t: "6s", x: "-14px" },
  { l: "31%", s: 4, d: "1.1s", t: "8s", x: "22px" },
  { l: "46%", s: 2, d: "3.4s", t: "6.5s", x: "-10px" },
  { l: "58%", s: 3, d: "0.6s", t: "7.5s", x: "16px" },
  { l: "70%", s: 2, d: "2.8s", t: "6s", x: "-20px" },
  { l: "82%", s: 4, d: "1.7s", t: "8s", x: "12px" },
  { l: "93%", s: 3, d: "4s", t: "7s", x: "-16px" },
];

const CSS = `
.gcl-slot,.gcl-photo,.gcl-pill{animation-duration:var(--cycle);animation-iteration-count:infinite;animation-delay:var(--d);animation-fill-mode:backwards;animation-timing-function:cubic-bezier(.16,1,.3,1)}
.gcl-slot,.gcl-photo{opacity:0;will-change:opacity,transform}
.gcl-slot{animation-name:gcl-slot}
.gcl-photo{animation-name:gcl-photo}
.gcl-pill{width:.375rem;opacity:.3;animation-name:gcl-pill}
.gcl-ring{background:conic-gradient(from 0deg,rgba(139,203,53,0) 0%,rgba(139,203,53,.95) 100%);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2px));mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2px));animation:gcl-spin 2.2s linear infinite}
.gcl-float{animation:gcl-float 4.5s ease-in-out infinite}
.gcl-ember{animation-name:gcl-ember;animation-iteration-count:infinite;animation-timing-function:linear;opacity:0}
.gcl-pulse{animation:gcl-pulse 1.4s ease-in-out infinite}
.gcl-rise{animation:gcl-rise .9s cubic-bezier(.16,1,.3,1) both}
@keyframes gcl-slot{0%{opacity:0;transform:translate3d(0,10px,0)}5%{opacity:1;transform:translate3d(0,0,0)}16%{opacity:1;transform:translate3d(0,0,0)}20%,100%{opacity:0;transform:translate3d(0,-8px,0)}}
@keyframes gcl-photo{0%{opacity:0;transform:scale(1.16)}7%{opacity:1}20%{opacity:1;transform:scale(1.02)}27%,100%{opacity:0;transform:scale(1.02)}}
@keyframes gcl-pill{0%{width:.375rem;opacity:.3}3%,19%{width:1.75rem;opacity:1}22%,100%{width:.375rem;opacity:.3}}
@keyframes gcl-spin{to{transform:rotate(360deg)}}
@keyframes gcl-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-8px,0)}}
@keyframes gcl-ember{0%{transform:translate3d(0,0,0) scale(1);opacity:0}15%{opacity:.8}100%{transform:translate3d(var(--x),-70vh,0) scale(.3);opacity:0}}
@keyframes gcl-pulse{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes gcl-rise{from{opacity:0;transform:translate3d(0,12px,0)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){
  .gcl-slot,.gcl-photo,.gcl-pill,.gcl-ring,.gcl-float,.gcl-ember,.gcl-pulse,.gcl-rise{animation:none!important}
  .gcl-first{opacity:1!important}
  .gcl-pill:first-child{width:1.75rem;opacity:1}
  .gcl-ember{display:none}
}
`;

export default function MenuLoader() {
  const steps = buildSteps(lastCount());
  const cycle = `${(steps.length * STEP).toFixed(1)}s`;
  const at = (i) => ({ "--d": `${(i * STEP).toFixed(1)}s` });

  return (
    <div
      className="noise relative isolate grid min-h-[100svh] place-items-center overflow-hidden bg-ink px-6 text-ivory"
      style={{ "--cycle": cycle }}
      role="status"
      aria-live="polite"
    >
      <style>{CSS}</style>
      <span className="sr-only">Loading the menu. Please wait.</span>

      {/* ambient light */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/[0.08] blur-[110px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.7)_100%)]" aria-hidden="true" />

      {/* tandoor embers rising */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {EMBERS.map((e, k) => (
          <span
            key={k}
            className="gcl-ember absolute bottom-0 rounded-full bg-lime"
            style={{ left: e.l, width: e.s, height: e.s, animationDuration: e.t, animationDelay: e.d, "--x": e.x }}
          />
        ))}
      </div>

      <div className="gcl-rise w-full max-w-md text-center" aria-hidden="true">
        {/* brand */}
        <p className="eyebrow flex items-center justify-center gap-3 text-lime">
          <span className="h-px w-8 bg-lime/60" />
          Tasty Tasty Greenchilly
          <span className="h-px w-8 bg-lime/60" />
        </p>

        {/* the plate */}
        <div className="relative mx-auto mt-12 h-44 w-44">
          <span className="absolute -inset-2.5 rounded-full border border-ivory/10" />
          <span className="gcl-ring absolute -inset-2.5 rounded-full" />

          <div className="relative h-full w-full overflow-hidden rounded-full bg-forest shadow-[0_30px_80px_-20px_rgba(139,203,53,0.45)] ring-1 ring-ivory/15">
            {steps.map((s, i) => (
              <img
                key={i}
                src={s.photo}
                alt=""
                width="176"
                height="176"
                decoding="async"
                draggable="false"
                className={`gcl-photo absolute inset-0 h-full w-full object-cover ${i === 0 ? "gcl-first" : ""}`}
                style={at(i)}
              />
            ))}
            <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
          </div>

          {/* floating side dishes */}
          <img
            src={manchowSoup}
            alt=""
            width="48"
            height="48"
            decoding="async"
            draggable="false"
            className="gcl-float absolute -left-9 top-3 h-12 w-12 rounded-full object-cover ring-2 ring-lime/40 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.9)]"
          />
          <img
            src={babyCorn}
            alt=""
            width="56"
            height="56"
            decoding="async"
            draggable="false"
            className="gcl-float absolute -right-8 bottom-2 h-14 w-14 rounded-full object-cover ring-2 ring-lime/40 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.9)]"
            style={{ animationDelay: "-2s" }}
          />

          {/* icon badge */}
          <span className="absolute -bottom-3 left-1/2 grid h-11 w-11 -translate-x-1/2 place-items-center rounded-full bg-ink text-lime shadow-[0_10px_30px_-6px_rgba(139,203,53,0.6)] ring-1 ring-lime/50">
            {steps.map(({ Icon }, i) => (
              <span key={i} className={`gcl-slot col-start-1 row-start-1 grid place-items-center ${i === 0 ? "gcl-first" : ""}`} style={at(i)}>
                <Icon size={20} strokeWidth={1.6} />
              </span>
            ))}
          </span>
        </div>

        {/* rotating message (all lines share one grid cell, so the height never jumps) */}
        <div className="mt-14 grid">
          {steps.map((s, i) => (
            <div key={i} className={`gcl-slot col-start-1 row-start-1 ${i === 0 ? "gcl-first" : ""}`} style={at(i)}>
              <p className="eyebrow text-lime/80">
                Station {String(i + 1).padStart(2, "0")} · {s.station}
              </p>
              <p className="mx-auto mt-3 max-w-[22rem] font-serif text-xl font-medium leading-snug text-ivory sm:text-2xl">
                {s.text}
                <span className="text-lime">…</span>
              </p>
            </div>
          ))}
        </div>

        {/* progress pills */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <span key={i} className="gcl-pill h-1.5 rounded-full bg-lime" style={at(i)} />
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.24em] text-ivory/40">
          <span className="gcl-pulse h-1.5 w-1.5 rounded-full bg-lime" />
          Live from our kitchen
        </p>
      </div>
    </div>
  );
}