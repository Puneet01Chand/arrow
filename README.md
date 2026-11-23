# Arrow — shuttlecock shop

An animated product site for a shuttlecock brand, built on **Next.js 16 (App Router)** with a
server-side API. One 3D shuttle travels down the page. It comes apart in the anatomy section and
flies a clear in the flight section. A speed guide picks a shuttle speed from hall temperature and
altitude. The cart, club price form and restock sign-up post to the backend, which validates,
prices and stores them.

## Run it

```bash
npm install
cp .env.example .env.local   # optional; defaults work
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
npm run lint
```

Node 20.9 or newer.

## Architecture

```
src/
├── app/                      Next.js routing only. Thin: no business logic here.
│   ├── layout.jsx            <html>, metadata, global CSS
│   ├── page.jsx              "/" → <ArrowExperience />
│   ├── icon.svg              favicon
│   └── api/                  HTTP layer: parse request → call a backend service → JSON
│       ├── products/         GET   catalogue
│       ├── speed/            GET   ?temp=26&high=1 → recommended speed
│       ├── orders/           POST  order request from the cart
│       ├── club-enquiries/   POST  bulk-price request
│       ├── newsletter/       POST  restock-email sign-up
│       └── health/           GET   liveness
│
├── backend/                  Server-only (every file imports 'server-only').
│   ├── config/env.js         the one place process.env is read
│   ├── http/respond.js       response envelope, error → status mapping, JSON body reader
│   ├── validation/           zod schemas for each request
│   ├── services/             business rules (pricing, merging cart lines, dedupe sign-ups)
│   └── db/json-store.js      persistence placeholder (JSON files in .data/)
│
├── frontend/                 Everything that runs in the browser.
│   ├── ArrowExperience.jsx   client boundary: loads ArrowApp with ssr: false
│   ├── ArrowApp.jsx          page composition (was App.jsx)
│   ├── sections/             page sections: Hero, Anatomy, Flight, Speed, Shop, …
│   ├── ui/                   Nav, CartDrawer, AddToCart, Decode
│   ├── fx/                   glass, gradient, lattice, liquid-logo effects
│   ├── three/                React Three Fiber scene, shuttle model, poses, textures
│   ├── shaders/              GLSL (imported as strings via raw-loader)
│   ├── lib/                  cart context, scroll model, hooks
│   ├── services/api.js       the only place the frontend calls fetch()
│   └── styles/               globals.css + self-hosted fonts
│
└── shared/
    └── catalogue.js          products, prices, club tiers, speed table. Pure JS, used by both sides.
```

**Rules of the layout**

- `app/` routes stay thin. A route handler is a few lines: `handle(async (req) => ok(await service(await readJson(req))))`.
- `backend/` never gets imported by `frontend/`; `server-only` turns a mistake into a build error.
- `frontend/` talks to the server only through `services/api.js`.
- `shared/` holds pure data and functions with no React, browser or Node APIs.
- Prices are always computed on the server from `shared/catalogue.js`. The client sends product ids,
  options and quantities only.

### API response shape

```jsonc
// success
{ "ok": true, "data": { … } }
// failure (4xx / 5xx)
{ "ok": false, "error": { "code": "validation_failed", "message": "…", "fields": { "customer.email": "…" } } }
```

`fields` keys are dotted paths into the request body, so forms can put each message under its input.

### Persistence

`backend/db/json-store.js` writes each collection (`orders`, `club-enquiries`, `newsletter`) to
`.data/<name>.json` (`ARROW_DATA_DIR` overrides the folder). On hosts with a read-only disk, such as
Vercel, it keeps records in memory and logs a warning, **so nothing survives a restart there**.
Services only use `collection(name).insert / list / findOne`, so moving to a real database means
replacing that one file.

### Why the page renders client-side

The page is one WebGL canvas and a set of scroll-measured sections; several modules read `window`
when they load. `ArrowExperience` therefore mounts it with `next/dynamic` and `ssr: false`. The
server still sends metadata, fonts and styles.

## Effects

| Part | Where | Built with |
|---|---|---|
| Travelling 3D shuttle, product renders | `src/frontend/three/` | React Three Fiber 9, drei 10 Views (one WebGL canvas) |
| Moving grounds (hero, close) | `src/frontend/fx/HeroGradient.jsx` | ShaderGradient |
| Liquid glass (nav, chips, panels, cart) | `src/frontend/fx/Glass.jsx` | SVG backdrop-filter refraction |
| Liquid-metal logo (loader, close) | `src/frontend/fx/LiquidLogo.jsx`, `src/frontend/shaders/` | liquid-logo shader |
| Decoding labels, line drawing | `src/frontend/ui/Decode.jsx`, `src/frontend/sections/Flight.jsx` | anime.js |
| UI motion, cart stepper | `src/frontend/ui/AddToCart.jsx` | Motion |
| Cart drawer | `src/frontend/ui/CartDrawer.jsx` | `<dialog>` with top-layer CSS transitions |

## Placeholders for the client

- The company is **Arrow**; the product line names (Arrow Tournament, Club, Training) are placeholders.
- Prices (₹) and the club tiers are demo figures. Each one carries `data-assumed`, and they live in `src/shared/catalogue.js`.
- The manufacturing steps in "How a tube is made" are generic. Confirm them with the client.
- `hello@arrow.example` is a stand-in address.
- Orders are stored as requests; no payment is taken, and no email is sent yet.
- The shuttle specs (16 feathers, 62–70 mm, 25–28 mm base, 4.74–5.50 g) and the speed test (lands 530–990 mm short of the back line) come from the BWF Laws of Badminton.

## Known follow-ups

- `npm run lint` reports warnings from the React Compiler rules (`react-hooks/refs` and friends) in
  the animation code, mostly refs carried in the cart context. They are warnings, not errors, until
  those components are refactored.
- No admin view of orders yet, no auth, no rate limiting on the POST routes, no outgoing email.
- `skywarriors-main/` is a separate project kept in this folder; it is excluded from lint and the
  path alias config and is not part of this app.
