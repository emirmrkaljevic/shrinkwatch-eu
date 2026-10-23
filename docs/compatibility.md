# Shop compatibility

Checked on 14 October 2026 by loading the extension in headless Chromium and opening a real product page.

| Shop | Page tested | Result |
|---|---|---|
| Konzum | konzum.hr/web/products/mutti-rajcica-pasirana-st-560g | Works: €2.84 / kg (560 g), matches the shop's own unit price |
| Lidl | lidl.de/p/4rain-terra-wandtank-275-l/p100174701 | Works: €0.36 / l (275 l), from schema.org data |
| Mercator | mercatoronline.si/izdelek/17931243/kisla-smetana-mercator-20-m-m-400-g | Works: €3.23 / kg (400 g) |
| Tommy | tommy.hr/proizvodi/t-jaja-m-razred-10-kom | Works: €0.25 / pc (10 pcs) |
| Bingo | bingoshop.ba/proizvod/... | Badge shows; the shop is mostly non-food, so few items have a pack size |
| Kaufland | kaufland.de | Not checked: the site blocks automated browsers |
| Rewe | shop.rewe.de | Not checked: the site blocks automated browsers |
| Tesco | tesco.com/groceries | Not checked: the site blocks automated browsers |
| Spar | spar.at | Not checked: blocked / connection closed |

Lidl HR and SI mostly list food as in-store only without an online price, so the badge only appears on items that have a price.

"Not checked" shops still use the generic schema.org reader and may work in a normal browser. Reports are welcome in the issues.

## Second round (14 October 2026, evening)
Every shop in `src/adapters.js` was opened in headless Chromium. Newly confirmed on real product pages: Maxi (RS), Esselunga (IT), Mega Image (RO), AB (GR), Rimi (LT), plus price-only results on Rossmann (DE), Billa (AT), Bilka ToGo (DK) and S-kaupat (FI). There, the product name has no pack size.

Not checked because the site blocks automated browsers: Rewe, Kaufland, Netto, Carrefour (FR/ES/BE/PL), Intermarché, Monoprix, Cours U, Dia, Eroski, Alcampo, Albert Heijn, Tesco, Dunnes, Auchan PL, K-Ruoka, Barbora, Selver, Sklavenitis. These run the generic reader and may work normally in a real browser.

The rest are listed as "Not verified yet" in [shops.md](shops.md). Their home pages are app-style, so no product link could be found automatically.

## Third round (14 October 2026, night)
Each shop below was opened on a real product page with the extension loaded. A trimmed excerpt of each page is kept in `test/fixtures/` so the result is checked on every test run.

| Shop | Result |
|---|---|
| Rohlik (CZ), Kifli (HU), Gurkerl (AT) | Works |
| Košík (CZ), Frisco (PL), Freshful, Auchan, Carrefour (RO) | Works (Carrefour RO was down for maintenance on the last run) |
| Auchan (HU), Spar Online (SI), Idea (RS), Maxi (RS) | Works |
| Billa (AT), Plus, Jumbo, Dirk (NL), Delhaize (BE) | Works; Billa and Dirk read the pack size from a separate field |
| Mathem, Willys, Coop (SE), Nemlig, Bilka ToGo (DK), S-kaupat (FI) | Works |
| Continente, Pingo Doce, Auchan (PT) | Works; Pingo Doce shows only a unit price, the pack price is worked out from it |
| My Market, AB (GR), Mega Image (RO), Rimi (LT), Esselunga (IT), SuperValu (IE) | Works |
| Carrefour (IT) | Works, including multipacks written as "Lt 2,0X6" |
| eBag (BG) | Price works; some items show no pack size anywhere on the page |
| E.Leclerc (FR), Bingo (BA) | Price works; tested items were non-food without a pack size |
| Mercadona, Auchan (FR), Conad, Coop (IT), Esselunga, ICA | Product pages need a store or postcode first; the badge appears after choosing one (checked in a real browser on 20 October 2026, see below) |
| dm, Rossmann, Albert Heijn, Colruyt and the shops listed in round two | Not checked: the site blocks automated browsers |

Spar Croatia was removed: it has no online shop.

## Listing pages (15 October 2026)
Category and search tiles were checked in headless Chromium with the extension loaded.

