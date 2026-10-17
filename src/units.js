// Pack-size parsing and unit-price computation.
(function (root) {
  const UNITS = {
    mg: ['g', 0.001], g: ['g', 1], gr: ['g', 1], gram: ['g', 1], grama: ['g', 1], grams: ['g', 1], gramos: ['g', 1], dag: ['g', 10], kg: ['g', 1000],
    ml: ['ml', 1], milliliter: ['ml', 1], millilitre: ['ml', 1], kilogram: ['g', 1000], kilogramm: ['g', 1000], gramm: ['g', 1], cl: ['ml', 10], dl: ['ml', 100], l: ['ml', 1000], lt: ['ml', 1000], ltr: ['ml', 1000], lit: ['ml', 1000], litre: ['ml', 1000], liter: ['ml', 1000], litra: ['ml', 1000], litro: ['ml', 1000], litros: ['ml', 1000], litri: ['ml', 1000], litrů: ['ml', 1000],
    'г': ['g', 1], 'гр': ['g', 1], 'кг': ['g', 1000], 'мл': ['ml', 1], 'л': ['ml', 1000], 'γρ': ['g', 1], 'κιλό': ['g', 1000], 'λτ': ['ml', 1000],
    kom: ['pc', 1], pcs: ['pc', 1], pc: ['pc', 1], stk: ['pc', 1], 'stück': ['pc', 1], kos: ['pc', 1]
  };
  const NUM = '(\\d+(?:[.,]\\d+)?)';
  const UNIT = '(кг|гр|мл|г|л|γρ|κιλό|λτ|milliliter|millilitre|kilogramm|kilogram|gramm|mg|kg|dag|gr|gramos|grams|grama|gram|g|ml|cl|dl|litros|litro|litri|litrů|litre|liter|litra|ltr|lit|lt|l|kom|pcs|pc|stk|stück|kos)';
  const MULTI = new RegExp(NUM + '\\s*[x×*]\\s*' + NUM + '\\s*' + UNIT + '(?![a-zčćšžđа-яα-ω])', 'i');
  const SINGLE = new RegExp('(?:^|[^\\d.,])' + NUM + '\\s*' + UNIT + '(?![a-zčćšžđа-яα-ω])', 'gi');

  // Size first, count after: "500 g x 12".
  const MULTI_AFTER = new RegExp(NUM + '\\s*' + UNIT + '\\s*[x×*]\\s*(\\d{1,3})(?![.,]\\d|\\d|\\s*(?:mg|g|kg|ml|cl|l)\\b)', 'i');
  // Pack count written as words: "12er Pack", "6er-Pack", "10er", "Packung mit 12", "pack of 6", "6-pack", "lot de 6".
  const PACK_COUNT = [
    /(?:^|[^\d.,])(\d{1,3})\s*-?\s*er(?![a-zäöüß])/i,
    /(?:^|[^\d.,])(\d{1,3})\s*-?\s*(?:pack|packs|stück-packung)(?![a-zäöüß])/i,
    /\b(?:packung|pack|karton|kiste|set|lot|confezione|pak)\s+(?:mit|of|de|da|van|à)\s+(\d{1,3})(?![.,]\d|\d|\s*(?:mg|g|kg|ml|cl|l)\b)/i
  ];
  function packCount(t) {
    for (const re of PACK_COUNT) {
      const m = t.match(re);
      if (m) { const n = parseInt(m[1], 10); if (n >= 2 && n <= 100) return n; }
    }
    return 1;
  }

  // Unit written first, as in "Lt 2,0X6" (Italian shops).
  const UNIT_FIRST = /(?:^|[^a-z])(lt|kg|gr|ml|cl)\.?\s*(\d+(?:[.,]\d+)?)\s*(?:[x×*]\s*(\d+))?(?![\d.,])/i;

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
    const a = t.match(MULTI_AFTER);
    if (a) {
      const [base, f] = UNITS[a[2].toLowerCase()];
      const count = num(a[3]);
      const each = num(a[1]) * f;
      if (base !== 'pc' && count >= 2 && each > 0) return { amount: round(count * each), unit: base, count, each: round(each) };
    }
    let last = null;
    for (const s of t.matchAll(SINGLE)) {
      const [base, f] = UNITS[s[2].toLowerCase()];
      if (base === 'pc' && last) continue; // prefer weight/volume
      last = { amount: round(num(s[1]) * f), unit: base, count: 1, each: round(num(s[1]) * f) };
      if (base !== 'pc') break;
    }
    if (last && last.amount > 0) {
      const count = last.unit === 'pc' ? 1 : packCount(t);
      return count > 1 ? { amount: round(count * last.each), unit: last.unit, count, each: last.each } : last;
    }
    const u = t.match(UNIT_FIRST);
    if (u) {
      const [base, f] = UNITS[u[1].toLowerCase()];
      const count = u[3] ? num(u[3]) : 1;
      const each = num(u[2]) * f;
      if (each > 0) return { amount: round(count * each), unit: base, count, each: round(each) };
    }
    return null;
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
    const split = String(text).match(/^\D*?(\d+)\s+(\d{2})(?!\d)(?![.,]\d)/); // "269 99 RSD", "1 59 €"
    if (split) return parseFloat(split[1] + '.' + split[2]);
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
    if (s.derived) return '≈' + formatSize(Object.assign({}, s, { derived: false }));
    if (s.unit === 'g') return s.amount >= 1000 ? s.amount / 1000 + ' kg' : s.amount + ' g';
    if (s.unit === 'ml') return s.amount >= 1000 ? s.amount / 1000 + ' l' : s.amount + ' ml';
    return s.amount + ' pcs';
  }

  // Symbol written after the amount, the way shoppers in these countries read prices ("4.49 zł").
  const SUFFIX = { PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RON: 'lei', RSD: 'din', BAM: 'KM', DKK: 'kr', SEK: 'kr', NOK: 'kr', BGN: 'лв', MKD: 'ден', ISK: 'kr' };
  function formatMoney(v, cur) {
    const n = Number(v);
    if (!isFinite(n)) return '';
    if (SUFFIX[cur]) return n.toFixed(2) + ' ' + SUFFIX[cur];
    try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur || 'EUR' }).format(n); } catch (e) { return n.toFixed(2) + ' ' + cur; }
  }

  const api = { parseSize, unitPrice, parsePrice, formatSize, formatMoney };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
