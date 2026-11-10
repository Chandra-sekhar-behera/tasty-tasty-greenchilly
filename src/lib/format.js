export const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
export const slugify = (s) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