| Shop | Listing result |
|---|---|
| Tommy | Unit-price badges on tiles (shop does not show €/kg). Example: milk multipack 4×1 L at €4.08 → €1.02 / l |
| Konzum | Shop already shows "Cijena za j.m.: €/kg"; no duplicate unit badge. Shrinkflation marker appears when local history has a larger pack |
| Mercator | Shop already shows €/kg on tiles; no duplicate unit badge |
| Maxi | Shop already shows rsd/Kg or rsd/L on tiles; no duplicate unit badge |
| Bingo | Listing scan enabled; most items are non-food without a pack size, so few badges |
| Lidl | No listing adapter yet (online catalogue is mostly non-food appliances) |

## Opt-in permissions (15 October 2026)
Verified in a real desktop Chrome (not headless) with the unpacked `dist/chrome` build:

| Shop | Check | Result |
|---|---|---|
| Gurkerl (AT) | Enable on this shop → reload product page | Permission prompt shown; badge `€1.59 / l (1 l)` after reload |
| Konzum (HR, core) | Product page (no Enable) | Badge `€1.39 / l (1 l)`; core shops show Active with neither Enable nor Disable |

Popup after the same session: enabled opt-in shops show Active + Disable (not a stuck Enable button); core shops show Active only.

## Real-browser check (16 October 2026)
Opened in a real desktop Chrome (not headless) with v0.3.0 and the opt-in shops enabled from the popup.

| Shop | Page tested | Result |
|---|---|---|
| dm (DE) | dm.de/p/d/1453941/dmbio-pflanzendrink-haferdrink-natur | Works: €0.90 / l (1 l) |
| Rossmann (DE) | rossmann.de product page | Works: €0.89 / l (1 l) |
| Albert Heijn (NL) | ah.nl | Blocked: the site showed "Access Denied" in a real Chrome, so it could not be checked |
| Rewe (DE) | rewe.de/shop/p/ja-frische-fettarme-milch-1-5-1l/2865662 | First run: the popup did not recognise www.rewe.de/shop/ (fixed). Re-check at 11:35: after Enable the popup said Active, but no badge appeared. See the re-check below. Fixed and verified in real Chrome (11:48) |
| Netto (DE) | netto-online.de, Melitta Auslese 500 g, 12er Pack, €90.48 | First run: €16.16 / kg (500 g), the "12er Pack" count was ignored (fixed). Re-check at 11:35: €1.35 / kg (6 kg), a wrong price. See the re-check below. Fixed and verified in real Chrome (11:48) |
| Kaufland (DE) | kaufland.de/product/300588093/ (olive oil 5 l, €49.99) | First run: €1.82 / l (5 l), the wrong price was picked. Fixed: price read from the buybox, struck prices and recommendation sliders skipped, shop unit-price cross-check. **Re-check at 11:35: works, €10.00 / l (5 l)** |
| Carrefour (FR) | carrefour.fr/p/lait-demi-ecreme-uht-vitamine-d-lactel-3252210390014 | First run: no badge. Fixed: nested AggregateOffer price, pack size from the short description or title. **Re-check at 11:35: works, €1.26 / l (1 l)** |
| Tesco (IE) | tesco.ie/shop/en-IE/products/250005606 (Tesco Fresh Milk 2 Litre, €2.25) | First run: no badge. Fixed: the opt-in prompt asked for tesco.com instead of tesco.ie, and the page's schema.org data says GBP next to a € price; tesco.ie is now read as EUR. **Re-check at 11:35: works, €1.13 / l (2 l)** (the shop prints €1.12/litre because it cuts instead of rounding) |

Opt-in prompts: "Enable on this shop" asked for the first country of a shop group (kaufland.cz on kaufland.de, dm.at on dm.de, tesco.com on tesco.ie). Fixed: the popup now asks only for the domain of the open tab, and the content script is registered for that domain. Covered by tests; the Kaufland DE and Tesco IE badges in the re-check were shown with this build.

### Re-check (16 October 2026, 11:35)
Same real desktop Chrome, rebuilt extension.

