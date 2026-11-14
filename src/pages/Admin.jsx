import { useEffect, useMemo, useRef, useState } from "react";
import {
  Lock, LogOut, Plus, Trash2, CloudUpload, CloudDownload, RotateCcw, Search, Check, AlertTriangle, Eye,
  ImagePlus, ImageOff, Download, X, ChevronDown, Camera, PackageX, PackageCheck, Leaf, Drumstick,
} from "lucide-react";
import { Link } from "react-router-dom";
import * as siteConfig from "../config/business.js";

const adminConfig = siteConfig.adminConfig || { cloudUrl: "", localPin: "admin123" }; // eslint-disable-line no-unused-vars
import { usePageTitle } from "../lib/hooks.js";
import SmartImg from "../components/SmartImg.jsx";
import {
  menuItems, categories, useMenuVersion, updateItem, deleteItem, addItem, resetToDefaults, setItemPhoto, removePhoto,
  verifyPin, saveToCloud, loadFromCloud, cloudEnabled, isDirty, testCloud, BUILD, setAdminPin, publishState, isPhoto,
} from "../lib/menuStore.js";

const SESSION = "gc-admin-pin";
const field = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30";
const cell = "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-white/30 transition hover:border-white/15 hover:bg-white/[0.04] focus:border-emerald-400 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-400/30";
const glow = "rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_24px_-4px_rgba(16,185,129,0.8)] transition hover:bg-emerald-300 disabled:opacity-50";
const ghost = "inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-50";
/* one grid for header + rows so columns always line up */
const COLS = "md:grid-cols-[2rem_4.5rem_minmax(0,1fr)_6.5rem_6.5rem_8.5rem_5.5rem]";

