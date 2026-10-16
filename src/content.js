// Runs only on supported shop pages the user opens. Nothing leaves the browser.
(function () {
  const SW = globalThis.SW;
  if (globalThis.SW_RAN) return; // already active on this page
  const forced = globalThis.SW_FORCE === true; // user clicked "Check this page"
  const adapter = SW.adapterFor(location.hostname) || (forced ? { id: 'site-' + location.hostname, productPath: /./ } : null);
  const onProduct = adapter && adapter.productPath && adapter.productPath.test(location.pathname);
  const onListing = adapter && adapter.listing;
  if (!adapter || (!forced && !onProduct && !onListing)) return;
  globalThis.SW_RAN = true;
  const store = chrome.storage.local;

  function fmt(v, cur) {
    try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur }).format(v); } catch (e) { return v.toFixed(2) + ' ' + cur; }
  }

  function render(p, alert) {
    let box = document.getElementById('shrinkwatch-badge');
    if (!box) {
      box = document.createElement('div');
      box.id = 'shrinkwatch-badge';
      box.setAttribute('role', 'status');
      document.documentElement.appendChild(box);
    }
    box.className = alert ? 'sw-alert' : '';
    box.textContent = '';
    const line = (parts) => {
      const div = document.createElement('div');
      for (const [t, bold] of parts) {
        const el = document.createElement(bold ? 'b' : 'span');
        el.textContent = t;
        div.appendChild(el);
      }
      box.appendChild(div);
    };
    if (p.unitPrice) line([[`${fmt(p.unitPrice.value, p.currency)} / ${p.unitPrice.per}`, true], [` (${SW.formatSize(p.size)})`]]);
    else line([['Pack size not found']]);
    if (alert) line([[`⚠ Shrinkflation: was ${SW.formatSize(alert.oldSize)} for ${fmt(alert.oldPrice, p.currency)}, now ${SW.formatSize(alert.newSize)} for ${fmt(alert.newPrice, p.currency)} = `], [`+${alert.unitPriceIncrease}% per unit`, true]]);
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.onclick = () => box.remove();
    box.appendChild(close);
  }

  function renderMissing() {
    render({ unitPrice: null, size: null, currency: 'EUR' }, null);
    document.querySelector('#shrinkwatch-badge div').textContent = 'No product price found on this page';
  }

  async function saveHistory(p) {
    const obs = { size: p.size, price: p.price, currency: p.currency, ts: Date.now() };
    const key = `p:${adapter.id}:${p.id}`;
    const got = await store.get(key);
    const history = got[key] || [];
    const alert = SW.detect(history, obs);
    const updates = { [key]: SW.record(history, obs) };
    // Also index by page URL so listing tiles (link-only) can find the same history.
    const urlId = location.href.split(/[?#]/)[0];
    if (urlId && urlId !== String(p.id)) {
      const urlKey = `p:${adapter.id}:${urlId}`;
      const got2 = await store.get(urlKey);
      updates[urlKey] = SW.record(got2[urlKey] || [], obs);
    }
    await store.set(updates);
    return alert;
  }

  async function runProduct() {
    const p = SW.extract(document, adapter, location.href);
    if (!p) { if (forced && tries === 9) renderMissing(); return false; }
    // A reading that disagrees with the shop's own unit price is shown but not stored, so it cannot raise false alerts later.
    const alert = p.unitPriceFromShop ? null : await saveHistory(p);
    render(p, alert);
    return true;
  }

  async function scanListings() {
    if (!adapter.listing || typeof SW.findTiles !== 'function') return;
    const tiles = SW.findTiles(document, adapter);
    if (!tiles.length) return;
    const own = !!adapter.listing.ownUnitPrice;
    for (const tile of tiles) {
      const product = SW.extractTile(tile, adapter, location.href);
      tile.setAttribute('data-sw-tile', '1');
      if (!product) continue;
      let alert = null;
      if (product.size) {
        const keys = [`p:${adapter.id}:${product.id}`];
        if (product.href && product.href !== product.id) keys.push(`p:${adapter.id}:${product.href}`);
        const got = await store.get(keys);
        for (const k of keys) {
          alert = SW.detect(got[k] || [], { size: product.size, price: product.price, currency: product.currency, ts: Date.now() });
          if (alert) break;
        }
      }
      const showUnit = !own && !SW.shopShowsUnitPrice(tile) && !!product.unitPrice;
      if (showUnit || alert) SW.decorateTile(tile, product, alert, showUnit);
    }
  }

  // Opt-in shops: show nothing unless access is still granted (it may have been removed with "Disable"
  // while this page was loading). Core shops and "Check this page now" need no check.
  async function allowed() {
    if (forced || adapter.core) return true;
    try { return (await chrome.runtime.sendMessage({ type: 'allowed' })) !== false; } catch (e) { return true; }
  }

  let tries = 0;
  function start() {
    if (onProduct || forced) {
      const tick = async () => { if (!(await runProduct()) && ++tries < 10) setTimeout(tick, 1000); };
      tick();
    }

    if (onListing) {
      let timer = 0;
      const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(() => { scanListings().catch(() => {}); }, 250);
      };
      schedule();
      const obs = new MutationObserver(schedule);
      obs.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  allowed().then(ok => { if (ok) start(); else globalThis.SW_RAN = false; });
})();
