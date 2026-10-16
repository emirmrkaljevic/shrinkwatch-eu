# Changelog

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
