import { useEffect, useMemo, useRef, useState } from "react";
import {
  Lock, LogOut, Plus, Trash2, CloudUpload, CloudDownload, RotateCcw, Search, Check, AlertTriangle, Eye,
  ImagePlus, ImageOff, EyeOff, Download, X, ChevronDown, Camera, PackageX, PackageCheck, Leaf, Drumstick,
} from "lucide-react";
import { Link } from "react-router-dom";
import * as siteConfig from "../config/business.js";

const adminConfig = siteConfig.adminConfig || { cloudUrl: "", localPin: "admin123" }; // eslint-disable-line no-unused-vars
import { usePageTitle } from "../lib/hooks.js";
import SmartImg from "../components/SmartImg.jsx";
import {
  menuItems, categories, useMenuVersion, updateItem, deleteItem, addItem, resetToDefaults, setItemPhoto, removePhoto,
  verifyPin, saveToCloud, loadFromCloud, cloudEnabled, isDirty, testCloud, BUILD, setAdminPin, publishState, isPhoto,
  setCategoryPhoto, removeCategoryPhoto,
} from "../lib/menuStore.js";

const SESSION = "gc-admin-pin";
const field = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30";
const cell = "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-white/30 transition hover:border-white/15 hover:bg-white/[0.04] focus:border-emerald-400 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-400/30";
const glow = "rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_24px_-4px_rgba(16,185,129,0.8)] transition hover:bg-emerald-300 disabled:opacity-50";
const ghost = "inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-50";
const COLS = "md:grid-cols-[2rem_4.5rem_minmax(0,1fr)_6.5rem_6.5rem_8.5rem_5.5rem]";

/* ---------------- login (liquid-metal style, admin emerald colours) ---------------- */
const MC_CSS = `
.mc-wrap{--mc-bg:#07100b;--mc-a:#34d399;--mc-b:#6ee7b7;--mc-dim:rgba(255,255,255,.5);--mx:0;--my:0;position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;width:100%;min-height:100vh;min-height:100svh;padding:80px 0 24px;overflow:hidden;background:var(--mc-bg);color:#fff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.mc-wrap *{box-sizing:border-box}
.mc-svg{position:absolute;width:0;height:0}
.mc-stage{position:absolute;inset:0;z-index:0;filter:url(#mc-goo);opacity:.55;pointer-events:none;contain:strict}
.mc-blob-pos{position:absolute;transition:transform .35s ease-out;transform:translate3d(calc(var(--mx) * var(--s) * 1px),calc(var(--my) * var(--s) * 1px),0)}
.mc-blob{width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,var(--mc-b),#047857);box-shadow:inset -10px -10px 20px rgba(0,0,0,.5),10px 10px 30px rgba(52,211,153,.25);animation:mc-float 20s infinite alternate ease-in-out;will-change:transform}
@keyframes mc-float{0%{transform:translate3d(0,0,0) scale(1)}33%{transform:translate3d(10vw,20vh,0) scale(1.2)}66%{transform:translate3d(-5vw,10vh,0) scale(.8)}100%{transform:translate3d(5vw,-10vh,0) scale(1.1)}}
.mc-auth{position:relative;z-index:10;width:100%;max-width:440px;padding:40px}
.mc-header{margin-bottom:56px;text-align:left}
.mc-brand{display:block;margin-bottom:10px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--mc-dim)}
.mc-header h1{margin:0 0 0 -4px;font-weight:800;font-size:clamp(2.4rem,9vw,3rem);line-height:.9;letter-spacing:-2px}
.mc-group{position:relative;margin-bottom:30px;transition:transform .4s cubic-bezier(.2,1,.3,1)}
.mc-group:focus-within{transform:translateX(10px)}
.mc-group label{display:block;margin-bottom:10px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;text-transform:uppercase;color:var(--mc-dim)}
.mc-input{display:block;width:100%;padding:12px 44px 12px 0;background:transparent;border:0;border-bottom:1px solid rgba(255,255,255,.14);border-radius:0;color:#fff;font-size:18px;outline:none;transition:border-color .4s}
.mc-input::placeholder{color:rgba(255,255,255,.25)}
.mc-input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #07100b inset;-webkit-text-fill-color:#fff;caret-color:#fff}
.mc-glow{position:absolute;bottom:0;left:0;width:0;height:2px;background:var(--mc-a);box-shadow:0 0 15px var(--mc-a);transition:width .6s cubic-bezier(.2,1,.3,1);pointer-events:none}
.mc-input:focus + .mc-glow{width:100%}
.mc-eye{position:absolute;right:-6px;bottom:2px;display:grid;place-items:center;width:44px;height:44px;background:transparent;border:0;border-radius:999px;color:var(--mc-dim);cursor:pointer;transition:color .25s}
.mc-eye:hover,.mc-eye:focus-visible{color:var(--mc-b);outline:none}
.mc-eye:focus-visible{box-shadow:0 0 0 2px rgba(52,211,153,.45)}
.mc-err{margin:-14px 0 18px;font-size:13px;color:#f87171}
.mc-submit{position:relative;margin-top:44px;filter:url(#mc-goo)}
.mc-btn{position:relative;z-index:2;width:100%;padding:20px 40px;background:var(--mc-a);color:#02130c;border:0;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:2px;cursor:pointer;transition:letter-spacing .3s,opacity .2s}
.mc-btn:hover:not(:disabled){letter-spacing:4px}
.mc-btn:disabled{cursor:not-allowed;opacity:.55}
.mc-drop{position:absolute;top:50%;left:50%;z-index:1;width:100%;height:100%;background:var(--mc-b);border-radius:50px;transform:translate(-50%,-50%);transition:all .5s cubic-bezier(.175,.885,.32,1.275)}
.mc-submit:hover .mc-drop{transform:translate(-50%,-50%) scale(1.05,1.2);filter:brightness(1.1)}
.mc-foot{display:flex;justify-content:space-between;margin-top:40px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10px;letter-spacing:1px;text-transform:uppercase}
.mc-foot a{color:var(--mc-dim);text-decoration:none;transition:color .3s}
.mc-foot a:hover{color:#fff}
@media (max-width:480px){.mc-auth{padding:28px 24px}.mc-header{margin-bottom:40px}}
@media (prefers-reduced-motion:reduce){.mc-blob{animation:none}.mc-blob-pos,.mc-group,.mc-glow,.mc-drop,.mc-btn{transition:none}}
`;

