import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import MobileCartBar from "./components/MobileCartBar.jsx";
import Home from "./pages/Home.jsx";
import ChatAssistant from "./components/ChatAssistant.jsx";

const Menu = lazy(() => import("./pages/Menu.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const VisitUs = lazy(() => import("./pages/VisitUs.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function RouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
    // Move focus to the new page for keyboard / screen-reader users
    const main = document.getElementById("main");
    if (main && pathname) main.focus({ preventScroll: true });
  }, [pathname, hash]);
  return null;
}

const Fallback = () => <div className="min-h-[70vh]" aria-busy="true" aria-label="Loading page" />;

export default function App() {
  const { pathname } = useLocation();
  // Checkout is a distraction-free page (like Swiggy / Zomato): no navbar, footer, chat or floating cart bar.
  const focused = pathname.startsWith("/checkout");

  return (
    <div className="flex min-h-screen flex-col bg-ink text-ivory">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-lime focus:px-5 focus:py-3 focus:text-ink">
        Skip to content
      </a>
      <RouteEffects />
      {!focused && <Navbar />}
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
      {!focused && <Footer />}
      {!focused && <MobileCartBar />}
      <CartDrawer />
      {!focused && <ChatAssistant />}
    </div>
  );
}