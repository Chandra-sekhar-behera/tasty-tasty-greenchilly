import { useEffect, useRef, useState } from "react";
import { LocateFixed, Hand, Lock } from "lucide-react";

const FLAME = '<svg viewBox="0 0 24 24" width="20" height="20" fill="#08140e"><path d="M12 2c1 4-3 5-3 9a3 3 0 0 0 6 0c0-1-.5-2-1-3 3 1 5 4 5 7a7 7 0 0 1-14 0c0-6 5-7 7-13z"/></svg>';
const DOT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="#8bcb35"><circle cx="12" cy="12" r="7"/></svg>';
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_SRI = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";

/** Loads Leaflet from a CDN the first time the map is needed, so no npm package is required. */
let leafletPromise = null;
function loadLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.L) return Promise.resolve(window.L);
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = LEAFLET_JS;
      s.integrity = LEAFLET_SRI;
      s.crossOrigin = "anonymous";
      s.async = true;
      s.onload = () => (window.L ? resolve(window.L) : reject(new Error("Leaflet missing")));
      s.onerror = () => { leafletPromise = null; reject(new Error("Leaflet failed to load")); };
      document.head.appendChild(s);
    });
  }
  return leafletPromise;
}

const pinIcon = (L, cls, svg) =>
  L.divIcon({ className: "gc-pin", html: `<div class="gc-pin-body ${cls}"><span>${svg}</span></div><i class="gc-pin-shadow"></i>`, iconSize: [40, 48], iconAnchor: [20, 46] });

