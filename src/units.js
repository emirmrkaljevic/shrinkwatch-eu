// Pack-size parsing and unit-price computation.
(function (root) {
  const UNITS = {
    mg: ['g', 0.001], g: ['g', 1], gr: ['g', 1], gram: ['g', 1], grama: ['g', 1], grams: ['g', 1], dag: ['g', 10], kg: ['g', 1000],
    ml: ['ml', 1], cl: ['ml', 10], dl: ['ml', 100], l: ['ml', 1000], lit: ['ml', 1000], litre: ['ml', 1000], liter: ['ml', 1000], litra: ['ml', 1000],
    kom: ['pc', 1], pcs: ['pc', 1], pc: ['pc', 1], stk: ['pc', 1], 'stück': ['pc', 1], kos: ['pc', 1]
  };
  const NUM = '(\\d+(?:[.,]\\d+)?)';
  const UNIT = '(mg|kg|dag|gr|grams|grama|gram|g|ml|cl|dl|litre|liter|litra|lit|l|kom|pcs|pc|stk|stück|kos)';
  const MULTI = new RegExp(NUM + '\\s*[x×*]\\s*' + NUM + '\\s*' + UNIT + '(?![a-zčćšžđ])', 'i');
  const SINGLE = new RegExp('(?:^|[^\\d.,])' + NUM + '\\s*' + UNIT + '(?![a-zčćšžđ])', 'gi');

  function num(s) { return parseFloat(String(s).replace(',', '.')); }

  function parseSize(text) {
    if (!text) return null;
    const t = String(text).toLowerCase().replace(/\u00a0/g, ' ');
    const m = t.match(MULTI);
    if (m) {
      const [base, f] = UNITS[m[3].toLowerCase()];
      const count = num(m[1]);
      const each = num(m[2]) * f;
      return { amount: round(count * each), unit: base, count, each: round(each) };
    }
    let last = null;
    for (const s of t.matchAll(SINGLE)) {
      const [base, f] = UNITS[s[2].toLowerCase()];
      if (base === 'pc' && last) continue; // prefer weight/volume
      last = { amount: round(num(s[1]) * f), unit: base, count: 1, each: round(num(s[1]) * f) };
      if (base !== 'pc') break;
    }
    return last && last.amount > 0 ? last : null;
  }

  function round(x) { return Math.round(x * 1000) / 1000; }

  // Returns { value, per } where per is 'kg', 'l' or 'pc'.
  function unitPrice(price, size) {
    if (!(price > 0) || !size || !(size.amount > 0)) return null;
    if (size.unit === 'g') return { value: price / size.amount * 1000, per: 'kg' };
    if (size.unit === 'ml') return { value: price / size.amount * 1000, per: 'l' };
    return { value: price / size.amount, per: 'pc' };
  }

  function parsePrice(text) {
    if (text == null) return null;
    if (typeof text === 'number') return text;
    const m = String(text).replace(/\s/g, '').match(/\d[\d.,]*/);
    if (!m) return null;
    let s = m[0].replace(/[.,]$/, '');
    const dec = s.match(/[.,](\d{1,2})$/);
    let v;
    if (dec) v = parseFloat(s.slice(0, -dec[0].length).replace(/[.,]/g, '') + '.' + dec[1]);
    else v = parseFloat(s.replace(/[.,]/g, ''));
    return isNaN(v) ? null : v;
  }

  function formatSize(s) {
    if (!s) return '';
    if (s.unit === 'g') return s.amount >= 1000 ? s.amount / 1000 + ' kg' : s.amount + ' g';
    if (s.unit === 'ml') return s.amount >= 1000 ? s.amount / 1000 + ' l' : s.amount + ' ml';
    return s.amount + ' pcs';
  }

  const api = { parseSize, unitPrice, parsePrice, formatSize };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
