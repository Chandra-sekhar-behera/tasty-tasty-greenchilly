import React from 'react';
import { ShoppingBag, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export function Hero({ onExploreClick }) {
  return (
    <section className="relative bg-neutral-950 text-white py-20 px-4 sm:px-6 overflow-hidden border-b border-neutral-900">
      {/* Static CSS Blur Glows (Zero JS performance cost) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96 bg-lime-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
        
        {/* Trust Badge Pill */}
        <div className="inline-flex items-center gap-2 bg-neutral-900/90 border border-lime-400/40 text-lime-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-inner">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping"></span>
          <span>100% Direct Local Kitchen in Jatni</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
          Tasty Tasty <br />
          <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-green-300 bg-clip-text text-transparent">
            Greenchilly
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-neutral-400 text-sm sm:text-lg max-w-xl mx-auto font-medium leading-relaxed">
          Skip Swiggy & Zomato commissions! Order directly from us for better prices and hot delivery in Jatni. 🚀🔥
        </p>

        {/* Action Buttons with pure CSS hover scale */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={onExploreClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-lime-400 hover:bg-lime-300 text-neutral-950 font-extrabold px-8 py-4 rounded-2xl shadow-lg shadow-lime-400/20 transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Order Direct & Save</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-6 text-xs text-neutral-400 pt-2 sm:pt-0">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-lime-400" />
              <span>Instant WhatsApp Checkout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              <span>Zero Hidden Fees</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}