// Leaflet's own stylesheet (v1.9.4), embedded here so no extra CSS file has to be resolved
const LEAFLET_CSS = ".leaflet-pane, .leaflet-tile, .leaflet-marker-icon, .leaflet-marker-shadow, .leaflet-tile-container, .leaflet-pane > svg, .leaflet-pane > canvas, .leaflet-zoom-box, .leaflet-image-layer, .leaflet-layer{position:absolute;left:0;top:0;} .leaflet-container{overflow:hidden;} .leaflet-tile, .leaflet-marker-icon, .leaflet-marker-shadow{-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-user-drag:none;} .leaflet-tile::selection{background:transparent;} .leaflet-safari .leaflet-tile{image-rendering:-webkit-optimize-contrast;} .leaflet-safari .leaflet-tile-container{width:1600px;height:1600px;-webkit-transform-origin:0 0;} .leaflet-marker-icon, .leaflet-marker-shadow{display:block;} .leaflet-container .leaflet-overlay-pane svg{max-width:none !important;max-height:none !important;} .leaflet-container .leaflet-marker-pane img, .leaflet-container .leaflet-shadow-pane img, .leaflet-container .leaflet-tile-pane img, .leaflet-container img.leaflet-image-layer, .leaflet-container .leaflet-tile{max-width:none !important;max-height:none !important;width:auto;padding:0;} .leaflet-container img.leaflet-tile{mix-blend-mode:plus-lighter;} .leaflet-container.leaflet-touch-zoom{-ms-touch-action:pan-x pan-y;touch-action:pan-x pan-y;} .leaflet-container.leaflet-touch-drag{-ms-touch-action:pinch-zoom;touch-action:none;touch-action:pinch-zoom;} .leaflet-container.leaflet-touch-drag.leaflet-touch-zoom{-ms-touch-action:none;touch-action:none;} .leaflet-container{-webkit-tap-highlight-color:transparent;} .leaflet-container a{-webkit-tap-highlight-color:rgba(51, 181, 229, 0.4);} .leaflet-tile{filter:inherit;visibility:hidden;} .leaflet-tile-loaded{visibility:inherit;} .leaflet-zoom-box{width:0;height:0;-moz-box-sizing:border-box;box-sizing:border-box;z-index:800;} .leaflet-overlay-pane svg{-moz-user-select:none;} .leaflet-pane{z-index:400;} .leaflet-tile-pane{z-index:200;} .leaflet-overlay-pane{z-index:400;} .leaflet-shadow-pane{z-index:500;} .leaflet-marker-pane{z-index:600;} .leaflet-tooltip-pane{z-index:650;} .leaflet-popup-pane{z-index:700;} .leaflet-map-pane canvas{z-index:100;} .leaflet-map-pane svg{z-index:200;} .leaflet-vml-shape{width:1px;height:1px;} .lvml{behavior:url(#default#VML);display:inline-block;position:absolute;} .leaflet-control{position:relative;z-index:800;pointer-events:visiblePainted;pointer-events:auto;} .leaflet-top, .leaflet-bottom{position:absolute;z-index:1000;pointer-events:none;} .leaflet-top{top:0;} .leaflet-right{right:0;} .leaflet-bottom{bottom:0;} .leaflet-left{left:0;} .leaflet-control{float:left;clear:both;} .leaflet-right .leaflet-control{float:right;} .leaflet-top .leaflet-control{margin-top:10px;} .leaflet-bottom .leaflet-control{margin-bottom:10px;} .leaflet-left .leaflet-control{margin-left:10px;} .leaflet-right .leaflet-control{margin-right:10px;} .leaflet-fade-anim .leaflet-popup{opacity:0;-webkit-transition:opacity 0.2s linear;-moz-transition:opacity 0.2s linear;transition:opacity 0.2s linear;} .leaflet-fade-anim .leaflet-map-pane .leaflet-popup{opacity:1;} .leaflet-zoom-animated{-webkit-transform-origin:0 0;-ms-transform-origin:0 0;transform-origin:0 0;} svg.leaflet-zoom-animated{will-change:transform;} .leaflet-zoom-anim .leaflet-zoom-animated{-webkit-transition:-webkit-transform 0.25s cubic-bezier(0,0,0.25,1);-moz-transition:-moz-transform 0.25s cubic-bezier(0,0,0.25,1);transition:transform 0.25s cubic-bezier(0,0,0.25,1);} .leaflet-zoom-anim .leaflet-tile, .leaflet-pan-anim .leaflet-tile{-webkit-transition:none;-moz-transition:none;transition:none;} .leaflet-zoom-anim .leaflet-zoom-hide{visibility:hidden;} .leaflet-interactive{cursor:pointer;} .leaflet-grab{cursor:-webkit-grab;cursor:-moz-grab;cursor:grab;} .leaflet-crosshair, .leaflet-crosshair .leaflet-interactive{cursor:crosshair;} .leaflet-popup-pane, .leaflet-control{cursor:auto;} .leaflet-dragging .leaflet-grab, .leaflet-dragging .leaflet-grab .leaflet-interactive, .leaflet-dragging .leaflet-marker-draggable{cursor:move;cursor:-webkit-grabbing;cursor:-moz-grabbing;cursor:grabbing;} .leaflet-marker-icon, .leaflet-marker-shadow, .leaflet-image-layer, .leaflet-pane > svg path, .leaflet-tile-container{pointer-events:none;} .leaflet-marker-icon.leaflet-interactive, .leaflet-image-layer.leaflet-interactive, .leaflet-pane > svg path.leaflet-interactive, svg.leaflet-image-layer.leaflet-interactive path{pointer-events:visiblePainted;pointer-events:auto;} .leaflet-container{background:#ddd;outline-offset:1px;} .leaflet-container a{color:#0078A8;} .leaflet-zoom-box{border:2px dotted #38f;background:rgba(255,255,255,0.5);} .leaflet-container{font-family:\"Helvetica Neue\", Arial, Helvetica, sans-serif;font-size:12px;font-size:0.75rem;line-height:1.5;} .leaflet-bar{box-shadow:0 1px 5px rgba(0,0,0,0.65);border-radius:4px;} .leaflet-bar a{background-color:#fff;border-bottom:1px solid #ccc;width:26px;height:26px;line-height:26px;display:block;text-align:center;text-decoration:none;color:black;} .leaflet-bar a, .leaflet-control-layers-toggle{background-position:50% 50%;background-repeat:no-repeat;display:block;} .leaflet-bar a:hover, .leaflet-bar a:focus{background-color:#f4f4f4;} .leaflet-bar a:first-child{border-top-left-radius:4px;border-top-right-radius:4px;} .leaflet-bar a:last-child{border-bottom-left-radius:4px;border-bottom-right-radius:4px;border-bottom:none;} .leaflet-bar a.leaflet-disabled{cursor:default;background-color:#f4f4f4;color:#bbb;} .leaflet-touch .leaflet-bar a{width:30px;height:30px;line-height:30px;} .leaflet-touch .leaflet-bar a:first-child{border-top-left-radius:2px;border-top-right-radius:2px;} .leaflet-touch .leaflet-bar a:last-child{border-bottom-left-radius:2px;border-bottom-right-radius:2px;} .leaflet-control-zoom-in, .leaflet-control-zoom-out{font:bold 18px 'Lucida Console', Monaco, monospace;text-indent:1px;} .leaflet-touch .leaflet-control-zoom-in, .leaflet-touch .leaflet-control-zoom-out{font-size:22px;} .leaflet-control-layers{box-shadow:0 1px 5px rgba(0,0,0,0.4);background:#fff;border-radius:5px;} .leaflet-control-layers-toggle{background-image:none;width:36px;height:36px;} .leaflet-retina .leaflet-control-layers-toggle{background-image:none;background-size:26px 26px;} .leaflet-touch .leaflet-control-layers-toggle{width:44px;height:44px;} .leaflet-control-layers .leaflet-control-layers-list, .leaflet-control-layers-expanded .leaflet-control-layers-toggle{display:none;} .leaflet-control-layers-expanded .leaflet-control-layers-list{display:block;position:relative;} .leaflet-control-layers-expanded{padding:6px 10px 6px 6px;color:#333;background:#fff;} .leaflet-control-layers-scrollbar{overflow-y:scroll;overflow-x:hidden;padding-right:5px;} .leaflet-control-layers-selector{margin-top:2px;position:relative;top:1px;} .leaflet-control-layers label{display:block;font-size:13px;font-size:1.08333em;} .leaflet-control-layers-separator{height:0;border-top:1px solid #ddd;margin:5px -10px 5px -6px;} .leaflet-default-icon-path{background-image:none;} .leaflet-container .leaflet-control-attribution{background:#fff;background:rgba(255, 255, 255, 0.8);margin:0;} .leaflet-control-attribution, .leaflet-control-scale-line{padding:0 5px;color:#333;line-height:1.4;} .leaflet-control-attribution a{text-decoration:none;} .leaflet-control-attribution a:hover, .leaflet-control-attribution a:focus{text-decoration:underline;} .leaflet-attribution-flag{display:inline !important;vertical-align:baseline !important;width:1em;height:0.6669em;} .leaflet-left .leaflet-control-scale{margin-left:5px;} .leaflet-bottom .leaflet-control-scale{margin-bottom:5px;} .leaflet-control-scale-line{border:2px solid #777;border-top:none;line-height:1.1;padding:2px 5px 1px;white-space:nowrap;-moz-box-sizing:border-box;box-sizing:border-box;background:rgba(255, 255, 255, 0.8);text-shadow:1px 1px #fff;} .leaflet-control-scale-line:not(:first-child){border-top:2px solid #777;border-bottom:none;margin-top:-2px;} .leaflet-control-scale-line:not(:first-child):not(:last-child){border-bottom:2px solid #777;} .leaflet-touch .leaflet-control-attribution, .leaflet-touch .leaflet-control-layers, .leaflet-touch .leaflet-bar{box-shadow:none;} .leaflet-touch .leaflet-control-layers, .leaflet-touch .leaflet-bar{border:2px solid rgba(0,0,0,0.2);background-clip:padding-box;} .leaflet-popup{position:absolute;text-align:center;margin-bottom:20px;} .leaflet-popup-content-wrapper{padding:1px;text-align:left;border-radius:12px;} .leaflet-popup-content{margin:13px 24px 13px 20px;line-height:1.3;font-size:13px;font-size:1.08333em;min-height:1px;} .leaflet-popup-content p{margin:17px 0;margin:1.3em 0;} .leaflet-popup-tip-container{width:40px;height:20px;position:absolute;left:50%;margin-top:-1px;margin-left:-20px;overflow:hidden;pointer-events:none;} .leaflet-popup-tip{width:17px;height:17px;padding:1px;margin:-10px auto 0;pointer-events:auto;-webkit-transform:rotate(45deg);-moz-transform:rotate(45deg);-ms-transform:rotate(45deg);transform:rotate(45deg);} .leaflet-popup-content-wrapper, .leaflet-popup-tip{background:white;color:#333;box-shadow:0 3px 14px rgba(0,0,0,0.4);} .leaflet-container a.leaflet-popup-close-button{position:absolute;top:0;right:0;border:none;text-align:center;width:24px;height:24px;font:16px/24px Tahoma, Verdana, sans-serif;color:#757575;text-decoration:none;background:transparent;} .leaflet-container a.leaflet-popup-close-button:hover, .leaflet-container a.leaflet-popup-close-button:focus{color:#585858;} .leaflet-popup-scrolled{overflow:auto;} .leaflet-oldie .leaflet-popup-content-wrapper{-ms-zoom:1;} .leaflet-oldie .leaflet-popup-tip{width:24px;margin:0 auto;-ms-filter:\"progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678)\";filter:progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678);} .leaflet-oldie .leaflet-control-zoom, .leaflet-oldie .leaflet-control-layers, .leaflet-oldie .leaflet-popup-content-wrapper, .leaflet-oldie .leaflet-popup-tip{border:1px solid #999;} .leaflet-div-icon{background:#fff;border:1px solid #666;} .leaflet-tooltip{position:absolute;padding:6px;background-color:#fff;border:1px solid #fff;border-radius:3px;color:#222;white-space:nowrap;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,0.4);} .leaflet-tooltip.leaflet-interactive{cursor:pointer;pointer-events:auto;} .leaflet-tooltip-top:before, .leaflet-tooltip-bottom:before, .leaflet-tooltip-left:before, .leaflet-tooltip-right:before{position:absolute;pointer-events:none;border:6px solid transparent;background:transparent;content:\"\";} .leaflet-tooltip-bottom{margin-top:6px;} .leaflet-tooltip-top{margin-top:-6px;} .leaflet-tooltip-bottom:before, .leaflet-tooltip-top:before{left:50%;margin-left:-6px;} .leaflet-tooltip-top:before{bottom:0;margin-bottom:-12px;border-top-color:#fff;} .leaflet-tooltip-bottom:before{top:0;margin-top:-12px;margin-left:-6px;border-bottom-color:#fff;} .leaflet-tooltip-left{margin-left:-6px;} .leaflet-tooltip-right{margin-left:6px;} .leaflet-tooltip-left:before, .leaflet-tooltip-right:before{top:50%;margin-top:-6px;} .leaflet-tooltip-left:before{right:0;margin-right:-12px;border-left-color:#fff;} .leaflet-tooltip-right:before{left:0;margin-left:-12px;border-right-color:#fff;} @media print{.leaflet-control{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}";

