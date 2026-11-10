import { useEffect, useState } from "react";

/**
 * Ordering hours (Indian Standard Time, whatever the customer's phone timezone is).
 * Menu is always visible; only ORDERING is limited to these windows.
 * Times are minutes after midnight.
 */
export const ORDER_WINDOWS = [
  { start: 12 * 60, end: 16 * 60 },          // 12:00 PM - 4:00 PM
  { start: 18 * 60, end: 22 * 60 + 30 },     // 6:00 PM - 10:30 PM
];
export const ORDER_HOURS_LABEL = "12 PM – 4 PM  &  6 PM – 10:30 PM";

const TZ = "Asia/Kolkata";

function istMinutes(date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

function fmt(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${ap}` : `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

export function getOrderStatus(now = new Date()) {
  const m = istMinutes(now);
  const win = ORDER_WINDOWS.find((w) => m >= w.start && m < w.end);
  if (win) {
    return { open: true, short: `Ordering open till ${fmt(win.end)}`, long: `We are taking orders right now, until ${fmt(win.end)}.` };
  }
  const next = ORDER_WINDOWS.find((w) => w.start > m);
  const when = next ? `today at ${fmt(next.start)}` : `tomorrow at ${fmt(ORDER_WINDOWS[0].start)}`;
  const whenShort = next ? fmt(next.start) : `tomorrow ${fmt(ORDER_WINDOWS[0].start)}`;
  return {
    open: false,
    short: `Ordering opens ${whenShort}`,
    long: `Ordering is closed right now. It opens again ${when}. Order times: ${ORDER_HOURS_LABEL}. You can still browse the full menu.`,
  };
}

/** Live status. Re-checks every 15 seconds and when the tab comes back to the front. */
export function useOrderStatus() {
  const [status, setStatus] = useState(() => getOrderStatus());
  useEffect(() => {
    const tick = () => setStatus((prev) => {
      const next = getOrderStatus();
      return next.open === prev.open && next.short === prev.short ? prev : next;
    });
    const id = setInterval(tick, 15000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, []);
  return status;
}