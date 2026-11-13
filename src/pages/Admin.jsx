// import { useEffect, useMemo, useState } from "react";
// import { Lock, LogOut, Plus, Trash2, CloudUpload, CloudDownload, RotateCcw, Search, Check, AlertTriangle, Eye, ImagePlus, ImageOff } from "lucide-react";
// import { Link } from "react-router-dom";
// import * as siteConfig from "../config/business.js";

// // Safe even if business.js is an older copy without adminConfig (falls back to local-only mode)
// const adminConfig = siteConfig.adminConfig || { cloudUrl: "", localPin: "admin123" };
// import { usePageTitle } from "../lib/hooks.js";
// import SmartImg from "../components/SmartImg.jsx";
// import {
//   menuItems, categories, useMenuVersion, updateItem, deleteItem, addItem, resetToDefaults, setItemPhoto, removePhoto,
//   verifyPin, saveToCloud, loadFromCloud, cloudEnabled, isDirty, testCloud, BUILD, setAdminPin, publishState, isPhoto,
// } from "../lib/menuStore.js";

// const SESSION = "gc-admin-pin";
// const field = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30";
// const glow = "rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_24px_-4px_rgba(16,185,129,0.8)] transition hover:bg-emerald-300 disabled:opacity-50";
// const ghost = "inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-50";

// /* ---------------- login ---------------- */
// function Login({ onOk }) {
//   const [pin, setPin] = useState("");
//   const [err, setErr] = useState("");
//   const [busy, setBusy] = useState(false);
//   async function submit(e) {
//     e.preventDefault();
//     setBusy(true); setErr("");
//     let ok = false;
//     try { ok = await verifyPin(pin.trim()); }
//     catch (x) { setBusy(false); return setErr(x.message || "Cloud not reachable."); }
//     setBusy(false);
//     if (ok) { try { sessionStorage.setItem(SESSION, pin.trim()); } catch { /* ignore */ } onOk(pin.trim()); }
//     else setErr("Wrong PIN. Please try again.");
//   }
//   return (
//     <div className="grid min-h-[80vh] place-items-center px-5 pt-24">
//       <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-emerald-400/20 bg-[#0d1512] p-8 shadow-[0_0_60px_-20px_rgba(16,185,129,0.5)]">
//         <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Lock size={24} /></span>
//         <h1 className="mt-5 font-serif text-4xl font-semibold text-white">Admin</h1>
//         <p className="mt-2 text-sm text-white/55">Enter the PIN to manage the menu.</p>
//         <label htmlFor="pin" className="sr-only">PIN</label>
//         <input id="pin" type="password" autoFocus value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" autoComplete="current-password" className={`${field} mt-6`} />
//         {err && <p role="alert" className="mt-3 text-sm text-red-400">{err}</p>}
//         <button type="submit" disabled={busy || !pin} className={`${glow} mt-6 w-full`}>{busy ? "Checking…" : "Unlock"}</button>
//       </form>
//     </div>
//   );
// }

