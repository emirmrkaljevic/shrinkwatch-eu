// Export and import of the locally stored product history (no DOM, so it can be tested).
(function (root) {
  const FORMAT = 'shrinkwatch-history';

  function exportData(all, now = Date.now()) {
    const products = {};
    for (const [k, v] of Object.entries(all || {})) if (k.startsWith('p:') && Array.isArray(v)) products[k] = v;
    return { format: FORMAT, version: 1, exported: new Date(now).toISOString(), products };
  }

  function validEntry(e) {
    return e && typeof e === 'object' && typeof e.price === 'number' && e.price > 0 && typeof e.ts === 'number' &&
      (e.size == null || (typeof e.size === 'object' && typeof e.size.amount === 'number' && ['g', 'ml', 'pc'].includes(e.size.unit)));
  }

  // Merges imported history into the current one; keeps entries sorted by time and drops duplicates.
  function mergeImport(current, data, max = 20) {
    if (!data || data.format !== FORMAT || typeof data.products !== 'object') throw new Error('This is not a ShrinkWatch history file.');
    const out = {};
    let count = 0;
    for (const [k, list] of Object.entries(data.products)) {
      if (!/^p:[\w.-]+:.+/.test(k) || !Array.isArray(list)) continue;
      const entries = list.filter(validEntry);
      if (!entries.length) continue;
      const seen = new Set();
      const merged = [...((current && current[k]) || []), ...entries]
        .filter(e => { const id = `${e.ts}|${e.price}|${e.size && e.size.amount}`; if (seen.has(id)) return false; seen.add(id); return true; })
        .sort((a, b) => a.ts - b.ts).slice(-max);
      out[k] = merged;
      count++;
    }
    return { updates: out, count };
  }

  const api = { exportData, mergeImport };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
