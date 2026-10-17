# Changelog

## Unreleased
- Popup: price history for the product on the open tab, with a small chart of the unit price over time and a list of each price and pack size seen.

## 0.3.1 (16 October 2026)
Checked in a real desktop Chrome on shops that block automated browsers. Now verified: Kaufland DE, Netto, Rewe, dm, Rossmann (DE), Carrefour FR and Tesco IE. Albert Heijn still blocks the browser, so it stays unverified.

- Popup: "Enable on this shop" asks only for the domain of the open tab (kaufland.de, not kaufland.cz; dm.de, not dm.at; tesco.ie, not tesco.com). "Disable" removes that domain, takes the badge off the open page, and the badge no longer flashes after a reload.
- Background: registering the opt-in content script is serialized and re-synced on install, startup and permission changes. This fixes "Duplicate script ID" / "Nonexistent script ID" errors that could leave opt-in shops without a badge.
- Rewe: product pages moved to www.rewe.de/shop/p/...; both hosts are supported, with access limited to www.rewe.de/shop/. Price read from the page when the product data has none.
- Kaufland: price read from the product buybox (it showed €1.82 / l instead of €10.00 / l on a 5 l olive oil).
- Netto: multipacks such as "500 g, 12er Pack" are multiplied in, and the right price is used (€15.08 / kg on 12 × 500 g).
- Carrefour FR: schema.org AggregateOffer prices; pack size from the description when the name has none.
- Tesco IE: euro prices although the page data says GBP; /shop/en-IE/products/ URLs.
- Pack sizes: "6er-Pack", "Packung mit 3", "pack of 24", "6-pack", "500 g x 3" and similar counts.
- Prices inside recommendation sliders and carousels, struck-out prices and stray cent fragments are no longer used as the product price. Slightly broken JSON-LD (line breaks in strings, trailing commas) is repaired.
- When pack price and size disagree with the shop's own unit price (also a labelled "Grundpreis") by more than 5 %, the badge shows the shop's figure and the reading is not saved to history.
- Firefox: minimum version 140 (Android 142) for data_collection_permissions; web-ext lint is clean.
- Regression fixtures for Kaufland, Netto, Rewe, Carrefour FR and Tesco IE built from the real pages; 94 tests.

## 0.3.0 (16 October 2026)
- Popup: when an opt-in shop is enabled, hide "Enable on this shop" and show "Disable on this shop" (removes the optional host permission and unregisters its content script). Core shops show neither button. "Check this page now" only on unsupported or not-yet-enabled sites. Fixed `button { display:block }` overriding the HTML `hidden` attribute so Enable no longer stuck visible after enable.
- Unit-price badges on listing pages (category and search tiles) for shops that do not already show €/kg or €/l on the tile. Verified live on Tommy.
- Small "smaller pack" shrinkflation marker on listing tiles when local history shows a shrink. Verified live on Konzum (seeded history). Konzum, Mercator and Maxi already print unit prices on tiles, so only the shrinkflation marker is added there.
- One debounced MutationObserver for dynamically loaded tiles; no network requests.

## 0.2.0 (15 October 2026)
- About 70 shops across the EU, Serbia and Bosnia and Herzegovina (docs/shops.md).
- Opt-in permissions per shop from the popup; "Check this page now" for any site.
- Reads schema.org microdata; handles prices shown as "269 99".
- Reads pack sizes from labelled fields (Inhalt, Menge, Contenu and others) and multipacks like "Lt 2,0X6".
- Regression tests against trimmed excerpts of real product pages for 27 shops.

## 0.1.1
- Mercator, Tommy and Bingo adapters fixed and checked on live product pages.
- Bingo now targets bingoshop.ba.
- Added docs/compatibility.md with the results of the shop checks.

## 0.1.0 (2026-10-14)
- First release: price per kg/l/piece, local shrinkflation alerts, Chrome and Firefox packages.
