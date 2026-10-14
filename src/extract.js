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
    for (const o of [].concat(p.offers || [])) {
      if (!o) continue;
      if (o.price != null) return { price: o.price, currency: o.priceCurrency };
      if (o.lowPrice != null) return { price: o.lowPrice, currency: o.priceCurrency };
      const spec = [].concat(o.priceSpecification || [])[0];
      if (spec && spec.price != null) return { price: spec.price, currency: spec.priceCurrency || o.priceCurrency };
    }
    return {};
  }

  function text(doc, sel) {
    if (!sel) return null;
    const el = doc.querySelector(sel);
    // innerText keeps visual gaps such as "269 99" where textContent would give "26999"
    return el ? (typeof el.innerText === 'string' && el.innerText ? el.innerText : el.textContent).replace(/\s+/g, ' ').trim() : null;
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

  // Labels shops use for a separate pack-size field, in the languages of supported shops.
  const SIZE_LABEL = /^(inhalt|nettoinhalt|füllmenge|menge|inhoud|contenu|poids net|poids|contenance|contenuto|peso netto|quantità|contenido|peso neto|cantidad|conteúdo|peso líquido|quantidade|gramatura|zawartość|waga netto|pojemność|hmotnost|obsah|množství|kiszerelés|nettó tömeg|tartalom|cantitate|greutate netă|gramaj|neto količina|količina|neto|pakiranje|masa|teža|neto masa|zapremina|nettovikt|vikt|mängd|volym|storlek|förpackning|nettovægt|netto mængde|nettomængde|nettoindhold|indhold|mængde|нето|нето количество|количество|разфасовка|грамаж|sisältö|nettopaino|määrä|kogus|neto kogis|kiekis|svoris|daudzums|tilpums|svars|καθαρό βάρος|βάρος|ποσότητα|περιεκτικότητα|net weight|net content|size|pack size|weight|quantity)\s*:?$/i;

  function labelledSize(doc) {
    const cands = doc.querySelectorAll('dt, th, td, span, div, li, strong, b, label, p');
    for (const el of cands) {
      if (el.childElementCount > 3) continue;
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || t.length > 40) continue;
      const m = t.match(/^([^:]{2,30}):\s*(.+)$/);
      if (m && SIZE_LABEL.test(m[1].trim())) { const s = U.parseSize(m[2]); if (s) return s; }
      if (!SIZE_LABEL.test(t)) continue;
      const next = el.nextElementSibling || (el.parentElement && el.parentElement.nextElementSibling);
      if (next) { const s = U.parseSize(next.textContent); if (s) return s; }
    }
    return null;
  }

  // A small element right after the product title whose whole text is a size ("500 g", "ca: 750g", "cca 100 g").
  const SIZE_ONLY = /^(?:ca\.?:?|cca\.?|approx\.?|~|≈|emb\.?|inh\.?|per\s+\w+)?\s*\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*)?(?:mg|g|gr|kg|dag|ml|cl|dl|l|ltr|lt|liter|litre|г|гр|кг|мл|л|γρ|κιλ|ml|λ|λτ)\.?$/i;
  function sizeNearTitle(doc) {
    const h1 = doc.querySelector('h1');
    if (!h1) return null;
    const scope = (h1.parentElement && h1.parentElement.closest('main, article, [class*="product" i], [class*="detail" i]')) || doc.body;
    let seen = 0, after = false;
    for (const el of scope.querySelectorAll('*')) {
      if (el === h1) { after = true; continue; }
      if (!after || el.childElementCount > 0) continue;
      if (el.closest('table, [class*="nutri" i], [class*="naehr" i], [class*="voeding" i], [class*="nutrition" i]')) continue;
      if (++seen > 300) break;
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.length < 2 || t.length > 20) continue;
      const before = el.previousElementSibling ? el.previousElementSibling.textContent.trim() : '';
      if (/(pr\.?|per|pro|je|na|par|za|ανά|за|nährwerte|næring|voeding|nutri)\s*$/i.test(before)) continue; // "per 100 g" nutrition headers
      if (SIZE_ONLY.test(t)) { const s = U.parseSize(t.replace(/^(ca\.?:?|cca\.?|approx\.?|~|≈|emb\.?|inh\.?|per\s+\w+)\s*/i, '').replace(/\b(ltr|lt)\b/i, 'l')); if (s) return s; }
    }
    return null;
  }

  // Fallback for prices drawn as separate euro and cent elements right after the title: <b>119</b><sup>90</sup>
  function splitPriceAfterTitle(doc) {
    const h1 = doc.querySelector('h1');
    if (!h1) return null;
    let after = false, prev = null, seen = 0;
    for (const el of doc.querySelectorAll('body *')) {
      if (el === h1) { after = true; continue; }
      if (!after || el.childElementCount > 0 || /^(script|style)$/i.test(el.tagName)) continue;
      const t = (el.textContent || '').trim();
      if (!t) continue;
      if (++seen > 200) break;
      if (prev && /^\d{2}$/.test(t) && /^\d{1,5}$/.test(prev)) return parseFloat(prev + '.' + t);
      prev = t;
    }
    return null;
  }

  // Some catalogues show only "1 L | 0,85 €/L": price = unit price × pack size.
  function priceFromUnitPrice(doc, adapter, size) {
    if (!size || size.unit === 'pc') return null;
    const el = (adapter.unitPrice && doc.querySelector(adapter.unitPrice)) || (adapter.size && doc.querySelector(adapter.size));
    if (!el) return null;
    const m = (el.textContent || '').match(UNIT_PRICE);
    if (!m) return null;
    const up = U.parsePrice(m[1]);
    const per = m[2].replace(/\s/g, '').toLowerCase();
    const base = per.startsWith('100') ? 100 : 1000;
    return up > 0 ? Math.round(up * size.amount / base * 100) / 100 : null;
  }

  // schema.org netContent / weight / size: { value, unitCode | unitText } or "500 g"
  function ldSize(ld) {
    if (!ld) return null;
    for (const k of ['netContent', 'weight', 'size']) {
      const v = ld[k];
      if (!v) continue;
      if (typeof v === 'string') { const s = U.parseSize(v); if (s) return s; }
      else if (v.value) {
        const unit = ({ GRM: 'g', KGM: 'kg', MLT: 'ml', LTR: 'l', CLT: 'cl', H87: 'pcs' })[v.unitCode] || v.unitText || '';
        const s = U.parseSize(`${v.value} ${unit}`); if (s) return s;
      }
    }
    return null;
  }

  // When only the shop's own unit price is shown ("1,99 €/kg"), derive the pack size from it.
  const UNIT_PRICE = /(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|kr|kč|zł|ft|lei|ron|rsd|din|km|bam|лв|bgn|huf|pln|czk|sek|dkk)?\s*\/\s*(?:1\s*)?(kg|l|100\s*g|100\s*ml)\b/i;
  function derivedSize(doc, price, adapter) {
    if (!(price > 0)) return null;
    let scope = adapter.unitPrice && doc.querySelector(adapter.unitPrice);
    if (!scope && adapter.price) {
      scope = doc.querySelector(adapter.price);
      for (let i = 0; scope && i < 3; i++) scope = scope.parentElement; // the price block, not the whole page
    }
    if (!scope) return null;
    const m = ((scope.innerText || scope.textContent || '')).match(UNIT_PRICE);
    if (!m) return null;
    const up = U.parsePrice(m[1]);
    if (!(up > 0)) return null;
    const per = m[2].replace(/\s/g, '').toLowerCase();
    const base = per === 'kg' || per === '100g' ? 'g' : 'ml';
    const factor = per.startsWith('100') ? 100 : 1000;
    const amount = Math.round((price / up) * factor / 5) * 5;
    if (!(amount > 0)) return null;
    return { amount, unit: base, count: 1, each: amount, derived: true };
  }

  // adapter: { name, price, currency, size, unitPrice, id } CSS selectors (all optional),
  // custom(doc) -> partial { name, price, currency, size } for shops that keep data in app state
  function extract(doc, adapter = {}, url = '') {
    const custom = typeof adapter.custom === 'function' ? (adapter.custom(doc, U) || {}) : {};
    const ld = findProductLd(doc);
    const offer = ld ? offerOf(ld) : {};
    const name = custom.name || (ld && ld.name) || text(doc, adapter.name) || microdata(doc, 'name') || meta(doc, 'og:title') || text(doc, 'h1');
    let price = custom.price || U.parsePrice(offer.price);
    if (!(price > 0)) price = U.parsePrice(text(doc, adapter.price) || meta(doc, 'product:price:amount') || meta(doc, 'price') || microdata(doc, 'price'));
    if (!(price > 0)) price = splitPriceAfterTitle(doc);
    let sizeEarly = null;
    if (!(price > 0)) price = priceFromUnitPrice(doc, adapter, (sizeEarly = U.parseSize(text(doc, adapter.size)) || U.parseSize(name)));
    const currency = custom.currency || offer.currency || meta(doc, 'product:price:currency') || meta(doc, 'priceCurrency') || microdata(doc, 'priceCurrency') || adapter.currency || 'EUR';
    let size = custom.size || U.parseSize(text(doc, adapter.size)) || ldSize(ld) || U.parseSize(name) || labelledSize(doc) || sizeNearTitle(doc) || U.parseSize(doc.title) || U.parseSize(ld && ld.description) || derivedSize(doc, price, adapter);
    const id = custom.id || (ld && (ld.gtin13 || ld.gtin || ld.sku)) || text(doc, adapter.id) || url.split(/[?#]/)[0];
    if (!name || !(price > 0)) return null;
    return { id: String([].concat(id)[0]), name: String(name).trim(), price, currency, size, unitPrice: U.unitPrice(price, size) };
  }

  const api = { extract, findProductLd };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