| Shop | Result |
|---|---|
| Kaufland (DE) | Works: €10.00 / l (5 l), matches the shop's 10,00 € / 1l |
| Carrefour (FR) | Works: €1.26 / l (1 l) |
| Tesco (IE) | Works: €1.13 / l (2 l) |
| Netto (DE) | Wrong: €1.35 / kg (6 kg) instead of €15.08 / kg. The page's schema.org price (90.48) was not used, and a fallback joined two stray "08" cents nodes into a price of 8.08. Fixed in tests: JSON-LD that strict JSON parsing rejects (line breaks inside strings, invalid escapes, trailing commas) is now repaired and read; split euro/cent prices are only joined from neighbouring elements and never from a cents-looking euro part; Netto's buybox price and its "Grundpreis: 15.08 / kg" are read, and the shop unit-price cross-check also finds a labelled "Grundpreis". A fixture from the captured page gives €15.08 / kg (6 kg). Verified in real Chrome at 11:48: `€15.08 / kg (6 kg)` |
| Rewe (DE) | No badge: after Enable the popup said Active, but no badge was added to the page. Two causes: the service worker registered the opt-in content script from several events at once and failed with "Duplicate script ID" / "Nonexistent script ID", which can leave no script registered; and the page has no price in its schema.org data (only `<mark itemprop="price">0,85 €</mark>`, pack size "1l" in a separate field, several empty h1 elements before the title). Fixed in tests: registration is serialized and updates an existing script instead of registering it again; Rewe's price and pack-size fields are read, a lone `itemprop="price"` is used on any shop, and the first non-empty h1 is the title. A fixture from the captured page gives €0.85 / l (1 l). Verified in real Chrome at 11:48: `€0.85 / l (1 l)` |

Disable: after "Disable on this shop", "Enable" brought access back without a new prompt (Kaufland, Netto, Carrefour). This is how Chrome works: removing an optional permission keeps it in the extension's approved list, so asking for it again is granted silently ([Chromium permissions docs](https://chromium.googlesource.com/chromium/src/+/main/extensions/docs/permissions.md)). To revoke it fully, use Site access on the extension's details page. Old badges also appeared briefly after Disable and a reload. Changed: Disable now removes the origins as the browser reports them, waits until the content script is unregistered, takes the badge off the open page, and says so if access could not be removed; the content script on an opt-in shop also asks the background whether access is still granted before showing anything. Covered by tests with a simulated browser and verified in real Chrome on Rewe at 11:48: the badge disappears at once on Disable, does not show after a reload, and returns after Enable and reload. The extension's error list stayed empty.

## Real-browser check (17 October 2026)
Real desktop Chrome with the unpacked `dist/chrome` build, one product page per shop ("Check this page now", Monoprix also with Enable and reload).

| Shop | Product | Result |
|---|---|---|
| Monoprix (FR) | Monoprix lait demi-écrémé 1L, 1,19 € | `€1.19 / l (1 l)`. First run: the badge was unstyled at the bottom-left because the shop's CSS overrode it. Fixed: the badge is now drawn in a shadow root with its own styles. Verified after the fix |
| Carrefour (ES) | Leche semidesnatada Carrefour 1 l, 0,83 € | `€0.83 / l (1 l)` after a normal Cloudflare checkbox |
| Dia (ES) | Leche 1 L, 1,09 € | `€1.09 / l (1 l)` |
| Alcampo (ES) | Leche semidesnatada 6 x 1 l, 4,98 € | `€0.83 / l (6 l)` |
| Eroski (ES) | Leche semidesnatada PRESIDENT, brik 1 litro, 1,12 € | First run: "Pack size not found" because "litro" was not a known unit, and the schema.org name is cut short. Fixed: litro/litros/litri/gramos are read and the full title comes from the page. Verified after the fix: `€1.12 / l (1 l)` |
| Carrefour (BE) | Lait demi-écrémé 1 L, 1,45 € | `€1.45 / l (1 l)` |
| Carrefour (PL) | Łaciate Mleko UHT 3,2 % 1 l, 4,49 zł | Value right, shown as "PLN 4.49 / l". Fixed: zł, Kč, Ft, lei, KM, kr and similar symbols are written after the amount. Verified after the fix: `4.49 zł / l (1 l)` |
| Intermarché (FR) | - | Blocked by a slider bot check, not attempted |
| Cours U (FR) | - | No prices until a store is chosen, then "Access Denied" |

## Real-browser check (19 October 2026)
Real desktop Chrome with the unpacked `dist/chrome` build (0.3.3), one product page per shop.