const CSS = `
.gc-map .leaflet-container{background:#0c2118;font-family:inherit;outline:none}
.gc-map .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.92) contrast(.88) saturate(.5)}
.gc-map .leaflet-control-attribution{background:rgba(8,20,14,.75)!important;color:#9fb0a6!important;font-size:10px}
.gc-map .leaflet-control-attribution a{color:#8bcb35!important}
.gc-map .leaflet-bar a{background:#0c2118;color:#f7f7f0;border-color:rgba(247,247,240,.15)}
.gc-map .leaflet-bar a:hover{background:#123d2a;color:#8bcb35}
.gc-pin{background:none;border:0}
.gc-pin-body{position:relative;width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;border:2px solid #08140e;box-shadow:0 8px 18px rgba(0,0,0,.55)}
.gc-pin-body span{transform:rotate(45deg);display:grid;place-items:center}
.gc-pin-body.rest{background:#8bcb35}
.gc-pin-body.you{background:#f7f7f0;animation:gc-drop .5s cubic-bezier(.3,1.5,.5,1)}
.gc-pin-shadow{position:absolute;left:10px;top:42px;width:20px;height:6px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(2px)}
@keyframes gc-drop{0%{transform:rotate(-45deg) translate(14px,-40px);opacity:0}100%{transform:rotate(-45deg);opacity:1}}
@media (prefers-reduced-motion:reduce){.gc-pin-body.you{animation:none}}
`;