// /* ---------------- one dish row ---------------- */
// function DishEditor({ item, pin }) {
//   const [photo, setPhoto] = useState({ busy: false, step: "", err: "", ok: "" });
//   const [broken, setBroken] = useState("");
//   useEffect(() => setBroken(""), [item.image]);
//   async function pick(e) {
//     const file = e.target.files?.[0]; e.target.value = "";
//     if (!file) return;
//     setPhoto({ busy: true, step: "Preparing photo…", err: "", ok: "" });
//     try {
//       const r = await setItemPhoto(item.id, file, pin, (step) => setPhoto((p) => ({ ...p, step })));
//       setPhoto({ busy: false, step: "", err: "", ok: r.published ? "Live on the website ✓" : "Saved on this browser only" });
//     } catch (x) { setPhoto({ busy: false, step: "", err: x.message || "Upload failed", ok: "" }); }
//   }
//   async function drop() {
//     setPhoto({ busy: true, step: "Removing…", err: "", ok: "" });
//     try { await removePhoto(item.id, pin); setPhoto({ busy: false, step: "", err: "", ok: "Photo removed" }); }
//     catch (x) { setPhoto({ busy: false, step: "", err: x.message || "Failed", ok: "" }); }
//   }
//   const [d, setD] = useState({ name: item.name, price: String(item.price), desc: item.desc });
//   useEffect(() => setD({ name: item.name, price: String(item.price), desc: item.desc }), [item.name, item.price, item.desc]);
//   const commit = () => {
//     const price = Math.round(Number(d.price));
//     if (!d.name.trim() || !Number.isFinite(price) || price < 0) return setD({ name: item.name, price: String(item.price), desc: item.desc });
//     if (d.name.trim() !== item.name || price !== item.price || d.desc.trim() !== item.desc) updateItem(item.id, { name: d.name.trim(), price, desc: d.desc.trim() });
//   };
//   const key = (e) => e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.blur();
//   const out = item.available === false;
//   return (
//     <div className={`rounded-2xl border bg-[#101916] p-4 transition ${out ? "border-red-400/25" : "border-white/10 hover:border-emerald-400/30"}`}>
//       <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
//         <div>
//           <label className="mb-1 block text-[0.65rem] uppercase tracking-widest text-white/40" htmlFor={`n-${item.id}`}>Dish name</label>
//           <input id={`n-${item.id}`} className={field} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} onBlur={commit} onKeyDown={key} maxLength={80} />
//         </div>
//         <div>
//           <label className="mb-1 block text-[0.65rem] uppercase tracking-widest text-white/40" htmlFor={`p-${item.id}`}>Price (₹)</label>
//           <input id={`p-${item.id}`} className={field} inputMode="numeric" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value.replace(/\D/g, "") })} onBlur={commit} onKeyDown={key} />
//         </div>
//       </div>
//       <div className="mt-3 flex items-center gap-3">
//         <div className="grid aspect-[4/3] w-28 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-white/30">
//           {item.image && !broken ? <SmartImg src={item.image} alt={`${item.name} photo`} onGiveUp={(why) => setBroken(why || "The photo link does not open.")} className="h-full w-full object-cover" /> : <ImageOff size={20} />}
//         </div>
//         <div className="min-w-0">
//           <div className="flex flex-wrap gap-2">
//             <label className={`${ghost} cursor-pointer !px-3 !py-1.5 text-xs ${photo.busy ? "pointer-events-none opacity-50" : ""}`}>
//               <ImagePlus size={14} /> {photo.busy ? "Please wait…" : item.image ? "Change photo" : "Add photo"}
//               <input type="file" accept="image/*" className="sr-only" onChange={pick} disabled={photo.busy} aria-label={`Photo for ${item.name}`} />
//             </label>
//             {item.image && !photo.busy && <button type="button" onClick={drop} className="rounded-full px-3 py-1.5 text-xs text-white/45 hover:text-red-300">Remove</button>}
//           </div>
//           {photo.busy && <p role="status" className="mt-1 text-xs text-amber-300">{photo.step}</p>}
//           {photo.ok && !photo.busy && <p role="status" className="mt-1 text-xs text-emerald-300">{photo.ok}</p>}
//           {photo.err && <p role="alert" className="mt-1 text-xs text-red-400">{photo.err}</p>}
//           {broken && <p role="alert" className="mt-1 text-xs text-red-400">Photo is saved but cannot be shown. {broken}</p>}
//           <p className="mt-1 text-[0.65rem] text-white/30">Auto-cropped to 4:3 for the menu</p>
//         </div>
//       </div>
//       <label className="mb-1 mt-3 block text-[0.65rem] uppercase tracking-widest text-white/40" htmlFor={`d-${item.id}`}>Description</label>
//       <textarea id={`d-${item.id}`} rows={2} className={field} value={d.desc} onChange={(e) => setD({ ...d, desc: e.target.value })} onBlur={commit} maxLength={240} />
//       <div className="mt-3 flex flex-wrap items-center gap-2">
//         <button type="button" role="switch" aria-checked={!out} onClick={() => updateItem(item.id, { available: out })}
//           className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${out ? "border-red-400/40 bg-red-400/10 text-red-300" : "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"}`}>
//           {out ? "Out of stock" : "In stock"}
//         </button>
//         <button type="button" aria-pressed={item.veg} onClick={() => updateItem(item.id, { veg: !item.veg })}
//           className="rounded-full border border-white/15 px-4 py-1.5 text-xs uppercase tracking-widest text-white/70 hover:border-emerald-400">
//           {item.veg ? "🟢 Veg" : "🔴 Non-veg"}
//         </button>
//         <button type="button" onClick={() => window.confirm(`Delete "${item.name}"?`) && deleteItem(item.id)} aria-label={`Delete ${item.name}`}
//           className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs uppercase tracking-widest text-white/45 hover:bg-red-400/10 hover:text-red-300">
//           <Trash2 size={14} /> Delete
//         </button>
//       </div>
//     </div>
//   );
// }

