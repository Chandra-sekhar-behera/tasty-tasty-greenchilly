/**
 * SINGLE SOURCE OF TRUTH for business facts.
 * Anything marked `confirmed: false` must be verified by the owner before launch.
 */
export const adminConfig = {
  // Paste your Google Apps Script Web App URL here
  cloudUrl: "https://script.google.com/macros/s/AKfycbyPaoFA-tfsy7nZ_O1YXWJ0Ml6exEoBd7AUGuY-5LjFDd3EwIV2X1Lrgj9szhZhRVnaLw/exec",
  localPin: "admin123",
};

export const business = {
  name: "Tasty Tasty Greenchilly",
  shortName: "Greenchilly",
  tagline: "Bold Flavours. Freshly Served.",
  cuisines: ["Indian", "Chinese", "Tandoor"],

  address: {
    line1: "Hari Bhaina Chhaka",
    line2: "Jatni, Khordha, Odisha 752050",
    plusCode: "5M7X+FPR",
    full: "5M7X+FPR, Hari Bhaina Chhaka, Jatni, Khordha, Odisha 752050",
  },

  contact: {
    phoneDisplay: "+91 63704 52277",
    phoneTel: "+916370452277",
    whatsappNumber: "916370452277",
    confirmed: false,
  },

  hours: {
    label: "12 PM – 10 PM",
    note: "Hours as shown on the business listing — please call to confirm before visiting.",
    confirmed: false,
  },

  rating: { value: 4.2, outOf: 5, count: 50, source: "Google business listing" },
  priceRange: "₹200 – ₹400 per person",

  ordering: {
    pickup: true,
    delivery: true,
    deliveryNote: "Delivery availability and charges are confirmed by the restaurant on WhatsApp.",
    confirmed: false,
  },

  payment: {
    upiId: "chandraasekharr1999@okaxis",
    payeeName: "Chandrasekhar Behera",
    halfPercent: 50,
    requiredFor: ["delivery"],
    minimumOrder: 0,
    cooldownMinutes: 10,
  },

  social: { instagram: "", facebook: "" },
  hero: { videoSrc: "", videoPoster: "" },
};

export const mapsDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${business.address.plusCode} Jatni, Odisha`
)}`;

export const googleReviewsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${business.name} ${business.address.plusCode} Jatni`
)}`;