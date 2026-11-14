/**
 * Live menu store. Single source of truth for the website AND the admin panel.
 * - Default data lives in src/data/menu.js
 * - Edits are saved to localStorage instantly (this browser)
 * - "Save to Cloud" pushes to a Google Sheet through a Google Apps Script; every visitor loads it from there.
 */
import { useSyncExternalStore } from "react";
import { defaultMenu, featuredIds as defaultFeatured } from "../data/menu.js";
import { slugify } from "./format.js";
import * as siteConfig from "../config/business.js";

// Safe even if business.js is an older copy without adminConfig (falls back to local-only mode)
const adminConfig = siteConfig.adminConfig || { cloudUrl: "", localPin: "admin123" };

const KEY = "greenchilly-menu-v2";
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

let version = 0;
const listeners = new Set();

/** A photo is accepted only if it is an https URL (cloud/Drive) or an inline image (local-only mode). */
const validImage = (v) => {
  const s = typeof v === "string" ? v.trim() : "";
  return /^https:\/\//i.test(s) || /^data:image\/(jpeg|png|webp);base64,/i.test(s) ? s : "";
};

/** Keep only safe, known fields. A dish photo is the uploaded one if present, else the one bundled in code. */
function clean(raw) {
  if (!Array.isArray(raw)) return null;
  const seen = new Set();
  const out = [];
  for (const r of raw) {
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
    if (!map.has(it.categoryId)) map.set(it.categoryId, { id: it.categoryId, name: it.category, count: 0, from: Infinity });
    const c = map.get(it.categoryId);
    c.count++; c.from = Math.min(c.from, it.price);
  }
  categories = [...map.values()];
}

function readLocal() {
  try { return clean(JSON.parse(localStorage.getItem(KEY))); } catch { return null; }
}
derive(readLocal() || defaultMenu);

function commit(items, { persist = true } = {}) {
  derive(items);
  version++;
  if (persist) {
    try { 
      localStorage.setItem(KEY, JSON.stringify(items.map(({ image, ...rest }) => (image && image !== defaultById[rest.id]?.image ? { ...rest, image } : rest)))); 
    } catch { /* storage full/blocked */ }
  }
  listeners.forEach((l) => l());
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

/** Call once at the top of any page/component that renders menu data so it re-renders on change. */
export const useMenuVersion = () => useSyncExternalStore(subscribe, () => version);

// Admin tab and Menu tab share one browser: when one saves, the other updates at once (no refresh needed).
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    const items = readLocal();
    if (!items) return;
    derive(items); version++;
    listeners.forEach((l) => l());
  });
}

/* ---------------- admin actions ---------------- */
const markDirty = (v) => {
  const was = isDirty();
  try { v ? localStorage.setItem(DIRTY, "1") : localStorage.removeItem(DIRTY); } catch { /* ignore */ }
  if (was !== Boolean(v)) { version++; listeners.forEach((l) => l()); }
};
export const isDirty = () => { try { return localStorage.getItem(DIRTY) === "1"; } catch { return false; } };

export function saveItems(items, { publish = true } = {}) { commit(clean(items) || []); markDirty(true); if (publish) schedulePublish(); }
export function updateItem(id, patch, opts) { saveItems(menuItems.map((i) => (i.id === id ? { ...i, ...patch } : i)), opts); }
export function deleteItem(id) { saveItems(menuItems.filter((i) => i.id !== id)); }
export function addItem({ name, category, price, veg, desc }) {
  let id = slugify(name), n = 2;
  while (menuById[id]) id = `${slugify(name)}-${n++}`;
  saveItems([...menuItems, { id, name, category, price, veg, desc, available: true }]);
  return id;
}
export function resetToDefaults() { commit(defaultMenu); markDirty(true); schedulePublish(); }

/* ---------------- auto-publish (admin edits go live for everyone) ---------------- */
let adminPin = "";
export const setAdminPin = (p) => { adminPin = p || ""; };
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
export const isPhoto = (v) => /^https:\/\//i.test(String(v || "")) || /^data:image\/jpeg;base64,/.test(String(v || ""));

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

export async function removePhoto(id, pin) {
  updateItem(id, { image: undefined }, { publish: false });
  if (cloudEnabled()) await saveToCloud(pin);
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
    const waits = [20000, 25000, 30000];
    for (let i = 0; i < waits.length && !data; i++) {
      try { data = await fetchMenu(waits[i]); } catch { if (i < waits.length - 1) await sleep(1500 * (i + 1)); }
    }
    if (!data) return false;
    if (!force && isDirty()) return false; 
    const items = clean(data.items);
    if (!items) return false;
    setRev(data.rev || "");
    if (JSON.stringify(items) !== JSON.stringify(menuItems)) commit(items);
    markDirty(false);
    return true;
  } finally { loadingCloud = false; }
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
export const BUILD = "sticky-v10-optimized";

export async function testCloud() {
  const url = adminConfig.cloudUrl;
  if (!url) throw new Error("Cloud URL is EMPTY in business.js.");
  let res;
  try { res = await fetch(`${url}${url.includes("?") ? "&" : "?"}action=menu&_=${Date.now()}`, { signal: withTimeout(15000) }); }
  catch { throw new Error(CLOUD_HELP); }
  let data;
  try { data = await res.json(); } catch { throw new Error("The script answered with a web page instead of data. " + CLOUD_HELP); }
  const items = Array.isArray(data?.items) ? data.items : [];
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

async function saveToCloudNow(pin) {
  const rows = menuItems.map(({ image, categoryId, ...r }) => ({ ...r, image: isPhoto(image) && String(image).length <= 48000 ? image : "" }));
  if (!rows.length) throw new Error("The menu is empty, so nothing was saved.");
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
  loadFromCloud();
  const refresh = () => { if (document.visibilityState === "visible") loadFromCloud(); };
  document.addEventListener("visibilitychange", refresh);
  setInterval(refresh, 180000);
}