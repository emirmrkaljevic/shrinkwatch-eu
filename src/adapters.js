// Per-shop configuration. Every shop falls back to schema.org JSON-LD and Open Graph data.
// Selectors are only used when structured data is missing.
(function (root) {
  const ADAPTERS = [
    { id: 'konzum', hosts: ['konzum.hr', 'konzum.ba'], productPath: /^\/web\/products\//, price: '.single-product__price .price--primary', name: '.single-product__title h1', status: 'verified' },
    { id: 'lidl', hosts: ['lidl.hr', 'lidl.si', 'lidl.rs', 'lidl.de', 'lidl.at', 'lidl.ba'], productPath: /\/p\d+/, price: '.m-price__price, .ods-price__value', size: '.price-footer, .ods-price__footer', status: 'json-ld (price rendered client-side)' },
    { id: 'kaufland', hosts: ['kaufland.de', 'kaufland.hr', 'kaufland.bg', 'kaufland.ro', 'kaufland.cz', 'kaufland.sk'], productPath: /\/product\//, price: '.rd-price-information__price', status: 'best-effort' },
    { id: 'mercator', hosts: ['mercatoronline.si', 'mercator.si', 'mercator.rs'], productPath: /./, price: '.price, .product-price', status: 'best-effort' },
    { id: 'bingo', hosts: ['bingotuzla.ba', 'bingo.ba'], productPath: /./, price: '.price .amount, .woocommerce-Price-amount', currency: 'BAM', status: 'best-effort (WooCommerce)' },
    { id: 'spar', hosts: ['spar.hr', 'spar.si', 'spar.at'], productPath: /./, status: 'json-ld' },
    { id: 'tommy', hosts: ['tommy.hr'], productPath: /./, status: 'json-ld' },
    { id: 'rewe', hosts: ['shop.rewe.de', 'rewe.de'], productPath: /\/p\//, status: 'json-ld' },
    { id: 'tesco', hosts: ['tesco.com', 'tesco.ie'], productPath: /\/products\//, status: 'json-ld' }
  ];

  function adapterFor(hostname) {
    const h = String(hostname).replace(/^www\./, '');
    return ADAPTERS.find(a => a.hosts.some(x => h === x || h.endsWith('.' + x))) || null;
  }

  const api = { ADAPTERS, adapterFor };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
