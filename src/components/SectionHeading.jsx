import Reveal from "./Reveal.jsx";

export default function SectionHeading({ eyebrow, title, accent, children, align = "center", light = false }) {
  const a = align === "center" ? "mx-auto text-center items-center" : "text-left items-start";
  return (
    <Reveal className={`flex max-w-3xl flex-col ${a}`}>
      <span className={`eyebrow ${light ? "text-heritage" : "text-lime"}`}>{eyebrow}</span>
      <span className={`mt-4 h-px w-14 ${light ? "bg-heritage/50" : "bg-lime/50"}`} />
      <h2 className={`mt-5 font-serif text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl ${light ? "text-charcoal" : "text-ivory"}`}>
        {title} {accent && <em className={`font-medium italic ${light ? "text-heritage" : "text-lime-gradient"}`}>{accent}</em>}
      </h2>
      {children && <p className={`mt-5 max-w-2xl text-base leading-relaxed sm:text-lg ${light ? "text-charcoal/70" : "text-ivory/70"}`}>{children}</p>}
    </Reveal>
  );
}
