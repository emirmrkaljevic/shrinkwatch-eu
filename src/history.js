// Shrinkflation detection from locally stored observations.
(function (root) {
  // prev/cur: { size: {amount, unit}, price, currency, ts }
  function compare(prev, cur) {
    if (!prev || !cur || !prev.size || !cur.size) return null;
    if (prev.size.derived || cur.size.derived) return null; // estimated sizes are too rough to accuse a product
    if (prev.size.unit !== cur.size.unit || prev.currency !== cur.currency) return null;
    if (!(cur.size.amount < prev.size.amount)) return null;
    const oldUnit = prev.price / prev.size.amount;
    const newUnit = cur.price / cur.size.amount;
    const increase = (newUnit / oldUnit - 1) * 100;
    if (increase <= 0.5) return null; // smaller but proportionally cheaper: not shrinkflation
    return {
      type: 'shrinkflation',
      oldSize: prev.size, newSize: cur.size,
      oldPrice: prev.price, newPrice: cur.price,
      sizeChange: Math.round((cur.size.amount / prev.size.amount - 1) * 1000) / 10,
      unitPriceIncrease: Math.round(increase * 10) / 10,
      since: prev.ts
    };
  }

  // Keep a compact per-product history: only store an entry when size or price changed.
  function record(history, obs, max = 20) {
    const h = Array.isArray(history) ? history.slice() : [];
    const last = h[h.length - 1];
    if (last && last.price === obs.price && last.size && obs.size && last.size.amount === obs.size.amount && last.size.unit === obs.size.unit) {
      last.seen = obs.ts;
      return h;
    }
    h.push(obs);
    return h.slice(-max);
  }

  // Compare the current observation to the most recent stored one with a larger size.
  function detect(history, cur) {
    if (!Array.isArray(history)) return null;
    for (let i = history.length - 1; i >= 0; i--) {
      const r = compare(history[i], cur);
      if (r) return r;
    }
    return null;
  }

  const api = { compare, record, detect };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
