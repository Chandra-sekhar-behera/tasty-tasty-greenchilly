import { useEffect, useState } from "react";
import { driveId, fetchDrivePhoto, photoProblem } from "../lib/menuStore.js";

/**
 * <img> that does not give up when a Google Drive photo link is slow or blocked.
 * Order: the link -> the same link again after 2.5s (new files take a moment) ->
 * Drive thumbnail link -> the photo fetched through your own Google script.
 * Only after all of these fail does it call onGiveUp (the page then shows its fallback).
 */
export default function SmartImg({ src, onGiveUp, ...rest }) {
  const [cur, setCur] = useState(src);
  const [step, setStep] = useState(0);
  useEffect(() => { setCur(src); setStep(0); }, [src]);

  async function fail() {
    const id = driveId(src);
    if (!id || step >= 3) return onGiveUp?.();
    if (step === 0) { await new Promise((r) => setTimeout(r, 2500)); setStep(1); return; }
    if (step === 1) { setCur(`https://drive.google.com/thumbnail?id=${id}&sz=w800`); setStep(2); return; }
    const data = await fetchDrivePhoto(id);
    if (data) { setCur(data); setStep(3); } else onGiveUp?.(photoProblem());
  }
  return <img key={step} src={cur} onError={fail} {...rest} />;
}