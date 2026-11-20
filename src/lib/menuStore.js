// /**
//  * Live menu store. Single source of truth for the website AND the admin panel.
//  * - Default data lives in src/data/menu.js
//  * - Edits are saved to localStorage instantly (this browser)
//  * - "Save to Cloud" pushes to a Google Sheet through a Google Apps Script; every visitor loads it from there.
//  *
//  * FIRST-VISIT FIX: when this browser has no saved copy yet, the menu page shows a loader
//  * (see useMenuReady) instead of the small built-in default menu, so visitors never see a
//  * wrong dish count that jumps after a refresh.
//  */
// import { useSyncExternalStore } from "react";
// import { defaultMenu, featuredIds as defaultFeatured } from "../data/menu.js";
// import { slugify } from "./format.js";
// import * as siteConfig from "../config/business.js";

// // Safe even if business.js is an older copy without adminConfig (falls back to local-only mode)
// const adminConfig = siteConfig.adminConfig || { cloudUrl: "", localPin: "admin123" };

// // Full menu baked in at build time by scripts/snapshot-menu.mjs. Optional: the app still works if the file is missing.
// const snapshotFiles = import.meta.glob("../data/menu.snapshot.json", { eager: true, import: "default" });
// const snapshot = Object.values(snapshotFiles)[0] || null;

// const KEY = "greenchilly-menu-v3"; // v3: older browsers may hold a stale 44-dish copy under v2, so it is ignored
// const SNAP_KEY = "greenchilly-menu-snap"; // which build snapshot this browser's saved copy belongs to
// const IMG_BASE = "/menu-img/"; // dish photos baked in at build time (see scripts/snapshot-menu.mjs)
// const CAT_PHOTOS_KEY = "greenchilly-category-photos-v1"; // Separate storage for category images
// const COUNT_KEY = "greenchilly-menu-count"; // last known dish count (used by the loader text)
// const DIRTY = "greenchilly-menu-dirty"; // local edits not yet pushed to cloud
// const REV = "greenchilly-menu-rev";     // which cloud version this browser's copy is based on

// const getRev = () => { try { return localStorage.getItem(REV) || ""; } catch { return ""; } };
// const setRev = (v) => { try { localStorage.setItem(REV, String(v ?? "")); } catch { /* ignore */ } };
// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// const defaultById = Object.fromEntries(defaultMenu.map((i) => [i.id, i]));

// export const featuredIds = defaultFeatured;
// export let menuItems = [];
// export let menuById = {};
// export let categories = [];
// export let categoryPhotos = {}; // Store category-level images separately

// let version = 0;
// const listeners = new Set();

// /** A photo is accepted only if it is an https URL (cloud/Drive) or an inline image (local-only mode). */
// const validImage = (v) => {
//   const s = typeof v === "string" ? v.trim() : "";
//   if (s.startsWith(IMG_BASE) && !s.includes("..")) return s;
//   return /^https:\/\//i.test(s) || /^data:image\/(jpeg|png|webp);base64,/i.test(s) ? s : "";
// };

// // Read saved category photos from localStorage
// function readCategoryPhotos() {
//   try {
//     return JSON.parse(localStorage.getItem(CAT_PHOTOS_KEY)) || {};
//   } catch {
//     return {};
//   }
// }
// categoryPhotos = readCategoryPhotos();

// /** Category photos travel inside the same Sheet as hidden rows (id starts with this prefix), so no script change is needed. */
// const CAT_ROW = "__cat__";
// const isCatRow = (r) => String(r?.id ?? "").startsWith(CAT_ROW);

// /** Pull category photos out of raw cloud rows: { categoryId: photo } */
// function extractCategoryPhotos(raw) {
//   const out = {};
//   if (!Array.isArray(raw)) return out;
//   for (const r of raw) {
//     if (!isCatRow(r)) continue;
//     const img = validImage(r?.image);
//     const cid = String(r.id).slice(CAT_ROW.length);
//     if (img && cid) out[cid] = img;
//   }
//   return out;
// }

// /** Keep only safe, known fields. A dish photo is the uploaded one if present, else the one bundled in code. */
// function clean(raw) {
//   if (!Array.isArray(raw)) return null;
//   const seen = new Set();
//   const out = [];
//   for (const r of raw) {
//     if (isCatRow(r)) continue; // hidden category-photo rows are not dishes
//     const name = String(r?.name ?? "").trim().slice(0, 80);
//     const category = String(r?.category ?? "").trim().slice(0, 60);
//     const price = Math.round(Number(r?.price));
//     if (!name || !category || !Number.isFinite(price) || price < 0 || price > 100000) continue;
//     let id = String(r?.id || slugify(name));
//     while (seen.has(id)) id += "-2";
//     seen.add(id);
//     out.push({
//       id, name, category, categoryId: slugify(category), price,
//       veg: r?.veg === true || r?.veg === "TRUE" || r?.veg === "true",
//       desc: String(r?.desc ?? "").trim().slice(0, 240),
//       available: !(r?.available === false || r?.available === "FALSE" || r?.available === "false"),
//       image: validImage(r?.image) || defaultById[id]?.image,
//     });
//   }
//   return out.length ? out : null;
// }

// function derive(items) {
//   menuItems = items;
//   menuById = Object.fromEntries(items.map((i) => [i.id, i]));
//   const map = new Map();
//   for (const it of items) {
//     if (!map.has(it.categoryId)) {
//       map.set(it.categoryId, {
//         id: it.categoryId,
//         name: it.category,
//         count: 0,
//         from: Infinity,
//         image: categoryPhotos[it.categoryId] || null // Attach category image if available
//       });
//     }
//     const c = map.get(it.categoryId);
//     c.count++; c.from = Math.min(c.from, it.price);
//   }
//   categories = [...map.values()];
// }

// function readLocal() {
//   try { return clean(JSON.parse(localStorage.getItem(KEY))); } catch { return null; }
// }
// const dirtyNow = () => { try { return localStorage.getItem(DIRTY) === "1"; } catch { return false; } };
// const snapItems = snapshot ? clean(snapshot.items) : null;
// const snapSig = snapshot?.sig ? String(snapshot.sig) : "";
// const snapCats = snapshot?.categoryPhotos && typeof snapshot.categoryPhotos === "object"
//   ? Object.fromEntries(Object.entries(snapshot.categoryPhotos).filter(([k, v]) => k && validImage(v)))
//   : {};
// const getSnapSig = () => { try { return localStorage.getItem(SNAP_KEY) || ""; } catch { return ""; } };
// const setSnapSig = (v) => { try { localStorage.setItem(SNAP_KEY, v); } catch { /* ignore */ } };

