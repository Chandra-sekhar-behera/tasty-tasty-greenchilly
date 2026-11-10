import { Link } from "react-router-dom";
import { ArrowRight, Home } from "lucide-react";
import { usePageTitle } from "../lib/hooks.js";

export default function NotFound() {
  usePageTitle("Page not found");
  return (
    <section className="noise relative flex min-h-screen items-center justify-center overflow-hidden bg-forest px-5 pt-24 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-violet/20 blur-[120px]" aria-hidden="true" />
      <div className="relative">
        <p className="font-serif text-[9rem] font-semibold italic leading-none text-lime-gradient sm:text-[14rem]">404</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">This plate isn't on the menu</h1>
        <p className="mx-auto mt-4 max-w-md text-ivory/65">The page you're looking for doesn't exist or has moved. Let's get you back to something delicious.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link to="/" className="btn btn-lime"><Home size={16} /> Back to homepage</Link>
          <Link to="/menu" className="btn btn-ghost">View menu <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
}
