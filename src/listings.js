// Unit-price and shrinkflation markers on category / search listing tiles.
// Read-only on history; product pages remain the source of recorded observations.
(function (root) {
  const U = root.SW || (typeof require !== 'undefined' ? require('./units.js') : {});

  // Shop already prints a clear unit price on the tile.
  const UNIT_SHOWN = /(\d+[.,]\d+)\s*(?:€|eur|rsd|din|km|bam|kr|kč|zł|ft|lei|ron|лв)?\s*\/\s*(?:1\s*)?(kg|l|100\s*g|100\s*ml)\b/i;

  function shopShowsUnitPrice(tile) {
    const t = (typeof tile.innerText === 'string' && tile.innerText) || tile.textContent || '';
    return UNIT_SHOWN.test(t);
  }

  function absUrl(href, base) {
    if (!href) return '';
    try { return new URL(href, base || 'https://example.com').href.split(/[?#]/)[0]; } catch (e) { return String(href).split(/[?#]/)[0]; }
  }

  function textOf(el, sel) {
    if (!sel) return null;
    const n = el.querySelector(sel);
    if (!n) return null;
    return ((typeof n.innerText === 'string' && n.innerText) || n.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function priceFromTile(tile, listing) {
    if (listing.price) {
      const raw = textOf(tile, listing.price);
      const p = U.parsePrice(raw);
      if (p > 0) return p;
    }
    if (listing.priceAttr) {
      const host = tile.querySelector('[' + listing.priceAttr + ']') || tile;
      const p = U.parsePrice(host.getAttribute(listing.priceAttr));
      if (p > 0) return p;
    }
    const blob = ((typeof tile.innerText === 'string' && tile.innerText) || tile.textContent || '').replace(/\s+/g, ' ');
    // Prefer a pack price with a currency symbol that is not followed by /kg or /l.
    const re = /(\d+[.,]\d{2})\s*(?:€|eur|km|bam|rsd|din)(?!\s*\/)/gi;
    let m, last = null;
    while ((m = re.exec(blob))) {
      if (UNIT_SHOWN.test(blob.slice(Math.max(0, m.index - 5), m.index + m[0].length + 8))) continue;
      last = U.parsePrice(m[1]);
    }
    if (last > 0) return last;
    const kom = blob.match(/(\d+)\s+(\d{2})\s*€\/kom/i);
    if (kom) return U.parsePrice(kom[1] + '.' + kom[2]);
    return null;
  }

  function extractTile(tile, adapter, pageUrl) {
    const listing = adapter.listing || {};
    const a = tile.querySelector(listing.link || 'a[href]');
    const href = a ? a.getAttribute('href') : null;
    if (!href) return null;
    let path = href;
    try { path = new URL(href, pageUrl || 'https://x.invalid').pathname; } catch (e) {}
    if (adapter.productPath && !adapter.productPath.test(path)) return null;

    const name = (listing.nameAttr && (tile.querySelector('[' + listing.nameAttr + ']') || tile).getAttribute(listing.nameAttr))
      || textOf(tile, listing.name)
      || (a && a.getAttribute('aria-label'))
      || (tile.querySelector('img[alt]') && tile.querySelector('img[alt]').getAttribute('alt'))
      || (a && a.textContent.replace(/\s+/g, ' ').trim());
    const price = priceFromTile(tile, listing);
    const currency = listing.currency || adapter.currency || 'EUR';
    const size = U.parseSize(name) || U.parseSize(textOf(tile, listing.size));
    let id = listing.idAttr && (tile.querySelector('[' + listing.idAttr + ']') || tile).getAttribute(listing.idAttr);
    if (!id) id = absUrl(href, pageUrl);
    if (!name || !(price > 0)) return null;
    return {
      id: String(id),
      name: String(name).trim(),
      price,
      currency,
      size,
      unitPrice: U.unitPrice(price, size),
      href: absUrl(href, pageUrl)
    };
  }

  function findTiles(doc, adapter) {
    const listing = adapter && adapter.listing;
    if (!listing || !listing.tile) return [];
    const out = [];
    for (const tile of doc.querySelectorAll(listing.tile)) {
      if (tile.hasAttribute('data-sw-tile')) continue;
      out.push(tile);
    }
    return out;
  }

  function fmt(v, cur) {
    if (typeof U.formatMoney === 'function') return U.formatMoney(v, cur);
    try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur }).format(v); }
    catch (e) { return v.toFixed(2) + ' ' + cur; }
  }

  // Append a compact badge. Never uses innerHTML with dynamic values.
  function decorateTile(tile, product, alert, showUnit) {
    tile.setAttribute('data-sw-tile', '1');
    if (!showUnit && !alert) return;
    let box = null;
    for (const child of tile.children) {
      if (child.classList && child.classList.contains('sw-tile-badge')) { box = child; break; }
    }
    const doc = tile.ownerDocument;
    if (!box) {
      box = doc.createElement('div');
      box.className = 'sw-tile-badge';
      box.setAttribute('role', 'status');
      tile.appendChild(box);
    } else {
      while (box.firstChild) box.removeChild(box.firstChild);
    }
    if (alert) box.classList.add('sw-tile-alert');
    else box.classList.remove('sw-tile-alert');
    if (showUnit && product && product.unitPrice) {
      const line = doc.createElement('span');
      line.className = 'sw-tile-unit';
      line.textContent = `${fmt(product.unitPrice.value, product.currency)} / ${product.unitPrice.per}`;
      box.appendChild(line);
    }
    if (alert) {
      const mark = doc.createElement('span');
      mark.className = 'sw-tile-shrink';
      mark.title = `Pack was ${U.formatSize(alert.oldSize)}, now ${U.formatSize(alert.newSize)} (+${alert.unitPriceIncrease}% per unit)`;
      mark.textContent = '⚠ smaller pack';
      box.appendChild(mark);
    }
  }

  const api = { findTiles, extractTile, decorateTile, shopShowsUnitPrice, absUrl };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