// let savedCopy = readLocal();
// // A new deploy ships fresher data than an old browser copy, so drop the old copy (unless it has unpublished admin edits).
// if (savedCopy && snapItems && !dirtyNow() && getSnapSig() !== snapSig) savedCopy = null;
// if (!savedCopy && snapItems) {
//   setSnapSig(snapSig);
//   if (!dirtyNow() && snapshot.rev) setRev(snapshot.rev);
// }
// if (snapItems && !Object.keys(categoryPhotos).length) categoryPhotos = snapCats;
// // Never fall back to the small built-in menu when a full snapshot exists.
// derive(savedCopy || snapItems || defaultMenu);

// /* ---------------- "ready" state: stops the 44 -> 269 flash ---------------- */
// // Ready immediately if this browser already has a saved menu, or if there is no cloud to wait for.
// // Otherwise the menu page shows the loader until the cloud answers (or finally gives up).
// let ready = Boolean(savedCopy) || Boolean(snapItems) || !adminConfig.cloudUrl;

// function commit(items, { persist = true } = {}) {
//   derive(items);
//   version++;
//   if (persist) {
//     try {
//       localStorage.setItem(KEY, JSON.stringify(items.map(({ image, ...rest }) => (image && image !== defaultById[rest.id]?.image ? { ...rest, image } : rest))));
//     } catch { /* storage full/blocked */ }
//     try { localStorage.setItem(COUNT_KEY, String(items.length)); } catch { /* ignore */ }
//     if (snapSig) setSnapSig(snapSig);
//   }
//   listeners.forEach((l) => l());
// }

// const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

// const markReady = () => {
//   if (ready) return;
//   ready = true;
//   listeners.forEach((l) => l());
// };

// /** Call once at the top of any page/component that renders menu data so it re-renders on change. */
// export const useMenuVersion = () => useSyncExternalStore(subscribe, () => version);

// /** true once the real menu is available (cache, cloud, or cloud gave up). Show a loader while false. */
// export const useMenuReady = () => useSyncExternalStore(subscribe, () => ready);

// // Admin tab and Menu tab share one browser: when one saves, the other updates at once (no refresh needed).
// if (typeof window !== "undefined") {
//   window.addEventListener("storage", (e) => {
//     if (e.key === KEY) {
//       const items = readLocal();
//       if (!items) return;
//       derive(items); version++;
//       markReady();
//       listeners.forEach((l) => l());
//     } else if (e.key === CAT_PHOTOS_KEY) {
//       categoryPhotos = readCategoryPhotos();
//       derive(menuItems); version++;
//       listeners.forEach((l) => l());
//     }
//   });
// }

// /* ---------------- admin actions ---------------- */
// const markDirty = (v) => {
//   const was = isDirty();
//   try { v ? localStorage.setItem(DIRTY, "1") : localStorage.removeItem(DIRTY); } catch { /* ignore */ }
//   if (was !== Boolean(v)) { version++; listeners.forEach((l) => l()); }
// };
// export const isDirty = () => { try { return localStorage.getItem(DIRTY) === "1"; } catch { return false; } };

// export function saveItems(items, { publish = true } = {}) { commit(clean(items) || []); markDirty(true); markReady(); if (publish) schedulePublish(); }
// export function updateItem(id, patch, opts) { saveItems(menuItems.map((i) => (i.id === id ? { ...i, ...patch } : i)), opts); }
// export function deleteItem(id) { saveItems(menuItems.filter((i) => i.id !== id)); }
// export function addItem({ name, category, price, veg, desc }) {
//   let id = slugify(name), n = 2;
//   while (menuById[id]) id = `${slugify(name)}-${n++}`;
//   saveItems([...menuItems, { id, name, category, price, veg, desc, available: true }]);
//   return id;
// }

// /** A category exists as soon as a dish uses it, so nothing extra is added here (old version created a fake "X Special" dish). */
// export function addCategory(categoryName) {
//   const category = String(categoryName || "").trim();
//   return category ? slugify(category) : "";
// }

// /** Updates all items belonging to a specific category or renames the category */
// export function setCategory(oldCategoryName, newCategoryName) {
//   const oldCat = String(oldCategoryName || "").trim();
//   const newCat = String(newCategoryName || "").trim();
//   if (!oldCat || !newCat) return;

//   const updated = menuItems.map((item) => {
//     if (item.category.toLowerCase() === oldCat.toLowerCase() || item.categoryId === slugify(oldCat)) {
//       return {
//         ...item,
//         category: newCat,
//         categoryId: slugify(newCat)
//       };
//     }
//     return item;
//   });

//   saveItems(updated);
// }

// export function resetToDefaults() {
//   try { localStorage.removeItem(CAT_PHOTOS_KEY); } catch {}
//   categoryPhotos = {};
//   commit(defaultMenu);
//   markDirty(true);
//   schedulePublish();
// }

// /* ---------------- auto-publish (admin edits go live for everyone) ---------------- */
// let adminPin = "";
// export const setAdminPin = (p) => { adminPin = p || ""; if (adminPin && !isDirty()) loadFromCloud({ force: true }); };
// let pub = { state: "idle", msg: "" };
// export const publishState = () => pub;
// const setPub = (state, msg) => { pub = { state, msg }; version++; listeners.forEach((l) => l()); };

// let pubTimer = null, publishing = false, again = false;
// function schedulePublish() {
//   if (!cloudEnabled() || !adminPin) return;
//   setPub("pending", "Saving to website…");
//   clearTimeout(pubTimer);
//   pubTimer = setTimeout(publishNow, 900);
// }
// export async function publishNow() {
//   if (!cloudEnabled() || !adminPin) return;
//   if (publishing) { again = true; return; }
//   publishing = true;
//   setPub("saving", "Saving to website…");
//   try {
//     const r = await saveToCloud(adminPin);
//     const lost = r.livePhotos < r.sentPhotos || r.liveDishes < r.sentDishes;
//     setPub(lost ? "error" : "ok", lost ? "The cloud did not keep everything. Redeploy the Apps Script (New version) with the latest apps-script.gs." : `Live for all visitors ✓ (${r.liveDishes} dishes, ${r.livePhotos} photos)`);
//   } catch (e) { setPub("error", e.message || "Could not save to the cloud"); }
//   publishing = false;
//   if (again) { again = false; publishNow(); }
// }

