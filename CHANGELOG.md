# Changelog

## 0.3.7 (24 October 2026)
Checked on egg boxes in a real desktop Chrome: Continente (`€0.25 / pc`), Nemlig (`5.25 kr / pc`), Willys (`3.79 kr / pc`) and Mathem (`3.33 kr / pc`).

- Willys and other Swedish shops: a bare piece count in the title ("Ägg 10p") is read as 10 pieces when no weight or volume is given. Only on Swedish shops, so "25p" elsewhere is never taken as a pack size.
- Mathem: when the shop prices per piece and the pack price divided by the piece count matches that figure, the piece count wins over the weight in the title (it showed `57.33 kr / kg (348 g)` for 6 eggs).
- Docs: test notes no longer name the store locations or postcodes chosen during checks.

## 0.3.6 (23 October 2026)
Checked on egg boxes in a real desktop Chrome: Auchan PL (`1.00 zł / pc`), Carrefour PL (`1.00 zł / pc`), Dia (`€0.24 / pc`) and Barbora (`€0.30 / pc`).

- Piece counts are read in more EU languages, so egg boxes, rolls and capsules get a price per piece: "szt" (PL), "ks" (CZ/SK), "db" (HU), "buc" (RO), "stuks" (NL), "pz"/"pezzi" (IT), "uds"/"unidades" (ES), "un"/"unid" (PT), "pièce"/"pièces" (FR), "st"/"styck"/"stycken" (SE), "styk"/"stykker" (DK/NO), "kpl" (FI), "tk" (EE), "vnt" (LT), "gab" (LV), "τεμ" (GR), "бр" (BG) and "шт". Full words are read too: "sztuk"/"sztuki" (PL), "kusů"/"kusy"/"kusov" (CZ/SK), "darab" (HU), "stuk" (NL), "bucăți" (RO). A weight or volume on the same label still wins.
- Pack counts written without a unit word ("10er Pack", "12-pack", "12-p", "pack of 10", "lot de 12", "boîte de 10", "confezione da 10") now count as pieces when the product has no weight or volume (covered by tests).
- Standalone piece-count lines right under the product title ("10 szt.", "12 uds", "10 stuks", "12 st") are read the same way as weight and volume lines (covered by tests).

## 0.3.5 (21 October 2026)
Checked in a real desktop Chrome: Mercadona, Auchan FR, Conad and ICA now verified. Coop Shop (IT) needs a Coop account before it shows prices, so it stays unverified.

- Mercadona: badge shown. The product page has no structured data, so the title, pack line and pack price are now read from the product block (it showed only the "choose a store" hint).
- Multipacks with a container word between the count and the "x" are read as the whole pack: "6 briks x 1 L" is 6 l, "6 mini briks x 200 ml" is 1.2 l, "4 latas x 33 cl" is 1.32 l. Before, only the single item was counted.
- Spanish unit words "mililitros", "centilitros", "kilos" and "kilogramos" are read.
- A shop unit price with three decimals ("1,367 €/L") is no longer read as 367 €/L, which had made the cross-check show a wildly wrong figure.
- Shops that change the address without loading a new page (Mercadona opens related products in a dialog): the badge is removed when the page path changes, so it never shows the previous product's numbers.
- Single-page shops: moving from a search or category page to a product without a page load (Mercadona search → product, back/forward) now starts the badge on the new product. Before, it only appeared after a reload.

## 0.3.4 (20 October 2026)
Checked in a real desktop Chrome: Auchan PL, Dunnes Stores and Barbora now verified, and K-Ruoka, Selver and Sklavenitis verified after the fixes below. Colruyt shows no price without logging in or choosing a store, and Tesco CZ blocks the browser, so both stay unverified.

- Mercadona, Auchan FR, Conad, Coop IT and Esselunga hide prices until a store or delivery address is chosen. On their product pages the badge now says so instead of staying empty, and shows the unit price once the page shows a price.
- K-Ruoka: the pack size comes from the product title ("1l") instead of the packed weight in the product data (it showed €0.96 / kg for 1.032 kg instead of €0.99 / l). In general, a size in the title now wins over a schema.org `weight`; `netContent` still comes first.
- Selver: the price is read from the product's own price block and wins over product cards and the page's other price data (it showed €0.50 / l instead of €0.62 / l; €0.50 is the price without 24 % VAT).
- Sklavenitis: badge shown again. The price is read from the product's price block, which comes before the title and has no structured data.
- Pack sizes and unit prices: Greek "λίτρο", "λίτρα" and "κιλά" are read, and shop unit prices written as "1,05 €/λίτρο" or "8,40 €/κιλό" are used for the cross-check.

## 0.3.3 (19 October 2026)
- Back up or move your history: a new options page (popup → "Back up or restore history") exports the stored pack sizes and prices to a JSON file and imports them again, merged with what is already stored. Nothing is uploaded.
- Website: sitemap, robots.txt and a per-country shop list.
- Corrected the 0.3.2 notes (support section).
- Mercadona still needs a postcode chosen first. The extension only reads the page you see and makes no requests of its own.

## 0.3.2 (17 October 2026)
Checked in a real desktop Chrome: Monoprix, Carrefour ES, Dia, Alcampo, Eroski, Carrefour BE and Carrefour PL now verified. Intermarché and Cours U block the browser, so they stay unverified.

- Popup: price history for the product on the open tab, with a small chart of the unit price over time and a list of each price and pack size seen.
- Badge: drawn inside a shadow root with its own styles, so shop stylesheets can no longer restyle or move it (it was unstyled on Monoprix).
- Prices: złoty, koruna, forint, leu, marka, krone and similar currencies are shown after the amount ("4.49 zł / l") on the badge, listing tiles and in the popup.
- Pack sizes: "litro", "litros", "litri" and "gramos" are read (Eroski showed "Pack size not found").
- Website: https://emirmrkaljevic.github.io/shrinkwatch-eu/ with install steps and the shop list.
- README: new "Support my work" section.
- Eroski: full product title from the page, since its product data has a shortened name.

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
