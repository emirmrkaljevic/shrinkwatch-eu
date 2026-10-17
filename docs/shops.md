# Supported shops

Core shops run automatically. Other shops are switched on per shop from the extension popup ("Enable on this shop"), so the extension only asks for access to sites you use. An enabled opt-in shop can be turned off again with "Disable on this shop". On unsupported or not-yet-enabled sites, "Check this page now" reads the current page once.

Live checks: 14 October 2026 (updated after the third round), headless Chromium, real product pages. Sites with bot protection were not tested. Opt-in permission flow verified in a real Chrome browser on 15 October 2026 (gurkerl.at): Enable prompt, then unit-price badge after reload; Disable removes access. Chrome does not prompt again when a shop is re-enabled after Disable, because it remembers the earlier approval; Site access on the extension's details page revokes it fully.

Real desktop Chrome check on 16 October 2026: dm, Rossmann, Kaufland DE, Carrefour FR and Tesco IE, Netto and Rewe work; Albert Heijn blocked the browser. See [compatibility.md](compatibility.md#real-browser-check-16-october-2026).

Real desktop Chrome check on 17 October 2026: Monoprix, Carrefour ES, Dia, Alcampo, Eroski, Carrefour BE and Carrefour PL work; Intermarché and Cours U blocked the browser. See [compatibility.md](compatibility.md#real-browser-check-17-october-2026).

Listing tiles (15 October 2026): Tommy shows unit-price badges on category/search tiles. Konzum, Mercator and Maxi already print unit prices on tiles; a shrinkflation marker is added when local history shows a smaller pack (verified on Konzum).

| Country | Shop | Domains | Mode | Live check |
|---|---|---|---|---|
| HR/BA | konzum | konzum.hr, konzum.ba | core | Works |
| HR | tommy | tommy.hr | core | Works |
| SI | mercator | mercatoronline.si | core | Works |
| BA | bingo | bingoshop.ba | core | Works; mostly non-food, few pack sizes |
| DE/AT/HR/SI/RS/BA | lidl | lidl.de, lidl.at, lidl.hr, lidl.si, lidl.rs, lidl.ba | core | Works |
| EU | lidl-eu | lidl.fr, lidl.es, lidl.it, lidl.nl, lidl.be, lidl.pl, lidl.cz, lidl.sk, lidl.hu, lidl.ro, lidl.bg, lidl.pt, lidl.ie, lidl.se, lidl.dk, lidl.fi, lidl.gr, lidl.lt, lidl.lv, lidl.ee | opt-in | Not verified yet |
| RS | maxi | maxi.rs | core | Works |
| RS | idea | online.idea.rs | opt-in | Works |
| SI | spar-si | online.spar.si | opt-in | Works |
| DE | rewe | shop.rewe.de, www.rewe.de/shop | opt-in | Verified (real Chrome, 16 Oct 2026) |
| DE/CZ/SK | kaufland | kaufland.de, kaufland.cz, kaufland.sk | opt-in | Works (kaufland.de, real Chrome, 16 Oct 2026: €10.00 / l on a 5 l olive oil) |
| DE/AT | dm | dm.de, dm.at | opt-in | Works (dm.de, real Chrome, 16 Oct 2026) |
| DE | rossmann | rossmann.de | opt-in | Works (real Chrome, 16 Oct 2026) |
| DE | netto | netto-online.de | opt-in | Verified (real Chrome, 16 Oct 2026) |
| AT | billa | shop.billa.at | opt-in | Works |
| AT | gurkerl | gurkerl.at | opt-in | Works; opt-in flow verified in real Chrome (15 Oct 2026) |
| FR | carrefour-fr | carrefour.fr | opt-in | Works (real Chrome, 16 Oct 2026: €1.26 / l on 1 l milk) |
| FR | auchan-fr | auchan.fr | opt-in | Needs a store or postcode chosen first |
| FR | leclerc | e.leclerc, leclercdrive.fr | opt-in | Price works; pack size only on food items |
| FR | intermarche | intermarche.com | opt-in | Blocked: slider bot check in a real Chrome (17 Oct 2026), not verified |
| FR | monoprix | monoprix.fr | opt-in | Verified (real Chrome, 17 Oct 2026) |
| FR | coursesu | coursesu.com | opt-in | Blocked: "Access Denied" after choosing a store in a real Chrome (17 Oct 2026), not verified |
| IT | esselunga | spesaonline.esselunga.it | opt-in | Works |
| IT | carrefour-it | carrefour.it | opt-in | Works |
| IT | conad | spesaonline.conad.it | opt-in | Needs a store or postcode chosen first |
| IT | coop-it | coopshop.it, easycoop.com | opt-in | Needs a store or postcode chosen first |
| ES | mercadona | tienda.mercadona.es | opt-in | Needs a store or postcode chosen first |
| ES | carrefour-es | carrefour.es | opt-in | Verified (real Chrome, 17 Oct 2026) |
| ES | dia | dia.es | opt-in | Verified (real Chrome, 17 Oct 2026) |
| ES | alcampo | compraonline.alcampo.es | opt-in | Verified (real Chrome, 17 Oct 2026); multipacks such as 6 x 1 l |
| ES | eroski | supermercado.eroski.es | opt-in | Verified (real Chrome, 17 Oct 2026) |
| PT | continente | continente.pt | opt-in | Works |
| PT | pingodoce | pingodoce.pt | opt-in | Works |
| PT | auchan-pt | auchan.pt | opt-in | Works |
| NL/BE | ah | ah.nl, ah.be | opt-in | Blocked: "Access Denied" in a real Chrome (16 Oct 2026), not verified |
| NL | jumbo | jumbo.com | opt-in | Works |
| NL | plus | plus.nl | opt-in | Works |
| NL | dirk | dirk.nl | opt-in | Works |
| BE | delhaize | delhaize.be | opt-in | Works |
| BE | colruyt | colruyt.be, collectandgo.be | opt-in | Not tested: bot protection |
| BE | carrefour-be | carrefour.be | opt-in | Verified (real Chrome, 17 Oct 2026) |
| PL | frisco | frisco.pl | opt-in | Works |
| PL | carrefour-pl | carrefour.pl | opt-in | Verified (real Chrome, 17 Oct 2026) |
| PL | auchan-pl | zakupy.auchan.pl | opt-in | Not tested: bot protection |
| CZ | rohlik | rohlik.cz | opt-in | Works |
| CZ | kosik | kosik.cz | opt-in | Works |
| CZ/SK/HU | tesco-ce | nakup.itesco.cz, potravinydomov.itesco.sk, bevasarlas.tesco.hu | opt-in | Not tested: bot protection |
| HU | kifli | kifli.hu | opt-in | Works |
| HU | auchan-hu | online.auchan.hu | opt-in | Works |
| RO | carrefour-ro | carrefour.ro | opt-in | Works |
| RO | mega-image | mega-image.ro | opt-in | Works |
| RO | auchan-ro | auchan.ro | opt-in | Works |
| RO | freshful | freshful.ro | opt-in | Works |
| BG | ebag | ebag.bg | opt-in | Price works; some items show no pack size |
| IE/UK | tesco | tesco.ie, tesco.com | opt-in | Works (tesco.ie, real Chrome, 16 Oct 2026: €1.13 / l on 2 l milk); tesco.com not tested |
| IE | dunnes | dunnesstoresgrocery.com | opt-in | Not tested: bot protection |
| IE | supervalu | shop.supervalu.ie | opt-in | Works |
| SE | ica | handlaprivatkund.ica.se | opt-in | Needs a store or postcode chosen first |
| SE | willys | willys.se | opt-in | Works |
| SE | coop-se | coop.se | opt-in | Works |
| SE | mathem | mathem.se | opt-in | Works |
| DK | nemlig | nemlig.com | opt-in | Works |
| DK | bilkatogo | bilkatogo.dk | opt-in | Works |
| FI | s-kaupat | s-kaupat.fi | opt-in | Works |
| FI | k-ruoka | k-ruoka.fi | opt-in | Not tested: bot protection |
| LT/LV/EE | barbora | barbora.lt, barbora.lv, barbora.ee | opt-in | Not tested: bot protection |
| LT/LV/EE | rimi | rimi.lt, rimi.lv, rimi.ee | opt-in | Works |
| EE | selver | selver.ee | opt-in | Not tested: bot protection |
| GR | sklavenitis | sklavenitis.gr | opt-in | Not tested: bot protection |
| GR | ab | ab.gr | opt-in | Works |
| GR | mymarket | mymarket.gr | opt-in | Works |