// /* ---------------- photos ---------------- */
// async function loadBitmap(file) {
//   if (typeof createImageBitmap === "function") {
//     try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch { /* fall back to <img> */ }
//   }
//   return new Promise((resolve, reject) => {
//     const url = URL.createObjectURL(file);
//     const img = new Image();
//     img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
//     img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that image. Try a JPG or PNG.")); };
//     img.src = url;
//   });
// }

// const PHOTO_LIMIT = 44000;
// export const isPhoto = (v) => /^https:\/\//i.test(String(v || "")) || /^data:image\/jpeg;base64,/.test(String(v || "")) || String(v || "").startsWith(IMG_BASE);

// async function compressToFit(file) {
//   const bmp = await loadBitmap(file);
//   const sw0 = bmp.width || bmp.naturalWidth, sh0 = bmp.height || bmp.naturalHeight;
//   let sw = sw0, sh = sw0 * 0.75;
//   if (sh > sh0) { sh = sh0; sw = sh0 / 0.75; }
//   const sx = (sw0 - sw) / 2, sy = (sh0 - sh) / 2;
//   try {
//     for (const width of [560, 480, 420, 360, 300, 240]) {
//       const w = Math.round(Math.min(width, sw)), h = Math.round(w * 0.75);
//       const c = document.createElement("canvas");
//       c.width = w; c.height = h;
//       const g = c.getContext("2d");
//       g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
//       g.imageSmoothingQuality = "high";
//       g.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
//       for (const q of [0.72, 0.62, 0.52, 0.42, 0.32]) {
//         const url = c.toDataURL("image/jpeg", q);
//         if (url.length <= PHOTO_LIMIT) return url;
//       }
//     }
//   } finally { bmp.close?.(); }
//   throw new Error("This photo is too detailed to store. Please try a simpler or smaller picture.");
// }

// export async function setItemPhoto(id, file, pin, onStep = () => {}) {
//   if (!file || !/^image\//.test(file.type)) throw new Error("Please choose an image file (JPG, PNG or WebP).");
//   if (file.size > 25 * 1024 * 1024) throw new Error("Image is too large (max 25 MB).");
//   onStep("Preparing photo…");
//   const image = await compressToFit(file);
//   updateItem(id, { image }, { publish: false });
//   if (!cloudEnabled()) return { published: false };
//   onStep("Publishing to the website…");
//   let r;
//   try { r = await saveToCloud(pin); }
//   catch (e) { throw new Error(`Photo saved here but NOT published yet (${e.message}). Press "Save to Cloud".`); }
//   if (r.livePhotos < r.sentPhotos) throw new Error('The cloud did not keep the photo. Press "Save to Cloud" again.');
//   return { published: true };
// }

// // Category photo is saved independently in categoryPhotos map without touching individual dish images
// export async function setCategoryPhoto(categoryId, file, pin, onStep = () => {}) {
//   const targetId = String(categoryId || "").trim().toLowerCase();
//   if (!targetId) return { published: false };
//   if (!file || !/^image\//.test(file.type)) throw new Error("Please choose an image file (JPG, PNG or WebP).");
//   if (file.size > 25 * 1024 * 1024) throw new Error("Image is too large (max 25 MB).");

//   onStep("Preparing category photo…");
//   const image = await compressToFit(file);

//   categoryPhotos[targetId] = image;
//   try {
//     localStorage.setItem(CAT_PHOTOS_KEY, JSON.stringify(categoryPhotos));
//   } catch { /* storage full */ }

//   derive(menuItems);
//   version++;
//   listeners.forEach((l) => l());

//   if (!cloudEnabled()) return { published: false };

//   onStep("Publishing to the website…");
//   try {
//     await saveToCloud(pin);
//   } catch (e) {
//     markDirty(true);
//     throw new Error(`Category photo saved locally but NOT published yet (${e.message}). Press "Save to Cloud".`);
//   }
//   return { published: true };
// }

// export async function removePhoto(id, pin) {
//   updateItem(id, { image: undefined }, { publish: false });
//   if (cloudEnabled()) await saveToCloud(pin);
// }

// // Remove only category photo mapping
// export async function removeCategoryPhoto(categoryId, pin) {
//   const targetId = String(categoryId || "").trim().toLowerCase();
//   if (!targetId) return;

//   delete categoryPhotos[targetId];
//   try {
//     localStorage.setItem(CAT_PHOTOS_KEY, JSON.stringify(categoryPhotos));
//   } catch {}

//   derive(menuItems);
//   version++;
//   listeners.forEach((l) => l());

//   if (cloudEnabled() && pin) {
//     await saveToCloud(pin);
//   }
// }

// /* ---------------- cloud (Google Apps Script) ---------------- */
// const withTimeout = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

// async function fetchMenu(timeout) {
//   const url = adminConfig.cloudUrl;
//   const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}action=menu&_=${Date.now()}`, { signal: withTimeout(timeout) });
//   const data = await res.json();
//   if (!data || data.ok === false) throw new Error("bad answer");
//   return data;
// }

// let loadingCloud = false;
// export async function loadFromCloud({ force = false } = {}) {
//   const url = adminConfig.cloudUrl;
//   if (!url || (!force && (isDirty() || loadingCloud))) return false;
//   loadingCloud = true;
//   try {
//     let data = null;
//     // Shorter waits than before: a visitor should never stare at a loader for 30+ seconds.
//     const waits = [8000, 10000, 15000];
//     for (let i = 0; i < waits.length && !data; i++) {
//       try { data = await fetchMenu(waits[i]); } catch { if (i < waits.length - 1) await sleep(800 * (i + 1)); }
//     }
//     if (!data) return false;
//     if (!force && isDirty()) return false;
//     // Same version as this copy: nothing to compare, nothing to re-render, nothing to save.
//     if (!force && data.rev && String(data.rev) === getRev()) return true;
//     const items = clean(data.items);
//     if (!items) return false;
//     setRev(data.rev || "");
//     const cloudCats = extractCategoryPhotos(data.items);
//     // Cloud is the truth once it has any category photo; before that keep what this browser already has.
//     if (Object.keys(cloudCats).length && JSON.stringify(cloudCats) !== JSON.stringify(categoryPhotos)) {
//       categoryPhotos = cloudCats;
//       try { localStorage.setItem(CAT_PHOTOS_KEY, JSON.stringify(categoryPhotos)); } catch { /* ignore */ }
//       derive(menuItems); version++; listeners.forEach((l) => l());
//     }
//     // Always save the first cloud copy so the next visit is instant, even if it equals what is on screen.
//     if (JSON.stringify(items) !== JSON.stringify(menuItems) || !readLocal()) commit(items);
//     markDirty(false);
//     return true;
//   } finally { loadingCloud = false; markReady(); }
// }

