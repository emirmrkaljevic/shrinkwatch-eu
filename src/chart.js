// Price history points for the popup chart (no DOM, so it can be tested).
(function (root) {
  const U = root.SW || (typeof require === 'function' ? require('./units.js') : {});

  // Turns stored observations into points of unit price over time.
  function historyPoints(history) {
    const pts = [];
    for (const h of Array.isArray(history) ? history : []) {
      const up = U.unitPrice(h.price, h.size);
      if (!up) continue;
      pts.push({ ts: h.ts, value: up.value, per: up.per, price: h.price, size: h.size, currency: h.currency });
      if (h.seen && h.seen > h.ts) pts.push({ ts: h.seen, value: up.value, per: up.per, price: h.price, size: h.size, currency: h.currency });
    }
    return pts.sort((a, b) => a.ts - b.ts);
  }

  // Maps points to SVG coordinates inside width x height with padding.
  function layout(points, width, height, pad = 6) {
    if (!points.length) return [];
    const t0 = points[0].ts, t1 = points[points.length - 1].ts;
    let lo = Math.min(...points.map(p => p.value)), hi = Math.max(...points.map(p => p.value));
    if (hi === lo) { hi += 1; lo -= 1; }
    return points.map(p => ({
      x: t1 === t0 ? width / 2 : pad + (p.ts - t0) / (t1 - t0) * (width - 2 * pad),
      y: pad + (hi - p.value) / (hi - lo) * (height - 2 * pad)
    }));
  }

  const api = { historyPoints, layout };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
