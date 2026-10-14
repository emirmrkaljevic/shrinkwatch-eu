// Extract product name, price and pack size from the page the user is viewing.
(function (root) {
  const U = root.SW || (typeof require !== 'undefined' ? require('./units.js') : {});

  function findProductLd(doc) {
    for (const el of doc.querySelectorAll('script[type="application/ld+json"]')) {
      let data;
      try { data = JSON.parse(el.textContent.replace(/,\s*([}\]])/g, '$1')); } catch (e) { continue; }
      const queue = [].concat(data);
      while (queue.length) {
        const n = queue.shift();
        if (!n || typeof n !== 'object') continue;
        const t = [].concat(n['@type'] || []);
        if (t.includes('Product')) return n;
        if (n['@graph']) queue.push(...[].concat(n['@graph']));
      }
    }
    return null;
  }

  function offerOf(p) {
    const o = [].concat(p.offers || [])[0];
    if (!o) return {};
    if (o['@type'] === 'AggregateOffer') return { price: o.lowPrice, currency: o.priceCurrency };
    return { price: o.price, currency: o.priceCurrency };
  }

  function text(doc, sel) {
    if (!sel) return null;
    const el = doc.querySelector(sel);
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
  }

  function meta(doc, prop) {
    const el = doc.querySelector(`meta[property="${prop}"],meta[name="${prop}"],meta[itemprop="${prop}"]`);
    return el ? el.getAttribute('content') : null;
  }

  // schema.org microdata: <span itemprop="price" content="1.99">
  function microdata(doc, prop) {
    const el = doc.querySelector(`[itemscope][itemtype*="schema.org/Product" i] [itemprop="${prop}"], [itemprop="offers"] [itemprop="${prop}"]`);
    if (!el) return null;
    return el.getAttribute('content') || el.textContent.trim();
  }

  // adapter: { name, price, currency, size, id } CSS selectors (all optional)
  function extract(doc, adapter = {}, url = '') {
    const ld = findProductLd(doc);
    const offer = ld ? offerOf(ld) : {};
    const name = (ld && ld.name) || text(doc, adapter.name) || microdata(doc, 'name') || meta(doc, 'og:title') || text(doc, 'h1');
    let price = U.parsePrice(offer.price);
    if (!(price > 0)) price = U.parsePrice(text(doc, adapter.price) || meta(doc, 'product:price:amount') || meta(doc, 'price') || microdata(doc, 'price'));
    const currency = offer.currency || meta(doc, 'product:price:currency') || meta(doc, 'priceCurrency') || microdata(doc, 'priceCurrency') || adapter.currency || 'EUR';
    const sizeText = [text(doc, adapter.size), name, ld && ld.description].filter(Boolean);
    let size = null;
    for (const s of sizeText) { size = U.parseSize(s); if (size) break; }
    const id = (ld && (ld.gtin13 || ld.gtin || ld.sku)) || text(doc, adapter.id) || url.split(/[?#]/)[0];
    if (!name || !(price > 0)) return null;
    return { id: String([].concat(id)[0]), name: String(name).trim(), price, currency, size, unitPrice: U.unitPrice(price, size) };
  }

  const api = { extract, findProductLd };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
