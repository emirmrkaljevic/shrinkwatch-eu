// Runs only on supported shop pages the user opens. Nothing leaves the browser.
(function () {
  const SW = globalThis.SW;
  const adapter = SW.adapterFor(location.hostname);
  if (!adapter || !adapter.productPath.test(location.pathname)) return;
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

  async function run() {
    const p = SW.extract(document, adapter, location.href);
    if (!p) return false;
    const key = `p:${adapter.id}:${p.id}`;
    const got = await store.get(key);
    const history = got[key] || [];
    const obs = { size: p.size, price: p.price, currency: p.currency, ts: Date.now() };
    const alert = SW.detect(history, obs);
    render(p, alert);
    await store.set({ [key]: SW.record(history, obs) });
    return true;
  }

  // Shops that render client-side need a few retries.
  let tries = 0;
  const tick = async () => { if (!(await run()) && ++tries < 10) setTimeout(tick, 1000); };
  tick();
})();
