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
| Mercadona, Auchan (FR), Conad, Coop (IT), Esselunga, ICA | Product pages need a store or postcode first; the badge appears after choosing one |
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

