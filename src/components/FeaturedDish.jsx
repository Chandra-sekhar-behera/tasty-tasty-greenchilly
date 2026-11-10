import { Plus } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { inr } from "../lib/format.js";
import QtyStepper from "./QtyStepper.jsx";
import VegMark from "./VegMark.jsx";

export default function FeaturedDish({ item }) {
  const { qtyOf, add, setQty } = useCart();
  const qty = qtyOf(item.id);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_60px_-30px_rgba(18,61,42,0.45)] ring-1 ring-charcoal/5">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={item.image} alt={item.name} loading="lazy" decoding="async" width="800" height="600"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <span className="absolute left-4 top-4 rounded-full bg-forest/85 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-ivory backdrop-blur">{item.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="flex items-center gap-2.5 font-serif text-3xl font-semibold leading-tight text-charcoal"><VegMark veg={item.veg} />{item.name}</h3>
          <span className="font-serif text-2xl font-semibold text-heritage">{inr(item.price)}</span>
        </div>
        <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-charcoal/65">{item.desc}</p>
        <div className="mt-6">
          {item.available === false ? (
            <span className="block rounded-full border border-charcoal/20 py-2.5 text-center text-xs font-medium uppercase tracking-widest text-charcoal/50">Out of stock</span>
          ) : qty === 0 ? (
            <button type="button" onClick={() => add(item.id)} className="btn btn-dark btn-sm w-full" aria-label={`Add ${item.name} to order`}><Plus size={15} /> Add to order</button>
          ) : (
            <QtyStepper qty={qty} name={item.name} tone="light" onChange={(q) => setQty(item.id, q)} />
          )}
        </div>
      </div>
    </article>
  );
}