import { paymentConfig } from "./whatsapp.js";

const FOLDERS = ["/payment-icons/", "/assets/"];
const iconList = (...files) => FOLDERS.flatMap((d) => files.map((f) => d + encodeURI(f)));

export const PAY_APPS = {
  gpay: {
    id: "gpay", name: "Google Pay", short: "GPay", color: "#1a73e8",
    icons: iconList("icons8-google-pay-color-16.png", "icons8-google pay-color-16.png", "icons8-google-pay-color-48.png", "icons8-google-pay-48.png", "gpay.png", "gpay.svg"),
    androidPkg: "com.google.android.apps.nbu.paisa.user", iosScheme: "gpay://upi/pay",
  },
  phonepe: {
    id: "phonepe", name: "PhonePe", short: "PhonePe", color: "#5f259f",
    icons: iconList("icons8-phone-pe-color-16.png", "icons8-phone pe-color-16.png", "icons8-phonepe-color-16.png", "icons8-phone-pe-color-48.png", "icons8-phonepe-48.png", "phonepe.png", "phonepe.svg"),
    androidPkg: "com.phonepe.app", iosScheme: "phonepe://pay",
  },
  paytm: {
    id: "paytm", name: "Paytm", short: "Paytm", color: "#00b9f1",
    icons: iconList("icons8-paytm-color-16.png", "icons8-paytm-color-48.png", "icons8-paytm-48.png", "paytm.png", "paytm.svg"),
    androidPkg: "net.one97.paytm", iosScheme: "paytmmp://pay",
  },
  upi: {
    id: "upi", name: "Other UPI apps", short: "UPI", color: "#0b7a3b",
    icons: iconList("upi.png", "upi.svg", "icons8-upi-color-48.png"),
    androidPkg: "", iosScheme: "upi://pay",
  },
};
export const PAY_APP_ORDER = ["gpay", "phonepe", "paytm", "upi"];

export function upiQuery({ amount, orderId }) {
  const q = new URLSearchParams({
    pa: paymentConfig.upiId,
    pn: paymentConfig.payeeName,
    am: Number(amount).toFixed(2),
    cu: "INR",
    tn: `Order ${orderId}`,
    tr: orderId,
  });
  return q.toString().replace(/\+/g, "%20");
}

export const genericUpiLink = (p) => `upi://pay?${upiQuery(p)}`;

export function detectPlatform() {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  return "desktop";
}

export function payLink(appId, params, platform = detectPlatform()) {
  const app = PAY_APPS[appId] || PAY_APPS.upi;
  const q = upiQuery(params);
  if (platform === "desktop") return "";
  if (appId === "upi") return `upi://pay?${q}`;
  if (platform === "android") return `intent://pay?${q}#Intent;scheme=upi;package=${app.androidPkg};end`;
  return `${app.iosScheme}?${q}`;
}