/* ---------------- login ---------------- */
function Login({ onOk }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
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
    <div className="grid min-h-[80vh] place-items-center px-5 pt-24">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-emerald-400/20 bg-[#0d1512] p-8 shadow-[0_0_60px_-20px_rgba(16,185,129,0.5)]">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Lock size={24} /></span>
        <h1 className="mt-5 font-serif text-4xl font-semibold text-white">Admin</h1>
        <p className="mt-2 text-sm text-white/55">Enter the PIN to manage the menu.</p>
        <label htmlFor="pin" className="sr-only">PIN</label>
        <input id="pin" type="password" autoFocus value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" autoComplete="current-password" className={`${field} mt-6`} />
        {err && <p role="alert" className="mt-3 text-sm text-red-400">{err}</p>}
        <button type="submit" disabled={busy || !pin} className={`${glow} mt-6 w-full`}>{busy ? "Checking…" : "Unlock"}</button>
      </form>
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
    const category = (isNew ? f.newCat : f.category).trim();
    const price = Math.round(Number(f.price));
    if (!f.name.trim() || !category || !Number.isFinite(price) || price <= 0) return setErr("Name, category and a price above ₹0 are required.");
    const id = addItem({ name: f.name.trim(), category, price, veg: f.veg, desc: f.desc.trim() });
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
  const [stock, setStock] = useState("all"); // all | in | out
  const [type, setType] = useState("all");   // all | veg | non
  const [sort, setSort] = useState("menu");
  const [showAdd, setShowAdd] = useState(false);
  const [closed, setClosed] = useState({});
  const [sel, setSel] = useState(() => new Set());
  const [cloud, setCloud] = useState({ busy: false, msg: "", ok: true });
  const dirty = useMemo(() => isDirty(), [mv, cloud]); // eslint-disable-line react-hooks/exhaustive-deps
  const pub = publishState();

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
      .filter((g) => g.items.length);
  }, [q, cat, stock, type, sort, mv]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const url = URL.createObjectURL(new Blob(["﻿" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
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
          : `Saved and verified. Live for all visitors: ${r.liveDishes} dishes, ${r.livePhotos} with uploaded photos.` });
      } else setCloud({ busy: false, ok: r !== false, msg: r === false ? "Nothing to load from the cloud." : okMsg });
    }
    catch (e) { setCloud({ busy: false, ok: false, msg: e.message || "Failed" }); }
  };
  const test = async () => {
    setCloud({ busy: true, msg: "", ok: true });
    try {
      const r = await testCloud();
      const mine = menuItems.filter((i) => isPhoto(i.image)).length;
      const notes = [r.dishes === 0 ? "The Sheet is EMPTY: press Save to Cloud." : "", r.photos < mine ? "Some photos in this browser are NOT in the cloud: press Save to Cloud." : "", isDirty() ? "This browser has unsaved changes." : ""].filter(Boolean).join(" ");
      setCloud({ busy: false, ok: !notes, msg: `Cloud reachable. Sheet holds ${r.dishes} dishes, ${r.photos} uploaded photos. This browser: ${menuItems.length} dishes, ${mine} uploaded photos. ${notes}`.trim() });
    } catch (e) { setCloud({ busy: false, ok: false, msg: e.message || "Failed" }); }
  };

  const sel2 = `${field} !w-auto !py-2 pr-8`;
  return (
    <div className="mx-auto max-w-6xl px-4 pb-40 pt-28 sm:px-8 sm:pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Admin panel</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-white sm:text-5xl">Menu manager</h1>
          <p className="mt-2 text-sm text-white/55">build {BUILD} · cloud {cloudEnabled() ? "ON" : "OFF"} · click any name, price or description to edit</p>
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
          <span className="inline-flex items-center gap-2 text-sm text-red-400"><AlertTriangle size={16} /> Cloud is OFF: changes stay on this browser only and other visitors will NOT see them.</span>
        ) : pub.state === "pending" || pub.state === "saving" ? (
          <span className="inline-flex items-center gap-2 text-sm text-amber-300"><CloudUpload size={16} /> {pub.msg}</span>
        ) : pub.state === "error" ? (
          <span className="inline-flex items-center gap-2 text-sm text-red-400"><AlertTriangle size={16} /> {pub.msg}</span>
        ) : dirty ? (
          <span className="inline-flex items-center gap-2 text-sm text-amber-300"><AlertTriangle size={16} /> Changes on this browser are not saved to the website yet. Press Save to Cloud.</span>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-emerald-300"><Check size={16} /> {pub.state === "ok" ? pub.msg : "Same as the live website"}</span>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" disabled={!cloudEnabled() || cloud.busy} onClick={() => run(() => saveToCloud(pin), "Saved to Google Sheet (photos included). Live for all visitors.")} className={glow}><CloudUpload size={15} className="mr-1.5 inline" />Save to Cloud</button>
          <button type="button" disabled={cloud.busy} onClick={test} className={ghost}><Check size={15} /> Test cloud</button>
          <button type="button" disabled={!cloudEnabled() || cloud.busy} onClick={() => window.confirm("Replace local edits with the cloud menu?") && run(() => loadFromCloud({ force: true }), "Loaded from cloud.")} className={ghost}><CloudDownload size={15} /> Load from Cloud</button>
          <button type="button" onClick={() => window.confirm("Reset the menu to the original defaults?") && resetToDefaults()} className={ghost}><RotateCcw size={15} /> Reset</button>
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
          return (
            <section key={g.id} role="rowgroup" aria-label={g.name}>
              <button type="button" onClick={() => setClosed((c) => ({ ...c, [g.id]: !c[g.id] }))} aria-expanded={!shut}
                className="flex w-full items-center gap-3 border-b border-white/10 bg-emerald-400/[0.06] px-4 py-2.5 text-left transition hover:bg-emerald-400/10">
                <ChevronDown size={16} className={`text-emerald-300 transition ${shut ? "-rotate-90" : ""}`} />
                <span className="font-serif text-xl font-semibold text-white">{g.name}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">{g.items.length}</span>
                {gOut > 0 && <span className="rounded-full bg-red-400/15 px-2 py-0.5 text-xs text-red-300">{gOut} out</span>}
              </button>
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
      <p className="mt-3 text-xs text-white/40">Showing {visible.length} of {menuItems.length} dishes · Enter = save, Esc = undo · changes go live automatically, or press Save to Cloud.</p>
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