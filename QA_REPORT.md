# QA report

## Executed and passed (Chromium via Playwright, production build served with `vite preview`)
- `npm run build`: succeeds, no errors.
- Direct load AND browser refresh on `/`, `/menu`, `/about`, `/visit-us`, unknown URL (404 page): all work, correct page titles.
- Internal navigation does not reload the document; back/forward work.
- Menu: category filter, search, empty state, reset (URL-synced).
- Cart: add, +/-, totals (₹810 for 2×Paneer Tikka + Dal Makhani), persists across routes and page reload.
- Checkout: validation (name, phone, delivery address), review step, WhatsApp URL = `https://wa.me/916370452277?text=…` with correctly encoded message; Esc closes drawer.
- 404 "Back to homepage" link works. Mobile nav opens/closes. No horizontal overflow at 390px. No console errors.
- `npm run test:whatsapp`: message/URL round-trip, subtotal, phone validation.

## Not tested / limits
- Real WhatsApp delivery (opening wa.me on a phone), and browser geolocation permission prompt.
- Google Fonts (blocked in the test sandbox; serif/sans fallbacks were rendered). Verify the Cormorant Garamond/Outfit look online.
- Real devices, Lighthouse scores, screen readers, formal contrast audit.
- Hero video path (no video supplied; slot is implemented but untested with a file).

## Content caveats
- The supplied zip's menu (44 dishes) was used as the menu source; prices are unverified. Names lightly corrected ("Bt." → Butter, "Hydrabadi" → Hyderabadi).
- Only 3 dishes have photos (Chicken Biryani, Paneer Tikka, Chicken Tikka); they come from the zip and the owner must confirm they may be used. Other photos in the zip (orange hall, Avengers mural, AI-style luxury interiors, bar) were NOT used — they are not Greenchilly.
- Interior photos are the supplied real Greenchilly photo and crops of it.
- No testimonials, offers, awards or social links were invented. Rating 4.2/5 (50) is as supplied.
- Removed from the old project: Spline, AOS, Lottie, old Saffron Spice content; no API keys were found in the source.
