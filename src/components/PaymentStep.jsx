import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Smartphone, ShieldCheck } from "lucide-react";
import { inr } from "../lib/format.js";
import { paymentConfig, payableAmount, upiUri } from "../lib/whatsapp.js";

const field = "w-full rounded-xl border border-ivory/15 bg-ivory/[0.06] px-4 py-3 text-[0.95rem] text-ivory placeholder:text-ivory/35 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/30";

/** Pay half or full by UPI, UTR is optional so users can just attach screenshot on WhatsApp. */
export default function PaymentStep({ subtotal, plan, setPlan, utr, setUtr, orderId, error }) {
  const amount = payableAmount(subtotal, plan);
  const uri = upiUri({ amount, orderId });
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(uri, { margin: 1, width: 280, color: { dark: "#0a1a10", light: "#ffffff" } })
      .then((u) => live && setQr(u)).catch(() => live && setQr(""));
    return () => { live = false; };
  }, [uri]);

  async function copyUpi() {
    try { await navigator.clipboard.writeText(paymentConfig.upiId); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }

  const plans = [["half", `Half (${paymentConfig.halfPercent}%)`, payableAmount(subtotal, "half")], ["full", "Full", subtotal]];
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="eyebrow mb-3 text-ivory/60">How much do you want to pay now?</legend>
        <div className="grid grid-cols-2 gap-3">
          {plans.map(([v, label, amt]) => (
            <label key={v} className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lime ${plan === v ? "border-lime bg-lime/10 text-lime" : "border-ivory/15 text-ivory/75 hover:border-ivory/40"}`}>
              <input type="radio" name="plan" value={v} checked={plan === v} onChange={() => setPlan(v)} className="sr-only" />
              <span className="block">{label}</span>
              <span className="mt-0.5 block font-serif text-2xl font-semibold">{inr(amt)}</span>
            </label>
          ))}
        </div>
        {amount < subtotal && <p className="mt-2 text-xs text-ivory/55">Balance {inr(subtotal - amount)} is paid at delivery. Delivery charge, if any, is extra.</p>}
      </fieldset>

      <section aria-label="Pay with UPI" className="rounded-2xl border border-ivory/10 p-5 text-center">
        <p className="text-xs uppercase tracking-widest text-ivory/55">Pay {inr(amount)} to {paymentConfig.payeeName}</p>
        <div className="mx-auto mt-4 grid h-[200px] w-[200px] place-items-center rounded-2xl bg-white p-2">
          {qr ? <img src={qr} alt={`UPI QR code for ${inr(amount)}`} className="h-full w-full" /> : <span className="text-xs text-ink/60">Making QR…</span>}
        </div>
        <p className="mt-3 text-xs text-ivory/55">Scan with any UPI app</p>
        <a href={uri} className="btn btn-lime mt-4 w-full justify-center"><Smartphone size={16} /> Pay {inr(amount)} with UPI app</a>
        <p className="mt-2 text-[0.7rem] text-ivory/45">The button works on a phone. On a computer, scan the QR.</p>
        <button type="button" onClick={copyUpi} className="mt-4 inline-flex items-center gap-2 rounded-full border border-ivory/15 px-4 py-2 text-xs text-ivory/80 hover:border-lime hover:text-lime">
          {copied ? <Check size={14} /> : <Copy size={14} />} {paymentConfig.upiId}
        </button>
        <p className="mt-3 text-[0.7rem] text-ivory/45">Order ID {orderId} is added to your payment note.</p>
      </section>

      <div>
        <label htmlFor="c-utr" className="eyebrow mb-2 block text-ivory/60">UTR / UPI reference number <span className="text-ivory/40">(Optional)</span></label>
        <input id="c-utr" className={field} value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))} inputMode="numeric" autoComplete="off" placeholder="Optional (or just share screenshot on WhatsApp)" aria-invalid={!!error} aria-describedby={error ? "e-utr" : undefined} />
        {error && <p id="e-utr" className="mt-1.5 text-sm text-[#ff8a7a]">{error}</p>}
        <p className="mt-2 text-xs text-ivory/50">Aap chahein toh UTR chhod sakte hain, bas WhatsApp par payment screenshot bhej dein.</p>
      </div>

      <p className="flex gap-2 rounded-xl bg-lime/10 p-4 text-sm leading-relaxed text-ivory/80"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-lime" /> Your order is confirmed only after the restaurant checks your payment. In the next step you will send the order on WhatsApp. Attach your payment screenshot there.</p>
    </div>
  );
}











