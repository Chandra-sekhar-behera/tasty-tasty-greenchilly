# Tasty Tasty Greenchilly — Premium Restaurant SPA

React 19 + Vite + Tailwind CSS v4 + React Router DOM + Motion (framer-motion) + Lucide. No backend, no database, no API keys.

## Run
```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build -> dist/
npm run preview      # test the built site (SPA fallback enabled)
npm run test:whatsapp   # checks the WhatsApp message/URL builder against the real menu
```

## Routes
`/` Home · `/menu` Menu (category, veg/non-veg, search; URL-synced, e.g. `/menu?cat=rice`) · `/about` · `/visit-us` · `*` 404.

## Where to edit things (all in one place)
| What | File |
|---|---|
| Name, address, phone, WhatsApp number, hours, rating, delivery on/off, social links, hero video | `src/config/business.js` |
| Dishes, prices, veg flag, photos | `src/data/menu.js` (the only menu source; cart and WhatsApp read prices from it) |
| Colours / fonts | `src/index.css` (`@theme`) |
| WhatsApp message format | `src/lib/whatsapp.js` |

Hero video: put a muted MP4 in `public/` and set `hero.videoSrc` (and optionally `videoPoster`). It is skipped for reduced-motion and data-saver users.

## Deployment (SPA fallback — refreshing /menu must not 404)
- **Netlify**: `public/_redirects` (`/* /index.html 200`) and `netlify.toml` are included. Build `npm run build`, publish `dist`.
- **Vercel**: `vercel.json` rewrite included.
- **Cloudflare Pages**: `_redirects` is honoured as-is.
- **GitHub Pages / Apache / nginx / Hostinger**: serve `dist/` and rewrite unknown paths to `index.html`.
  - nginx: `location / { try_files $uri /index.html; }`
  - Apache `.htaccess`: `RewriteEngine On` / `RewriteCond %{REQUEST_FILENAME} !-f` / `RewriteRule . /index.html [L]`
  - GitHub Pages has no rewrites: copy `index.html` to `404.html` after building.

## Owner must confirm before going live
Opening hours, phone/WhatsApp number, every price, delivery availability and charges, and photo ownership. Unconfirmed items are flagged in `business.js`.
