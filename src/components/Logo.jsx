import logo from "../assets/Tasty Tasty Greenchilly Logo.png";

// The logo image must be saved as src/assets/logo.webp
export default function Logo({ large = false }) {
  return (
    <img
      src={logo}
      alt="Tasty Tasty Greenchilly, Family Restaurant"
      width="800"
      height="591"
      decoding="async"
      className={`block w-auto select-none rounded-xl object-contain ${large ? "h-28 sm:h-32" : "h-14 sm:h-[3.75rem] lg:h-[4.5rem]"}`}
    />
  );
}