// export const driveId = (url) => (/^https:\/\/lh3\.googleusercontent\.com\/d\/([A-Za-z0-9_-]+)/.exec(String(url || "")) || [])[1] || "";
// const photoCache = new Map();
// let photoWhy = "";
// export const photoProblem = () => photoWhy;

// export async function fetchDrivePhoto(id) {
//   photoWhy = "";
//   if (photoCache.has(id)) return photoCache.get(id);
//   const ck = `gc-photo-${id}`;
//   try { const c = sessionStorage.getItem(ck); if (c) { photoCache.set(id, c); return c; } } catch { /* ignore */ }
//   const url = adminConfig.cloudUrl;
//   if (!url) { photoWhy = "Cloud URL is empty in business.js."; return ""; }
//   let data;
//   try {
//     const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}action=img&id=${encodeURIComponent(id)}`, { signal: withTimeout(40000) });
//     data = await res.json();
//   } catch { photoWhy = "The Google script did not answer. Deploy it again."; return ""; }
//   if (data?.ok && /^data:image\/(jpeg|png|webp);base64,/.test(data.data || "")) {
//     photoCache.set(id, data.data);
//     try { sessionStorage.setItem(ck, data.data); } catch { /* ignore */ }
//     return data.data;
//   }
//   if (data?.ok) photoWhy = "The Google script is still the OLD one (no photo support).";
//   else if (data?.error === "not a menu photo") photoWhy = "That file is not inside the Drive folder.";
//   else if (data?.error === "not found") photoWhy = "The script cannot find that file in Drive.";
//   else photoWhy = `The script said: ${data?.error || "unknown error"}.`;
//   return "";
// }

// const CLOUD_HELP = "Cannot reach your Google script. Check deployment settings (Who has access = Anyone, New version).";
// async function post(body) {
//   let res;
//   try {
//     res = await fetch(adminConfig.cloudUrl, {
//       method: "POST",
//       headers: { "Content-Type": "text/plain;charset=utf-8" },
//       body: JSON.stringify(body),
//       signal: withTimeout(30000),
//     });
//   } catch { throw new Error(CLOUD_HELP); }
//   try { return await res.json(); } catch { throw new Error(CLOUD_HELP); }
// }

// export const cloudEnabled = () => Boolean(adminConfig.cloudUrl);
// export const BUILD = "sticky-v12-snapshot";

// export async function testCloud() {
//   const url = adminConfig.cloudUrl;
//   if (!url) throw new Error("Cloud URL is EMPTY in business.js.");
//   let res;
//   try { res = await fetch(`${url}${url.includes("?") ? "&" : "?"}action=menu&_=${Date.now()}`, { signal: withTimeout(15000) }); }
//   catch { throw new Error(CLOUD_HELP); }
//   let data;
//   try { data = await res.json(); } catch { throw new Error("The script answered with a web page instead of data. " + CLOUD_HELP); }
//   const items = (Array.isArray(data?.items) ? data.items : []).filter((r) => !isCatRow(r));
//   return { dishes: items.length, photos: items.filter((r) => isPhoto(r.image)).length };
// }

// export async function verifyPin(pin) {
//   if (!cloudEnabled()) return pin === adminConfig.localPin;
//   return (await post({ action: "auth", key: pin })).ok === true;
// }

// let saveChain = Promise.resolve();
// export function saveToCloud(pin) {
//   const run = saveChain.then(() => saveToCloudNow(pin), () => saveToCloudNow(pin));
//   saveChain = run.catch(() => {});
//   return run;
// }

// /** Baked photos live as files; the cloud stores photo data, so read the file back before saving (never lose a photo). */
// async function inlineLocalPhoto(image) {
//   if (typeof image !== "string" || !image.startsWith(IMG_BASE)) return image;
//   const res = await fetch(image.split("?")[0]);
//   if (!res.ok) throw new Error("Could not read a saved photo. Please refresh the page and try again.");
//   const blob = await res.blob();
//   return new Promise((resolve, reject) => {
//     const fr = new FileReader();
//     fr.onload = () => resolve(String(fr.result));
//     fr.onerror = () => reject(new Error("Could not read a saved photo. Please refresh the page and try again."));
//     fr.readAsDataURL(blob);
//   });
// }

// async function saveToCloudNow(pin) {
//   const rows = await Promise.all(menuItems.map(async ({ image, categoryId, ...r }) => {
//     const img = await inlineLocalPhoto(image);
//     return { ...r, image: isPhoto(img) && String(img).length <= 48000 ? img : "" };
//   }));
//   if (!rows.length) throw new Error("The menu is empty, so nothing was saved.");
//   // hidden rows that carry the category photos (only for categories that still have dishes)
//   const liveCats = new Set(menuItems.map((i) => i.categoryId));
//   for (const [cid, rawImg] of Object.entries(categoryPhotos)) {
//     const img = await inlineLocalPhoto(rawImg);
//     if (liveCats.has(cid) && isPhoto(img) && String(img).length <= 48000) {
//       const cat = menuItems.find((i) => i.categoryId === cid);
//       rows.push({ id: CAT_ROW + cid, name: "Category photo", category: cat.category, price: 0, veg: true, desc: "", available: false, image: img });
//     }
//   }
//   const data = await post({ action: "save", key: pin, baseRev: getRev(), items: rows });
//   if (!data.ok) throw new Error(data.error || "Cloud save failed");
//   setRev(data.rev || "");
//   markDirty(false);
//   let back;
//   try {
//     const url = adminConfig.cloudUrl;
//     back = await (await fetch(`${url}${url.includes("?") ? "&" : "?"}action=menu&_=${Date.now()}`, { signal: withTimeout(15000) })).json();
//   } catch { throw new Error("Saved, but could not read the menu back from the cloud."); }
//   const live = Array.isArray(back?.items) ? back.items : [];
//   return {
//     sentDishes: rows.length, sentPhotos: rows.filter((r) => r.image).length,
//     liveDishes: live.length, livePhotos: live.filter((r) => isPhoto(r.image)).length,
//   };
// }

