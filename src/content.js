// Runs only on supported shop pages the user opens. Nothing leaves the browser.
(function () {
  const SW = globalThis.SW;
  if (globalThis.SW_RAN) return; // already active on this page
  const forced = globalThis.SW_FORCE === true; // user clicked "Check this page"
  const adapter = SW.adapterFor(location.hostname) || (forced ? { id: 'site-' + location.hostname, productPath: /./ } : null);
  // Runs on every page of a supported shop: single-page shops (Mercadona) move from search to a product without a page load.
  if (!adapter) return;
  let mode = SW.pageMode(adapter, location.pathname, forced);
  let onProduct = SW.pageMode(adapter, location.pathname, false).product;
  const onListing = mode.listing;
  globalThis.SW_RAN = true;
  const store = chrome.storage.local;

  const fmt = (v, cur) => SW.formatMoney(v, cur);

  // The badge lives in a shadow root with its own styles, so shop CSS (resets, !important rules) cannot restyle or hide it.
  const BADGE_CSS = ':host{all:initial}' +
    '.box{position:fixed;right:16px;bottom:16px;z-index:2147483647;max-width:320px;padding:10px 30px 10px 12px;background:#fff;color:#111;border:2px solid #2e7d32;border-radius:10px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.2);text-align:left}' +
    '.box.sw-alert{border-color:#c62828;background:#fff5f5}div{margin:0}b{font-weight:700;color:#111}span{color:#555}' +
    'button{position:absolute;top:4px;right:6px;border:0;padding:0 4px;background:none;font:18px/1 system-ui,sans-serif;cursor:pointer;color:#555}';

  function badgeBox() {
    let host = document.getElementById('shrinkwatch-badge');
    if (host && host.shadowRoot) return host.shadowRoot.querySelector('.box');
    if (host) host.remove();
    host = document.createElement('div');
    host.id = 'shrinkwatch-badge';
    host.style.setProperty('all', 'initial', 'important');
    host.style.setProperty('display', 'block', 'important');
    const root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = BADGE_CSS;
    const box = document.createElement('div');
    box.className = 'box';
    box.setAttribute('role', 'status');
    root.append(style, box);
    document.documentElement.appendChild(host);
    return box;
  }

  function render(p, alert) {
    const box = badgeBox();
    box.className = alert ? 'box sw-alert' : 'box';
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
    else {
      const [title, hint] = SW.missingSizeText();
      line(p.price ? [[`${fmt(p.price, p.currency)}`, true], [` · ${title}`]] : [[title]]);
      if (p.price) line([[hint]]);
    }
    if (alert) line([[`⚠ Shrinkflation: was ${SW.formatSize(alert.oldSize)} for ${fmt(alert.oldPrice, p.currency)}, now ${SW.formatSize(alert.newSize)} for ${fmt(alert.newPrice, p.currency)} = `], [`+${alert.unitPriceIncrease}% per unit`, true]]);
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.onclick = () => { const host = document.getElementById('shrinkwatch-badge'); if (host) host.remove(); };
    box.appendChild(close);
  }

  function renderMissing() {
    render({ unitPrice: null, size: null, currency: 'EUR' }, null);
    badgeBox().querySelector('div').textContent = 'No product price found on this page';
  }

  // Shops that hide prices until a store or delivery address is chosen get a hint instead of nothing.
  function renderStoreHint() {
    render({ unitPrice: null, size: null, currency: 'EUR' }, null);
    badgeBox().querySelector('div').textContent = SW.storeHintText(adapter);
  }

  async function saveHistory(p) {
    const obs = { size: p.size, price: p.price, currency: p.currency, ts: Date.now() };
    const key = `p:${adapter.id}:${p.id}`;
    // Lets the popup show this product's price history.
    globalThis.SW_LAST = { key, name: p.name };
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
  let run = 0; // bumps on every path change so a stale product loop stops

  function startProduct() {
    const mine = ++run;
    tries = 0;
    const tick = async () => {
      if (mine !== run) return;
      if (await runProduct()) return;
      if (mine !== run) return;
      ++tries;
      if (adapter.needsStore && onProduct && tries === 10) renderStoreHint();
      // Keep looking slowly after the hint, so the unit price appears once a store is chosen on the page.
      if (tries < 10) setTimeout(tick, 1000);
      else if (adapter.needsStore && tries < 130) setTimeout(tick, 5000);
    };
    tick();
  }

  function start() {
    if (mode.product) startProduct();
    // The badge belongs to the page it was read on: on a path change it is removed, and read again if the new page is a product.
    if (!forced) {
      SW.watchPath(() => location.pathname, (path) => {
        run++;
        const host = document.getElementById('shrinkwatch-badge');
        if (host) host.remove();
        mode = SW.pageMode(adapter, path, false);
        onProduct = mode.product;
        if (onProduct) startProduct();
      }, { window: globalThis });
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
