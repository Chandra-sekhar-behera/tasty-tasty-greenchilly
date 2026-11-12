import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Check, Plus, ShoppingBag, ChevronRight, Clock, Sparkles } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon.jsx";
import robotChefIcon from "../assets/Robot Chef.png";
import { useCart } from "../context/CartContext.jsx";
import { categories, menuById, menuItems, useMenuVersion } from "../lib/menuStore.js";
import { business } from "../config/business.js";
import { inr } from "../lib/format.js";
import { getOrderStatus, useOrderStatus, ORDER_HOURS_LABEL } from "../lib/orderHours.js";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const OWNER_WHATSAPP = business.contact.whatsappNumber;

const PRIMARY_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const MODELS = [
  PRIMARY_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-1.5-flash",
].filter((v, i, arr) => v && arr.indexOf(v) === i);

const EASE = [0.16, 1, 0.3, 1];
const HOURS_TEXT = ORDER_HOURS_LABEL.replace(/\s+/g, " ");
const GREETING = `Namaste ji! 🤖🍳 Main ${business.shortName} ka Robot Chef assistant hoon. Poore menu ke kisi bhi dish, category, veg/non-veg ya budget ke baare mein kabhi bhi puchiye. Order lene ka time: ${HOURS_TEXT}.`;

const closedText = () => `Abhi order lena band hai ji 🙏 ${getOrderStatus().short}. Order ka time: ${HOURS_TEXT}. Tab tak aap menu dekh sakte hain.`;
const addHint = () => (getOrderStatus().open ? "Add dabake seedha order mein jodiye." : "Order abhi band hai, aap menu dekh sakte hain.");
const baseName = (n) => n.replace(/\s*\((veg|non-veg)\)\s*$/i, "").trim();

function buildMenuText() {
  const groups = new Map();
  for (const i of menuItems) {
    if (!groups.has(i.categoryId)) groups.set(i.categoryId, { name: i.category, items: [] });
    groups.get(i.categoryId).items.push(i);
  }
  return [...groups.values()]
    .map((g) =>
      `## ${g.name} (${g.items.length} dishes)\n` +
      g.items.map((i) => `- ${i.name} | ${i.veg ? "Veg" : "Non-veg"} | ₹${i.price}${i.available === false ? " | UNAVAILABLE" : ""} | ${(i.desc || "").slice(0, 70)}`).join("\n")
    )
    .join("\n\n");
}

function cartText(lines) {
  if (!lines.length) return "empty";
  return lines.map((l) => `${menuById[l.id]?.name} x${l.qty}`).join(", ");
}

function buildSystemInstruction(cartLines) {
  const pay = business.payment || {};
  return `You are the virtual Robot Chef host of "${business.name}", a family restaurant at ${business.address.line1}, ${business.address.line2}. Cuisines: ${business.cuisines.join(", ")}.

YOUR JOB: help guests explore the menu, choose dishes, and place an order. You know the COMPLETE menu below (${menuItems.length} dishes, grouped by category).

LANGUAGE AND TONE
- Reply in the same language and script the guest uses (Hindi, Hinglish, Odia or English).
- Warm, polite, playful and respectful, like a smart robotic chef. Keep replies short: 2 to 5 lines.
- Use plain text. Short "-" bullets are fine. Do not use tables or headings.

MENU RULES
- Use ONLY the menu below. Never invent dishes, prices, offers, discounts, combos, ingredients, or portions.
- Always quote the exact dish name and price (₹) from the menu.

ORDERING HOURS
- Online orders are accepted ONLY between 12 PM to 4 PM and 6 PM to 10:30 PM (Indian time).
- RIGHT NOW: ${(() => { const st = getOrderStatus(); return st.open ? "ordering is OPEN. " + st.short + "." : "ordering is CLOSED. " + st.short + "."; })()}

THE GUEST'S CART RIGHT NOW: ${cartText(cartLines)}

FULL MENU
${buildMenuText()}`;
}

const STOP = new Set((
  "the a an is are of in on for to me my i we you your it and or with any some all please pls hi hello hey " +
  "hai hain ho kya kaun kaunsa kaunse kitna kitne ka ki ke ko se me mein mai main hum aap tum mujhe mere liye wala wali wale " +
  "chahiye chaiye dikhao dikha batao bata do dena de show list give tell what which have has available avail " +
  "menu item items dish dishes price prices rate cost rs rupees rupee inr under below less than within upto up budget max tak andar " +
  "veg non nonveg vegetarian best good tasty special aur ya koi kuch sab sabhi full half order cheapest cheap sasta sasti affordable"
).split(" "));

