// Runs the shared WhatsApp builder against the real menu data. Usage: npm run test:whatsapp
import assert from "node:assert/strict";
import { buildOrderMessage, buildWhatsAppUrl, validateOrder, isValidPhone, subtotalOf } from "../src/lib/whatsapp.js";

const lines = [{ id: "chicken-biryani", qty: 2 }, { id: "paneer-tikka", qty: 1 }, { id: "ghost-item", qty: 3 }];
assert.equal(subtotalOf(lines), 280 * 2 + 280, "subtotal ignores unknown items and reads menu prices");

const msg = buildOrderMessage({ lines, customer: { name: "Asha Rani", phone: "+91 98765 43210", mode: "delivery", address: "Plot 12, Jatni Main Road", location: { lat: 20.1555, lng: 85.7063 }, note: "Less spicy & no onion" } });
const url = buildWhatsAppUrl(msg);
assert.ok(url.startsWith("https://wa.me/916370452277?text="));
const decoded = decodeURIComponent(url.split("?text=")[1]);
assert.equal(decoded, msg, "message round-trips through URL encoding");
for (const s of ["Chicken Biryani × 2 — ₹560", "Paneer Tikka × 1 — ₹280", "Subtotal: ₹840", "to be confirmed by the restaurant", "Less spicy & no onion", "+91 9876543210"])
  assert.ok(msg.includes(s), "missing: " + s);
assert.ok(!msg.includes("ghost"));
assert.ok(!url.includes(" ") && !url.includes("\n"));

assert.ok(isValidPhone("63704 52277") && isValidPhone("+916370452277") && !isValidPhone("12345") && !isValidPhone("5123456789"));
assert.deepEqual(Object.keys(validateOrder({ name: "", phone: "1", mode: "delivery", address: "x" })).sort(), ["address", "name", "phone"]);
assert.deepEqual(validateOrder({ name: "Ravi", phone: "9876543210", mode: "pickup" }), {});
console.log("WhatsApp builder: all assertions passed\n\n" + msg + "\n\n" + url.slice(0, 120) + "…");