/**
 * Interactive delivery map (OpenStreetMap). The customer taps the map or drags the pin.
 * value: {lat, lng} | null     onChange({lat, lng})     onLocate(): use phone GPS
 */
export default function DeliveryMap({ restaurant, value, onChange, onLocate, locating }) {
  const box = useRef(null);
  const api = useRef({});
  const emitted = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const coarse = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(hover: none)").matches;
  const [locked, setLocked] = useState(coarse); // phones: map is locked so the page can still scroll
  const [hasPin, setHasPin] = useState(!!value);
  const [L, setL] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    loadLeaflet().then((l) => live && setL(l)).catch(() => live && setFailed(true));
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || !L) return;
    const map = L.map(el, { center: [restaurant.lat, restaurant.lng], zoom: 15, zoomControl: false, scrollWheelZoom: false, attributionControl: true });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    const R = [restaurant.lat, restaurant.lng];
    L.marker(R, { icon: pinIcon(L, "rest", FLAME), interactive: false, keyboard: false, zIndexOffset: 100 }).addTo(map);

    let you = null;
    let line = null;
    const put = (ll, fit) => {
      if (!you) {
        you = L.marker(ll, { icon: pinIcon(L, "you", DOT), draggable: true, autoPan: true, zIndexOffset: 500 }).addTo(map);
        line = L.polyline([R, ll], { color: "#8bcb35", weight: 3, dashArray: "6 9", opacity: 0.9 }).addTo(map);
        you.on("drag", () => line.setLatLngs([R, you.getLatLng()]));
        you.on("dragend", () => {
          const p = you.getLatLng();
          const v = { lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) };
          emitted.current = v;
          onChangeRef.current(v);
        });
      } else {
        you.setLatLng(ll);
        line.setLatLngs([R, ll]);
      }
      setHasPin(true);
      if (fit) map.fitBounds(L.latLngBounds([R, ll]), { padding: [56, 56], maxZoom: 16, animate: true });
    };
    map.on("click", (e) => {
      const v = { lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) };
      emitted.current = v;
      put(e.latlng, false);
      onChangeRef.current(v);
    });
    map.on("focus", () => map.scrollWheelZoom.enable());
    map.on("blur", () => map.scrollWheelZoom.disable());
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => map.invalidateSize()) : null;
    ro && ro.observe(el);
    api.current = { put, map };
    return () => { ro && ro.disconnect(); map.remove(); api.current = {}; };
  }, [L, restaurant.lat, restaurant.lng]);

  // when the parent changes the location (for example "use my current location"), move the pin
  useEffect(() => {
    if (!L || !value || !api.current.put) return;
    const e = emitted.current;
    if (e && e.lat === value.lat && e.lng === value.lng) return; // that was our own click / drag
    api.current.put([value.lat, value.lng], true);
  }, [L, value]);

  return (
    <div className="gc-map relative overflow-hidden rounded-2xl border border-ivory/10 bg-forest">
      <style>{LEAFLET_CSS + CSS}</style>
      <div ref={box} className="h-[300px] w-full sm:h-[360px]" role="application" aria-label="Delivery map. Tap to drop your pin, drag the pin to adjust." />

      {failed && (
        <div className="absolute inset-0 z-[1200] grid place-items-center bg-forest p-6 text-center text-sm text-ivory/70">
          The map could not load. Please type your full address above instead.
        </div>
      )}

      <button
        type="button"
        onClick={onLocate}
        disabled={locating}
        className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-2 rounded-full border border-ivory/20 bg-ink/85 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-lime shadow-lg backdrop-blur-sm transition hover:border-lime disabled:opacity-60"
      >
        <LocateFixed size={14} className={locating ? "animate-spin" : ""} /> {locating ? "Locating" : "My location"}
      </button>

      <p className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[62%] rounded-full bg-ink/85 px-3 py-1.5 text-xs text-ivory/85 shadow-lg backdrop-blur-sm">
        {hasPin ? "Drag the pin to your door" : "Tap the map to drop your pin"}
      </p>

      {coarse && !locked && (
        <button type="button" onClick={() => setLocked(true)} className="absolute left-3 top-3 z-[1000] inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-2 text-xs font-bold uppercase tracking-wider text-ink shadow-lg">
          <Lock size={13} /> Done
        </button>
      )}
      {coarse && locked && (
        <button type="button" onClick={() => setLocked(false)} aria-label="Unlock map to move the pin" className="absolute inset-0 z-[1100] grid place-items-center bg-ink/25 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-ink/90 px-4 py-2.5 text-sm font-medium text-ivory shadow-xl ring-1 ring-lime/40">
            <Hand size={16} className="text-lime" /> Tap to move the map
          </span>
        </button>
      )}
    </div>
  );
}