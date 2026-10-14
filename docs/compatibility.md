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
| Spar | spar.at, online.spar.hr | Not checked: blocked / connection closed |

Lidl HR and SI mostly list food as in-store only without an online price, so the badge only appears on items that have a price.

"Not checked" shops still use the generic schema.org reader and may work in a normal browser. Reports are welcome in the issues.

## Second round (14 October 2026, evening)
Every shop in `src/adapters.js` was opened in headless Chromium. Newly confirmed on real product pages: Maxi (RS), Esselunga (IT), Mega Image (RO), AB (GR), Rimi (LT), plus price-only results on Rossmann (DE), Billa (AT), Bilka ToGo (DK) and S-kaupat (FI). There, the product name has no pack size.

Not checked because the site blocks automated browsers: Rewe, Kaufland, Netto, Carrefour (FR/ES/BE/PL), Intermarché, Monoprix, Cours U, Dia, Eroski, Alcampo, Albert Heijn, Tesco, Dunnes, Auchan PL, K-Ruoka, Barbora, Selver, Sklavenitis. These run the generic reader and may work normally in a real browser.

The rest are listed as "Not verified yet" in [shops.md](shops.md). Their home pages are app-style, so no product link could be found automatically.