const norm = (s) => String(s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const stem = (w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);
const words = (s) => norm(s).split(" ").filter(Boolean).map(stem);
const GENERIC = new Set(["veg", "non", "and", "curry", "starter", "indian", "chinese"]);

function parseFilters(text) {
  const t = text.toLowerCase();
  const filters = {};
  const m =
    t.match(/(?:under|below|less than|within|upto|up to|budget|max)\s*(?:rs\.?|₹|inr)?\s*(\d{2,4})/) ||
    t.match(/(\d{2,4})\s*(?:rs|₹|rupees?|rupaye|tak|se kam|ke andar|andar|under)/) ||
    t.match(/(?:rs\.?|₹)\s*(\d{2,4})/);
  if (m) filters.max = Number(m[1]);
  if (/\bnon[\s-]?veg\b|\bnonveg\b/.test(t)) filters.veg = false;
  else if (/\bveg(?:etarian)?\b|\bshakahari\b/.test(t)) filters.veg = true;
  if (/cheap|sasta|sasti|low price|kam price|cheapest|affordable/.test(t)) filters.cheap = true;
  return filters;
}

const apply = (items, f) => {
  let out = items.filter((i) => i.available !== false);
  if (f.veg !== undefined) out = out.filter((i) => !!i.veg === f.veg);
  if (f.max) out = out.filter((i) => i.price <= f.max);
  if (f.cheap) out = [...out].sort((a, b) => a.price - b.price);
  return out;
};

function describe(f) {
  const bits = [];
  if (f.veg === true) bits.push("veg");
  if (f.veg === false) bits.push("non-veg");
  if (f.max) bits.push(`under ${inr(f.max)}`);
  if (f.cheap) bits.push("cheapest first");
  return bits.join(", ");
}

function localSearch(text) {
  const filters = parseFilters(text);
  const qt = norm(text).split(" ").filter((w) => w && !STOP.has(w) && !STOP.has(stem(w)) && !/^\d+$/.test(w)).map(stem);
  const hasFilter = filters.veg !== undefined || filters.max || filters.cheap;
  const live = menuItems.filter((i) => i.available !== false);
  if (!qt.length && !hasFilter) return null;

  let pool = live;
  let title = "";
  if (qt.length) {
    const cat = categories.find((c) => {
      const cw = words(c.name).filter((w) => w.length > 1);
      return qt.every((w) => cw.includes(w)) && qt.some((w) => !GENERIC.has(w));
    });
    if (cat) {
      pool = live.filter((i) => i.categoryId === cat.id);
      title = cat.name;
    } else {
      const scoreOf = (i) => {
        const iw = new Set([...words(i.name), ...words(i.category)]);
        return qt.filter((w) => iw.has(w) || [...iw].some((x) => x.length > 3 && w.length > 3 && (x.startsWith(w) || w.startsWith(x)))).length;
      };
      const scored = live.map((i) => [i, scoreOf(i)]);
      let hit = scored.filter(([, s]) => s === qt.length).map(([i]) => i);
      if (!hit.length && qt.length > 1) {
        const best = Math.max(...scored.map(([, s]) => s));
        if (best >= Math.ceil(qt.length / 2) && best > 0) hit = scored.filter(([, s]) => s === best).map(([i]) => i);
      }
      if (!hit.length) return null;
      pool = hit;
      title = "Matching dishes";
    }
  } else {
    title = "Menu";
  }

  const items = apply(pool, filters);
  const f = describe(filters);
  if (!items.length) {
    return { text: `${title ? title + ": " : ""}is filter (${f || "your search"}) mein koi dish nahi mili.`, ids: [] };
  }
  const capped = items.slice(0, filters.cheap ? 12 : 40);
  return {
    title: `${title}${f ? " · " + f : ""}`,
    text: `${title}${f ? " (" + f + ")" : ""}: ${items.length} dish${items.length > 1 ? "es" : ""}. ${addHint()}`,
    ids: capped.map((i) => i.id),
    more: items.length - capped.length,
  };
}

function mentionedDishes(reply, max = 4) {
  let rest = ` ${norm(reply)} `;
  const names = menuItems
    .filter((i) => i.available !== false)
    .map((i) => ({ i, full: norm(i.name), base: norm(baseName(i.name)) }))
    .sort((a, b) => b.full.length - a.full.length);
  const found = [];
  for (const { i, full, base } of names) {
    const key = ` ${full} `;
    if (rest.includes(key)) { found.push(i); rest = rest.replace(key, " "); continue; }
    if (base !== full && rest.includes(` ${base} `)) { found.push(i); }
  }
  const order = (i) => { const p = norm(reply).indexOf(norm(baseName(i.name))); return p < 0 ? 9999 : p; };
  const seen = new Set();
  return found.filter((i) => !seen.has(i.id) && seen.add(i.id)).sort((a, b) => order(a) - order(b)).slice(0, max).map((i) => i.id);
}

async function fetchWithFallback(contents, cartLines) {
  let lastError = null;
  const system = buildSystemInstruction(cartLines);

  for (const model of MODELS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.5 },
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || `Error on model ${model}`);
      const reply = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
      if (reply) return reply;
      throw new Error(`Empty reply from ${model}`);
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(lastError?.message || "All models busy");
}

