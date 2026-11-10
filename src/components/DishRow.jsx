import { Plus } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { inr } from "../lib/format.js";
import QtyStepper from "./QtyStepper.jsx";
import VegMark from "./VegMark.jsx";

/** Editorial menu row: name · leader · price, with optional real photograph. */
export default function DishRow({ item }) {
  const { qtyOf, add, setQty } = useCart();
  const qty = qtyOf(item.id);
  return (
    <article className={`group flex gap-4 rounded-2xl border border-ivory/[0.07] bg-ivory/[0.03] p-4 transition hover:border-lime/30 hover:bg-ivory/[0.055] sm:p-5 ${item.available === false ? "opacity-60" : ""}`}>
      {item.image && (
        <img src={item.image} alt={`${item.name}`} loading="lazy" decoding="async" width="96" height="96"
          className="h-24 w-24 shrink-0 rounded-xl object-cover sm:h-28 sm:w-28" />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline gap-3">
          <VegMark veg={item.veg} />
          <h3 className="font-serif text-xl font-semibold leading-tight text-ivory sm:text-2xl">{item.name}</h3>
          <span className="mb-1 hidden min-w-4 flex-1 self-end border-b border-dotted border-ivory/25 sm:block" aria-hidden="true" />
          <span className="ml-auto whitespace-nowrap font-serif text-xl font-semibold text-lime sm:ml-0 sm:text-2xl">{inr(item.price)}</span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-ivory/60">{item.desc}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="eyebrow !tracking-[0.18em] text-ivory/40">{item.category}</span>
          {item.available === false ? (
            <span className="rounded-full border border-ivory/20 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-ivory/50">Out of stock</span>
          ) : qty === 0 ? (
            <button type="button" onClick={() => add(item.id)} aria-label={`Add ${item.name} to order`}
              className="btn btn-lime btn-sm"><Plus size={15} /> Add</button>
          ) : (
            <QtyStepper qty={qty} name={item.name} onChange={(q) => setQty(item.id, q)} />
          )}
        </div>
      </div>
    </article>
  );
}