// if (typeof window !== "undefined") {
//   // If the first try fails (bad network), try once more quickly instead of waiting 3 minutes.
//   const boot = () => loadFromCloud().then((ok) => { if (!ok && !isDirty()) setTimeout(() => loadFromCloud(), 4000); });
//   if (ready) {
//     // The menu is already on screen: check the cloud quietly after the page has settled.
//     if (window.requestIdleCallback) window.requestIdleCallback(boot, { timeout: 4000 });
//     else setTimeout(boot, 1500);
//   } else boot();
//   const refresh = () => { if (document.visibilityState === "visible") loadFromCloud(); };
//   document.addEventListener("visibilitychange", refresh);
//   setInterval(refresh, 180000);
// }




/**
 * Live menu store. Single source of truth for the website AND the admin panel.
 * - Default data lives in src/data/menu.js
 * - Edits are saved to localStorage instantly (this browser)
 * - "Save to Cloud" pushes to a Google Sheet through a Google Apps Script; every visitor loads it from there.
 *
 * FIRST-VISIT FIX: when this browser has no saved copy yet, the menu page shows a loader
 * (see useMenuReady) instead of the small built-in default menu, so visitors never see a
 * wrong dish count that jumps after a refresh.
 */
import { useSyncExternalStore } from "react";
import { defaultMenu, featuredIds as defaultFeatured } from "../data/menu.js";
import { slugify } from "./format.js";
import * as siteConfig from "../config/business.js";

// Safe even if business.js is an older copy without adminConfig (falls back to local-only mode)
const adminConfig = siteConfig.adminConfig || { cloudUrl: "", localPin: "admin123" };

// Full menu baked in at build time by scripts/snapshot-menu.mjs. Optional: the app still works if the file is missing.
const snapshotFiles = import.meta.glob("../data/menu.snapshot.json", { eager: true, import: "default" });
const snapshot = Object.values(snapshotFiles)[0] || null;

const KEY = "greenchilly-menu-v3"; // v3: older browsers may hold a stale 44-dish copy under v2, so it is ignored
const SNAP_KEY = "greenchilly-menu-snap"; // which build snapshot this browser's saved copy belongs to
const IMG_BASE = "/menu-img/"; // dish photos baked in at build time (see scripts/snapshot-menu.mjs)
const CAT_PHOTOS_KEY = "greenchilly-category-photos-v1"; // Separate storage for category images
const COUNT_KEY = "greenchilly-menu-count"; // last known dish count (used by the loader text)
const DIRTY = "greenchilly-menu-dirty"; // local edits not yet pushed to cloud
const REV = "greenchilly-menu-rev";     // which cloud version this browser's copy is based on

const getRev = () => { try { return localStorage.getItem(REV) || ""; } catch { return ""; } };
const setRev = (v) => { try { localStorage.setItem(REV, String(v ?? "")); } catch { /* ignore */ } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const defaultById = Object.fromEntries(defaultMenu.map((i) => [i.id, i]));

export const featuredIds = defaultFeatured;
export let menuItems = [];
export let menuById = {};
export let categories = [];
export let categoryPhotos = {}; // Store category-level images separately

let version = 0;
const listeners = new Set();

/** A photo is accepted only if it is an https URL (cloud/Drive) or an inline image (local-only mode). */
const validImage = (v) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (s.startsWith(IMG_BASE) && !s.includes("..")) return s;
  return /^https:\/\//i.test(s) || /^data:image\/(jpeg|png|webp);base64,/i.test(s) ? s : "";
};

// Read saved category photos from localStorage
function readCategoryPhotos() {
  try {
    return JSON.parse(localStorage.getItem(CAT_PHOTOS_KEY)) || {};
  } catch {
    return {};
  }
}
categoryPhotos = readCategoryPhotos();

/** Category photos travel inside the same Sheet as hidden rows (id starts with this prefix), so no script change is needed. */
const CAT_ROW = "__cat__";
const isCatRow = (r) => String(r?.id ?? "").startsWith(CAT_ROW);

/** Pull category photos out of raw cloud rows: { categoryId: photo } */
function extractCategoryPhotos(raw) {
  const out = {};
  if (!Array.isArray(raw)) return out;
  for (const r of raw) {
    if (!isCatRow(r)) continue;
    const img = validImage(r?.image);
    const cid = String(r.id).slice(CAT_ROW.length);
    if (img && cid) out[cid] = img;
  }
  return out;
}

/** Keep only safe, known fields. A dish photo is the uploaded one if present, else the one bundled in code. */
function clean(raw) {
  if (!Array.isArray(raw)) return null;
  const seen = new Set();
  const out = [];
  for (const r of raw) {
    if (isCatRow(r)) continue; // hidden category-photo rows are not dishes
    const name = String(r?.name ?? "").trim().slice(0, 80);
    const category = String(r?.category ?? "").trim().slice(0, 60);
    const price = Math.round(Number(r?.price));
    if (!name || !category || !Number.isFinite(price) || price < 0 || price > 100000) continue;
    let id = String(r?.id || slugify(name));
    while (seen.has(id)) id += "-2";
    seen.add(id);
    out.push({
      id, name, category, categoryId: slugify(category), price,
      veg: r?.veg === true || r?.veg === "TRUE" || r?.veg === "true",
      desc: String(r?.desc ?? "").trim().slice(0, 240),
      available: !(r?.available === false || r?.available === "FALSE" || r?.available === "false"),
      image: validImage(r?.image) || defaultById[id]?.image,
    });
  }
  return out.length ? out : null;
}

function derive(items) {
  menuItems = items;
  menuById = Object.fromEntries(items.map((i) => [i.id, i]));
  const map = new Map();
  for (const it of items) {
    if (!map.has(it.categoryId)) {
      map.set(it.categoryId, {
        id: it.categoryId,
        name: it.category,
        count: 0,
        from: Infinity,
        image: categoryPhotos[it.categoryId] || null // Attach category image if available
      });
    }
    const c = map.get(it.categoryId);
    c.count++; c.from = Math.min(c.from, it.price);
  }
  categories = [...map.values()];
}

