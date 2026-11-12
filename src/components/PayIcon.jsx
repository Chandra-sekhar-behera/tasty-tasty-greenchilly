import { useState } from "react";
import { Smartphone } from "lucide-react";
import { PAY_APPS } from "../lib/payments.js";

export default function PayIcon({ app, size = 32, bare = false, className = "" }) {
  const meta = PAY_APPS[app];
  const [i, setI] = useState(0);
  if (!meta) return null;
  if (i < meta.icons.length) {
    return (
      <img
        src={meta.icons[i]} width={size} height={size} alt="" draggable={false}
        onError={() => setI((n) => n + 1)}
        className={`select-none object-contain ${className}`} style={{ width: size, height: size }}
      />
    );
  }
  if (bare) return null;
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-lg bg-white text-[0.6rem] font-bold leading-none tracking-tight ${className}`}
      style={{ width: size, height: size, color: meta.color }}
    >
      {app === "upi" ? <Smartphone size={size * 0.55} /> : meta.short.slice(0, app === "gpay" ? 4 : 3)}
    </span>
  );
}