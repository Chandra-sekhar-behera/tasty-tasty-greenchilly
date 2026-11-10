/**
 * SINGLE SOURCE OF TRUTH for business facts.
 * Anything marked `confirmed: false` must be verified by the owner before launch.
 */
export const adminConfig = {
  // Paste your Google Apps Script Web App URL here (see ADMIN_SETUP). Leave "" to use this browser only.
  cloudUrl: "https://script.google.com/macros/s/AKfycbyPaoFA-tfsy7nZ_O1YXWJ0Ml6exEoBd7AUGuY-5LjFDd3EwIV2X1Lrgj9szhZhRVnaLw/exec",
  // Used ONLY when cloudUrl is empty. With a cloudUrl the PIN is checked by your Apps Script instead.
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
    whatsappNumber: "916370452277", // digits only, country code first (owner to confirm)
    confirmed: false,
  },

  // Listed on the Google business listing supplied by the owner. Owner to confirm.
  hours: {
    label: "12 PM – 10 PM",
    note: "Hours as shown on the business listing — please call to confirm before visiting.",
    confirmed: false,
  },

  // Supplied Google listing data. Do not edit without a fresh source.
  rating: { value: 4.2, outOf: 5, count: 50, source: "Google business listing" },
  priceRange: "₹200 – ₹400 per person",

  ordering: {
    // Set `delivery` to false if the restaurant does not deliver.
    pickup: true,
    delivery: true,
    deliveryNote: "Delivery availability and charges are confirmed by the restaurant on WhatsApp.",
    confirmed: false,
  },

  // UPI advance payment. Leave upiId "" to switch payment OFF completely.
  payment: {
    upiId: "chandraasekharr1999@okaxis",   // <-- CHANGE to the restaurant's own UPI ID before going live
    payeeName: "Chandrasekhar Behera",      // name shown to the customer in their UPI app
    halfPercent: 50,                        // "Half" = this % of the subtotal
    requiredFor: ["delivery"],              // which order types must pay first: "delivery", "pickup"
    minimumOrder: 0,                        // in rupees; 0 = no minimum
    cooldownMinutes: 10,                    // one new order per device in this time (stops spam)
  },

  // Only add real, verified URLs. Empty = nothing is rendered.
  social: { instagram: "", facebook: "" },

  // Set to a real file in /public (e.g. "/hero.mp4") to enable a muted looping hero video.
  hero: { videoSrc: "", videoPoster: "" },
};

export const mapsDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${business.address.plusCode} Jatni, Odisha`
)}`;

export const googleReviewsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${business.name} ${business.address.plusCode} Jatni`
)}`;