// /* ---------------- add dish ---------------- */
// function AddDish({ onDone, pin }) {
//   const [file, setFile] = useState(null);
//   const [busy, setBusy] = useState("");
//   const empty = { name: "", category: categories[0]?.name || "", newCat: "", price: "", veg: true, desc: "" };
//   const [f, setF] = useState(empty);
//   const [err, setErr] = useState("");
//   const isNew = f.category === "__new";
//   async function submit(e) {
//     e.preventDefault();
//     const category = (isNew ? f.newCat : f.category).trim();
//     const price = Math.round(Number(f.price));
//     if (!f.name.trim() || !category || !Number.isFinite(price) || price <= 0) return setErr("Name, category and a price above ₹0 are required.");
//     const id = addItem({ name: f.name.trim(), category, price, veg: f.veg, desc: f.desc.trim() });
//     let photoErr = "";
//     if (file) {
//       setBusy("Preparing photo…");
//       try { await setItemPhoto(id, file, pin, setBusy); } catch (x) { photoErr = x.message || "Photo failed"; }
//       setBusy("");
//     }
//     setF(empty); setFile(null);
//     if (photoErr) return setErr(`Dish added, but the photo failed: ${photoErr}`);
//     setErr(""); onDone?.();
//   }
//   return (
//     <form onSubmit={submit} className="rounded-2xl border border-emerald-400/25 bg-[#0d1512] p-5">
//       <h2 className="font-serif text-2xl font-semibold text-white">Add a new dish</h2>
//       <div className="mt-4 grid gap-3 sm:grid-cols-2">
//         <input className={field} placeholder="Dish name" aria-label="Dish name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} />
//         <input className={field} placeholder="Price (₹)" aria-label="Price" inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, "") })} />
//         <select className={field} aria-label="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
//           {categories.map((c) => <option key={c.id} value={c.name} className="bg-[#0d1512]">{c.name}</option>)}
//           <option value="__new" className="bg-[#0d1512]">+ New category…</option>
//         </select>
//         {isNew ? <input className={field} placeholder="New category name" aria-label="New category name" value={f.newCat} onChange={(e) => setF({ ...f, newCat: e.target.value })} maxLength={60} />
//           : <div className="flex gap-2">{[true, false].map((v) => (
//               <button key={String(v)} type="button" aria-pressed={f.veg === v} onClick={() => setF({ ...f, veg: v })}
//                 className={`flex-1 rounded-lg border px-3 py-2 text-sm ${f.veg === v ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-white/60"}`}>{v ? "Veg" : "Non-veg"}</button>))}</div>}
//       </div>
//       {isNew && <div className="mt-3 flex gap-2">{[true, false].map((v) => (
//         <button key={String(v)} type="button" aria-pressed={f.veg === v} onClick={() => setF({ ...f, veg: v })}
//           className={`flex-1 rounded-lg border px-3 py-2 text-sm ${f.veg === v ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-white/60"}`}>{v ? "Veg" : "Non-veg"}</button>))}</div>}
//       <textarea className={`${field} mt-3`} rows={2} placeholder="Short description" aria-label="Description" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} maxLength={240} />
//       <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 px-3 py-2.5 text-sm text-white/60 hover:border-emerald-400">
//         <ImagePlus size={16} /> <span className="truncate">{file ? file.name : "Add a photo (optional)"}</span>
//         <input type="file" accept="image/*" className="sr-only" aria-label="Dish photo" onChange={(e) => setFile(e.target.files?.[0] || null)} />
//       </label>
//       {err && <p role="alert" className="mt-2 text-sm text-red-400">{err}</p>}
//       <button type="submit" disabled={!!busy} className={`${glow} mt-4`}><Plus size={15} className="mr-1 inline" /> {busy || "Add dish"}</button>
//     </form>
//   );
// }

