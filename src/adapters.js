// Per-shop configuration. Every shop falls back to schema.org JSON-LD, microdata and Open Graph data.
// Selectors are only used when structured data is missing.
// core: true  -> host permission requested at install (small, verified set)
// core: false -> optional host permission, requested only when the user enables the shop in the popup
(function (root) {
  const A = (id, country, hosts, extra = {}) => ({ id, country, hosts, productPath: /./, core: false, status: 'unverified', ...extra });
  // Hint for shops that hide prices until a store or delivery address is chosen.
  const storeHintText = () => 'Choose a store or delivery address on this shop to see the unit price.';
  const ADAPTERS = [
    // Balkans (core)
    A('konzum', 'HR/BA', ['konzum.hr', 'konzum.ba'], { core: true, productPath: /^\/web\/products\//, price: '.single-product__price .price--primary', name: '.single-product__title h1', status: 'verified',
      listing: { tile: 'article.product-item', link: 'a.link-to-product', nameAttr: 'data-ga-name', priceAttr: 'data-ga-price', idAttr: 'data-ga-id', ownUnitPrice: true } }),
    A('tommy', 'HR', ['tommy.hr'], { core: true, productPath: /^\/proizvodi\//, status: 'verified',
      listing: { tile: 'article', link: 'a[href*="/proizvodi/"]' } }),
    A('mercator', 'SI', ['mercatoronline.si'], { core: true, productPath: /^\/izdelek\//, price: '.price-box .price', status: 'verified',
      listing: { tile: '.box.item.product', link: 'a[href*="/izdelek/"]', name: '.product-name', ownUnitPrice: true } }),
    A('bingo', 'BA', ['bingoshop.ba'], { core: true, productPath: /^\/proizvod\//, price: 'div.price', currency: 'BAM', status: 'verified',
      listing: { tile: 'div.product', link: 'a[href*="/proizvod/"]', price: 'div.price', currency: 'BAM' } }),
    A('lidl', 'DE/AT/HR/SI/RS/BA', ['lidl.de', 'lidl.at', 'lidl.hr', 'lidl.si', 'lidl.rs', 'lidl.ba'], { core: true, productPath: /\/p\d+/, price: '.ods-price__value, .m-price__price', status: 'verified (lidl.de)' }),
    A('lidl-eu', 'EU', ['lidl.fr', 'lidl.es', 'lidl.it', 'lidl.nl', 'lidl.be', 'lidl.pl', 'lidl.cz', 'lidl.sk', 'lidl.hu', 'lidl.ro', 'lidl.bg', 'lidl.pt', 'lidl.ie', 'lidl.se', 'lidl.dk', 'lidl.fi', 'lidl.gr', 'lidl.lt', 'lidl.lv', 'lidl.ee'], { productPath: /\/p\d+/, price: '.ods-price__value, .m-price__price' }),
    // Balkans (optional)
    A('maxi', 'RS', ['maxi.rs'], { status: 'verified', core: true, productPath: /\/p\/\d+/, currency: 'RSD', price: '[data-testid="product-properties-price-info"] [data-testid="product-block-price"], [data-testid="product-block-price"]', size: '[data-testid="product-properties-supplementary-price-info"]',
      listing: { tile: 'li.product-item', link: 'a[href*="/p/"]', name: '[data-testid="product-block-product-name"]', currency: 'RSD', ownUnitPrice: true } }),
    A('idea', 'RS', ['online.idea.rs'], { currency: 'RSD' , status: 'verified' }),
    A('spar-si', 'SI', ['online.spar.si']),
    // Germany
    // shop.rewe.de now redirects to www.rewe.de/shop/p/<slug>/<id>; only the /shop/ part of www.rewe.de is used.
    // Product JSON-LD has no offers: the price is only in <mark itemprop="price">0,85 €</mark>, the pack in .pdsr-Grammage ("1l").
    A('rewe', 'DE', ['shop.rewe.de', 'www.rewe.de/shop'], { status: 'verified (www.rewe.de/shop)', productPath: /\/p\//,
      price: '.pdpr-Price__Price, .rs-qa-price', size: '.pdsr-Grammage, .rs-qa-price-base', currency: 'EUR' }),
    // Product price in the buybox (captured in a real Chrome, 16 Oct 2026); recommendation tiles below use other classes.
    A('kaufland', 'DE/CZ/SK', ['kaufland.de', 'kaufland.cz', 'kaufland.sk'], { status: 'verified (kaufland.de)', productPath: /\/product\//,
      price: '.pdp-buybox-price [data-test="product-price"], .pdp-price-information__price, .rd-price-information__price', unitPrice: '.pdp-buybox-price .pdp-base-prices__base-price',
      currencyByHost: { 'kaufland.de': 'EUR', 'kaufland.sk': 'EUR', 'kaufland.cz': 'CZK' } }),
    A('dm', 'DE/AT', ['dm.de', 'dm.at'], { status: 'verified (dm.de)', productPath: /-p\d+\.html|\/p\/d\/\d+/ }),
    A('rossmann', 'DE', ['rossmann.de'], { status: 'verified', productPath: /\/p\// }),
    // Captured in a real Chrome, 16 Oct 2026: price "90.48" in .tc-salePrice .prices__ins--digits-before-comma (its cents
    // siblings repeat "48"), shop unit price "Grundpreis: 15.08 / kg". JSON-LD offers.price is used first.
    A('netto', 'DE', ['netto-online.de'], { status: 'verified', productPath: /\/p-\d+/, currency: 'EUR',
      price: '.tc-salePrice .prices__ins--digits-before-comma', unitPrice: '.tc-product-baseprice, .product-property__base-price' }),
    // Austria
    A('billa', 'AT', ['shop.billa.at'], { status: 'verified', productPath: /\/produkte\//, price: '.ws-product-price-value',
      // pack info is a list item such as "1 liter Packung" or "500 g Becher"
      custom: (doc, U) => { for (const li of doc.querySelectorAll('li')) { const t = li.textContent.trim(); if (t.length < 40 && /packung|stück|flasche|dose|beutel|becher|glas|tasse|schale|netz|karton|tube|tiegel/i.test(t)) { const size = U.parseSize(t); if (size) return { size }; } } return null; } }),
    A('gurkerl', 'AT', ['gurkerl.at'], { productPath: /^\/\d+-/ , status: 'verified' }),
    // France
    A('carrefour-fr', 'FR', ['carrefour.fr'], { status: 'verified', productPath: /\/p\// }),
    A('auchan-fr', 'FR', ['auchan.fr'], { status: 'verified (real Chrome, 20 Oct 2026)', productPath: /\/pr-/, needsStore: true }),
    A('leclerc', 'FR', ['e.leclerc', 'leclercdrive.fr']),
    A('intermarche', 'FR', ['intermarche.com'], { productPath: /\/produit\// }),
    A('monoprix', 'FR', ['monoprix.fr'], { status: 'verified (real Chrome, 17 Oct 2026)', productPath: /\/products\/|\/p\// }),
    A('coursesu', 'FR', ['coursesu.com'], { productPath: /\/p\// }),
    // Italy
    A('esselunga', 'IT', ['spesaonline.esselunga.it'], { productPath: /\/prodotto\/\d+/, status: 'verified', needsStore: true }),
    A('carrefour-it', 'IT', ['carrefour.it']),
    A('conad', 'IT', ['spesaonline.conad.it'], { status: 'verified (real Chrome, 20 Oct 2026)', productPath: /^\/p\//, needsStore: true }),
    A('coop-it', 'IT', ['coopshop.it', 'easycoop.com'], { productPath: /^\/product\//, needsStore: true }),
    // Spain / Portugal
    // Mercadona has no structured data; the pack line reads "Brik 1 Litro | 2,45" for screen readers. The current pack price is
    // .product-price__unit-price (a discounted product also has .product-price__previous-unit-price with the old price).
    A('mercadona', 'ES', ['tienda.mercadona.es'], { status: 'verified (real Chrome, 20 Oct 2026)', productPath: /^\/product\/\d+/, needsStore: true,
      name: 'h1.private-product-detail__description', price: '.private-product-detail__right .product-price__unit-price', size: '.private-product-detail__right .product-format__size .sr-only' }),
    A('carrefour-es', 'ES', ['carrefour.es'], { status: 'verified (real Chrome, 17 Oct 2026)', productPath: /\/R-/ }),
    A('dia', 'ES', ['dia.es'], { status: 'verified (real Chrome, 17 Oct 2026)', productPath: /\/p\// }),
    A('alcampo', 'ES', ['compraonline.alcampo.es'], { status: 'verified (real Chrome, 17 Oct 2026)', productPath: /\/products\// }),
    // Eroski's schema.org name is cut short ("Leche semi presid.1"); the full title is in p.text-desktop.
    A('eroski', 'ES', ['supermercado.eroski.es'], { status: 'verified (real Chrome, 17 Oct 2026)', productPath: /\/productdetail\//,
      custom: doc => { const el = doc.querySelector('p.text-desktop'); const t = el && el.textContent.trim(); return t ? { name: t } : null; } }),
    A('continente', 'PT', ['continente.pt'], { productPath: /\/produto\// , status: 'verified' }),
    A('pingodoce', 'PT', ['pingodoce.pt'], { productPath: /\/produtos\/.+\.html$/, size: 'h1.product-unit-measure', unitPrice: 'h1.product-unit-measure', name: 'h1.product-name' , status: 'verified' }),
    A('auchan-pt', 'PT', ['auchan.pt']),
    // Benelux
    A('ah', 'NL/BE', ['ah.nl', 'ah.be'], { productPath: /\/producten\/product\// }),
    A('jumbo', 'NL', ['jumbo.com'], { productPath: /\/producten\// , status: 'verified' }),
    A('plus', 'NL', ['plus.nl'], { productPath: /\/product\// , status: 'verified' }),
    A('dirk', 'NL', ['dirk.nl'], { productPath: /\/boodschappen\/.+\/\d+$/, size: '.product .subtitle',
      // euros and cents are separate elements: <span class="hasEuros">3</span><span class="hasCents">45</span>
      custom: doc => { const box = doc.querySelector('.product .price-container .price, .price-container .price'); if (!box) return null; const e = box.querySelector('.hasEuros'); const c = box.querySelector('.hasCents, .price-small'); return e ? { price: parseFloat(e.textContent + '.' + (c ? c.textContent.trim().padStart(2, '0') : '00')) } : null; } }),
    A('delhaize', 'BE', ['delhaize.be'], { productPath: /\/p\/[A-Z0-9]+$/i, price: '[data-testid="product-properties-price-info"] [data-testid="product-block-price"], [data-testid="product-block-price"]', size: '[data-testid="product-properties-supplementary-price-info"]' , status: 'verified' }),
    A('colruyt', 'BE', ['colruyt.be', 'collectandgo.be']),
    A('carrefour-be', 'BE', ['carrefour.be'], { status: 'verified (real Chrome, 17 Oct 2026)' }),
    // Poland / Czechia / Slovakia / Hungary / Romania / Bulgaria
    A('frisco', 'PL', ['frisco.pl'], { productPath: /\/pid,/ , status: 'verified' }),
    A('carrefour-pl', 'PL', ['carrefour.pl'], { status: 'verified (real Chrome, 17 Oct 2026)', currency: 'PLN' }),
    A('auchan-pl', 'PL', ['zakupy.auchan.pl'], { status: 'verified (real Chrome, 19 Oct 2026)', productPath: /\/products\//, currency: 'PLN' }),
    A('rohlik', 'CZ', ['rohlik.cz'], { productPath: /^\/\d+-/, currency: 'CZK' , status: 'verified' }),
    A('kosik', 'CZ', ['kosik.cz'], { productPath: /\/p\d+/, currency: 'CZK', size: '[class*="product-detail__product-weight"]' , status: 'verified' }),
    A('tesco-ce', 'CZ/SK/HU', ['nakup.itesco.cz', 'potravinydomov.itesco.sk', 'bevasarlas.tesco.hu'], { productPath: /\/products\// }),
    A('kifli', 'HU', ['kifli.hu'], { productPath: /^\/\d+-/, currency: 'HUF' , status: 'verified' }),
    A('auchan-hu', 'HU', ['auchan.hu'], { productPath: /\.p-\d+/, currency: 'HUF' , status: 'verified' }),
    A('carrefour-ro', 'RO', ['carrefour.ro']),
    A('mega-image', 'RO', ['mega-image.ro'], { status: 'verified', productPath: /\/p\/\d+/, currency: 'RON', price: '[data-testid="product-properties-price-info"] [data-testid="product-block-price"], [data-testid="product-block-price"]', size: '[data-testid="product-properties-supplementary-price-info"]' }),
    A('auchan-ro', 'RO', ['auchan.ro']),
    A('freshful', 'RO', ['freshful.ro'], { productPath: /^\/p\//, currency: 'RON', price: '[class*="ProductPrice-module"]' , status: 'verified' }),
    A('ebag', 'BG', ['ebag.bg'], { productPath: /\/\d+$/ }),
    // Ireland / Nordics / Baltics / Greece
    // /groceries/en-IE/products/<id> (old) and /shop/en-IE/products/<id> (since October 2026)
    // tesco.ie product JSON-LD says GBP next to a € price, so the currency comes from the domain.
    A('tesco', 'IE/UK', ['tesco.ie', 'tesco.com'], { status: 'verified (tesco.ie)', productPath: /\/products\//, currencyByHost: { 'tesco.ie': 'EUR', 'tesco.com': 'GBP' } }),
    A('dunnes', 'IE', ['dunnesstoresgrocery.com'], { status: 'verified (real Chrome, 19 Oct 2026)' }),
    A('supervalu', 'IE', ['shop.supervalu.ie']),
    A('ica', 'SE', ['handlaprivatkund.ica.se'], { status: 'verified (real Chrome, 20 Oct 2026)' }),
    A('willys', 'SE', ['willys.se'], { productPath: /\/produkt\// , status: 'verified' }),
    A('coop-se', 'SE', ['coop.se']),
    A('mathem', 'SE', ['mathem.se']),
    A('nemlig', 'DK', ['nemlig.com']),
    A('bilkatogo', 'DK', ['bilkatogo.dk'], { status: 'verified', productPath: /\/produkt\//, currency: 'DKK', price: '.product-price-col .product-price' }),
    A('s-kaupat', 'FI', ['s-kaupat.fi'], { status: 'verified', productPath: /\/tuote\//, price: '[class*="ProductPagePricing"] [class*="UnitPrice"]' }),
    // JSON-LD "weight" is the packed weight (1.032 kg for 1 l of milk); the title's "1l" is used instead (see extract.js).
    A('k-ruoka', 'FI', ['k-ruoka.fi'], { status: 'verified (real Chrome, 19 Oct 2026)' }),
    A('barbora', 'LT/LV/EE', ['barbora.lt', 'barbora.lv', 'barbora.ee'], { status: 'verified (barbora.lt, real Chrome, 19 Oct 2026)', productPath: /\/produktai\/|\/produkti\/|\/toode\// }),
    A('rimi', 'LT/LV/EE', ['rimi.lt', 'rimi.lv', 'rimi.ee'], { status: 'verified', productPath: /\/p\// }),
    // Rendered client-side. The product's own price is the .ProductPrice in the product block ("0,62 €" with a
    // .ProductPrice__unit-price child "0,62 €/l"); product cards elsewhere on the page use the same class, and the
    // page's structured price can be the amount before VAT, so this reading wins over both.
    A('selver', 'EE', ['selver.ee'], { status: 'verified (real Chrome, 19 Oct 2026)', unitPrice: '.Product__prices .ProductPrice__unit-price',
      custom: (doc, U) => {
        const own = e => !e.closest('[class*="ProductCard"], s, del') && !/ProductPrice--original/.test(e.getAttribute('class') || '');
        const h1 = doc.querySelector('h1');
        const afterTitle = e => !!h1 && !!(h1.compareDocumentPosition(e) & 4);
        const el = [...doc.querySelectorAll('.Product__prices .ProductPrice')].find(own) || [...doc.querySelectorAll('.ProductPrice')].find(e => own(e) && afterTitle(e));
        if (!el) return null;
        const copy = el.cloneNode(true);
        for (const u of copy.querySelectorAll('.ProductPrice__unit-price')) u.remove();
        const price = U.parsePrice(copy.textContent);
        return price > 0 ? { price } : null;
      } }),
    // No structured data: the price block (.main-price .price "1,05 €/τεμ.", .priceKil "1,05 €/λίτρο") comes before the title.
    A('sklavenitis', 'GR', ['sklavenitis.gr'], { status: 'verified (real Chrome, 19 Oct 2026)', price: '.product-detail .main-price .price', unitPrice: '.product-detail .priceKil' }),
    A('ab', 'GR', ['ab.gr'], { status: 'verified', productPath: /\/p\/\d+/, price: '[data-testid="product-properties-price-info"] [data-testid="product-block-price"], [data-testid="product-block-price"]', size: '[data-testid="product-properties-supplementary-price-info"]' }),
    A('mymarket', 'GR', ['mymarket.gr'])
  ];

  // A host entry is a domain ("kaufland.de": the domain and its subdomains), a full host ("shop.billa.at": that host only)
  // or a host with a path prefix ("www.rewe.de/shop": that host, only below /shop/).
  function parseEntry(entry) {
    const i = entry.indexOf('/');
    return i < 0 ? { host: entry, path: '' } : { host: entry.slice(0, i), path: entry.slice(i) };
  }
  const bare = h => String(h).toLowerCase().replace(/^www\./, '');

  function entryMatches(entry, hostname) {
    const { host, path } = parseEntry(entry);
    const h = bare(hostname), x = bare(host);
    return path ? h === x : h === x || h.endsWith('.' + x);
  }

  function entryPatterns(entry) {
    const { host, path } = parseEntry(entry);
    if (path) return [`https://${host}${path}/*`];
    return host.split('.').length > 2 ? [`https://${host}/*`] : [`https://${host}/*`, `https://*.${host}/*`];
  }

  function adapterFor(hostname) {
    return ADAPTERS.find(a => a.hosts.some(x => entryMatches(x, hostname))) || null;
  }

  function matchPatterns(a) {
    return a.hosts.flatMap(entryPatterns);
  }

  // Match patterns to request for the tab the user is on: only the shop domain of that host, not the shop's other countries.
  function originsForHost(a, hostname) {
    if (!a) return [];
    return a.hosts.filter(x => entryMatches(x, hostname)).flatMap(entryPatterns);
  }

  // Optional patterns from the manifest that are covered by granted origins.
  // Browsers may report granted origins with the path reduced to "/*", so compare scheme and host only.
  const originKey = p => String(p).replace(/^([^:]+:\/\/[^/]+).*$/, '$1');
  function grantedPatterns(optional, granted) {
    const have = new Set(granted.map(originKey));
    return optional.filter(p => have.has(originKey(p)));
  }

  // What "Disable" must remove: the granted origins (as the browser reports them, e.g. "https://www.rewe.de/*"
  // for a requested "https://www.rewe.de/shop/*") that belong to the requested ones. Falls back to the requested list.
  function originsToRemove(wanted, granted) {
    const keys = new Set(wanted.map(originKey));
    const hit = [...new Set(granted.filter(g => keys.has(originKey(g))))];
    return hit.length ? hit : wanted.slice();
  }

  const api = { storeHintText, ADAPTERS, adapterFor, matchPatterns, originsForHost, grantedPatterns, originsToRemove };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