| Shop | Product | Result |
|---|---|---|
| Auchan (PL) | Kawa z cykorii Auchan 250 g | `89.56 zł / kg (250 g)` |
| Dunnes Stores (IE) | Dunnes Stores Irish Whole Milk 2L | `€1.13 / l (2 l)` |
| Barbora (LT) | Pienas Farm Milk 2 % 1 l | `€0.83 / l (1 l)`, shown after about 15 seconds while the page loads |
| K-Ruoka (FI) | Pirkka suomalainen kevytmaito 1l, 0,99 € | Wrong: `€0.96 / kg (1.032 kg)`. The schema.org `weight` is the packed weight. Fixed: a size in the product title wins over `weight`; re-checked: `€0.99 / l (1 l)` |
| Selver (EE) | Piim 2,5%, kiles, FARMI, 1 L, 0,62 € | Wrong: `€0.50 / l (1 l)`, which matches the price before 24 % VAT. Fixed: the price is read from the product's own price block, not from product cards or structured data; re-checked: `€0.62 / l (1 l)` |
| Sklavenitis (GR) | ΜΑΡΑΤΑ Φρέσκο Γάλα Πλήρες 3,5% 1lt, 1,05 € | No badge: the page has no structured data and the price block comes before the title. Fixed: the price is read from the product's price block, and "/λίτρο" and "/κιλό" unit prices are understood; re-checked: `€1.05 / l (1 l)` and `€1.74 / l (1 l)` |
| Colruyt (BE) | - | No price without logging in or choosing a store, so it could not be checked |
| Tesco (CZ) | - | Blocked by a bot check page |

## Real-browser check (20 October 2026)
Real desktop Chrome with the unpacked `dist/chrome` build, shops that hide prices until a store or postcode is chosen. No account was created on any shop.

| Shop | Product | Result |
|---|---|---|
| Conad (IT) | Latte UHT intero 1 L, 1,09 € (pickup store in Milan) | `€1.09 / l (1 l)` |
| Auchan (FR) | Haché porc et bœuf 400 g, 4,99 € (Click&Collect, Paris) | `€12.48 / kg (400 g)` |
| ICA (SE) | Färsk mellanmjölk 1,5 % 1,5 l, 19,12 kr | `12.75 kr / l (1.5 l)` |
| Mercadona (ES) | Chocolate líquido a la taza 1 L, 2,45 € (postcode 28001) | First run: only the "choose a store" hint. The page has no structured data, so no price was found. Fixed: the title, the pack line and the pack price are read from the product block. Verified after the fix: `€2.45 / l (1 l)` |
| Mercadona (ES) | Leche semidesnatada, 6 briks x 1 L, 4,98 € | First run: `€0.83 / l (1 l)`, right price per litre (taken from the shop's own figure) but the wrong pack size. Fixed: multipacks written with a container word ("6 briks x 1 L", "6 mini briks x 200 ml", "4 latas x 33 cl") are read, and the current price wins over the struck-out one. Verified after the fix: `€0.83 / l (6 l)` |
| Mercadona (ES) | Leche semidesnatada, 6 mini briks x 200 ml, 1,64 € | First run: `€328.00 / l (≈5 ml)`. "Mililitros" was not a known unit, and the shop's "1,367 €/L" (three decimals) was read as 367. Fixed: Spanish unit words (mililitros, centilitros, kilos, kilogramos) are read, and a unit price is only taken when the whole number matches. Verified after the fix: `€1.37 / l (1.2 l)` |
| Mercadona (ES) | Related product opened in a dialog | The URL changes without a page load and the badge kept the earlier product's figures. Fixed: the badge is removed when the page path changes. Verified: badge gone after opening the dialog |
| Coop Shop (IT) | - | No prices until you log in to a Coop account, so it could not be checked |

## Real-browser check (22 October 2026)
Real desktop Chrome with the unpacked `dist/chrome` build, egg boxes priced per piece across EU languages.

| Shop | Result |
|---|---|
| Auchan (PL) | `1.00 zł / pc (10 pcs)` |
| Carrefour (PL) | `1.00 zł / pc (10 pcs)` |
| Dia (ES) | `€0.24 / pc` |
| Barbora (LT) | `€0.30 / pc` |

## Real-browser check (23 October 2026)
Real desktop Chrome with the unpacked `dist/chrome` build (0.3.6), egg boxes priced per piece in Portugal and the Nordics.

| Shop | Result |
|---|---|
| Continente (PT) | Ovos de Solo Classe M 12 un, 2,99 €: `€0.25 / pc (12 pcs)` |
| Nemlig (DK) | Æg str. M/L øko. 6 stk., 31,50 kr: `5.25 kr / pc (6 pcs)` |
| Willys (SE) | Ägg 10p Frigående Utomhus Medium/large, 37,90 kr. First run: no badge, the "10p" in the title was not read. Fixed: on Swedish shops a bare "10p" in the title is read as 10 pieces when no weight or volume is given (fixed in tests, live re-check pending) |
| Mathem (SE) | Ägg Frigående M 348g, 19,95 kr, "6 st" under the title, shop price 3,33 kr/st. First run: `57.33 kr / kg (348 g)` instead of per piece. Fixed: when the shop prices per piece and pack price / piece count matches that figure, the piece count wins over the weight in the title (fixed in tests, live re-check pending) |