// /* ---------------- dashboard ---------------- */
// function Dashboard({ pin, onLogout }) {
//   const mv = useMenuVersion();
//   const [q, setQ] = useState("");
//   const [showAdd, setShowAdd] = useState(false);
//   const [cloud, setCloud] = useState({ busy: false, msg: "", ok: true });
//   const dirty = useMemo(() => isDirty(), [mv, cloud]); // eslint-disable-line react-hooks/exhaustive-deps
//   const pub = publishState();

//   // Every admin starts from what is live in the cloud, so everyone sees the same menu.
//   useEffect(() => {
//     setAdminPin(pin);
//     if (cloudEnabled() && !isDirty()) loadFromCloud({ force: true });
//   }, [pin]);

//   const groups = useMemo(() => {
//     const n = q.trim().toLowerCase();
//     return categories.map((c) => ({ ...c, items: menuItems.filter((i) => i.categoryId === c.id && (!n || `${i.name} ${i.desc}`.toLowerCase().includes(n))) })).filter((g) => g.items.length);
//   }, [q, mv]); // eslint-disable-line react-hooks/exhaustive-deps

//   const run = async (fn, okMsg) => {
//     setCloud({ busy: true, msg: "", ok: true });
//     try {
//       const r = await fn();
//       if (r && typeof r === "object" && "liveDishes" in r) {
//         const lost = r.livePhotos < r.sentPhotos || r.liveDishes < r.sentDishes;
//         setCloud({ busy: false, ok: !lost, msg: lost
//           ? `Cloud did NOT keep everything: sent ${r.sentDishes} dishes / ${r.sentPhotos} photos, cloud has ${r.liveDishes} / ${r.livePhotos}. Redeploy the Apps Script (New version) with the latest apps-script.gs.`
//           : `Saved and verified. Live for all visitors: ${r.liveDishes} dishes, ${r.livePhotos} with uploaded photos.` });
//       } else setCloud({ busy: false, ok: r !== false, msg: r === false ? "Nothing to load from the cloud." : okMsg });
//     }
//     catch (e) { setCloud({ busy: false, ok: false, msg: e.message || "Failed" }); }
//   };
//   const out = menuItems.filter((i) => i.available === false).length;
//   const test = async () => {
//     setCloud({ busy: true, msg: "", ok: true });
//     try {
//       const r = await testCloud();
//       const mine = menuItems.filter((i) => isPhoto(i.image)).length;
//       const notes = [r.dishes === 0 ? "The Sheet is EMPTY: press Save to Cloud." : "", r.photos < mine ? "Some photos in this browser are NOT in the cloud: press Save to Cloud." : "", isDirty() ? "This browser has unsaved changes." : ""].filter(Boolean).join(" ");
//       setCloud({ busy: false, ok: !notes, msg: `Cloud reachable. Sheet holds ${r.dishes} dishes, ${r.photos} uploaded photos. This browser: ${menuItems.length} dishes, ${mine} uploaded photos. ${notes}`.trim() });
//     } catch (e) { setCloud({ busy: false, ok: false, msg: e.message || "Failed" }); }
//   };

