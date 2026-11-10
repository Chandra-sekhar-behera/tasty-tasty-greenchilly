import { Minus, Plus } from "lucide-react";

export default function QtyStepper({ qty, name, onChange, tone = "dark" }) {
  const base = tone === "dark" ? "border-lime/40 text-ivory" : "border-heritage/50 text-charcoal";
  const btn = tone === "dark" ? "hover:bg-lime hover:text-ink" : "hover:bg-heritage hover:text-ivory";
  return (
    <div className={`inline-flex items-center rounded-full border ${base}`} role="group" aria-label={`Quantity of ${name}`}>
      <button type="button" onClick={() => onChange(qty - 1)} aria-label={`Remove one ${name}`} className={`grid h-9 w-9 place-items-center rounded-full transition ${btn}`}>
        <Minus size={15} />
      </button>
      <span className="min-w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
      <button type="button" onClick={() => onChange(qty + 1)} aria-label={`Add one more ${name}`} className={`grid h-9 w-9 place-items-center rounded-full transition ${btn}`}>
        <Plus size={15} />
      </button>
    </div>
  );
}