function readLocal() {
  try { return clean(JSON.parse(localStorage.getItem(KEY))); } catch { return null; }
}
const dirtyNow = () => { try { return localStorage.getItem(DIRTY) === "1"; } catch { return false; } };
const snapItems = snapshot ? clean(snapshot.items) : null;
const snapSig = snapshot?.sig ? String(snapshot.sig) : "";
const snapCats = snapshot?.categoryPhotos && typeof snapshot.categoryPhotos === "object"
  ? Object.fromEntries(Object.entries(snapshot.categoryPhotos).filter(([k, v]) => k && validImage(v)))
  : {};
const getSnapSig = () => { try { return localStorage.getItem(SNAP_KEY) || ""; } catch { return ""; } };
const setSnapSig = (v) => { try { localStorage.setItem(SNAP_KEY, v); } catch { /* ignore */ } };

let savedCopy = readLocal();
// A new deploy ships fresher data than an old browser copy, so drop the old copy (unless it has unpublished admin edits).
if (savedCopy && snapItems && !dirtyNow() && getSnapSig() !== snapSig) savedCopy = null;
if (!savedCopy && snapItems) {
  setSnapSig(snapSig);
  if (!dirtyNow() && snapshot.rev) setRev(snapshot.rev);
}
if (snapItems && !Object.keys(categoryPhotos).length) categoryPhotos = snapCats;
// Never fall back to the small built-in menu when a full snapshot exists.
derive(savedCopy || snapItems || defaultMenu);
// true only while the small built-in menu is on screen (no snapshot, no saved copy, cloud not answered yet)
let usingFallback = !(savedCopy || snapItems);
export const isFallbackMenu = () => usingFallback;

/* ---------------- "ready" state: stops the 44 -> 269 flash ---------------- */
// Ready immediately if this browser already has a saved menu, or if there is no cloud to wait for.
// Otherwise the menu page shows the loader until the cloud answers (or finally gives up).
let ready = Boolean(savedCopy) || Boolean(snapItems) || !adminConfig.cloudUrl;

function commit(items, { persist = true } = {}) {
  usingFallback = false;
  derive(items);
  version++;
  if (persist) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items.map(({ image, ...rest }) => (image && image !== defaultById[rest.id]?.image ? { ...rest, image } : rest))));
    } catch { /* storage full/blocked */ }
    try { localStorage.setItem(COUNT_KEY, String(items.length)); } catch { /* ignore */ }
    if (snapSig) setSnapSig(snapSig);
  }
  listeners.forEach((l) => l());
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

const markReady = () => {
  if (ready) return;
  ready = true;
  listeners.forEach((l) => l());
};

/** Call once at the top of any page/component that renders menu data so it re-renders on change. */
export const useMenuVersion = () => useSyncExternalStore(subscribe, () => version);

/** true once the real menu is available (cache, cloud, or cloud gave up). Show a loader while false. */
export const useMenuReady = () => useSyncExternalStore(subscribe, () => ready);

// Admin tab and Menu tab share one browser: when one saves, the other updates at once (no refresh needed).
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      const items = readLocal();
      if (!items) return;
      derive(items); version++;
      markReady();
      listeners.forEach((l) => l());
    } else if (e.key === CAT_PHOTOS_KEY) {
      categoryPhotos = readCategoryPhotos();
      derive(menuItems); version++;
      listeners.forEach((l) => l());
    }
  });
}

/* ---------------- admin actions ---------------- */
const markDirty = (v) => {
  const was = isDirty();
  try { v ? localStorage.setItem(DIRTY, "1") : localStorage.removeItem(DIRTY); } catch { /* ignore */ }
  if (was !== Boolean(v)) { version++; listeners.forEach((l) => l()); }
};
export const isDirty = () => { try { return localStorage.getItem(DIRTY) === "1"; } catch { return false; } };

export function saveItems(items, { publish = true } = {}) { commit(clean(items) || []); markDirty(true); markReady(); if (publish) schedulePublish(); }
export function updateItem(id, patch, opts) { saveItems(menuItems.map((i) => (i.id === id ? { ...i, ...patch } : i)), opts); }
export function deleteItem(id) { saveItems(menuItems.filter((i) => i.id !== id)); }
export function addItem({ name, category, price, veg, desc }) {
  let id = slugify(name), n = 2;
  while (menuById[id]) id = `${slugify(name)}-${n++}`;
  saveItems([...menuItems, { id, name, category, price, veg, desc, available: true }]);
  return id;
}

/** A category exists as soon as a dish uses it, so nothing extra is added here (old version created a fake "X Special" dish). */
export function addCategory(categoryName) {
  const category = String(categoryName || "").trim();
  return category ? slugify(category) : "";
}

/** Updates all items belonging to a specific category or renames the category */
export function setCategory(oldCategoryName, newCategoryName) {
  const oldCat = String(oldCategoryName || "").trim();
  const newCat = String(newCategoryName || "").trim();
  if (!oldCat || !newCat) return;

  const updated = menuItems.map((item) => {
    if (item.category.toLowerCase() === oldCat.toLowerCase() || item.categoryId === slugify(oldCat)) {
      return {
        ...item,
        category: newCat,
        categoryId: slugify(newCat)
      };
    }
    return item;
  });

  saveItems(updated);
}

export function resetToDefaults() {
  try { localStorage.removeItem(CAT_PHOTOS_KEY); } catch {}
  categoryPhotos = {};
  commit(defaultMenu);
  markDirty(true);
  schedulePublish();
}

/* ---------------- auto-publish (admin edits go live for everyone) ---------------- */
let adminPin = "";
// Returns the load promise (true = full menu is in) so the admin page can wait for it instead of showing the small default menu.
export const setAdminPin = (p) => { adminPin = p || ""; return adminPin && !isDirty() ? loadFromCloud({ force: true }) : Promise.resolve(!usingFallback); };
let pub = { state: "idle", msg: "" };
export const publishState = () => pub;
const setPub = (state, msg) => { pub = { state, msg }; version++; listeners.forEach((l) => l()); };

