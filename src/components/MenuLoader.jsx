// import { useEffect, useState } from "react";
// import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// import { Flame, Leaf, Fish, ChefHat, Sparkles } from "lucide-react";

// // Agar pehli baar aane wale user ke liye cache nahi hai, to ye number dikhega.
// // Jab menu badal jaye to yahan sirf ek number update kar dein.
// const FALLBACK_COUNT = 269;
// const STEP_MS = 1200;
// const EASE = [0.16, 1, 0.3, 1];

// const lastCount = () => {
//   try { return Number(localStorage.getItem("greenchilly-menu-count")) || FALLBACK_COUNT; } catch { return FALLBACK_COUNT; }
// };

// const buildSteps = (n) => [
//   { Icon: Flame, emoji: "🔥", text: "Firing up the clay oven for authentic smoky Tandoori" },
//   { Icon: Leaf, emoji: "🌿", text: "Selecting farm-fresh spices & herbs from local markets" },
//   { Icon: Fish, emoji: "🍤", text: "Marinating fresh prawns & tender chicken cuts" },
//   { Icon: ChefHat, emoji: "👨‍🍳", text: "Wok-tossing sizzling Chinese noodles & fiery Chilli Chicken" },
//   { Icon: Sparkles, emoji: "✨", text: `Plating ${n} authentic flavors crafted with passion` },
// ];

// export default function MenuLoader() {
//   const reduce = useReducedMotion();
//   const [steps] = useState(() => buildSteps(lastCount()));
//   const [i, setI] = useState(0);

//   useEffect(() => {
//     const t = setInterval(() => setI((n) => (n + 1) % steps.length), STEP_MS);
//     return () => clearInterval(t);
//   }, [steps.length]);

//   const { Icon, text } = steps[i];

//   return (
//     <div
//       className="noise relative isolate grid min-h-[100svh] place-items-center overflow-hidden bg-ink px-6"
//       role="status"
//       aria-live="polite"
//       aria-label="Loading menu"
//     >
//       {/* soft ambient glow */}
//       <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/[0.07] blur-[110px]" aria-hidden="true" />
//       <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)]" aria-hidden="true" />

//       <div className="w-full max-w-md text-center">
//         <motion.p
//           initial={{ opacity: 0, y: reduce ? 0 : -8 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: reduce ? 0.01 : 0.8, ease: EASE }}
//           className="eyebrow flex items-center justify-center gap-3 text-lime"
//         >
//           <span className="h-px w-8 bg-lime/60" aria-hidden="true" />
//           Tasty Tasty Greenchilly
//           <span className="h-px w-8 bg-lime/60" aria-hidden="true" />
//         </motion.p>

//         {/* icon with slow orbiting ring */}
//         <div className="relative mx-auto mt-12 grid h-24 w-24 place-items-center">
//           {!reduce && (
//             <motion.span
//               className="absolute inset-0 rounded-full border border-transparent border-t-lime/70 border-r-lime/20"
//               animate={{ rotate: 360 }}
//               transition={{ duration: 2.4, ease: "linear", repeat: Infinity }}
//               aria-hidden="true"
//             />
//           )}
//           <span className="absolute inset-2 rounded-full border border-ivory/10" aria-hidden="true" />
//           <AnimatePresence mode="wait">
//             <motion.span
//               key={i}
//               initial={{ opacity: 0, scale: reduce ? 1 : 0.7, rotate: reduce ? 0 : -12 }}
//               animate={{ opacity: 1, scale: 1, rotate: 0 }}
//               exit={{ opacity: 0, scale: reduce ? 1 : 0.7 }}
//               transition={{ duration: reduce ? 0.01 : 0.35, ease: EASE }}
//               className="grid h-14 w-14 place-items-center rounded-full bg-lime/15 text-lime shadow-[0_0_40px_-6px_rgba(139,203,53,0.55)] ring-1 ring-lime/30"
//             >
//               <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
//             </motion.span>
//           </AnimatePresence>
//         </div>

//         {/* rotating flavour text */}
//         <div className="mt-10 flex h-24 items-start justify-center">
//           <AnimatePresence mode="wait">
//             <motion.p
//               key={i}
//               initial={{ opacity: 0, y: reduce ? 0 : 12, filter: "blur(6px)" }}
//               animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
//               exit={{ opacity: 0, y: reduce ? 0 : -10, filter: "blur(6px)" }}
//               transition={{ duration: reduce ? 0.01 : 0.35, ease: EASE }}
//               className="max-w-[22rem] font-serif text-xl font-medium leading-snug text-ivory/90 sm:text-2xl"
//             >
//               {text}
//               <span className="text-lime">…</span>
//             </motion.p>
//           </AnimatePresence>
//         </div>

//         {/* step indicator */}
//         <div className="mt-2 flex items-center justify-center gap-2" aria-hidden="true">
//           {steps.map((_, idx) => (
//             <motion.span
//               key={idx}
//               animate={{ width: idx === i ? 28 : 6, opacity: idx === i ? 1 : 0.3 }}
//               transition={{ duration: reduce ? 0.01 : 0.4, ease: EASE }}
//               className="h-1.5 rounded-full bg-lime"
//             />
//           ))}
//         </div>