//   return (
//     <div className="mx-auto max-w-5xl px-5 pb-32 pt-28 sm:px-8 sm:pt-32">
//       <div className="flex flex-wrap items-end justify-between gap-4">
//         <div>
//           <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Admin panel</p>
//           <h1 className="mt-2 font-serif text-5xl font-semibold text-white">Menu manager</h1>
//           <p className="mt-2 text-sm text-white/55">{menuItems.length} dishes · {categories.length} categories · {out} out of stock · build {BUILD} · cloud {cloudEnabled() ? "ON" : "OFF"}</p>
//         </div>
//         <div className="flex flex-wrap gap-2">
//           <Link to="/menu" className={ghost}><Eye size={15} /> View menu</Link>
//           <button type="button" onClick={onLogout} className={ghost}><LogOut size={15} /> Log out</button>
//         </div>
//       </div>

//       <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1512] p-4">
//         {!cloudEnabled() ? (
//           <span className="inline-flex items-center gap-2 text-sm text-red-400"><AlertTriangle size={16} /> Cloud is OFF: changes stay on this browser only and other visitors will NOT see them.</span>
//         ) : pub.state === "pending" || pub.state === "saving" ? (
//           <span className="inline-flex items-center gap-2 text-sm text-amber-300"><CloudUpload size={16} /> {pub.msg}</span>
//         ) : pub.state === "error" ? (
//           <span className="inline-flex items-center gap-2 text-sm text-red-400"><AlertTriangle size={16} /> {pub.msg}</span>
//         ) : dirty ? (
//           <span className="inline-flex items-center gap-2 text-sm text-amber-300"><AlertTriangle size={16} /> Changes on this browser are not saved to the website yet. Press Save to Cloud.</span>
//         ) : (
//           <span className="inline-flex items-center gap-2 text-sm text-emerald-300"><Check size={16} /> {pub.state === "ok" ? pub.msg : "Same as the live website"}</span>
//         )}
//         <div className="ml-auto flex flex-wrap gap-2">
//           <button type="button" disabled={!cloudEnabled() || cloud.busy} onClick={() => run(() => saveToCloud(pin), "Saved to Google Sheet (photos included). Live for all visitors.")} className={glow}><CloudUpload size={15} className="mr-1.5 inline" />Save to Cloud</button>
//           <button type="button" disabled={cloud.busy} onClick={test} className={ghost}><Check size={15} /> Test cloud</button>
//           <button type="button" disabled={!cloudEnabled() || cloud.busy} onClick={() => window.confirm("Replace local edits with the cloud menu?") && run(() => loadFromCloud({ force: true }), "Loaded from cloud.")} className={ghost}><CloudDownload size={15} /> Load from Cloud</button>
//           <button type="button" onClick={() => window.confirm("Reset the menu to the original defaults?") && resetToDefaults()} className={ghost}><RotateCcw size={15} /> Reset</button>
//         </div>
//         {cloud.msg && <p role="status" className={`w-full text-sm ${cloud.ok ? "text-emerald-300" : "text-red-400"}`}>{cloud.msg}</p>}
//       </div>

//       <div className="mt-6 flex flex-wrap gap-3">
//         <div className="relative min-w-60 flex-1">
//           <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
//           <input className={`${field} !pl-10`} placeholder="Search dishes" aria-label="Search dishes" value={q} onChange={(e) => setQ(e.target.value)} />
//         </div>
//         <button type="button" onClick={() => setShowAdd((s) => !s)} className={glow}><Plus size={15} className="mr-1 inline" /> {showAdd ? "Close" : "Add dish"}</button>
//       </div>
//       {showAdd && <div className="mt-4"><AddDish pin={pin} onDone={() => setShowAdd(false)} /></div>}

