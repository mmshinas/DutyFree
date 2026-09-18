# Serendib Treasures — Inflight Duty-Free Catalog & Sales App

A fully offline progressive web app (PWA) for SriLankan Airlines cabin crew
to browse the inflight duty-free catalog, manage opening stock per flight,
record passenger and staff sales, take pre-orders, and generate a
printable/PDF flight report — all without a backend or internet connection.

## Files

| File | Purpose |
|---|---|
| `index.html` | The entire application — markup, styles, catalog data (113 items), and all logic. No external requests are made at runtime. |
| `manifest.json` | PWA manifest (name, icons, display mode) so the app can be installed to a device home screen. |
| `sw.js` | Service worker that caches the app shell and item photos for offline use. |
| `icon-192.png`, `icon-512.png` | App icon, standard. |
| `icon-192-maskable.png`, `icon-512-maskable.png` | App icon, maskable variant (safe-zone padding so Android doesn't crop it awkwardly when applying its own shape mask). |
| `images/` | Product photos, one file per item, named by item number (e.g. `images/product-1.png` … `images/product-113.png`); the 7 category-tile icons (`images/tile-*.png`); and the Pre-Orders tile's `images/PRE ORDER.png`. All referenced directly from the catalog data / home screen in `index.html`. |

The one decorative image inside the app itself (the peacock feather in the
header) is embedded directly in `index.html` as a base64 data URI. Product
photos are kept as separate real files in `images/` instead, since there are
113 of them — that lets the browser and service worker cache each one
individually and only re-fetch whichever ones actually change, rather than
re-downloading everything on every app update.

## Running locally

No build step is required. Either:

- Open `index.html` directly in a browser, or
- Serve the folder with any static file server, e.g.:
  ```bash
  npx serve .
  # or
  python3 -m http.server 8000
  ```

Serving over HTTP(S) (rather than `file://`) is required for the service
worker (offline caching) and "Add to Home Screen" install prompt to work.

## Deploying with GitHub Pages

1. Push **all** the files and folders listed above — including `images/` in
   full — to the root of a GitHub repository (or to a `/docs` folder, or a
   `gh-pages` branch — whichever you prefer). The `images` folder must sit
   at the same level as `index.html`, since photos are referenced by the
   relative path `images/product-<item-number>.png`.
2. In the repo settings, enable **GitHub Pages** and point it at that
   location.
3. Visit the published URL.

## Installing as an app (PWA)

Visit the deployed URL in a mobile browser, then:
- **Android (Chrome)** — tap the install prompt, or menu → "Install app" / "Add to Home Screen".
- **iOS (Safari)** — tap the Share icon → "Add to Home Screen".

Once installed it opens full-screen with its own icon, and works offline
after the first load thanks to the service worker. The app also proactively
re-checks for updates every few minutes while online, and will auto-reload
once a newer version takes over — the goal being that an offline device
never falls too far behind, since it can only ever be as current as the
last time it was successfully online.

## Updating currency & incentive rates

Both are embedded as a single JSON block in `index.html` (search for
`conversionRatesData`) — `effectiveFrom`, `effectiveTo`, `rates` (array of
`{code, rate}` — 1 USD = `rate` units of that currency), and
`incentiveRateLKR` (1 USD = that many LKR, used for the crew incentive
calculation printed on every flight report). Update these three whenever a
new monthly rate chart comes in; everything downstream (the Currency Rates
page, its home-screen button label, and the incentive figures on every PDF
report) reads from this one place automatically.

## Key workflows

- **Open Flight** — enter Date, Flight Number, Sector, CSS Staff No, and CSS
  Name (the last two persist across flights on the same device — only the
  first three need re-entering each leg). Then work through each product
  category plus the **Pre-orders** section, confirming each one — the flight
  only counts as fully "open" once every section is confirmed.
- **Pre-orders** — record item + quantity on Open Flight (a separate stock
  pool, never mixed with regular opening stock). From the **Pre-Orders**
  home-screen tile, price each pending pre-order, mark Staff Sale if
  applicable, and send some or all of it to the cart — any amount not sent
  stays in the pre-order balance, and anything sent but later removed from
  the cart is credited back to that balance automatically.
- **Sell** — browse or search the catalog, open an item, choose a quantity
  and price tier (Listed / Special / Staff), add to cart. A single cart
  cannot mix passenger and staff sales. Items with a Special price disable
  Listed, leaving only Special or Staff selectable.
- **Payment** — choose Credit Card, Onboard Vouchers, Cash (any currency, or
  split across several), or a Mix of all three before a sale completes. A
  fixed list of items carry an extra USD 10 per-unit discount for passengers
  when a sale is settled **100% in Cash** (not Mix) — noted on that item's
  own page, and shown/deducted automatically on the Payment screen.
- **Current Flight Summary** — view the live sales breakdown across four
  categories (Normal/Pre-order × Passengers/Staff), refund any item if a
  passenger changes their mind (which restores the correct stock pool),
  download a printable report (payment summary, both stock reconciliations,
  crew incentive calculation, totals), and close the flight to archive it
  and reset for the next leg. Past closed flights stay browsable from
  **Flight Sales History** on the Home screen, with reports still
  downloadable.
- **Duty Free Allowances** and **Currency Rates** — quick reference tools,
  also on the Home screen.

## Item thumbnail photos

Photos are bundled directly into the app as real files in `images/`, named
by item number (`product-<n>.png`), and referenced from each item's data in
`index.html`. There is no in-app photo upload feature — photos are provided
as files up front and wired into the catalog data directly, so every visitor
sees the same images with nothing device-specific to manage.

### How photo caching works on visitors' devices

- The service worker caches each photo the first time it's requested, in a
  cache kept **separate** from the app shell itself.
- Unchanged photos are never re-downloaded, even when you push app updates —
  they're already cached under the same file path, so the service worker
  serves them straight from local storage with no network request at all.
- If you replace a photo's content later, give the new file a different
  name so its URL actually changes — that's what tells a device "this one's
  new, fetch it." Reusing the exact same filename for different image
  content won't automatically update devices that already cached the old
  one.
- The app also proactively fetches every bundled photo once, right after it
  loads (while online), rather than waiting for each item to be opened —
  so by the time a device goes offline, everything's already cached.

## Data & storage

Everything else the app remembers is stored locally in the browser's
`localStorage` on the device it's used on:

- Opening stock counts, category confirmations, pre-order balances, and
  flight details (date, flight number, sector, CSS staff no, CSS name)
- The current cart, sales log, and payment records
- Archived (closed) flight summaries and their stock/payment reconciliation

Since there's no backend, this data does not sync between devices — each
phone/tablet the app is installed on keeps its own local history. (Photos
are the exception — those are shipped with the app itself, so they're
identical for everyone.)
