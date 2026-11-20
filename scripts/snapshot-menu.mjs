#!/usr/bin/env node
/**
 * Bakes the LIVE menu into the website at build time.
 *
 *   src/data/menu.snapshot.json   -> bundled in the app, so the full menu (all dishes) exists on the very first paint
 *   public/menu-img/*             -> dish photos, served as normal cached files instead of base64 text inside the data
 *
 * Runs automatically before every build ("prebuild" in package.json). It NEVER fails the build:
 * if the cloud cannot be reached, the previous snapshot (committed in git) is kept.
 *
 * Manual run:   node scripts/snapshot-menu.mjs
 * Custom URL:   MENU_CLOUD_URL="https://script.google.com/macros/s/.../exec" node scripts/snapshot-menu.mjs
 */
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_JSON = path.join(root, "src/data/menu.snapshot.json");
const IMG_DIR = path.join(root, "public/menu-img");
const IMG_URL = "/menu-img/";
const CAT_ROW = "__cat__";
const log = (...a) => console.log("[menu-snapshot]", ...a);

const sha = (data, n = 8) => createHash("sha1").update(data).digest("hex").slice(0, n);
const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "dish";

async function findCloudUrl() {
  if (process.env.MENU_CLOUD_URL) return process.env.MENU_CLOUD_URL.trim();
  for (const rel of ["src/config/business.js", "src/config/business.jsx", "src/config/business.ts"]) {
    const file = path.join(root, rel);
    if (!existsSync(file)) continue;
    const text = await readFile(file, "utf8");
    const direct = /cloudUrl\s*:\s*(["'`])(https?:\/\/[^"'`]+)\1/.exec(text);
    if (direct) return direct[2];
    const script = /https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/.exec(text);
    if (script) return script[0];
  }
  return "";
}

async function fetchMenu(url) {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 25000);
    try {
      const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}action=menu&_=${Date.now()}`, { signal: ctl.signal });
      const data = await res.json();
      if (!data || data.ok === false || !Array.isArray(data.items)) throw new Error("bad answer from the cloud");
      return data;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error("cloud unreachable");
}

const DATA_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/i;
const EXT = { jpeg: "jpg", png: "png", webp: "webp" };
const files = new Map(); // file name -> Buffer

/** https photos stay as they are; inline (base64) photos become real files. */
function photoToUrl(baseName, value) {
  const s = typeof value === "string" ? value.trim() : "";
  if (/^https:\/\//i.test(s)) return s;
  const m = DATA_RE.exec(s);
  if (!m) return "";
  const buf = Buffer.from(m[2].replace(/\s/g, ""), "base64");
  if (!buf.length) return "";
  const name = `${baseName}.${EXT[m[1].toLowerCase()]}`;
  files.set(name, buf);
  return `${IMG_URL}${name}?v=${sha(buf)}`;
}

async function main() {
  const url = await findCloudUrl();
  if (!url) return log("no cloud URL found (src/config/business.js) - keeping the existing snapshot.");

  const data = await fetchMenu(url);
  const items = [];
  const categoryPhotos = {};

  for (const r of data.items) {
    const id = String(r?.id ?? "");
    if (id.startsWith(CAT_ROW)) {
      const cid = id.slice(CAT_ROW.length);
      const photo = cid ? photoToUrl(`cat-${slug(cid)}-${sha(cid, 6)}`, r.image) : "";
      if (photo) categoryPhotos[cid] = photo;
      continue;
    }
    const image = photoToUrl(`${slug(id || r?.name)}-${sha(id || String(r?.name), 6)}`, r?.image);
    const row = {
      id, name: r?.name, category: r?.category, price: r?.price,
      veg: r?.veg, desc: r?.desc, available: r?.available,
    };
    if (image) row.image = image;
    items.push(row);
  }

  if (!items.length) return log("the cloud returned no dishes - keeping the existing snapshot.");

  // Replace the photo folder only after everything above succeeded.
  await rm(IMG_DIR, { recursive: true, force: true });
  await mkdir(IMG_DIR, { recursive: true });
  for (const [name, buf] of files) await writeFile(path.join(IMG_DIR, name), buf);

  const body = { items, categoryPhotos };
  const snapshot = { rev: String(data.rev ?? ""), sig: sha(JSON.stringify(body), 12), count: items.length, ...body };
  await mkdir(path.dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify(snapshot));

  log(`${items.length} dishes, ${files.size} photos saved (rev ${snapshot.rev || "n/a"}).`);
}

main().catch((e) => log("could not refresh the snapshot, keeping the old one:", e?.message || e));