let pubTimer = null, publishing = false, again = false;
function schedulePublish() {
  if (!cloudEnabled() || !adminPin) return;
  setPub("pending", "Saving to website…");
  clearTimeout(pubTimer);
  pubTimer = setTimeout(publishNow, 900);
}
export async function publishNow() {
  if (!cloudEnabled() || !adminPin) return;
  if (publishing) { again = true; return; }
  publishing = true;
  setPub("saving", "Saving to website…");
  try {
    const r = await saveToCloud(adminPin);
    const lost = r.livePhotos < r.sentPhotos || r.liveDishes < r.sentDishes;
    setPub(lost ? "error" : "ok", lost ? "The cloud did not keep everything. Redeploy the Apps Script (New version) with the latest apps-script.gs." : `Live for all visitors ✓ (${r.liveDishes} dishes, ${r.livePhotos} photos)`);
  } catch (e) { setPub("error", e.message || "Could not save to the cloud"); }
  publishing = false;
  if (again) { again = false; publishNow(); }
}

/* ---------------- photos ---------------- */
async function loadBitmap(file) {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }); } catch { /* fall back to <img> */ }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that image. Try a JPG or PNG.")); };
    img.src = url;
  });
}

const PHOTO_LIMIT = 44000;
export const isPhoto = (v) => /^https:\/\//i.test(String(v || "")) || /^data:image\/jpeg;base64,/.test(String(v || "")) || String(v || "").startsWith(IMG_BASE);

async function compressToFit(file) {
  const bmp = await loadBitmap(file);
  const sw0 = bmp.width || bmp.naturalWidth, sh0 = bmp.height || bmp.naturalHeight;
  let sw = sw0, sh = sw0 * 0.75;
  if (sh > sh0) { sh = sh0; sw = sh0 / 0.75; }
  const sx = (sw0 - sw) / 2, sy = (sh0 - sh) / 2;
  try {
    for (const width of [560, 480, 420, 360, 300, 240]) {
      const w = Math.round(Math.min(width, sw)), h = Math.round(w * 0.75);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
      g.imageSmoothingQuality = "high";
      g.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
      for (const q of [0.72, 0.62, 0.52, 0.42, 0.32]) {
        const url = c.toDataURL("image/jpeg", q);
        if (url.length <= PHOTO_LIMIT) return url;
      }
    }
  } finally { bmp.close?.(); }
  throw new Error("This photo is too detailed to store. Please try a simpler or smaller picture.");
}

export async function setItemPhoto(id, file, pin, onStep = () => {}) {
  if (!file || !/^image\//.test(file.type)) throw new Error("Please choose an image file (JPG, PNG or WebP).");
  if (file.size > 25 * 1024 * 1024) throw new Error("Image is too large (max 25 MB).");
  onStep("Preparing photo…");
  const image = await compressToFit(file);
  updateItem(id, { image }, { publish: false });
  if (!cloudEnabled()) return { published: false };
  onStep("Publishing to the website…");
  let r;
  try { r = await saveToCloud(pin); }
  catch (e) { throw new Error(`Photo saved here but NOT published yet (${e.message}). Press "Save to Cloud".`); }
  if (r.livePhotos < r.sentPhotos) throw new Error('The cloud did not keep the photo. Press "Save to Cloud" again.');
  return { published: true };
}

// Category photo is saved independently in categoryPhotos map without touching individual dish images
export async function setCategoryPhoto(categoryId, file, pin, onStep = () => {}) {
  const targetId = String(categoryId || "").trim().toLowerCase();
  if (!targetId) return { published: false };
  if (!file || !/^image\//.test(file.type)) throw new Error("Please choose an image file (JPG, PNG or WebP).");
  if (file.size > 25 * 1024 * 1024) throw new Error("Image is too large (max 25 MB).");

  onStep("Preparing category photo…");
  const image = await compressToFit(file);

  categoryPhotos[targetId] = image;
  try {
    localStorage.setItem(CAT_PHOTOS_KEY, JSON.stringify(categoryPhotos));
  } catch { /* storage full */ }

  derive(menuItems);
  version++;
  listeners.forEach((l) => l());

  if (!cloudEnabled()) return { published: false };

  onStep("Publishing to the website…");
  try {
    await saveToCloud(pin);
  } catch (e) {
    markDirty(true);
    throw new Error(`Category photo saved locally but NOT published yet (${e.message}). Press "Save to Cloud".`);
  }
  return { published: true };
}

export async function removePhoto(id, pin) {
  updateItem(id, { image: undefined }, { publish: false });
  if (cloudEnabled()) await saveToCloud(pin);
}

// Remove only category photo mapping
export async function removeCategoryPhoto(categoryId, pin) {
  const targetId = String(categoryId || "").trim().toLowerCase();
  if (!targetId) return;

  delete categoryPhotos[targetId];
  try {
    localStorage.setItem(CAT_PHOTOS_KEY, JSON.stringify(categoryPhotos));
  } catch {}

  derive(menuItems);
  version++;
  listeners.forEach((l) => l());

  if (cloudEnabled() && pin) {
    await saveToCloud(pin);
  }
}

/* ---------------- cloud (Google Apps Script) ---------------- */
const withTimeout = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

async function fetchMenu(timeout) {
  const url = adminConfig.cloudUrl;
  const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}action=menu&_=${Date.now()}`, { signal: withTimeout(timeout) });
  const data = await res.json();
  if (!data || data.ok === false) throw new Error("bad answer");
  return data;
}

let loadingCloud = false;
export async function loadFromCloud({ force = false } = {}) {
  const url = adminConfig.cloudUrl;
  if (!url || (!force && (isDirty() || loadingCloud))) return false;
  loadingCloud = true;
  try {
    let data = null;
    // Shorter waits than before: a visitor should never stare at a loader for 30+ seconds.
    const waits = [8000, 10000, 15000];
    for (let i = 0; i < waits.length && !data; i++) {
      try { data = await fetchMenu(waits[i]); } catch { if (i < waits.length - 1) await sleep(800 * (i + 1)); }
    }
    if (!data) return false;
    if (!force && isDirty()) return false;
    // Same version as this copy: nothing to compare, nothing to re-render, nothing to save.
    if (!force && data.rev && String(data.rev) === getRev()) return true;
    const items = clean(data.items);
    if (!items) return false;
    setRev(data.rev || "");
    const cloudCats = extractCategoryPhotos(data.items);
    // Cloud is the truth once it has any category photo; before that keep what this browser already has.
    if (Object.keys(cloudCats).length && JSON.stringify(cloudCats) !== JSON.stringify(categoryPhotos)) {
      categoryPhotos = cloudCats;
      try { localStorage.setItem(CAT_PHOTOS_KEY, JSON.stringify(categoryPhotos)); } catch { /* ignore */ }
      derive(menuItems); version++; listeners.forEach((l) => l());
    }
    // Always save the first cloud copy so the next visit is instant, even if it equals what is on screen.
    if (JSON.stringify(items) !== JSON.stringify(menuItems) || !readLocal()) commit(items);
    markDirty(false);
    return true;
  } finally { loadingCloud = false; markReady(); }
}

export const driveId = (url) => (/^https:\/\/lh3\.googleusercontent\.com\/d\/([A-Za-z0-9_-]+)/.exec(String(url || "")) || [])[1] || "";
const photoCache = new Map();
let photoWhy = "";
export const photoProblem = () => photoWhy;

export async function fetchDrivePhoto(id) {
  photoWhy = "";
  if (photoCache.has(id)) return photoCache.get(id);
  const ck = `gc-photo-${id}`;
  try { const c = sessionStorage.getItem(ck); if (c) { photoCache.set(id, c); return c; } } catch { /* ignore */ }
  const url = adminConfig.cloudUrl;
  if (!url) { photoWhy = "Cloud URL is empty in business.js."; return ""; }
  let data;
  try {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}action=img&id=${encodeURIComponent(id)}`, { signal: withTimeout(40000) });
    data = await res.json();
  } catch { photoWhy = "The Google script did not answer. Deploy it again."; return ""; }
  if (data?.ok && /^data:image\/(jpeg|png|webp);base64,/.test(data.data || "")) {
    photoCache.set(id, data.data);
    try { sessionStorage.setItem(ck, data.data); } catch { /* ignore */ }
    return data.data;
  }
  if (data?.ok) photoWhy = "The Google script is still the OLD one (no photo support).";
  else if (data?.error === "not a menu photo") photoWhy = "That file is not inside the Drive folder.";
  else if (data?.error === "not found") photoWhy = "The script cannot find that file in Drive.";
  else photoWhy = `The script said: ${data?.error || "unknown error"}.`;
  return "";
}

