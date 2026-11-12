import { ShieldCheck, QrCode } from "lucide-react";
import { siGooglepay, siPhonepe, siPaytm } from "simple-icons";

/**
 * Real logos: put your downloaded logo files in  src/assets/pay/
 * Any file name works as long as it contains the app name, e.g.
 *   icons8-google-pay-india-color-96.png   (Google Pay: name has "google" or "gpay")
 *   icons8-phone-pe-color-96.png           (PhonePe:    name has "phone")
 *   icons8-paytm-color-96.png              (Paytm:      name has "paytm")
 *   upi.png                                (optional, "Other UPI app")
 * png / webp / jpg / svg all work. No file = the open-source brand mark from "simple-icons" is shown.
 */
const files = import.meta.glob("../assets/pay/*.{png,jpg,jpeg,webp,svg}", { eager: true, query: "?url", import: "default" });
const PATTERNS = { gpay: /google|gpay|tez/i, phonepe: /phone/i, paytm: /paytm/i, upi: /(^|[^a-z])upi/i };
const fileFor = (id) => {
  const rx = PATTERNS[id];
  const hit = rx && Object.entries(files).filter(([p]) => rx.test(p.split("/").pop())).sort((x, y) => y[0].length - x[0].length);
  return hit && hit.length ? hit[0][1] : undefined;
};

const BRANDS = {
  phonepe: { icon: siPhonepe, label: "PhonePe" },
  gpay: { icon: siGooglepay, label: "Google Pay" },
  paytm: { icon: siPaytm, label: "Paytm" },
};

export default function PayLogo({ id, size = 44 }) {
  const box = { width: size, height: size };
  const own = fileFor(id === "any" ? "upi" : id);
  if (own) {
    return (
      <span className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1" style={box}>
        <img src={own} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }
  const b = BRANDS[id];
  if (b) {
    return (
      <span className="grid shrink-0 place-items-center rounded-xl bg-white" style={box} role="img" aria-label={b.label}>
        <svg viewBox="0 0 24 24" width={size * 0.66} height={size * 0.66} fill={`#${b.icon.hex}`} aria-hidden="true"><path d={b.icon.path} /></svg>
      </span>
    );
  }
  if (id === "gateway") {
    return <span className="grid shrink-0 place-items-center rounded-xl bg-lime text-ink" style={box} aria-hidden="true"><ShieldCheck size={size * 0.55} /></span>;
  }
  if (id === "qr") {
    return <span className="grid shrink-0 place-items-center rounded-xl bg-white text-ink" style={box} aria-hidden="true"><QrCode size={size * 0.55} /></span>;
  }
  return (
    <span className="grid shrink-0 place-items-center rounded-xl bg-white text-[0.7rem] font-extrabold tracking-wide text-ink" style={box} aria-hidden="true">UPI</span>
  );
}