// Per-shop configuration. Every shop falls back to schema.org JSON-LD, microdata and Open Graph data.
// Selectors are only used when structured data is missing.
// core: true  -> host permission requested at install (small, verified set)
// core: false -> optional host permission, requested only when the user enables the shop in the popup
(function (root) {
  const A = (id, country, hosts, extra = {}) => ({ id, country, hosts, productPath: /./, core: false, status: 'unverified', ...extra });
  const ADAPTERS = [
    // Balkans (core)
    A('konzum', 'HR/BA', ['konzum.hr', 'konzum.ba'], { core: true, productPath: /^\/web\/products\//, price: '.single-product__price .price--primary', name: '.single-product__title h1', status: 'verified' }),
    A('tommy', 'HR', ['tommy.hr'], { core: true, productPath: /^\/proizvodi\//, status: 'verified' }),
    A('mercator', 'SI', ['mercatoronline.si'], { core: true, productPath: /^\/izdelek\//, price: '.price-box .price', status: 'verified' }),
    A('bingo', 'BA', ['bingoshop.ba'], { core: true, productPath: /^\/proizvod\//, price: 'div.price', currency: 'BAM', status: 'verified' }),
    A('lidl', 'DE/AT/HR/SI/RS/BA', ['lidl.de', 'lidl.at', 'lidl.hr', 'lidl.si', 'lidl.rs', 'lidl.ba'], { core: true, productPath: /\/p\d+/, price: '.ods-price__value, .m-price__price', status: 'verified (lidl.de)' }),
    A('lidl-eu', 'EU', ['lidl.fr', 'lidl.es', 'lidl.it', 'lidl.nl', 'lidl.be', 'lidl.pl', 'lidl.cz', 'lidl.sk', 'lidl.hu', 'lidl.ro', 'lidl.bg', 'lidl.pt', 'lidl.ie', 'lidl.se', 'lidl.dk', 'lidl.fi', 'lidl.gr', 'lidl.lt', 'lidl.lv', 'lidl.ee'], { productPath: /\/p\d+/, price: '.ods-price__value, .m-price__price' }),
    // Balkans (optional)
    A('maxi', 'RS', ['maxi.rs'], { status: 'verified', core: true, productPath: /\/p\/\d+/, currency: 'RSD', price: '[data-testid="product-properties-price-info"] [data-testid="product-block-price"], [data-testid="product-block-price"]', size: '[data-testid="product-properties-supplementary-price-info"]' }),
    A('idea', 'RS', ['online.idea.rs'], { currency: 'RSD' , status: 'verified' }),
    A('spar-si', 'SI', ['online.spar.si']),
    // Germany
    A('rewe', 'DE', ['shop.rewe.de'], { productPath: /\/p\// }),
    A('kaufland', 'DE/CZ/SK', ['kaufland.de', 'kaufland.cz', 'kaufland.sk'], { productPath: /\/product\//, price: '.rd-price-information__price' }),
    A('dm', 'DE/AT', ['dm.de', 'dm.at'], { productPath: /-p\d+\.html|\/p\/d\/\d+/ }),
    A('rossmann', 'DE', ['rossmann.de'], { status: 'verified (price; size not in name)', productPath: /\/p\// }),
    A('netto', 'DE', ['netto-online.de']),
    // Austria
    A('billa', 'AT', ['shop.billa.at'], { status: 'verified', productPath: /\/produkte\//, price: '.ws-product-price-value',
      // pack info is a list item such as "1 liter Packung" or "500 g Becher"
      custom: (doc, U) => { for (const li of doc.querySelectorAll('li')) { const t = li.textContent.trim(); if (t.length < 40 && /packung|stück|flasche|dose|beutel|becher|glas|tasse|schale|netz|karton|tube|tiegel/i.test(t)) { const size = U.parseSize(t); if (size) return { size }; } } return null; } }),
    A('gurkerl', 'AT', ['gurkerl.at'], { productPath: /^\/\d+-/ , status: 'verified' }),
    // France
    A('carrefour-fr', 'FR', ['carrefour.fr'], { productPath: /\/p\// }),
    A('auchan-fr', 'FR', ['auchan.fr'], { productPath: /\/pr-/ }),
    A('leclerc', 'FR', ['e.leclerc', 'leclercdrive.fr']),
    A('intermarche', 'FR', ['intermarche.com'], { productPath: /\/produit\// }),
    A('monoprix', 'FR', ['monoprix.fr'], { productPath: /\/products\/|\/p\// }),
    A('coursesu', 'FR', ['coursesu.com'], { productPath: /\/p\// }),
    // Italy
    A('esselunga', 'IT', ['spesaonline.esselunga.it'], { status: 'verified' }),
    A('carrefour-it', 'IT', ['carrefour.it']),
    A('conad', 'IT', ['spesaonline.conad.it']),
    A('coop-it', 'IT', ['coopshop.it', 'easycoop.com']),
    // Spain / Portugal
    A('mercadona', 'ES', ['tienda.mercadona.es']),
    A('carrefour-es', 'ES', ['carrefour.es'], { productPath: /\/R-/ }),
    A('dia', 'ES', ['dia.es'], { productPath: /\/p\// }),
    A('alcampo', 'ES', ['compraonline.alcampo.es'], { productPath: /\/products\// }),
    A('eroski', 'ES', ['supermercado.eroski.es'], { productPath: /\/productdetail\// }),
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
    A('carrefour-be', 'BE', ['carrefour.be']),
    // Poland / Czechia / Slovakia / Hungary / Romania / Bulgaria
    A('frisco', 'PL', ['frisco.pl'], { productPath: /\/pid,/ , status: 'verified' }),
    A('carrefour-pl', 'PL', ['carrefour.pl']),
    A('auchan-pl', 'PL', ['zakupy.auchan.pl'], { productPath: /\/products\//, currency: 'PLN' }),
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
    A('tesco', 'IE/UK', ['tesco.ie', 'tesco.com'], { productPath: /\/products\// }),
    A('dunnes', 'IE', ['dunnesstoresgrocery.com']),
    A('supervalu', 'IE', ['shop.supervalu.ie']),
    A('ica', 'SE', ['handlaprivatkund.ica.se']),
    A('willys', 'SE', ['willys.se'], { productPath: /\/produkt\// , status: 'verified' }),
    A('coop-se', 'SE', ['coop.se']),
    A('mathem', 'SE', ['mathem.se']),
    A('nemlig', 'DK', ['nemlig.com']),
    A('bilkatogo', 'DK', ['bilkatogo.dk'], { status: 'verified', productPath: /\/produkt\//, currency: 'DKK', price: '.product-price-col .product-price' }),
    A('s-kaupat', 'FI', ['s-kaupat.fi'], { status: 'verified', productPath: /\/tuote\//, price: '[class*="ProductPagePricing"] [class*="UnitPrice"]' }),
    A('k-ruoka', 'FI', ['k-ruoka.fi']),
    A('barbora', 'LT/LV/EE', ['barbora.lt', 'barbora.lv', 'barbora.ee'], { productPath: /\/produktai\/|\/produkti\/|\/toode\// }),
    A('rimi', 'LT/LV/EE', ['rimi.lt', 'rimi.lv', 'rimi.ee'], { status: 'verified', productPath: /\/p\// }),
    A('selver', 'EE', ['selver.ee']),
    A('sklavenitis', 'GR', ['sklavenitis.gr']),
    A('ab', 'GR', ['ab.gr'], { status: 'verified', productPath: /\/p\/\d+/, price: '[data-testid="product-properties-price-info"] [data-testid="product-block-price"], [data-testid="product-block-price"]', size: '[data-testid="product-properties-supplementary-price-info"]' }),
    A('mymarket', 'GR', ['mymarket.gr'])
  ];

  function adapterFor(hostname) {
    const h = String(hostname).replace(/^www\./, '');
    return ADAPTERS.find(a => a.hosts.some(x => h === x || h.endsWith('.' + x))) || null;
  }

  function matchPatterns(a) {
    return a.hosts.flatMap(h => (h.split('.').length > 2 ? [`https://${h}/*`] : [`https://${h}/*`, `https://*.${h}/*`]));
  }

  const api = { ADAPTERS, adapterFor, matchPatterns };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
