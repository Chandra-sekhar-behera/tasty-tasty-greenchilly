import DoodleCrewFooter from "./DoodleCrewFooter.jsx";
import { business, mapsDirectionsUrl, googleReviewsUrl } from "../config/business.js";
import { enquiryUrl } from "../lib/whatsapp.js";
import { categories, useMenuVersion } from "../lib/menuStore.js";

/* Instagram: change the handle or follower text here */
const IG_HANDLE = "tastytastygreenchilly2";
const IG_FOLLOWERS = "690+ followers";
const IG_URL = business.social.instagram || `https://www.instagram.com/${IG_HANDLE}/`;

// What each little character says when you click it
const CREW = [
  { kind: "yeti", letter: 0, seat: "front", offset: -0.32, name: "Bruno", says: "Bhookh lagi hai. Biryani?" },
  { kind: "bird", letter: 1, seat: "top", offset: 0.02, name: "Pip", says: "Order seedha WhatsApp pe!" },
  { kind: "mushroom", letter: 3, seat: "front", offset: 0.12, scale: 0.95, name: "Morel", says: "Mushroom chilli try karo!" },
  { kind: "kid", letter: 5, seat: "top", offset: -0.05, name: "Juno", says: "Yahan se best view hai!" },
  { kind: "ghost", letter: 8, seat: "behind", offset: 0, name: "Boo", says: "Boo! Ab menu dekho." },
  { kind: "cat", letter: 10, seat: "front", offset: 0.42, flip: true, name: "Patch", says: "Meow. Fish curry?" },
];

export default function Footer() {
  useMenuVersion();

  const columns = [
    {
      title: "Explore",
      links: [
        { label: "Home", href: "/" },
        { label: "Menu", href: "/menu" },
        { label: "About", href: "/about" },
        { label: "Visit Us", href: "/visit-us" },
      ],
    },
    {
      title: "From the menu",
      links: [
        ...categories.slice(0, 4).map((c) => ({ label: c.name, href: `/menu?cat=${c.id}` })),
        { label: "Full menu", href: "/menu" },
      ],
    },
    {
      title: "Order",
      links: [
        { label: "On WhatsApp", href: enquiryUrl() },
        { label: "Call us", href: `tel:${business.contact.phoneTel}` },
        { label: "Directions", href: mapsDirectionsUrl },
        { label: `Google ★ ${business.rating.value}`, href: googleReviewsUrl },
      ],
    },
    {
      title: "Visit",
      links: [
        { label: business.address.line1 },
        { label: "Jatni, Odisha" },
        { label: business.hours.label },
        { label: business.contact.phoneDisplay, href: `tel:${business.contact.phoneTel}` },
      ],
    },
  ];

  return (
    <div className="pb-20 lg:pb-0" style={{ background: "#0c2118" }}>
      <DoodleCrewFooter
        wordmark="GREENCHILLY"
        brand="Tasty Tasty Greenchilly"
        blurb={`Biryani, tandoor grills, curries and Indo-Chinese favourites, cooked fresh at ${business.address.line1}, Jatni.`}
        tagline="Indian, Chinese and Tandoor, freshly served in Jatni."
        columns={columns}
        actions={[
          { label: "Order on WhatsApp", href: enquiryUrl(), icon: "flame", variant: "solid" },
          { label: "Call us", href: `tel:${business.contact.phoneTel}`, icon: "bolt", variant: "outline" },
        ]}
        copyright={`© ${new Date().getFullYear()} ${business.name}. Menu, prices and availability are confirmed on WhatsApp.`}
        legal={[]}
        socials={[{ label: `Instagram · ${IG_FOLLOWERS}`, href: IG_URL }]}
        crew={CREW}
        doodles={["flame", "sandwich", "star", "flame", "heart", "sandwich", "bolt", "sparkle"]}
        preset="night"
        palette={{ background: "#0c2118", ink: "#f7f7f0", accent: "#8bcb35" }}
        height="640px"
      />
    </div>
  );
}