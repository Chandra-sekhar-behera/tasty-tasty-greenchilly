import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Navbar from "./components/Navbar.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import MobileCartBar from "./components/MobileCartBar.jsx";
import Home from "./pages/Home.jsx"; // landing page loads up-front: no spinner->chunk->image waterfall

const Footer = lazy(() => import("./components/Footer.jsx"));
const ChatAssistant = lazy(() => import("./components/ChatAssistant.jsx"));

// Heavy, non-critical widgets are fetched after the page is interactive
function useAfterIdle() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const go = () => setReady(true);
    const id = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 3000 }) : setTimeout(go, 2000);
    return () => { window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id); };
  }, []);
  return ready;
}

const Menu = lazy(() => import("./pages/Menu.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const VisitUs = lazy(() => import("./pages/VisitUs.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));

function RouteEffects() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const timer = setTimeout(() => {
      if (hash) {
        const el = document.getElementById(hash.slice(1));
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      const main = document.getElementById("main");
      if (main && pathname) main.focus({ preventScroll: true });
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname, hash]);

  return null;
}

const Fallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-ink" aria-busy="true" aria-label="Loading page">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime border-t-transparent" />
  </div>
);

export default function App() {
  const { pathname } = useLocation();
  const bare = pathname === "/checkout";
  const idle = useAfterIdle();

  return (
    <div className="flex min-h-screen flex-col bg-ink text-ivory">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-lime focus:px-5 focus:py-3 focus:text-ink">
        Skip to content
      </a>
      <RouteEffects />
      {!bare && <Navbar />}
      <main id="main" tabIndex={-1} className="flex-1">
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/about" element={<About />} />
            <Route path="/visit-us" element={<VisitUs />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!bare && (
        <Suspense fallback={<div className="min-h-[24rem] bg-forest" aria-hidden="true" />}>
          <Footer />
        </Suspense>
      )}
      {!bare && <MobileCartBar />}
      <CartDrawer />
      {!bare && idle && (
        <Suspense fallback={null}>
          <ChatAssistant />
        </Suspense>
      )}
      {idle && <SpeedInsights />}
    </div>
  );
}