const ORDER_RE = /\b(order|book|parcel|delivery|deliver|chahiye|chaiye|mangwa|mangwana|manga|lena hai|karna hai|bhej|pickup|takeaway)\b/i;

function whatsappText(name, phone, requirement) {
  return (
    `🌶️ *NEW ENQUIRY FROM ${business.name.toUpperCase()} WEBSITE* 🌶️\n\n` +
    `👤 *Name:* ${name}\n` +
    `📞 *Phone:* ${phone}\n` +
    `💬 *Requirement:* ${requirement || "Food order enquiry"}\n\n` +
    `_Sent via ${business.shortName} Robot Chef Assistant_`
  );
}

function Rich({ text }) {
  return text.split("\n").map((line, li) => {
    const clean = line.replace(/^\s*[*-]\s+/, "• ");
    const parts = clean.split(/\*\*(.+?)\*\*/g);
    return (
      <span key={li} className="block">
        {parts.map((p, i) => (i % 2 ? <strong key={i} className="font-semibold">{p}</strong> : p.replace(/\*/g, "")))}
      </span>
    );
  });
}

function DishRow({ id, cart, orderOpen }) {
  const it = menuById[id];
  if (!it) return null;
  const qty = cart.qtyOf(id);
  return (
    <li className="flex items-center gap-2 py-1.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${it.veg ? "bg-green-500" : "bg-red-500"}`} aria-label={it.veg ? "Veg" : "Non-veg"} />
      <span className="min-w-0 flex-1 truncate">{it.name}</span>
      <span className="shrink-0 font-serif text-lime">{inr(it.price)}</span>
      {orderOpen ? (
        <button
          type="button" onClick={() => cart.add(id)} aria-label={`Add ${it.name} to order`}
          className={`flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-[11px] font-bold transition ${qty ? "bg-lime text-ink" : "border border-lime/50 text-lime hover:bg-lime/15"}`}
        >
          {qty ? <><Check size={12} /> {qty}</> : <><Plus size={12} /> Add</>}
        </button>
      ) : (
        <span className="flex h-7 shrink-0 items-center gap-1 rounded-lg border border-ivory/15 px-2 text-[10px] font-medium text-ivory/50"><Clock size={11} /> Closed</span>
      )}
    </li>
  );
}

