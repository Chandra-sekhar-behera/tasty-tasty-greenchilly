import { business } from "../config/business.js";
import { menuById } from "./menuStore.js";
import { inr } from "./format.js";

/** Payment settings with safe defaults (payment is OFF when no UPI ID is set). */
export const paymentConfig = {
  upiId: "", payPhone: "9337611526", razorpayKeyId: "", payeeName: business.name, halfPercent: 50, requiredFor: ["delivery"], minimumOrder: 0, cooldownMinutes: 10,
  ...(business.payment || {}),
};
export const gatewayEnabled = Boolean(paymentConfig.razorpayKeyId);
export const needsPayment = (mode) => Boolean(paymentConfig.upiId) && paymentConfig.requiredFor.includes(mode);

/** Shared validation: Indian mobile number, 10 digits starting 6-9 (optional +91 / 0). */
export function normalizePhone(input = "") {
  const d = String(input).replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d;
}
export const isValidPhone = (p) => /^[6-9]\d{9}$/.test(normalizePhone(p));

export function validateOrder({ name, phone, mode, address }) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = "Please enter your name.";
  if (!isValidPhone(phone)) errors.phone = "Enter a valid 10-digit mobile number.";
  if (mode === "delivery" && (!address || address.trim().length < 8))
    errors.address = "Please enter your full delivery address.";
  return errors;
}

/** Price is always read from the authoritative menu, never from the cart. */
export function priceLines(lines) {
  return lines
    .map(({ id, qty }) => ({ item: menuById[id], qty }))
    .filter((l) => l.item && l.qty > 0)
    .map(({ item, qty }) => ({ item, qty, total: item.price * qty }));
}
export const subtotalOf = (lines) => priceLines(lines).reduce((s, l) => s + l.total, 0);

/* ---------------- payment helpers ---------------- */
/** Amount to pay now: the whole subtotal ("full") or the configured percentage rounded up ("half"). */
export const payableAmount = (subtotal, plan) =>
  plan === "full" ? subtotal : Math.min(subtotal, Math.ceil((subtotal * paymentConfig.halfPercent) / 100));

/** A short readable order number, e.g. GC-4K7Q2X. */
export const makeOrderId = () => {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 6; i++) r += a[Math.floor(Math.random() * a.length)];
  return `GC-${r}`;
};

/** upi://pay link: opens GPay / PhonePe / Paytm with the amount already filled in. */
export const upiUri = ({ amount, orderId }) =>
  `upi://pay?pa=${encodeURIComponent(paymentConfig.upiId)}&pn=${encodeURIComponent(paymentConfig.payeeName)}` +
  `&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}`;

/** UTR (12 digits) from a UPI app, or a Razorpay payment id (pay_xxxxxxxxxxxxxx) from secure checkout. */
export const isValidUtr = (u) => {
  const v = String(u || "").replace(/\s/g, "");
  return /^\d{12}$/.test(v) || /^pay_[A-Za-z0-9]{10,}$/.test(v);
};

/** Pay-with-app links. Each opens that UPI app with the amount, payee and order ID already filled in. */
const isIOS = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
export const isMobileDevice = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
export function upiAppLinks({ amount, orderId }) {
  const q = upiUri({ amount, orderId }).replace("upi://pay?", "");
  return [
    { id: "phonepe", label: "PhonePe", sub: "Pay via PhonePe", color: "#5f259f", href: `phonepe://pay?${q}` },
    { id: "gpay", label: "Google Pay", sub: "Pay via Google Pay", color: "#1a73e8", href: `${isIOS() ? "gpay" : "tez"}://upi/pay?${q}` },
    { id: "paytm", label: "Paytm", sub: "Pay via Paytm", color: "#00b9f1", href: `paytmmp://pay?${q}` },
    { id: "any", label: "Other UPI app", sub: "BHIM, Amazon Pay, bank apps…", color: "#8bcb35", href: `upi://pay?${q}` },
  ];
}

/* ---------------- delivery time ---------------- */
export const deliveryEta = { min: 35, max: 40, ...((business.ordering && business.ordering.eta) || {}) };
export const etaLabel = `${deliveryEta.min}–${deliveryEta.max} minutes`;
export const fmtClock = (d) => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
export const etaWindow = (from = Date.now()) => ({
  from: fmtClock(new Date(from + deliveryEta.min * 60000)),
  to: fmtClock(new Date(from + deliveryEta.max * 60000)),
});

/* ---------------- spam brake (one new order per device per few minutes) ---------------- */
const LAST = "gc-last-order";
export function cooldownLeft(orderId) {
  try {
    const x = JSON.parse(localStorage.getItem(LAST) || "null");
    if (!x || x.id === orderId) return 0;
    const left = paymentConfig.cooldownMinutes * 60000 - (Date.now() - x.t);
    return left > 0 ? Math.ceil(left / 60000) : 0;
  } catch { return 0; }
}
export function markOrderSent(orderId) {
  try { localStorage.setItem(LAST, JSON.stringify({ id: orderId, t: Date.now() })); } catch { /* ignore */ }
}

/** 100x Optimized WhatsApp Message Payload Builder with strict encoding */
export function buildOrderMessage({ lines, customer, orderId, payment }) {
  const priced = priceLines(lines);
  const sub = priced.reduce((s, l) => s + l.total, 0);
  const mode = customer.mode === "delivery" ? "Delivery" : "Pickup / Dine-in";
  
  const out = [
    `*New Order — ${business.name}*`,
    ...(orderId ? [`Order ID: *${orderId}*`] : []),
    "",
    ...priced.map((l, i) => `${i + 1}. ${l.item.name} × ${l.qty} — ${inr(l.total)} (${inr(l.item.price)} each)`),
    "",
    `*Subtotal: ${inr(sub)}*`,
    customer.mode === "delivery"
      ? `Delivery charge: To be confirmed by restaurant\nEstimated delivery time: ${etaLabel} after confirmation`
      : "Pickup / Dine-in: No delivery charge",
  ];

  if (payment) {
    out.push(
      "",
      `*Payment (UPI): ${payment.plan === "full" ? "FULL" : `HALF (${paymentConfig.halfPercent}%) Advance`} — ${inr(payment.amount)} paid*`,
      `UTR / Ref no: ${payment.utr || "Not entered, screenshot attached"}`,
    );
    if (payment.amount < sub) {
      out.push(`Balance to pay: ${inr(sub - payment.amount)}${customer.mode === "delivery" ? " (plus delivery charge if any)" : ""}`);
    }
  }

  out.push(
    "",
    `Name: ${customer.name.trim()}`,
    `Phone: +91 ${normalizePhone(customer.phone)}`,
    `Order Type: ${mode}`
  );

  if (customer.mode === "delivery") {
    out.push(`Address: ${customer.address.trim()}`);
    if (customer.location) {
      out.push(`Shared Location: https://maps.google.com/?q=${customer.location.lat},${customer.location.lng}`);
    }
  }

  if (customer.note && customer.note.trim()) {
    out.push(`Note: ${customer.note.trim()}`);
  }

  out.push(
    "",
    payment
      ? "Payment screenshot attached. Please verify and confirm my order. Thank you!"
      : "Please confirm item availability and final amount. Thank you!"
  );

  return out.join("\n");
}

export const buildWhatsAppUrl = (message, number = business.contact.whatsappNumber) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

export const enquiryUrl = () =>
  buildWhatsAppUrl(`Hello ${business.name}, I would like to place an order.`);