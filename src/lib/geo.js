import { business } from "../config/business.js";

/** Restaurant location (from plus code 5M7X+FPR, Jatni). To override, add  geo: { lat, lng }  inside business.address. */
export const RESTAURANT = (business.address && business.address.geo) || { lat: 20.16371, lng: 85.6993 };

/** Straight-line distance in km between two {lat, lng} points. */
export function haversineKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Turns a map pin into a readable address (free OpenStreetMap service). Throws if offline. */
export async function reverseGeocode(lat, lng, signal) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${lat}&lon=${lng}`;
  const r = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("geocode failed");
  const j = await r.json();
  const a = j.address || {};
  const parts = [
    a.house_number,
    a.road || a.pedestrian || a.path,
    a.neighbourhood || a.suburb || a.quarter,
    a.village || a.town || a.city || a.hamlet,
    a.state_district || a.county,
    a.postcode,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : j.display_name || "";
}