function ConfirmSend({ onNo, onYes }) {
  const noRef = useRef(null);
  useEffect(() => { noRef.current?.focus(); }, []);
  return (
    <motion.div className="absolute inset-0 z-20 grid place-items-center bg-ink/80 p-5 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onNo}>
      <motion.div
        role="alertdialog" aria-modal="true" aria-labelledby="chat-confirm-title"
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-lime/30 bg-forest p-6 text-center shadow-2xl"
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime/15 text-lime ring-1 ring-lime/40">
          <img src={robotChefIcon} alt="Robot Chef" className="h-8 w-8 object-contain" />
        </span>
        <h3 id="chat-confirm-title" className="mt-4 font-serif text-2xl font-semibold">Send this order?</h3>
        <p className="mt-2 text-sm leading-relaxed text-ivory/70">Are you sure you want to send your order to {business.shortName} on WhatsApp?</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button ref={noRef} type="button" onClick={onNo} className="btn btn-ghost justify-center"><X size={16} /> No</button>
          <button type="button" onClick={onYes} className="btn btn-lime justify-center"><Check size={16} /> Yes, send</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const QUICK = [
  { label: "🥦 Veg", q: "veg dishes" },
  { label: "🍗 Non-veg", q: "non veg dishes" },
  { label: "💸 Under ₹100", q: "under 100" },
  { label: "⭐ Cheapest", q: "cheapest dishes" },
];

export default function ChatAssistant() {
  useMenuVersion();
  const status = useOrderStatus();
  const cart = useCart();
  const { count, lines, subtotal } = cart;

  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [messages, setMessages] = useState([{ role: "model", text: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const [leadStep, setLeadStep] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderSummary, setOrderSummary] = useState("");

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, isOpen, confirm, leadStep]);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  const resetAll = () => {
    setLeadStep(0);
    setCustomerName("");
    setCustomerPhone("");
    setOrderSummary("");
  };

  const push = (...msgs) => setMessages((prev) => [...prev, ...msgs]);

  const showCategory = (c) => {
    const ids = menuItems.filter((i) => i.categoryId === c.id && i.available !== false).map((i) => i.id);
    push(
      { role: "user", text: c.name },
      ids.length
        ? { role: "model", text: `${c.name}: ${ids.length} dishes. ${addHint()}`, list: { title: c.name, ids, more: 0 } }
        : { role: "model", text: `${c.name} abhi available nahi hai.` }
    );
  };

  const startLead = () => {
    if (!status.open) { push({ role: "model", text: closedText() }); return; }
    const summary = lines.length ? lines.map((l) => `${menuById[l.id]?.name} x${l.qty}`).join(", ") : [...messages].reverse().find((m) => m.role === "user")?.text || "";
    setOrderSummary(summary);
    setLeadStep(1);
    push({ role: "model", text: "Theek hai ji! Pehle apna naam bata dijiye." });
  };

  const goCheckout = () => {
    if (!status.open) { push({ role: "model", text: closedText() }); return; }
    setIsOpen(false); cart.openCart();
  };

  const handleSend = async (e, preset) => {
    e?.preventDefault?.();
    const userText = (preset ?? input).trim();
    if (!userText || loading) return;
    setInput("");

    if (userText.toLowerCase() === "cancel" || userText.toLowerCase() === "reset") {
      resetAll();
      push({ role: "user", text: userText }, { role: "model", text: "Theek hai ji, sab reset ho gaya hai. Ab batayein, kya chahiye?" });
      return;
    }

    if (leadStep === 1) {
      if (userText.length < 2) {
        push({ role: "user", text: userText }, { role: "model", text: "Kripya apna poora naam batayein." });
        return;
      }
      setCustomerName(userText);
      push({ role: "user", text: userText }, { role: "model", text: `Shukriya ${userText} ji! 😊 Ab apna 10-digit mobile number de dijiye.` });
      setLeadStep(2);
      return;
    }

    if (leadStep === 2) {
      let digits = userText.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
      if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
      if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
        push({ role: "user", text: userText }, { role: "model", text: "Kripya sahi 10-digit mobile number enter karein." });
        return;
      }
      setCustomerPhone(digits);
      push({ role: "user", text: userText }, { role: "model", text: "Bahut badhiya! Details save ho gayi hain. Niche diye gaye button par click karke WhatsApp par order bhej dein!" });
      setLeadStep(3);
      return;
    }

    const shortQuery = userText.split(/\s+/).length <= 4;
    const quick = shortQuery ? localSearch(userText) : null;
    if (quick) {
      push({ role: "user", text: userText }, { role: "model", text: quick.text, list: { title: quick.title, ids: quick.ids, more: quick.more } });
      return;
    }

    const updatedMessages = [...messages, { role: "user", text: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY missing");

      const contents = updatedMessages
        .filter((m) => m.text)
        .slice(-10)
        .map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] }));
      while (contents.length && contents[0].role !== "user") contents.shift();

      const aiReply = await fetchWithFallback(contents, lines);
      const dishes = mentionedDishes(aiReply);
      push({ role: "model", text: aiReply, dishes });

      if (ORDER_RE.test(userText) && status.open) push({ role: "model", actions: true });
    } catch {
      const fallback = localSearch(userText);
      if (fallback) {
        push({ role: "model", text: fallback.text, list: { title: fallback.title, ids: fallback.ids, more: fallback.more } });
      } else {
        push({ role: "model", text: "Arre network busy hai! 🌿 Neeche ke category buttons se menu dekh sakte hain." });
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmAndOpenWhatsApp = () => {
    setConfirm(false);
    if (!status.open) { push({ role: "model", text: closedText() }); return; }
    const url = `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(whatsappText(customerName, customerPhone, orderSummary))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const chipCls = "shrink-0 whitespace-nowrap rounded-full border border-lime/30 bg-lime/10 px-3 py-1.5 text-[11px] font-medium text-lime transition hover:bg-lime/20 disabled:opacity-40";

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {!isOpen && showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-3 mr-1 max-w-[260px] rounded-2xl border border-lime/30 bg-ink/95 px-4 py-3 text-xs shadow-xl backdrop-blur-xl sm:max-w-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-lime flex items-center gap-1"><Sparkles size={12} /> {business.shortName} Robot Chef</span>
              <button type="button" onClick={() => setShowTooltip(false)} aria-label="Dismiss" className="text-ivory/60 hover:text-ivory"><X size={14} /></button>
            </div>
            <p className="mt-1 text-ivory/90">Hi! Ask me about any dish or budget.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Robot Chef Button */}
      <motion.button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setShowTooltip(false); }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="relative flex h-16 w-16 items-center justify-center p-0 bg-transparent border-none outline-none cursor-pointer drop-shadow-[0_8px_20px_rgba(16,185,129,0.5)] will-change-transform"
        aria-label={isOpen ? "Close Robot Chef assistant" : "Open Robot Chef assistant"} aria-expanded={isOpen}
      >
        {isOpen ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest border border-lime text-ivory shadow-xl">
            <X size={26} />
          </div>
        ) : (
          <img src={robotChefIcon} alt="Robot Chef" className="h-full w-full object-contain filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]" />
        )}
        {!isOpen && (
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5 animate-ping rounded-full bg-lime" />
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog" aria-label={`${business.shortName} Robot Chef assistant`}
            initial={{ opacity: 0, y: 15, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.96 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="absolute bottom-20 right-0 flex w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-3xl border border-lime/30 bg-forest/95 shadow-2xl backdrop-blur-xl sm:w-[400px] sm:max-w-[400px] max-h-[calc(100vh-120px)] will-change-transform"
            style={{ height: "min(500px, 65vh)" }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-ivory/10 bg-gradient-to-r from-lime/15 to-transparent px-3 py-2.5 sm:px-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-lime/20 border border-lime/40 p-1">
                  <img src={robotChefIcon} alt="Robot Chef" className="h-full w-full object-contain" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-forest" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-serif text-sm font-semibold leading-tight text-ivory">{business.shortName} Robot Chef</h3>
                  <p className="truncate text-[10px] text-lime">{status.open ? status.short : status.short + " · Ask anything"}</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close chat" className="rounded-full p-1.5 text-ivory/70 transition hover:bg-ivory/10 hover:text-ivory"><X size={18} /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 text-xs sm:p-4">
              {messages.map((m, i) => {
                if (m.actions) {
                  return (
                    <div key={i} className="flex flex-col gap-2">
                      {count > 0 ? (
                        <button type="button" onClick={goCheckout} className="flex w-full items-center justify-between gap-2 rounded-xl bg-lime px-4 py-3 text-xs font-bold text-ink shadow-lg transition hover:bg-lime-soft">
                          <span className="flex items-center gap-2"><ShoppingBag size={16} /> Open cart & checkout</span>
                          <span>{count} · {inr(subtotal)}</span>
                        </button>
                      ) : (
                        <p className="rounded-xl border border-lime/25 bg-lime/10 px-3 py-2 text-lime">Dishes ke saamne <strong>Add</strong> dabaiye, phir yahan se checkout kijiye.</p>
                      )}
                      {leadStep === 0 && (
                        <button type="button" onClick={startLead} className="flex w-full items-center justify-between gap-2 rounded-xl border border-ivory/15 px-4 py-2.5 text-xs text-ivory/80 transition hover:border-lime/50 hover:text-ivory">
                          <span className="flex items-center gap-2"><WhatsAppIcon size={16} /> Or send a quick enquiry on WhatsApp</span><ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[88%] break-words rounded-2xl px-4 py-3 leading-relaxed shadow-md ${
                      m.role === "user" ? "rounded-br-none bg-lime font-medium text-ink" : "rounded-bl-none border border-ivory/10 bg-ivory/[0.07] text-ivory"
                    }`}>
                      <Rich text={m.text} />
                    </div>

                    {m.list && m.list.ids.length > 0 && (
                      <div className="mt-2 w-full max-w-[96%] rounded-2xl border border-ivory/10 bg-ink/40 px-3 py-1">
                        <p className="border-b border-ivory/10 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-lime">{m.list.title}</p>
                        <ul className="max-h-52 divide-y divide-ivory/5 overflow-y-auto overscroll-contain text-ivory/90">
                          {m.list.ids.map((id) => <DishRow key={id} id={id} cart={cart} orderOpen={status.open} />)}
                        </ul>
                        {m.list.more > 0 && <p className="py-1.5 text-[10px] text-ivory/50">+ {m.list.more} aur dishes. Naam ya budget se search kijiye.</p>}
                      </div>
                    )}

                    {m.dishes && m.dishes.length > 0 && (
                      <ul className="mt-2 w-full max-w-[96%] divide-y divide-ivory/5 rounded-2xl border border-ivory/10 bg-ink/40 px-3 py-0.5 text-ivory/90">
                        {m.dishes.map((id) => <DishRow key={id} id={id} cart={cart} orderOpen={status.open} />)}
                      </ul>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-none border border-ivory/10 bg-ivory/[0.07] px-4 py-3 text-ivory/60">
                    <span className="animate-pulse">Robot Chef soch raha hai... 🤖🌿</span>
                  </div>
                </div>
              )}

              {leadStep === 3 && (
                <div className="pt-2 text-center">
                  <button
                    type="button" onClick={() => (status.open ? setConfirm(true) : push({ role: "model", text: closedText() }))}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-[#20ba5a]"
                  >
                    <WhatsAppIcon size={18} /> Open WhatsApp with Order Details
                  </button>
                  <button type="button" onClick={() => { resetAll(); push({ role: "model", text: "Theek hai ji, naya order shuru karte hain. Kya chahiye?" }); }} className="mt-2 text-[0.7rem] uppercase tracking-widest text-ivory/45 hover:text-ivory">Naya order</button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick buttons */}
            {leadStep === 0 && (
              <div className="shrink-0 border-t border-ivory/10 bg-ink/40">
                <div className="flex gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Quick menu buttons">
                  {count > 0 && <button type="button" onClick={goCheckout} className={`${chipCls} !bg-lime !text-ink font-bold`}>🛒 {count} · {inr(subtotal)}</button>}
                  {QUICK.map((c) => <button key={c.label} type="button" disabled={loading} onClick={() => handleSend(null, c.q)} className={chipCls}>{c.label}</button>)}
                  {categories.map((c) => <button key={c.id} type="button" disabled={loading} onClick={() => showCategory(c)} className={`${chipCls} !border-ivory/15 !bg-ivory/5 !text-ivory/85 hover:!bg-ivory/10`}>{c.name} <span className="text-ivory/45">{c.count}</span></button>)}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-ivory/10 bg-ink/50 p-2.5 sm:p-3">
              <input
                type={leadStep === 2 ? "tel" : "text"} value={input} onChange={(e) => setInput(e.target.value)} maxLength={300}
                aria-label="Type your message"
                placeholder={leadStep === 1 ? "Apna naam likhiye..." : leadStep === 2 ? "10-digit mobile number..." : "Dish, category ya budget puchiye..."}
                className="flex-1 rounded-xl border border-ivory/15 bg-black/30 px-3.5 py-2.5 text-xs text-ivory outline-none placeholder:text-ivory/40 focus:border-lime"
              />
              <button type="submit" disabled={!input.trim() || loading} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime text-ink transition hover:bg-lime-soft disabled:opacity-40">
                <Send size={16} />
              </button>
            </form>

            <AnimatePresence>
              {confirm && <ConfirmSend onNo={() => setConfirm(false)} onYes={confirmAndOpenWhatsApp} />}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}