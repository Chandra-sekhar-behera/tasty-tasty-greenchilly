import { ShieldCheck } from "lucide-react";
import PayLogo from "./PayLogo.jsx";
import { inr } from "../lib/format.js";

/**
 * "Pay with" section for the checkout page.
 *   1. PhonePe / Google Pay / Paytm  : three buttons in a row, each opens its UPI app with the amount filled in
 *   2. separator line
 *   3. Scan QR code  /  Other UPI app
 *
 * Props
 *   apps        list from upiAppLinks()   [{ id, label, href }, ...]
 *   amount      number to pay now         (payableAmount(subtotal, plan))
 *   choice      currently selected id
 *   onPay(id)   called with "phonepe" | "gpay" | "paytm" | "qr" | "any" | "gateway"
 *   disabled    true while ordering is closed / below minimum
 *   busy        true while the secure checkout is opening
 *   gateway     true if Razorpay secure checkout is configured
 */
export default function PaymentOptions({ apps, amount, choice, onPay, disabled = false, busy = false, gateway = false }) {
  const row = ["phonepe", "gpay", "paytm"].map((id) => apps.find((a) => a.id === id)).filter(Boolean);
  return (
    <div>
      <p className="eyebrow mb-3 text-ivory/55">Pay with</p>

      {gateway && (
        <button type="button" onClick={() => onPay("gateway")} disabled={busy || disabled} className="btn btn-lime mb-4 w-full justify-center">
          <ShieldCheck size={16} /> Pay {inr(amount)} · Secure checkout
        </button>
      )}

      <div className="grid grid-cols-3 gap-3">
        {row.map((a) => {
          const on = choice === a.id;
          return (
            <button key={a.id} type="button" onClick={() => onPay(a.id)} disabled={disabled} aria-label={`Pay via ${a.label}`}
              className={`flex h-24 flex-col items-center justify-center gap-2 rounded-xl border px-1 text-center transition active:scale-[0.97] disabled:opacity-50 ${on ? "border-lime bg-lime/10" : "border-ivory/15 bg-ivory/[0.03] hover:border-lime/60"}`}>
              <PayLogo id={a.id} size={40} />
              <span className="text-xs font-semibold leading-none sm:text-sm">{a.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-ivory/45">Tap an app. It opens with {inr(amount)} already filled in.</p>

      <div className="my-5 flex items-center gap-3 text-ivory/45">
        <hr className="flex-grow border-t border-ivory/15" />
        <span className="text-xs font-medium">or pay using QR / another UPI app</span>
        <hr className="flex-grow border-t border-ivory/15" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => onPay("qr")} disabled={disabled} className="flex items-center gap-3 rounded-xl border border-ivory/15 p-3 text-left transition hover:border-lime disabled:opacity-50">
          <PayLogo id="qr" size={38} />
          <span className="min-w-0"><span className="block text-sm font-semibold">Scan QR code</span><span className="block text-xs text-ivory/50">From another phone or computer</span></span>
        </button>
        <button type="button" onClick={() => onPay("any")} disabled={disabled} className="flex items-center gap-3 rounded-xl border border-ivory/15 p-3 text-left transition hover:border-lime disabled:opacity-50">
          <PayLogo id="any" size={38} />
          <span className="min-w-0"><span className="block text-sm font-semibold">Other UPI app</span><span className="block text-xs text-ivory/50">BHIM, Amazon Pay, bank apps…</span></span>
        </button>
      </div>
    </div>
  );
}