//         <p className="mt-8 text-[0.65rem] uppercase tracking-[0.22em] text-ivory/35">Preparing today&rsquo;s menu</p>
//       </div>
//     </div>
//   );
// }



import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Fallback dish count agar localStorage mein na ho
const FALLBACK_COUNT = 269;
const STEP_MS = 1400;
const EASE = [0.16, 1, 0.3, 1];

const lastCount = () => {
  try { return Number(localStorage.getItem("greenchilly-menu-count")) || FALLBACK_COUNT; } catch { return FALLBACK_COUNT; }
};

// Icons ki jagah real high-res food previews aur cinematic vibe
const buildSteps = (n) => [
  { 
    image: "https://images.unsplash.com/photo-1599487484170-7c1e665081db?q=80&w=400&auto=format&fit=crop", 
    emoji: "🔥", 
    text: "Firing up the clay oven for authentic smoky Tandoori" 
  },
  { 
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400&auto=format&fit=crop", 
    emoji: "🌿", 
    text: "Selecting farm-fresh spices & herbs from local markets" 
  },
  { 
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=400&auto=format&fit=crop", 
    emoji: "🍤", 
    text: "Marinating fresh prawns & tender chicken cuts" 
  },
  { 
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=400&auto=format&fit=crop", 
    emoji: "👨‍🍳", 
    text: "Wok-tossing sizzling Chinese noodles & fiery Chilli Chicken" 
  },
  { 
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400&auto=format&fit=crop", 
    emoji: "✨", 
    text: `Plating ${n} authentic flavors crafted with passion` 
  },
];

export default function MenuLoader() {
  const reduce = useReducedMotion();
  const [steps] = useState(() => buildSteps(lastCount()));
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % steps.length), STEP_MS);
    return () => clearInterval(t);
  }, [steps.length]);

  const { image, emoji, text } = steps[i];

  return (
    <div
      className="noise relative isolate grid min-h-[100svh] place-items-center overflow-hidden bg-[#0a140c] px-6 text-white"
      role="status"
      aria-live="polite"
      aria-label="Loading menu"
    >
      {/* Deep Forest Green & Emerald Ambient Glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.12] blur-[130px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,10,7,0.85)_100%)]" aria-hidden="true" />

      <div className="w-full max-w-md text-center">
        {/* Brand Header */}
        <motion.p
          initial={{ opacity: 0, y: reduce ? 0 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.8, ease: EASE }}
          className="flex items-center justify-center gap-3 text-emerald-400 font-semibold tracking-wider text-xs uppercase"
        >
          <span className="h-px w-8 bg-emerald-500/60" aria-hidden="true" />
          Tasty Tasty Greenchilly
          <span className="h-px w-8 bg-emerald-500/60" aria-hidden="true" />
        </motion.p>

        {/* Central Circular Image Preview with Neon Aura */}
        <div className="relative mx-auto mt-12 grid h-32 w-32 place-items-center">
          {!reduce && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, ease: "linear", repeat: Infinity }}
              aria-hidden="true"
            />
          )}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.8, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: reduce ? 1 : 1.1, filter: "blur(8px)" }}
              transition={{ duration: reduce ? 0.01 : 0.4, ease: EASE }}
              className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-emerald-500/30 shadow-[0_0_50px_-10px_rgba(16,185,129,0.6)] bg-neutral-900"
            >
              <img 
                src={image} 
                alt="Loading preview" 
                className="h-full w-full object-cover scale-105 hover:scale-100 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-2">
                <span className="text-lg drop-shadow-md">{emoji}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Rotating Flavor Text */}
        <div className="mt-10 flex h-24 items-start justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={i}
              initial={{ opacity: 0, y: reduce ? 0 : 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: reduce ? 0 : -10, filter: "blur(6px)" }}
              transition={{ duration: reduce ? 0.01 : 0.35, ease: EASE }}
              className="max-w-[24rem] font-serif text-xl font-medium leading-relaxed text-neutral-100 sm:text-2xl"
            >
              {text}
              <span className="text-emerald-400 font-sans">…</span>
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Step Indicator Pills */}
        <div className="mt-4 flex items-center justify-center gap-2" aria-hidden="true">
          {steps.map((_, idx) => (
            <motion.span
              key={idx}
              animate={{ width: idx === i ? 32 : 6, opacity: idx === i ? 1 : 0.3 }}
              transition={{ duration: reduce ? 0.01 : 0.4, ease: EASE }}
              className="h-1.5 rounded-full bg-emerald-400"
            />
          ))}
        </div>

        <p className="mt-8 text-[0.65rem] uppercase tracking-[0.25em] text-neutral-400 font-medium">
          Preparing today’s exclusive menu
        </p>
      </div>
    </div>
  );
}