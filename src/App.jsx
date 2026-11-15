import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import MobileCartBar from "./components/MobileCartBar.jsx";
import ChatAssistant from "./components/ChatAssistant.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const Menu = lazy(() => import("./pages/Menu.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const VisitUs = lazy(() => import("./pages/VisitUs.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));

function RouteEffects() {
  const { pathname, hash } = useLocation();
  
  useEffect(() => {
    // Browser ke default scroll restoration ko manually 'manual' set karna safe rehta hai
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Ek chota timeout/requestAnimationFrame dene se DOM paint hone ke baad scroll execute hoga
    const timer = setTimeout(() => {
      if (hash) {
        const el = document.getElementById(hash.slice(1));
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      
      const main = document.getElementById("main");
      if (main && pathname) main.focus({ preventScroll: true });
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname, hash]);

  return null;
}

// Fallback ki height ko min-h-screen kar diya hai taaki layout shift na ho
const Fallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-ink" aria-busy="true" aria-label="Loading page">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime border-t-transparent" />
  </div>
);

export default function App() {
  const { pathname } = useLocation();
  const bare = pathname === "/checkout";
  
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
      {!bare && <Footer />}
      {!bare && <MobileCartBar />}
      <CartDrawer />
      {!bare && <ChatAssistant />}
      <SpeedInsights />
    </div>
  );
}