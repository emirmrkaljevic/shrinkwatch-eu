// Extract product name, price and pack size from the page the user is viewing.
(function (root) {
  const U = root.SW || (typeof require !== 'undefined' ? require('./units.js') : {});

  // Shops often print JSON-LD that strict JSON.parse rejects: raw line breaks or tabs inside strings
  // (long HTML descriptions), invalid escapes such as \' and trailing commas. Only those are repaired.
  function lenientJson(raw) {
    let out = '', inStr = false;
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i];
      if (inStr) {
        if (c === '\\') {
          const n = raw[i + 1];
          if (n !== undefined && '"\\/bfnrtu'.includes(n)) { out += c + n; i++; } // valid escape
          // invalid escape (\' or \x): drop the backslash
          continue;
        }
        if (c === '"') inStr = false;
        out += c.charCodeAt(0) < 0x20 ? ' ' : c;
        continue;
      }
      if (c === '"') inStr = true;
      if (c === ',' && /^\s*[}\]]/.test(raw.slice(i + 1, i + 200))) continue; // trailing comma
      out += c;
    }
    return JSON.parse(out);
  }

  function parseLd(raw) {
    try { return JSON.parse(raw); } catch (e) { /* repaired below */ }
    try { return lenientJson(raw); } catch (e) { return null; }
  }

  function findProductLd(doc) {
    for (const el of doc.querySelectorAll('script[type="application/ld+json"]')) {
      const data = parseLd(el.textContent || '');
      if (!data) continue;
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
      // AggregateOffer: a nested offer carries the real price; lowPrice is the fallback.
      const nested = o.offers ? offerOf({ offers: o.offers }) : {};
      if (nested.price != null) return { price: nested.price, currency: nested.currency || o.priceCurrency };
      if (o.lowPrice != null) return { price: o.lowPrice, currency: o.priceCurrency };
      const spec = [].concat(o.priceSpecification || [])[0];
      if (spec && spec.price != null) return { price: spec.price, currency: spec.priceCurrency || o.priceCurrency };
    }
    return {};
  }

  // Recommendation sliders, "similar products" and struck-out list prices are never the product's own price.
  // ("cross-sell" is not in the list: Jumbo renders the product's own price card with that class.)
  const OTHER = '[class*="slider" i], [class*="carousel" i], [class*="swiper" i], [class*="recommend" i], [class*="related" i], [class*="similar" i], [data-test*="recommend" i], [data-testid*="recommend" i]';
  const STRUCK = 's, del, strike, [class*="strike" i], [data-test*="strike" i]';
  const isOther = el => !!(el.closest && el.closest(OTHER));
  const isStruck = el => !!(el.closest && el.closest(STRUCK));

  function first(doc, sel) {
    if (!sel) return null;
    for (const el of doc.querySelectorAll(sel)) if (!isOther(el) && !isStruck(el)) return el;
    return null;
  }

  function textOf(el) {
    // innerText keeps visual gaps such as "269 99" where textContent would give "26999"
    return el ? (typeof el.innerText === 'string' && el.innerText ? el.innerText : el.textContent).replace(/\s+/g, ' ').trim() : null;
  }

  function text(doc, sel) {
    return textOf(first(doc, sel));
  }

  function meta(doc, prop) {
    const el = doc.querySelector(`meta[property="${prop}"],meta[name="${prop}"],meta[itemprop="${prop}"]`);
    return el ? el.getAttribute('content') : null;
  }

  // schema.org microdata: <span itemprop="price" content="1.99">
  // A lone itemprop="price" outside any itemscope (Rewe: <mark itemprop="price">0,85 €</mark>) is read last.
  function microdata(doc, prop) {
    const el = doc.querySelector(`[itemscope][itemtype*="schema.org/Product" i] [itemprop="${prop}"], [itemprop="offers"] [itemprop="${prop}"]`) ||
      (prop === 'price' ? first(doc, '[itemprop="price"]:not([itemscope] [itemprop="price"])') : null);
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
    const h1 = titleEl(doc);
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

  // Screen-reader-only and hidden copies of a price are not the visible price.
  const HIDDEN = '[hidden], [class*="sr-only" i], [class*="visually-hidden" i], [class*="screen-reader" i], template';
  const isHidden = el => !!(el.closest && el.closest(HIDDEN));

  // Title text without screen-reader-only notes (Netto: "<span class=sr-only>(Produkt aktuell ausverkauft)</span>").
  function titleText(h1) {
    if (!h1) return null;
    const copy = h1.cloneNode(true);
    for (const el of copy.querySelectorAll(HIDDEN)) el.remove();
    return textOf(copy) || textOf(h1);
  }

  // The first non-empty h1: some shops (Rewe) render several empty h1 elements before the product title.
  function titleEl(doc) {
    const all = doc.querySelectorAll('h1');
    for (const h of all) if ((h.textContent || '').trim()) return h;
    return all[0] || null;
  }

  // Fallback for prices drawn as separate euro and cent elements right after the title: <b>119</b><sup>90</sup>
  // The two parts must be neighbours in the same element, and the euro part cannot itself look like cents
  // ("08"), so unrelated numbers are never joined: Netto has two stray "08" cents nodes that gave 8.08.
  const EURO_PART = /^(?:0|[1-9]\d{0,4})$/;
  const CENTS_CLASS = /after-comma|cent|decimal|fraction|minor/i;
  function splitPriceAfterTitle(doc) {
    const h1 = titleEl(doc);
    if (!h1) return null;
    let after = false, prev = null, seen = 0;
    for (const el of doc.querySelectorAll('body *')) {
      if (el === h1) { after = true; continue; }
      if (!after || el.childElementCount > 0 || /^(script|style)$/i.test(el.tagName)) continue;
      if (isOther(el) || isStruck(el) || isHidden(el)) continue;
      const t = (el.textContent || '').trim();
      if (!t) continue;
      if (++seen > 200) break;
      if (prev && /^\d{2}$/.test(t) && EURO_PART.test(prev.t) && !CENTS_CLASS.test(prev.el.getAttribute('class') || '') &&
        prev.el.parentElement === el.parentElement && prev.el.nextElementSibling === el) return parseFloat(prev.t + '.' + t);
      prev = { t, el };
    }
    return null;
  }

  // Some catalogues show only "1 L | 0,85 €/L": price = unit price × pack size.
  function priceFromUnitPrice(doc, adapter, size) {
    if (!size || size.unit === 'pc') return null;
    const el = first(doc, adapter.unitPrice) || first(doc, adapter.size);
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
    let scope = first(doc, adapter.unitPrice);
    if (!scope && adapter.price) {
      scope = first(doc, adapter.price);
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

  // Labels shops print before their own unit price ("Grundpreis: 15.08 / kg", "Prix au kg : 1,26 €/kg").
  const BASE_PRICE_LABEL = /^(?:grundpreis|literpreis|kilopreis|base price|unit price|price per (?:kg|kilo|litre|liter)|prix au (?:kg|kilo|litre|l)|prix unitaire|prezzo al (?:kg|litro|l)|prezzo unitario|precio por (?:kg|litro|l)|precio unitario|preço por (?:kg|litro|l)|prijs per (?:kg|kilo|liter|l)|eenheidsprijs|cena za (?:kg|l|1 ?kg|1 ?l)|cijena za (?:kg|l|j\.?m\.?)|jedinična cijena|cena jednostkowa|jednotková cena|egységár|preț (?:unitar|pe kg|pe l)|jämförpris|kilopris|literpris|enhedspris|yksikköhinta|kilohinta)\b/i;
  function labelledUnitPrice(doc) {
    for (const el of doc.querySelectorAll('div, p, li, dd, dt, td, span')) {
      if (el.childElementCount > 4 || isOther(el) || isStruck(el) || isHidden(el)) continue;
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.length > 80 || !BASE_PRICE_LABEL.test(t)) continue;
      if (UNIT_PRICE.test(t)) return el;
    }
    return null;
  }

  // The shop's own unit price next to the pack price ("10,00 € / 1l"), as { value, per: 'kg' | 'l' }.
  function shopUnitPrice(doc, adapter) {
    let scope = first(doc, adapter.unitPrice);
    if (!scope && adapter.price) {
      scope = first(doc, adapter.price);
      for (let i = 0; scope && i < 3; i++) scope = scope.parentElement;
      if (scope && !UNIT_PRICE.test(scope.innerText || scope.textContent || '')) scope = null;
    }
    if (!scope) scope = labelledUnitPrice(doc);
    if (!scope) return null;
    const m = (scope.innerText || scope.textContent || '').match(UNIT_PRICE);
    if (!m) return null;
    const v = U.parsePrice(m[1]);
    if (!(v > 0)) return null;
    const per = m[2].replace(/\s/g, '').toLowerCase();
    return { value: per.startsWith('100') ? v * 10 : v, per: per === 'kg' || per === '100g' ? 'kg' : 'l' };
  }

  // Currency symbol printed with the price ("€2.25", "49,99 €"). Only symbols that name one currency.
  const SYMBOL = { '€': 'EUR', '£': 'GBP' };
  const PRICE_WITH_SYMBOL = /^(?:([€£])\s?\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s?([€£]))$/;
  function visibleCurrency(doc, adapter) {
    const own = text(doc, adapter.price);
    const sym = own && own.match(/[€£]/);
    if (sym) return SYMBOL[sym[0]];
    const h1 = titleEl(doc);
    if (!h1) return null;
    let after = false, seen = 0;
    for (const el of doc.querySelectorAll('body *')) {
      if (el === h1) { after = true; continue; }
      if (!after || el.childElementCount > 0 || isOther(el) || isStruck(el)) continue;
      if (++seen > 200) break;
      const m = (el.textContent || '').replace(/\s+/g, ' ').trim().match(PRICE_WITH_SYMBOL);
      if (m) return SYMBOL[m[1] || m[2]];
    }
    return null;
  }

  // Currency of the shop domain when the adapter knows it: currencyByHost { 'tesco.ie': 'EUR' } or currency.
  function hostCurrency(adapter, hostname) {
    const h = String(hostname || '').toLowerCase().replace(/^www\./, '');
    const map = adapter.currencyByHost || {};
    for (const k of Object.keys(map)) if (h && (h === k || h.endsWith('.' + k))) return map[k];
    return adapter.currency || null;
  }

  function hostOf(doc, url) {
    try { return new URL(url).hostname; } catch (e) { /* no or relative url */ }
    return (doc.location && doc.location.hostname) || '';
  }

  // adapter: { name, price, currency, currencyByHost, size, unitPrice, id } CSS selectors (all optional),
  // custom(doc) -> partial { name, price, currency, size } for shops that keep data in app state
  function extract(doc, adapter = {}, url = '') {
    const custom = typeof adapter.custom === 'function' ? (adapter.custom(doc, U) || {}) : {};
    const ld = findProductLd(doc);
    const offer = ld ? offerOf(ld) : {};
    const og = meta(doc, 'og:title');
    const name = custom.name || (ld && ld.name) || text(doc, adapter.name) || microdata(doc, 'name') || og || titleText(titleEl(doc));
    let price = custom.price || U.parsePrice(offer.price);
    if (!(price > 0)) price = U.parsePrice(text(doc, adapter.price) || meta(doc, 'product:price:amount') || meta(doc, 'price') || microdata(doc, 'price'));
    if (!(price > 0)) price = splitPriceAfterTitle(doc);
    if (!(price > 0)) price = priceFromUnitPrice(doc, adapter, U.parseSize(text(doc, adapter.size)) || U.parseSize(name));
    // Structured data sometimes names the wrong currency (tesco.ie says GBP next to a € price):
    // a currency known for the shop domain wins, otherwise the symbol printed with the price.
    const declared = offer.currency || meta(doc, 'product:price:currency') || meta(doc, 'priceCurrency') || microdata(doc, 'priceCurrency');
    const known = hostCurrency(adapter, hostOf(doc, url));
    let currency = custom.currency || known || declared;
    if (!custom.currency && !known && declared) {
      const shown = visibleCurrency(doc, adapter);
      if (shown && shown !== declared) currency = shown;
    }
    if (!currency) currency = visibleCurrency(doc, adapter) || 'EUR';
    const nameSize = U.parseSize(name);
    let structured = ldSize(ld);
    // Structured data often gives the size of one item of a multipack ("500 g" for "500 g, 12er Pack").
    if (structured && nameSize && nameSize.count > 1 && structured.count === 1 && nameSize.each === structured.amount && nameSize.unit === structured.unit) structured = nameSize;
    const desc = ld && typeof ld.description === 'string' ? ld.description : '';
    // A short description is often just the pack ("la bouteille 1L"); og:title may add it to a name without one.
    const shortDesc = desc.length <= 60 ? U.parseSize(desc) : null;
    let size = custom.size || U.parseSize(text(doc, adapter.size)) || structured || nameSize || shortDesc || U.parseSize(og) || labelledSize(doc) || sizeNearTitle(doc) || U.parseSize(doc.title) || U.parseSize(desc) || derivedSize(doc, price, adapter);
    const id = custom.id || (ld && (ld.gtin13 || ld.gtin || ld.sku)) || text(doc, adapter.id) || url.split(/[?#]/)[0];
    if (!name || !(price > 0)) return null;
    let unitPrice = U.unitPrice(price, size);
    // Cross-check with the shop's own unit price: if pack price and size disagree with it by more than 5 %,
    // one of them was read wrong, so show the shop's figure and keep this reading out of the price history.
    let unitPriceFromShop = false;
    const shop = unitPrice && !size.derived ? shopUnitPrice(doc, adapter) : null;
    if (shop && shop.per === unitPrice.per && Math.abs(unitPrice.value / shop.value - 1) > 0.05) {
      unitPrice = { value: shop.value, per: shop.per };
      unitPriceFromShop = true;
    }
    const out = { id: String([].concat(id)[0]), name: String(name).trim(), price, currency, size, unitPrice };
    if (unitPriceFromShop) out.unitPriceFromShop = true;
    return out;
  }

  const api = { extract, findProductLd };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