//       <div className="mt-10 space-y-12">
//         {groups.map((g) => (
//           <section key={g.id} aria-labelledby={`g-${g.id}`}>
//             <h2 id={`g-${g.id}`} className="mb-4 flex items-baseline gap-3 font-serif text-3xl font-semibold text-white">{g.name}<span className="text-sm font-normal text-white/40">{g.items.length}</span></h2>
//             <div className="grid gap-4 md:grid-cols-2">{g.items.map((it) => <DishEditor key={it.id} item={it} pin={pin} />)}</div>
//           </section>
//         ))}
//         {groups.length === 0 && <p className="py-16 text-center text-white/50">No dishes match “{q}”.</p>}
//       </div>
//     </div>
//   );
// }

// export default function Admin() {
//   usePageTitle("Admin");
//   useEffect(() => {
//     const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex,nofollow";
//     document.head.appendChild(m); return () => m.remove();
//   }, []);
//   const [pin, setPin] = useState(() => { try { return sessionStorage.getItem(SESSION) || ""; } catch { return ""; } });
//   const logout = () => { try { sessionStorage.removeItem(SESSION); } catch { /* ignore */ } setPin(""); };
//   return pin ? <Dashboard pin={pin} onLogout={logout} /> : <Login onOk={setPin} />;
// }



import { useEffect, useMemo, useState } from "react";
import { Lock, LogOut, Plus, Trash2, CloudUpload, CloudDownload, RotateCcw, Search, Check, AlertTriangle, Eye, ImagePlus, ImageOff } from "lucide-react";
import { Link } from "react-router-dom";
import * as siteConfig from "../config/business.js";

const adminConfig = siteConfig.adminConfig || { cloudUrl: "", localPin: "admin123" };
import { usePageTitle } from "../lib/hooks.js";
import SmartImg from "../components/SmartImg.jsx";
import {
  menuItems, categories, useMenuVersion, updateItem, deleteItem, addItem, resetToDefaults, setItemPhoto, removePhoto,
  verifyPin, saveToCloud, loadFromCloud, cloudEnabled, isDirty, testCloud, BUILD, setAdminPin, publishState, isPhoto,
} from "../lib/menuStore.js";

const SESSION = "gc-admin-pin";
const field = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30";
const glow = "rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_24px_-4px_rgba(16,185,129,0.8)] transition hover:bg-emerald-300 disabled:opacity-50";
const ghost = "inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-50";

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

