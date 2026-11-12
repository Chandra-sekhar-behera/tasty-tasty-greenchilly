import { upiUri } from "./whatsapp.js";

export const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)); // iPadOS

export const isAndroid = () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

export const isMobileDevice = () => isIOS() || isAndroid();

const PLAY = (pkg) => `https://play.google.com/store/apps/details?id=${pkg}`;

/**
 * One button per UPI app. Each opens that app directly with payee, amount and order id filled in.
 *  - Android: intent:// link (opens the app, or the Play Store page if it is not installed)
 *  - iPhone : the app's own URL scheme (iOS ignores the generic upi:// link)
 */
export function upiAppLinks({ amount, orderId }) {
  const q = upiUri({ amount, orderId }).replace("upi://pay?", "");
  const android = isAndroid();

  const make = (id, label, sub, color, pkg, iosHref) => ({
    id, label, sub, color,
    href: android
      ? `intent://pay?${q}#Intent;scheme=upi;package=${pkg};S.browser_fallback_url=${encodeURIComponent(PLAY(pkg))};end`
      : iosHref,
  });

  const apps = [
    make("phonepe", "PhonePe", "Pay with PhonePe", "#5f259f", "com.phonepe.app", `phonepe://pay?${q}`),
    make("gpay", "Google Pay", "Pay with Google Pay", "#1a73e8", "com.google.android.apps.nbu.paisa.user", `gpay://upi/pay?${q}`),
    make("paytm", "Paytm", "Pay with Paytm", "#00baf2", "net.one97.paytm", `paytmmp://pay?${q}`),
  ];
  // Generic chooser works on Android only. iPhone ignores upi://
  if (android) apps.push({ id: "any", label: "Other UPI app", sub: "BHIM, Amazon Pay, bank apps…", color: "#8bcb35", href: `upi://pay?${q}` });
  return apps;
}