function Login({ onOk }) {
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const wrap = useRef(null);

  // Random blob layout once per mount (fewer blobs on touch devices = lighter on phones)
  const blobs = useMemo(() => {
    const touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    return Array.from({ length: touch ? 4 : 6 }, (_, i) => ({
      size: Math.round(Math.random() * 200 + 150),
      left: Math.round(Math.random() * 80 + 10),
      top: Math.round(Math.random() * 80 + 10),
      delay: -(Math.random() * 20).toFixed(1),
      dur: (Math.random() * 15 + 15).toFixed(1),
      speed: (i + 1) * 20,
    }));
  }, []);

  // Subtle mouse parallax: one rAF-throttled write of two CSS variables, desktop only
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof matchMedia !== "function") return;
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const move = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5).toFixed(3));
        el.style.setProperty("--my", (e.clientY / window.innerHeight - 0.5).toFixed(3));
      });
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", move); };
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    let ok = false;
    try { ok = await verifyPin(pin.trim()); }
    catch (x) { setBusy(false); return setErr(x.message || "Cloud not reachable."); }
    setBusy(false);
    if (ok) { try { sessionStorage.setItem(SESSION, pin.trim()); } catch { /* ignore */ } onOk(pin.trim()); }
    else setErr("Wrong PIN. Please try again.");
  }

  return (
    <div ref={wrap} className="mc-wrap">
      <style>{MC_CSS}</style>

      <svg className="mc-svg" aria-hidden="true" focusable="false">
        <defs>
          <filter id="mc-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="mc-stage" aria-hidden="true">
        {blobs.map((b, i) => (
          <div key={i} className="mc-blob-pos" style={{ width: b.size, height: b.size, left: `${b.left}%`, top: `${b.top}%`, "--s": b.speed }}>
            <div className="mc-blob" style={{ animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` }} />
          </div>
        ))}
      </div>

      <main className="mc-auth">
        <header className="mc-header">
          <span className="mc-brand">Secure area · Menu manager</span>
          <h1>ADMIN<br />ACCESS</h1>
        </header>

        <form onSubmit={submit}>
          <div className="mc-group">
            <label htmlFor="pin">Admin PIN</label>
            <input
              id="pin"
              className="mc-input"
              type={show ? "text" : "password"}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={!!err}
              aria-describedby={err ? "pin-err" : undefined}
            />
            <div className="mc-glow" />
            <button type="button" className="mc-eye" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide PIN" : "Show PIN"} aria-pressed={show}>
              {show ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {err && <p id="pin-err" role="alert" className="mc-err">{err}</p>}

          <div className="mc-submit">
            <div className="mc-drop" />
            <button type="submit" className="mc-btn" disabled={busy || !pin}>{busy ? "Checking…" : "Unlock"}</button>
          </div>
        </form>

        <footer className="mc-foot">
          <Link to="/">← Back to site</Link>
          <Link to="/menu">View menu</Link>
        </footer>
      </main>
    </div>
  );
}

/* ---------------- add dish ---------------- */
function AddDish({ onDone, pin }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState("");
  const empty = { name: "", category: categories[0]?.name || "", newCat: "", price: "", veg: true, desc: "" };
  const [f, setF] = useState(empty);
  const [err, setErr] = useState("");
  const isNew = f.category === "__new";
  async function submit(e) {
    e.preventDefault();
    const categoryName = (isNew ? f.newCat : f.category).trim();
    const price = Math.round(Number(f.price));
    if (!f.name.trim() || !categoryName || !Number.isFinite(price) || price <= 0) return setErr("Name, category and a price above ₹0 are required.");

    // reuse the exact name of an existing category (any capitalisation) so no duplicate category is created
    const existing = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    const id = addItem({ name: f.name.trim(), category: existing ? existing.name : categoryName, price, veg: f.veg, desc: f.desc.trim() });
    let photoErr = "";
    if (file) {
      setBusy("Preparing photo…");
      try { await setItemPhoto(id, file, pin, setBusy); } catch (x) { photoErr = x.message || "Photo failed"; }
      setBusy("");
    }
    setF(empty); setFile(null);
    if (photoErr) return setErr(`Dish added, but the photo failed: ${photoErr}`);
    setErr(""); onDone?.();
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border border-emerald-400/25 bg-[#0d1512] p-5">
      <h2 className="font-serif text-2xl font-semibold text-white">Add a new dish</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input className={field} placeholder="Dish name" aria-label="Dish name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} />
        <input className={field} placeholder="Price (₹)" aria-label="Price" inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, "") })} />
        <select className={field} aria-label="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          {categories.map((c) => <option key={c.id} value={c.name} className="bg-[#0d1512]">{c.name}</option>)}
          <option value="__new" className="bg-[#0d1512]">+ New category…</option>
        </select>
        {isNew ? <input className={field} placeholder="New category name" aria-label="New category name" value={f.newCat} onChange={(e) => setF({ ...f, newCat: e.target.value })} maxLength={60} />
          : <div className="flex gap-2">{[true, false].map((v) => (
              <button key={String(v)} type="button" aria-pressed={f.veg === v} onClick={() => setF({ ...f, veg: v })}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${f.veg === v ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-white/60"}`}>{v ? "Veg" : "Non-veg"}</button>))}</div>}
      </div>
      {isNew && <div className="mt-3 flex gap-2">{[true, false].map((v) => (
        <button key={String(v)} type="button" aria-pressed={f.veg === v} onClick={() => setF({ ...f, veg: v })}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm ${f.veg === v ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-white/60"}`}>{v ? "Veg" : "Non-veg"}</button>))}</div>}
      <textarea className={`${field} mt-3`} rows={2} placeholder="Short description" aria-label="Description" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} maxLength={240} />
      <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 px-3 py-2.5 text-sm text-white/60 hover:border-emerald-400">
        <ImagePlus size={16} /> <span className="truncate">{file ? file.name : "Add a photo (optional)"}</span>
        <input type="file" accept="image/*" className="sr-only" aria-label="Dish photo" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>
      {err && <p role="alert" className="mt-2 text-sm text-red-400">{err}</p>}
      <button type="submit" disabled={!!busy} className={`${glow} mt-4`}><Plus size={15} className="mr-1 inline" /> {busy || "Add dish"}</button>
    </form>
  );
}

/* ---------------- one table row ---------------- */
function Row({ item, pin, selected, onSelect }) {
  const [d, setD] = useState({ name: item.name, price: String(item.price), desc: item.desc || "" });
  const [photo, setPhoto] = useState({ busy: false, err: "", ok: "" });
  const [broken, setBroken] = useState("");
  const [saved, setSaved] = useState(false);
  const timer = useRef(0);
  useEffect(() => setD({ name: item.name, price: String(item.price), desc: item.desc || "" }), [item.name, item.price, item.desc]);
  useEffect(() => setBroken(""), [item.image]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const out = item.available === false;
  const changed = d.name.trim() !== item.name || Math.round(Number(d.price)) !== item.price || d.desc.trim() !== (item.desc || "");
  const flash = () => { setSaved(true); clearTimeout(timer.current); timer.current = setTimeout(() => setSaved(false), 1400); };
  const reset = () => setD({ name: item.name, price: String(item.price), desc: item.desc || "" });
  const commit = () => {
    const price = Math.round(Number(d.price));
    if (!d.name.trim() || !Number.isFinite(price) || price < 0) return reset();
    if (changed) { updateItem(item.id, { name: d.name.trim(), price, desc: d.desc.trim() }); flash(); }
  };
  const key = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") e.target.blur();
    if (e.key === "Escape") { reset(); e.target.blur(); }
  };

  async function pick(e) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setPhoto({ busy: true, err: "", ok: "" });
    try { const r = await setItemPhoto(item.id, file, pin, () => {}); setPhoto({ busy: false, err: "", ok: r.published ? "Live ✓" : "Saved here only" }); }
    catch (x) { setPhoto({ busy: false, err: x.message || "Upload failed", ok: "" }); }
  }
  async function drop() {
    setPhoto({ busy: true, err: "", ok: "" });
    try { await removePhoto(item.id, pin); setPhoto({ busy: false, err: "", ok: "Removed" }); }
    catch (x) { setPhoto({ busy: false, err: x.message || "Failed", ok: "" }); }
  }

  return (
    <div role="row" className={`grid grid-cols-[2rem_4.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-white/[0.06] px-3 py-3 transition last:border-0 ${COLS} ${selected ? "bg-emerald-400/[0.07]" : out ? "bg-red-400/[0.035]" : "hover:bg-white/[0.03]"}`}>
      <div role="cell" className="self-start pt-1 md:self-center md:pt-0">
        <input type="checkbox" checked={selected} onChange={() => onSelect(item.id)} aria-label={`Select ${item.name}`} className="h-4 w-4 cursor-pointer accent-emerald-400" />
      </div>

      <div role="cell" className="self-start md:self-center">
        <label className={`group relative grid aspect-[4/3] w-full cursor-pointer place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-white/30 ${photo.busy ? "pointer-events-none" : ""} ${out ? "opacity-60" : ""}`} title="Click to change photo">
          {item.image && !broken ? <SmartImg src={item.image} alt={`${item.name} photo`} onGiveUp={(why) => setBroken(why || "Photo link does not open")} className="h-full w-full object-cover" /> : <ImageOff size={18} />}
          <span className={`absolute inset-0 grid place-items-center bg-black/60 text-white transition ${photo.busy ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"}`}>
            {photo.busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Camera size={16} />}
          </span>
          <input type="file" accept="image/*" className="sr-only" onChange={pick} disabled={photo.busy} aria-label={`Photo for ${item.name}`} />
        </label>
      </div>

      <div role="cell" className="min-w-0">
        <input className={`${cell} font-semibold ${out ? "text-white/55" : ""}`} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} onBlur={commit} onKeyDown={key} maxLength={80} aria-label="Dish name" />
        <input className={`${cell} !py-1 text-xs text-white/55`} value={d.desc} onChange={(e) => setD({ ...d, desc: e.target.value })} onBlur={commit} onKeyDown={key} maxLength={240} placeholder="Add a short description" aria-label="Description" />
        {(photo.err || photo.ok || broken) && (
          <p role={photo.err || broken ? "alert" : "status"} className={`px-2 pt-0.5 text-[0.7rem] ${photo.err || broken ? "text-red-400" : "text-emerald-300"}`}>{photo.err || broken || photo.ok}</p>
        )}
      </div>

      <div role="cell" className="col-start-2 md:col-start-auto">
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-white/40">₹</span>
          <input className={`${cell} !pl-6 font-semibold tabular-nums`} inputMode="numeric" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value.replace(/\D/g, "") })} onBlur={commit} onKeyDown={key} aria-label="Price in rupees" />
          {saved && !changed && <Check size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300" aria-label="Saved" />}
        </div>
      </div>

      <div role="cell" className="col-start-2 md:col-start-auto">
        <button type="button" aria-pressed={item.veg} onClick={() => updateItem(item.id, { veg: !item.veg })} title="Tap to switch Veg / Non-veg"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${item.veg ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/40 bg-red-400/10 text-red-300"}`}>
          {item.veg ? <Leaf size={12} /> : <Drumstick size={12} />}{item.veg ? "Veg" : "Non-veg"}
        </button>
      </div>

      <div role="cell" className="col-start-2 md:col-start-auto">
        <button type="button" role="switch" aria-checked={!out} onClick={() => updateItem(item.id, { available: out })}
          className="group inline-flex items-center gap-2 rounded-full py-1 text-xs font-semibold">
          <span className={`relative h-5 w-9 rounded-full transition ${out ? "bg-white/15" : "bg-emerald-400"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${out ? "left-0.5" : "left-[1.125rem]"}`} />
          </span>
          <span className={out ? "text-red-300" : "text-emerald-300"}>{out ? "Out of stock" : "In stock"}</span>
        </button>
      </div>

      <div role="cell" className="col-start-2 flex items-center gap-1 md:col-start-auto md:justify-end">
        {changed && <button type="button" onClick={commit} className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-black">Save</button>}
        {item.image && !photo.busy && !changed && <button type="button" onClick={drop} title="Remove photo" aria-label={`Remove photo of ${item.name}`} className="rounded-full p-2 text-white/40 transition hover:bg-white/10 hover:text-white"><ImageOff size={15} /></button>}
        {!changed && <button type="button" onClick={() => window.confirm(`Delete "${item.name}"?`) && deleteItem(item.id)} aria-label={`Delete ${item.name}`} title="Delete dish" className="rounded-full p-2 text-white/40 transition hover:bg-red-400/10 hover:text-red-300"><Trash2 size={15} /></button>}
      </div>
    </div>
  );
}

/* ---------------- dashboard ---------------- */
const SORTS = { menu: "Menu order", name: "Name A–Z", low: "Price: low to high", high: "Price: high to low" };

function Stat({ label, value, tone, active, onClick }) {
  const tones = { green: "text-emerald-300", red: "text-red-300", white: "text-white", amber: "text-amber-300" };
  return (
    <button type="button" onClick={onClick} aria-pressed={!!active}
      className={`rounded-2xl border px-4 py-3 text-left transition ${active ? "border-emerald-400/60 bg-emerald-400/10" : "border-white/10 bg-[#0d1512] hover:border-white/25"}`}>
      <p className="text-[0.65rem] uppercase tracking-widest text-white/45">{label}</p>
      <p className={`mt-1 font-serif text-3xl font-semibold tabular-nums ${tones[tone] || tones.white}`}>{value}</p>
    </button>
  );
}

function Dashboard({ pin, onLogout }) {
  const mv = useMenuVersion();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [stock, setStock] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("menu");
  const [showAdd, setShowAdd] = useState(false);
  const [closed, setClosed] = useState({});
  const [sel, setSel] = useState(() => new Set());
  const [cloud, setCloud] = useState({ busy: false, msg: "", ok: true });
  const dirty = useMemo(() => isDirty(), [mv, cloud]);
  const pub = publishState();

  const [catPhotoState, setCatPhotoState] = useState({});

  useEffect(() => {
    setAdminPin(pin);
    if (cloudEnabled() && !isDirty()) loadFromCloud({ force: true });
  }, [pin]);

  const out = menuItems.filter((i) => i.available === false).length;
  const veg = menuItems.filter((i) => i.veg).length;

  const groups = useMemo(() => {
    const n = q.trim().toLowerCase();
    const sorter = { menu: null, name: (a, b) => a.name.localeCompare(b.name), low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price }[sort];
    return categories
      .filter((c) => cat === "all" || c.id === cat)
      .map((c) => {
        let items = menuItems.filter((i) =>
          i.categoryId === c.id &&
          (!n || `${i.name} ${i.desc || ""} ${i.price}`.toLowerCase().includes(n)) &&
          (stock === "all" || (stock === "out") === (i.available === false)) &&
          (type === "all" || (type === "veg") === !!i.veg));
        if (sorter) items = [...items].sort(sorter);
        return { ...c, items };
      })
      .filter((g) => g.items.length || cat !== "all");
  }, [q, cat, stock, type, sort, mv]);

  const visible = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const allSel = visible.length > 0 && visible.every((i) => sel.has(i.id));
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSel(allSel ? new Set() : new Set(visible.map((i) => i.id)));
  const picked = [...sel].filter((id) => menuItems.some((i) => i.id === id));
  const bulk = (available) => { picked.forEach((id) => updateItem(id, { available })); setSel(new Set()); };
  const bulkDelete = () => {
    if (!window.confirm(`Delete ${picked.length} dish${picked.length > 1 ? "es" : ""}? This cannot be undone.`)) return;
    picked.forEach((id) => deleteItem(id)); setSel(new Set());
  };
  const filtered = q || cat !== "all" || stock !== "all" || type !== "all";
  const clearAll = () => { setQ(""); setCat("all"); setStock("all"); setType("all"); };

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Category", "Dish", "Price", "Type", "Stock", "Description"], ...menuItems.map((i) => [i.category, i.name, i.price, i.veg ? "Veg" : "Non-veg", i.available === false ? "Out of stock" : "In stock", i.desc || ""])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "menu.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const run = async (fn, okMsg) => {
    setCloud({ busy: true, msg: "", ok: true });
    try {
      const r = await fn();
      if (r && typeof r === "object" && "liveDishes" in r) {
        const lost = r.livePhotos < r.sentPhotos || r.liveDishes < r.sentDishes;
        setCloud({ busy: false, ok: !lost, msg: lost
          ? `Cloud did NOT keep everything: sent ${r.sentDishes} dishes / ${r.sentPhotos} photos, cloud has ${r.liveDishes} / ${r.livePhotos}. Redeploy the Apps Script (New version) with the latest apps-script.gs.`
          : `Saved and verified to Google Sheets. Live for all visitors: ${r.liveDishes} dishes, ${r.livePhotos} photos.` });
      } else setCloud({ busy: false, ok: r !== false, msg: r === false ? "Nothing to load from the cloud." : okMsg });
    }
    catch (e) { setCloud({ busy: false, ok: false, msg: e.message || "Failed" }); }
  };
  const test = async () => {
    setCloud({ busy: true, msg: "", ok: true });
    try {
      const r = await testCloud();
      const mine = menuItems.filter((i) => isPhoto(i.image)).length;
      const notes = [r.dishes === 0 ? "The Sheet is EMPTY: press Save to Cloud." : "", r.photos < mine ? "Some photos are NOT in the cloud: press Save to Cloud." : "", isDirty() ? "This browser has unsaved changes." : ""].filter(Boolean).join(" ");
      setCloud({ busy: false, ok: !notes, msg: `Google Sheets connected successfully. Sheet holds ${r.dishes} dishes, ${r.photos} photos. Local: ${menuItems.length} dishes. ${notes}`.trim() });
    } catch (e) { setCloud({ busy: false, ok: false, msg: e.message || "Failed" }); }
  };

  async function handleCategoryPhotoPick(catId, e) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setCatPhotoState(s => ({ ...s, [catId]: { busy: true, err: "" } }));
    try {
      await setCategoryPhoto(catId, file, pin);
      setCatPhotoState(s => ({ ...s, [catId]: { busy: false, err: "" } }));
    } catch (x) {
      setCatPhotoState(s => ({ ...s, [catId]: { busy: false, err: x.message || "Failed to upload category photo" } }));
    }
  }

  async function handleCategoryPhotoDrop(catId) {
    setCatPhotoState(s => ({ ...s, [catId]: { busy: true, err: "" } }));
    try {
      await removeCategoryPhoto(catId, pin);
      setCatPhotoState(s => ({ ...s, [catId]: { busy: false, err: "" } }));
    } catch (x) {
      setCatPhotoState(s => ({ ...s, [catId]: { busy: false, err: x.message || "Failed to remove category photo" } }));
    }
  }

  const sel2 = `${field} !w-auto !py-2 pr-8`;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-40 pt-28 sm:px-8 sm:pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Admin panel</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-white sm:text-5xl">Menu manager</h1>
          <p className="mt-2 text-sm text-white/55">build {BUILD} · Google Sheets Sync {cloudEnabled() ? "ON" : "OFF"} · click name, price or description to edit</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className={ghost}><Download size={15} /> Export CSV</button>
          <Link to="/menu" className={ghost}><Eye size={15} /> View menu</Link>
          <button type="button" onClick={onLogout} className={ghost}><LogOut size={15} /> Log out</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="All dishes" value={menuItems.length} active={stock === "all" && type === "all"} onClick={() => { setStock("all"); setType("all"); }} />
        <Stat label="In stock" value={menuItems.length - out} tone="green" active={stock === "in"} onClick={() => setStock(stock === "in" ? "all" : "in")} />
        <Stat label="Out of stock" value={out} tone={out ? "red" : "white"} active={stock === "out"} onClick={() => setStock(stock === "out" ? "all" : "out")} />
        <Stat label="Veg / Non-veg" value={`${veg} / ${menuItems.length - veg}`} tone="amber" active={type !== "all"} onClick={() => setType(type === "all" ? "veg" : type === "veg" ? "non" : "all")} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1512] p-4">
        {!cloudEnabled() ? (
          <span className="inline-flex items-center gap-2 text-sm text-red-400"><AlertTriangle size={16} /> Cloud URL missing in business config. Google Sheets sync is disabled.</span>
        ) : pub.state === "pending" || pub.state === "saving" ? (
          <span className="inline-flex items-center gap-2 text-sm text-amber-300"><CloudUpload size={16} /> {pub.msg}</span>
        ) : pub.state === "error" ? (
          <span className="inline-flex items-center gap-2 text-sm text-red-400"><AlertTriangle size={16} /> {pub.msg}</span>
        ) : dirty ? (
          <span className="inline-flex items-center gap-2 text-sm text-amber-300"><AlertTriangle size={16} /> Unsaved changes. Press Save to Cloud to update Google Sheets.</span>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-emerald-300"><Check size={16} /> {pub.state === "ok" ? pub.msg : "Synced with Google Sheets"}</span>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" disabled={!cloudEnabled() || cloud.busy} onClick={() => run(() => saveToCloud(pin), "Saved to Google Sheet successfully.")} className={glow}><CloudUpload size={15} className="mr-1.5 inline" />Save to Cloud</button>
          <button type="button" disabled={cloud.busy} onClick={test} className={ghost}><Check size={15} /> Test Sheet</button>
          <button type="button" disabled={!cloudEnabled() || cloud.busy} onClick={() => window.confirm("Replace local edits with Google Sheets menu?") && run(() => loadFromCloud({ force: true }), "Loaded from Google Sheet.")} className={ghost}><CloudDownload size={15} /> Load from Cloud</button>
          <button type="button" onClick={() => window.confirm("Reset the menu to original defaults?") && resetToDefaults()} className={ghost}><RotateCcw size={15} /> Reset</button>
        </div>
        {cloud.msg && <p role="status" className={`w-full text-sm ${cloud.ok ? "text-emerald-300" : "text-red-400"}`}>{cloud.msg}</p>}
      </div>

      {/* toolbar */}
      <div className="sticky top-16 z-20 -mx-4 mt-5 border-y border-white/10 bg-[#08140e]/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input className={`${field} !pl-10 !pr-9`} placeholder="Search name, description or price" aria-label="Search dishes" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/50 hover:text-white"><X size={14} /></button>}
          </div>
          <select className={sel2} aria-label="Stock filter" value={stock} onChange={(e) => setStock(e.target.value)}>
            <option value="all" className="bg-[#0d1512]">Any stock</option><option value="in" className="bg-[#0d1512]">In stock</option><option value="out" className="bg-[#0d1512]">Out of stock</option>
          </select>
          <select className={sel2} aria-label="Veg filter" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all" className="bg-[#0d1512]">Veg + Non-veg</option><option value="veg" className="bg-[#0d1512]">Veg only</option><option value="non" className="bg-[#0d1512]">Non-veg only</option>
          </select>
          <select className={sel2} aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k} className="bg-[#0d1512]">{v}</option>)}
          </select>
          <button type="button" onClick={() => setShowAdd((s) => !s)} className={glow}><Plus size={15} className="mr-1 inline" />{showAdd ? "Close" : "Add dish"}</button>
        </div>
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Categories">
          {[{ id: "all", name: "All", n: menuItems.length }, ...categories.map((c) => ({ id: c.id, name: c.name, n: menuItems.filter((i) => i.categoryId === c.id).length }))].map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${cat === c.id ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/15 text-white/70 hover:border-emerald-400/60"}`}>
              {c.name} <span className={cat === c.id ? "text-black/60" : "text-white/40"}>{c.n}</span>
            </button>
          ))}
        </div>
      </div>

      {showAdd && <div className="mt-4"><AddDish pin={pin} onDone={() => setShowAdd(false)} /></div>}

      {/* bulk bar */}
      {picked.length > 0 && (
        <div role="region" aria-label="Bulk actions" className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-2xl flex-wrap items-center gap-2 rounded-2xl border border-emerald-400/40 bg-[#0d1512]/95 p-3 shadow-[0_10px_50px_-10px_rgba(0,0,0,0.8)] backdrop-blur">
          <span className="px-2 text-sm font-semibold text-white">{picked.length} selected</span>
          <button type="button" onClick={() => bulk(true)} className={`${ghost} !px-3 !py-1.5 text-xs`}><PackageCheck size={14} /> In stock</button>
          <button type="button" onClick={() => bulk(false)} className={`${ghost} !px-3 !py-1.5 text-xs`}><PackageX size={14} /> Out of stock</button>
          <button type="button" onClick={bulkDelete} className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10"><Trash2 size={14} /> Delete</button>
          <button type="button" onClick={() => setSel(new Set())} className="ml-auto rounded-full p-2 text-white/50 hover:text-white" aria-label="Clear selection"><X size={16} /></button>
        </div>
      )}

      {/* table */}
      <div role="table" aria-label="Menu dishes" className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1512]">
        <div role="row" className={`hidden items-center gap-x-3 border-b border-white/10 bg-white/[0.03] px-3 py-2.5 text-[0.65rem] uppercase tracking-widest text-white/45 md:grid ${COLS}`}>
          <div role="columnheader"><input type="checkbox" checked={allSel} onChange={toggleAll} aria-label="Select all shown dishes" className="h-4 w-4 cursor-pointer accent-emerald-400" /></div>
          <div role="columnheader">Photo</div><div role="columnheader">Dish</div><div role="columnheader">Price</div><div role="columnheader">Type</div><div role="columnheader">Stock</div><div role="columnheader" className="text-right">Actions</div>
        </div>

        {groups.map((g) => {
          const shut = !!closed[g.id];
          const gOut = g.items.filter((i) => i.available === false).length;
          const cState = catPhotoState[g.id] || {};
          return (
            <section key={g.id} role="rowgroup" aria-label={g.name}>
              <div className="flex w-full items-center justify-between border-b border-white/10 bg-emerald-400/[0.06] px-4 py-2.5">
                <button type="button" onClick={() => setClosed((c) => ({ ...c, [g.id]: !c[g.id] }))} aria-expanded={!shut}
                  className="flex items-center gap-3 text-left transition hover:opacity-80">
                  <ChevronDown size={16} className={`text-emerald-300 transition ${shut ? "-rotate-90" : ""}`} />
                  <span className="font-serif text-xl font-semibold text-white">{g.name}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">{g.items.length}</span>
                  {gOut > 0 && <span className="rounded-full bg-red-400/15 px-2 py-0.5 text-xs text-red-300">{gOut} out</span>}
                </button>

                <div className="flex items-center gap-2">
                  {cState.err && <span className="text-[0.7rem] text-red-400">{cState.err}</span>}
                  {g.image ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-8 w-12 overflow-hidden rounded border border-emerald-400/30">
                        <SmartImg src={g.image} alt={g.name} className="h-full w-full object-cover" />
                      </div>
                      <button type="button" onClick={() => handleCategoryPhotoDrop(g.id)} disabled={cState.busy} title="Remove category photo" className="rounded p-1 text-white/50 hover:bg-red-400/10 hover:text-red-300">
                        <ImageOff size={14} />
                      </button>
                    </div>
                  ) : null}
                  <label className="group relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20" title="Upload category banner/photo">
                    <Camera size={14} />
                    <span>{cState.busy ? "Uploading..." : g.image ? "Change Photo" : "Add Photo"}</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleCategoryPhotoPick(g.id, e)} disabled={cState.busy} />
                  </label>
                </div>
              </div>
              {!shut && g.items.map((it) => <Row key={it.id} item={it} pin={pin} selected={sel.has(it.id)} onSelect={toggle} />)}
            </section>
          );
        })}

        {groups.length === 0 && (
          <div className="px-4 py-16 text-center">
            <p className="text-white/60">No dishes match your search / filters.</p>
            {filtered && <button type="button" onClick={clearAll} className={`${ghost} mt-4`}><X size={14} /> Clear all filters</button>}
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-white/40">Showing {visible.length} of {menuItems.length} dishes · Press **Save to Cloud** to update your Google Sheet.</p>
    </div>
  );
}

export default function Admin() {
  usePageTitle("Admin");
  useEffect(() => {
    const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex,nofollow";
    document.head.appendChild(m); return () => m.remove();
  }, []);
  const [pin, setPin] = useState(() => { try { return sessionStorage.getItem(SESSION) || ""; } catch { return ""; } });
  const logout = () => { try { sessionStorage.removeItem(SESSION); } catch { /* ignore */ } setPin(""); };
  return pin ? <Dashboard pin={pin} onLogout={logout} /> : <Login onOk={setPin} />;
}