const CLOUD_HELP = "Cannot reach your Google script. Check deployment settings (Who has access = Anyone, New version).";
async function post(body) {
  let res;
  try {
    res = await fetch(adminConfig.cloudUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      signal: withTimeout(30000),
    });
  } catch { throw new Error(CLOUD_HELP); }
  try { return await res.json(); } catch { throw new Error(CLOUD_HELP); }
}

export const cloudEnabled = () => Boolean(adminConfig.cloudUrl);
export const BUILD = "sticky-v12-snapshot";

export async function testCloud() {
  const url = adminConfig.cloudUrl;
  if (!url) throw new Error("Cloud URL is EMPTY in business.js.");
  let res;
  try { res = await fetch(`${url}${url.includes("?") ? "&" : "?"}action=menu&_=${Date.now()}`, { signal: withTimeout(15000) }); }
  catch { throw new Error(CLOUD_HELP); }
  let data;
  try { data = await res.json(); } catch { throw new Error("The script answered with a web page instead of data. " + CLOUD_HELP); }
  const items = (Array.isArray(data?.items) ? data.items : []).filter((r) => !isCatRow(r));
  return { dishes: items.length, photos: items.filter((r) => isPhoto(r.image)).length };
}

export async function verifyPin(pin) {
  if (!cloudEnabled()) return pin === adminConfig.localPin;
  return (await post({ action: "auth", key: pin })).ok === true;
}

let saveChain = Promise.resolve();
export function saveToCloud(pin) {
  const run = saveChain.then(() => saveToCloudNow(pin), () => saveToCloudNow(pin));
  saveChain = run.catch(() => {});
  return run;
}

/** Baked photos live as files; the cloud stores photo data, so read the file back before saving (never lose a photo). */
async function inlineLocalPhoto(image) {
  if (typeof image !== "string" || !image.startsWith(IMG_BASE)) return image;
  const res = await fetch(image.split("?")[0]);
  if (!res.ok) throw new Error("Could not read a saved photo. Please refresh the page and try again.");
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("Could not read a saved photo. Please refresh the page and try again."));
    fr.readAsDataURL(blob);
  });
}

async function saveToCloudNow(pin) {
  const rows = await Promise.all(menuItems.map(async ({ image, categoryId, ...r }) => {
    const img = await inlineLocalPhoto(image);
    return { ...r, image: isPhoto(img) && String(img).length <= 48000 ? img : "" };
  }));
  if (!rows.length) throw new Error("The menu is empty, so nothing was saved.");
  // hidden rows that carry the category photos (only for categories that still have dishes)
  const liveCats = new Set(menuItems.map((i) => i.categoryId));
  for (const [cid, rawImg] of Object.entries(categoryPhotos)) {
    const img = await inlineLocalPhoto(rawImg);
    if (liveCats.has(cid) && isPhoto(img) && String(img).length <= 48000) {
      const cat = menuItems.find((i) => i.categoryId === cid);
      rows.push({ id: CAT_ROW + cid, name: "Category photo", category: cat.category, price: 0, veg: true, desc: "", available: false, image: img });
    }
  }
  const data = await post({ action: "save", key: pin, baseRev: getRev(), items: rows });
  if (!data.ok) throw new Error(data.error || "Cloud save failed");
  setRev(data.rev || "");
  markDirty(false);
  let back;
  try {
    const url = adminConfig.cloudUrl;
    back = await (await fetch(`${url}${url.includes("?") ? "&" : "?"}action=menu&_=${Date.now()}`, { signal: withTimeout(15000) })).json();
  } catch { throw new Error("Saved, but could not read the menu back from the cloud."); }
  const live = Array.isArray(back?.items) ? back.items : [];
  return {
    sentDishes: rows.length, sentPhotos: rows.filter((r) => r.image).length,
    liveDishes: live.length, livePhotos: live.filter((r) => isPhoto(r.image)).length,
  };
}

if (typeof window !== "undefined") {
  // If the first try fails (bad network), try once more quickly instead of waiting 3 minutes.
  const boot = () => loadFromCloud().then((ok) => { if (!ok && !isDirty()) setTimeout(() => loadFromCloud(), 4000); });
  if (ready) {
    // The menu is already on screen: check the cloud quietly after the page has settled.
    if (window.requestIdleCallback) window.requestIdleCallback(boot, { timeout: 4000 });
    else setTimeout(boot, 1500);
  } else boot();
  const refresh = () => { if (document.visibilityState === "visible") loadFromCloud(); };
  document.addEventListener("visibilitychange", refresh);
  setInterval(refresh, 180000);
}