/* ---------------- one dish row ---------------- */
function DishEditor({ item, pin }) {
  const [photo, setPhoto] = useState({ busy: false, step: "", err: "", ok: "" });
  const [broken, setBroken] = useState("");
  useEffect(() => setBroken(""), [item.image]);
  async function pick(e) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setPhoto({ busy: true, step: "Preparing photo…", err: "", ok: "" });
    try {
      const r = await setItemPhoto(item.id, file, pin, (step) => setPhoto((p) => ({ ...p, step })));
      setPhoto({ busy: false, step: "", err: "", ok: r.published ? "Live on the website ✓" : "Saved on this browser only" });
    } catch (x) { setPhoto({ busy: false, step: "", err: x.message || "Upload failed", ok: "" }); }
  }
  async function drop() {
    setPhoto({ busy: true, step: "Removing…", err: "", ok: "" });
    try { await removePhoto(item.id, pin); setPhoto({ busy: false, step: "", err: "", ok: "Photo removed" }); }
    catch (x) { setPhoto({ busy: false, step: "", err: x.message || "Failed", ok: "" }); }
  }
  const [d, setD] = useState({ name: item.name, price: String(item.price), desc: item.desc });
  useEffect(() => setD({ name: item.name, price: String(item.price), desc: item.desc }), [item.name, item.price, item.desc]);
  const commit = () => {
    const price = Math.round(Number(d.price));
    if (!d.name.trim() || !Number.isFinite(price) || price < 0) return setD({ name: item.name, price: String(item.price), desc: item.desc });
    if (d.name.trim() !== item.name || price !== item.price || d.desc.trim() !== item.desc) updateItem(item.id, { name: d.name.trim(), price, desc: d.desc.trim() });
  };
  const key = (e) => e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.blur();
  const out = item.available === false;
  return (
    <div className={`rounded-2xl border bg-[#101916] p-4 transition ${out ? "border-red-400/25" : "border-white/10 hover:border-emerald-400/30"}`}>
      <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
        <div>
          <label className="mb-1 block text-[0.65rem] uppercase tracking-widest text-white/40" htmlFor={`n-${item.id}`}>Dish name</label>
          <input id={`n-${item.id}`} className={field} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} onBlur={commit} onKeyDown={key} maxLength={80} />
        </div>
        <div>
          <label className="mb-1 block text-[0.65rem] uppercase tracking-widest text-white/40" htmlFor={`p-${item.id}`}>Price (₹)</label>
          <input id={`p-${item.id}`} className={field} inputMode="numeric" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value.replace(/\D/g, "") })} onBlur={commit} onKeyDown={key} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="grid aspect-[4/3] w-28 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-white/30">
          {item.image && !broken ? <SmartImg src={item.image} alt={`${item.name} photo`} onGiveUp={(why) => setBroken(why || "The photo link does not open.")} className="h-full w-full object-cover" /> : <ImageOff size={20} />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <label className={`${ghost} cursor-pointer !px-3 !py-1.5 text-xs ${photo.busy ? "pointer-events-none opacity-50" : ""}`}>
              <ImagePlus size={14} /> {photo.busy ? "Please wait…" : item.image ? "Change photo" : "Add photo"}
              <input type="file" accept="image/*" className="sr-only" onChange={pick} disabled={photo.busy} aria-label={`Photo for ${item.name}`} />
            </label>
            {item.image && !photo.busy && <button type="button" onClick={drop} className="rounded-full px-3 py-1.5 text-xs text-white/45 hover:text-red-300">Remove</button>}
          </div>
          {photo.busy && <p role="status" className="mt-1 text-xs text-amber-300">{photo.step}</p>}
          {photo.ok && !photo.busy && <p role="status" className="mt-1 text-xs text-emerald-300">{photo.ok}</p>}
          {photo.err && <p role="alert" className="mt-1 text-xs text-red-400">{photo.err}</p>}
          {broken && <p role="alert" className="mt-1 text-xs text-red-400">Photo is saved but cannot be shown. {broken}</p>}
          <p className="mt-1 text-[0.65rem] text-white/30">Auto-cropped to 4:3 for the menu</p>
        </div>
      </div>
      <label className="mb-1 mt-3 block text-[0.65rem] uppercase tracking-widest text-white/40" htmlFor={`d-${item.id}`}>Description</label>
      <textarea id={`d-${item.id}`} rows={2} className={field} value={d.desc} onChange={(e) => setD({ ...d, desc: e.target.value })} onBlur={commit} maxLength={240} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" role="switch" aria-checked={!out} onClick={() => updateItem(item.id, { available: out })}
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${out ? "border-red-400/40 bg-red-400/10 text-red-300" : "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"}`}>
          {out ? "Out of stock" : "In stock"}
        </button>
        <button type="button" aria-pressed={item.veg} onClick={() => updateItem(item.id, { veg: !item.veg })}
          className="rounded-full border border-white/15 px-4 py-1.5 text-xs uppercase tracking-widest text-white/70 hover:border-emerald-400">
          {item.veg ? "🟢 Veg" : "🔴 Non-veg"}
        </button>
        <button type="button" onClick={() => window.confirm(`Delete "${item.name}"?`) && deleteItem(item.id)} aria-label={`Delete ${item.name}`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs uppercase tracking-widest text-white/45 hover:bg-red-400/10 hover:text-red-300">
          <Trash2 size={14} /> Delete
        </button>
      </div>
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

/* ---------------- dashboard ---------------- */
function Dashboard({ pin, onLogout }) {
  const mv = useMenuVersion();
  const [q, setQ] = useState("");
  const [selectedCat, setSelectedCat] = useState("all"); // <-- Category filter state add kiya hai
  const [showAdd, setShowAdd] = useState(false);
  const [cloud, setCloud] = useState({ busy: false, msg: "", ok: true });
  const dirty = useMemo(() => isDirty(), [mv, cloud]); // eslint-disable-line react-hooks/exhaustive-deps
  const pub = publishState();

  useEffect(() => {
    setAdminPin(pin);
    if (cloudEnabled() && !isDirty()) loadFromCloud({ force: true });
  }, [pin]);

  const groups = useMemo(() => {
    const n = q.trim().toLowerCase();
    return categories
      .filter((c) => selectedCat === "all" || c.id === selectedCat || c.name === selectedCat) // <-- Category wise filtering logic
      .map((c) => ({
        ...c,
        items: menuItems.filter((i) => i.categoryId === c.id && (!n || `${i.name} ${i.desc}`.toLowerCase().includes(n))),
      }))
      .filter((g) => g.items.length);
  }, [q, selectedCat, mv]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const out = menuItems.filter((i) => i.available === false).length;
  const test = async () => {
    setCloud({ busy: true, msg: "", ok: true });
    try {
      const r = await testCloud();
      const mine = menuItems.filter((i) => isPhoto(i.image)).length;
      const notes = [r.dishes === 0 ? "The Sheet is EMPTY: press Save to Cloud." : "", r.photos < mine ? "Some photos in this browser are NOT in the cloud: press Save to Cloud." : "", isDirty() ? "This browser has unsaved changes." : ""].filter(Boolean).join(" ");
      setCloud({ busy: false, ok: !notes, msg: `Cloud reachable. Sheet holds ${r.dishes} dishes, ${r.photos} uploaded photos. This browser: ${menuItems.length} dishes, ${mine} uploaded photos. ${notes}`.trim() });
    } catch (e) { setCloud({ busy: false, ok: false, msg: e.message || "Failed" }); }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pb-32 pt-28 sm:px-8 sm:pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Admin panel</p>
          <h1 className="mt-2 font-serif text-5xl font-semibold text-white">Menu manager</h1>
          <p className="mt-2 text-sm text-white/55">{menuItems.length} dishes · {categories.length} categories · {out} out of stock · build {BUILD} · cloud {cloudEnabled() ? "ON" : "OFF"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/menu" className={ghost}><Eye size={15} /> View menu</Link>
          <button type="button" onClick={onLogout} className={ghost}><LogOut size={15} /> Log out</button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1512] p-4">
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

      <div className="mt-6 flex flex-wrap gap-3">
        {/* Search Input */}
        <div className="relative min-w-60 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input className={`${field} !pl-10`} placeholder="Search dishes" aria-label="Search dishes" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {/* Category Filter Dropdown */}
        <div className="w-full sm:w-auto">
          <select 
            className={field} 
            aria-label="Filter by category" 
            value={selectedCat} 
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="all" className="bg-[#0d1512]">📂 All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#0d1512]">{c.name}</option>
            ))}
          </select>
        </div>

        <button type="button" onClick={() => setShowAdd((s) => !s)} className={glow}><Plus size={15} className="mr-1 inline" /> {showAdd ? "Close" : "Add dish"}</button>
      </div>
      {showAdd && <div className="mt-4"><AddDish pin={pin} onDone={() => setShowAdd(false)} /></div>}

      <div className="mt-10 space-y-12">
        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`}>
            <h2 id={`g-${g.id}`} className="mb-4 flex items-baseline gap-3 font-serif text-3xl font-semibold text-white">{g.name}<span className="text-sm font-normal text-white/40">{g.items.length}</span></h2>
            <div className="grid gap-4 md:grid-cols-2">{g.items.map((it) => <DishEditor key={it.id} item={it} pin={pin} />)}</div>
          </section>
        ))}
        {groups.length === 0 && <p className="py-16 text-center text-white/50">No dishes match your filter / search.</p>}
      </div>
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