# Serendib Treasures

Offline-first inflight duty-free catalog PWA for SriLankan Airlines cabin crew: catalog, stock, pre-orders, sales, multi-currency payments, flight reports.

## Files
- `index.html` – the entire app (catalog, rates and logic)
- `manifest.json`, `sw.js`, `icon-*.png` – PWA install and offline support
- `images/` – product photos (`product-1…113.png`) and home tile images

## Deploy (GitHub Pages)
Upload all files and folders to the repository root, then enable Pages (Settings → Pages → deploy from branch, `/root`). Open the URL once online, then use "Add to Home Screen".

## Features
- 113 items, 7 categories, Listed / Special / Staff pricing
- USD 10 cash discount for passengers on eligible items when paid 100% in Cash
- Conversion rates 05 Nov – 04 Dec 2026 (USD = LKR 332.40, also the crew incentive rate)

## Themes
Four selectable layouts with identical functionality: **Classic**, **Tab bar** (light, bottom navigation), **Shop grid** (product-card home) and **Flight deck** (dark). Switch via Home → Tools & Reports → **Appearance**. The choice is remembered on the device. Themes use system fonts only, so the app works fully offline; printed reports are unaffected.

## Crew list & Staff sales

On the Edit Flight page, upload a crew-list screenshot (Crew List panel, below CSS Name). Staff No and names are read on the device with a bundled OCR engine (`ocr/` folder, works offline); review/correct the list (⇄ swaps first/last name). On Staff-priced cart lines, pick the buying crew member; reports show Staff No, First Name and Last Name. The crew list is cleared when the flight is closed.
