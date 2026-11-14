import { useEffect, useState } from "react";
import { driveId, fetchDrivePhoto, photoProblem } from "../lib/menuStore.js";

/**
 * <img> that handles Google Drive photo fallback and is optimized for mobile devices
 * with lazy loading, responsive sizing, and WebP format support.
 */
export default function SmartImg({ src, onGiveUp, alt = "", className = "", ...rest }) {
  const [cur, setCur] = useState(src);
  const [step, setStep] = useState(0);

  useEffect(() => { 
    setCur(src); 
    setStep(0); 
  }, [src]);

  async function fail() {
    const id = driveId(src);
    if (!id || step >= 3) return onGiveUp?.();
    if (step === 0) { 
      await new Promise((r) => setTimeout(r, 2500)); 
      setStep(1); 
      return; 
    }
    if (step === 1) { 
      // Optimized for mobile/desktop view using dynamic width parameters
      setCur(`https://drive.google.com/thumbnail?id=${id}&sz=w800`); 
      setStep(2); 
      return; 
    }
    const data = await fetchDrivePhoto(id);
    if (data) { 
      setCur(data); 
      setStep(3); 
    } else {
      onGiveUp?.(photoProblem());
    }
  }

  return (
    <img 
      key={step} 
      src={cur} 
      onError={fail} 
      alt={alt}
      loading="lazy" // Mobile performance optimization for lazy loading
      decoding="async" // Improves scrolling performance on mobile devices
      className={`transition-opacity duration-300 ${className}`}
      {...rest} 
    />
  );
}