// Pack-size parsing and unit-price computation.
(function (root) {
  const UNITS = {
    mg: ['g', 0.001], g: ['g', 1], gr: ['g', 1], gram: ['g', 1], grama: ['g', 1], grams: ['g', 1], gramos: ['g', 1], dag: ['g', 10], kg: ['g', 1000],
    ml: ['ml', 1], milliliter: ['ml', 1], mililitro: ['ml', 1], mililitros: ['ml', 1], centilitro: ['ml', 10], centilitros: ['ml', 10], kilo: ['g', 1000], kilos: ['g', 1000], kilogramo: ['g', 1000], kilogramos: ['g', 1000], gramo: ['g', 1], millilitre: ['ml', 1], kilogram: ['g', 1000], kilogramm: ['g', 1000], gramm: ['g', 1], cl: ['ml', 10], dl: ['ml', 100], l: ['ml', 1000], lt: ['ml', 1000], ltr: ['ml', 1000], lit: ['ml', 1000], litre: ['ml', 1000], liter: ['ml', 1000], litra: ['ml', 1000], litro: ['ml', 1000], litros: ['ml', 1000], litri: ['ml', 1000], litrů: ['ml', 1000], pints: ['ml', 568], pint: ['ml', 568],
    'г': ['g', 1], 'гр': ['g', 1], 'кг': ['g', 1000], 'мл': ['ml', 1], 'л': ['ml', 1000], 'γρ': ['g', 1], 'κιλό': ['g', 1000], 'κιλά': ['g', 1000], 'λτ': ['ml', 1000], 'λίτρο': ['ml', 1000], 'λίτρα': ['ml', 1000],
    kom: ['pc', 1], pcs: ['pc', 1], pc: ['pc', 1], stk: ['pc', 1], 'stück': ['pc', 1], kos: ['pc', 1],
    // Piece counts in other EU languages (eggs, rolls, capsules, nappies).
    szt: ['pc', 1], sztuk: ['pc', 1], sztuki: ['pc', 1], sztuka: ['pc', 1], 'kusů': ['pc', 1], kusy: ['pc', 1], kusov: ['pc', 1], darab: ['pc', 1], stuk: ['pc', 1], pezzo: ['pc', 1], unidad: ['pc', 1], ks: ['pc', 1], db: ['pc', 1], buc: ['pc', 1], stuks: ['pc', 1], pz: ['pc', 1], pezzi: ['pc', 1], uds: ['pc', 1], unidades: ['pc', 1], 'pièces': ['pc', 1], kpl: ['pc', 1], tk: ['pc', 1], vnt: ['pc', 1], gab: ['pc', 1], 'τεμάχια': ['pc', 1], 'τεμ': ['pc', 1], 'бр': ['pc', 1], 'шт': ['pc', 1], st: ['pc', 1], styck: ['pc', 1], stycken: ['pc', 1], styk: ['pc', 1], stykker: ['pc', 1], un: ['pc', 1], unid: ['pc', 1], 'pièce': ['pc', 1], 'bucăți': ['pc', 1], bucati: ['pc', 1],
    // Count packs with a product word and no weight or volume: kitchen rolls, wipes, cloths.
    rollen: ['pc', 1], rolle: ['pc', 1], rolls: ['pc', 1], roll: ['pc', 1], rollo: ['pc', 1], rollos: ['pc', 1],
    rotoli: ['pc', 1], rotolo: ['pc', 1], rolos: ['pc', 1], rolo: ['pc', 1], rol: ['pc', 1],
    rouleaux: ['pc', 1], rouleau: ['pc', 1], lavettes: ['pc', 1], lavette: ['pc', 1],
    lingettes: ['pc', 1], lingette: ['pc', 1], toallitas: ['pc', 1], salviette: ['pc', 1], doekjes: ['pc', 1],
    'tücher': ['pc', 1], tuch: ['pc', 1], 'blätter': ['pc', 1], blatt: ['pc', 1], wipes: ['pc', 1], wipe: ['pc', 1]
  };
  const NUM = '(\\d+(?:[.,]\\d+)?)';
  const UNIT = '(кг|гр|мл|г|л|γρ|κιλό|κιλά|λίτρο|λίτρα|λτ|milliliter|millilitre|mililitros|mililitro|centilitros|centilitro|kilogramos|kilogramo|kilogramm|kilogram|kilos|kilo|gramm|mg|kg|dag|gr|gramos|gramo|grams|grama|gram|g|ml|cl|dl|litros|litro|litri|litrů|litre|liter|litra|ltr|lit|lt|l|pints|pint|kom|pcs|pc|stk|stück|rouleaux|rouleau|lavettes|lavette|lingettes|lingette|toallitas|salviette|doekjes|blätter|tücher|rollen|rollos|rotoli|rolos|rolls|rolle|rollo|rotolo|rolo|roll|blatt|tuch|wipes|wipe|kos|unidades|unidad|uds|unid|un|pezzi|pezzo|pz|pièces|pièce|stuks|stuk|stycken|styck|stykker|styk|st|sztuki|sztuka|sztuk|szt|kusů|kusy|kusov|darab|bucăți|bucati|ks|db|buc|kpl|tk|vnt|gab|τεμάχια|τεμ|бр|шт)';
  // A container word may sit between the count and the "x": "6 briks x 1 L", "6 mini briks x 200 ml" (Mercadona), "4 latas x 33 cl".
  const CONTAINER = '(?:mini\\s*)?(?:briks?|bricks?|latas?|botellas?|botellines|vasos|tarrinas|sobres|bolsas|uds?\\.?|unidades|bouteilles|canettes|pots|bottiglie|lattine|vasetti|pz\\.?|cans|bottles|tins|cartons|dosen|flaschen|becher|stuks|kom\\.?|ks|szt\\.?)';
  const MULTI = new RegExp(NUM + '\\s*(?:' + CONTAINER + '\\s*)?[x×*]\\s*' + NUM + '\\s*' + UNIT + '(?![a-zčćšžđа-яα-ω])', 'i');
  const SINGLE = new RegExp('(?:^|[^\\d.,])' + NUM + '\\s*' + UNIT + '(?![a-zčćšžđа-яα-ω])', 'gi');

  // Count, a container word, then a joiner and the size of each: "4 Becher à 125 g", "4 pots de 125 g",
  // "6 bottiglie da 1,5 l", "20 Beutel x 1,75 g", "6 bottles of 500 ml", "4 kubeczki po 125 g".
  // Only listed container words, so "Gouda 48 de 400 g" or a year before "de" is never read as a count.
  const CONTAINER_OF = '(?:becher|beutel|beuteln|kapseln|kapsel|dosen|flaschen|packungen|portionen|riegel|tüten|tafeln|schalen|stück|stk|st|' +
    'pots|bouteilles|canettes|sachets|briques|boîtes|boites|capsules|portions|barres|tablettes|berlingots|pièces|' +
    'vasetti|bottiglie|lattine|bustine|capsule|confezioni|pezzi|pz|vaschette|merendine|' +
    'unidades|uds|botellas|latas|sobres|bolsitas|cápsulas|capsulas|tarrinas|briks|bricks|' +
    'pakken|flessen|blikken|bekers|zakjes|stuks|porties|repen|' +
    'bags|cans|bottles|sachets|pieces|bars|packs|cartons|tins|pods|tea bags|' +
    'kubeczki|kubeczków|butelki|butelek|puszki|puszek|saszetki|saszetek|kapsułki|kapsułek|szt|' +
    'flaskor|burkar|påsar|bägare|flasker|dåser|poser)';
  const MULTI_OF = new RegExp('(?<![\\d.,])(\\d{1,3})\\s*' + CONTAINER_OF + '(?![\\p{L}])\\.?\\s*(?:(?:à|á|a|je|zu je|zu|de|da|di|van|of|po)(?![\\p{L}])|[x×*])\\s*' + NUM + '\\s*' + UNIT + '(?![\\p{L}])', 'iu');

  // Size first, count after: "500 g x 12".
  const MULTI_AFTER = new RegExp(NUM + '\\s*' + UNIT + '\\s*[x×*]\\s*(\\d{1,3})(?![.,]\\d|\\d|\\s*(?:mg|g|kg|ml|cl|l)\\b)', 'i');
  // Pack count written as words: "12er Pack", "6er-Pack", "10er", "Packung mit 12", "pack of 6", "6-pack", "lot de 6".
  const PACK_COUNT = [
    /(?:^|[^\d.,])(\d{1,3})\s*-?\s*er(?![a-zäöüß])/i,
    /(?:^|[^\d.,])(\d{1,3})\s*-?\s*(?:pack|packs|stück-packung)(?![a-zäöüß])/i,
    /(?:^|[^\d.,])(\d{1,3})\s*-\s*p(?![a-zäöüß])/i,
    /\b(?:packung|pack|karton|kiste|set|lot|boîte|boite|confezione|pak)\s+(?:mit|of|de|da|van|à)\s+(\d{1,3})(?![.,]\d|\d|\s*(?:mg|g|kg|ml|cl|l)\b)/i
  ];
  function packCount(t) {
    for (const re of PACK_COUNT) {
      const m = t.match(re);
      if (m) { const n = parseInt(m[1], 10); if (n >= 2 && n <= 100) return n; }
    }
    return 1;
  }

  // A times sign and a count, with no size: "Eggs x 6", "x 12", "Lavettes x 30".
  // MULTI already handles "6 x 0,5 l". Skip dimensions such as "4.5 x 6 cm".
  const TIMES_COUNT = /(?:^|[^\d.,])[x×]\s*(\d{1,3})(?![.,]\d|\d|\s*(?:mg|g|kg|ml|cl|dl|l|cm|mm|m|in|inch|inches)\b)/i;
  function timesCount(t) {
    const m = t.match(TIMES_COUNT);
    if (!m) return 0;
    const n = parseInt(m[1], 10);
    return n >= 2 && n <= 100 ? n : 0;
  }

  // Unit written first, as in "Lt 2,0X6" (Italian shops).
  const UNIT_FIRST = /(?:^|[^a-z])(lt|kg|gr|ml|cl)\.?\s*(\d+(?:[.,]\d+)?)\s*(?:[x×*]\s*(\d+))?(?![\d.,])/i;

  function num(s) { return parseFloat(String(s).replace(',', '.')); }

  // Grams and millilitres with a thousands separator: "1.000 g", "1,500 ml" (DE, NL, IT, ES shops).
  // Nobody sells 1.5 g or 1.5 ml of groceries, so three digits after the separator mean thousands
  // for these small units only. "1,000 kg" or "0,750 l" keep their decimal meaning.
  function sizeNum(s, unitKey) {
    const u = UNITS[String(unitKey).toLowerCase()];
    if (u && u[1] === 1 && (u[0] === 'g' || u[0] === 'ml') && /^[1-9]\d{0,2}[.,]\d{3}$/.test(s)) return parseFloat(String(s).replace(/[.,]/, ''));
    return num(s);
  }

  // Swedish shops write a piece count as a bare "p" after the number ("Ägg 10p", "Toalettpapper 8p").
  // Only read when the caller says the shop is Swedish (opts.svPieces) and nothing else was found,
  // so "25p" (pence) or "5p" coupons elsewhere are never taken as a pack size.
  const SV_PIECES = /(?<![\p{L}\d.,])(\d{1,3})p(?=$|[\s,.;)])/u;

  // Drained weight of canned food in liquid is the amount of food, so it wins over the
  // net weight of the can including brine or oil: "Abtropfgewicht 140 g", "poids égoutté 140 g".
  const DRAINED_WORD = '(?:abtropf-?\\s*gewicht|poids(?:\\s+net)?\\s+[eé]goutt[eé]s?|[eé]goutt[eé]s?|peso(?:\\s+netto)?\\s+sgocciolato|peso\\s+escurrido|peso\\s+escorrido|uitlekgewicht|uitgelekt(?:e)?\\s+gewicht|drained(?:\\s+net)?\\s+weight|afdryppet\\s+v(?:æ|ae)gt|avrunnen\\s+vikt|valumapaino|(?:waga|masa(?:\\s+netto)?)\\s+po\\s+ods[aą]czeniu|hmotnost\\s+po\\s+scezen[ií]|lecsepegtetett(?:\\s+t[oö]meg)?|greutate\\s+scurs[aă]|στραγγισμ[έε]νο\\s+β[άα]ρος)';
  const DRAINED_SIZE = '(?:' + NUM + '\\s*(?:' + CONTAINER + '\\s*)?[x×*]\\s*)?' + NUM + '\\s*' + UNIT;
  const DRAINED_THEN = new RegExp(DRAINED_WORD + '\\s*[:=]?\\s*' + DRAINED_SIZE + '(?![\\p{L}])', 'iu');
  const THEN_DRAINED = new RegExp(DRAINED_SIZE + '\\s*' + DRAINED_WORD, 'iu');

  function fromDrainedMatch(m) {
    if (!m) return null;
    const count = m[1] != null ? num(m[1]) : 1;
    const raw = m[2];
    const uKey = m[3].toLowerCase();
    const u = UNITS[uKey];
    if (!u || u[0] === 'pc' || !(count >= 1 && count <= 100)) return null;
    const each = sizeNum(raw, uKey) * u[1];
    if (!(each > 0)) return null;
    return { amount: round(count * each), unit: u[0], count, each: round(each) };
  }

  function parseDrainedSize(text) {
    if (!text) return null;
    return fromDrainedMatch(prep(text).match(DRAINED_THEN) || prep(text).match(THEN_DRAINED));
  }

  // Lowercase, fold grouped thousands and fractions, the same prep parseSize uses.
  function prep(text) {
    let t = String(text).toLowerCase().replace(/[\u00a0\u202f\u2009]/g, ' ');
    t = t.replace(/(\d{1,3}(?: \d{3})+)(?!\d)/g, (m) => m.replace(/ /g, ''));
    t = t.replace(/(\d)?\s*([½¼¾])/g, (m, w, fr) => String((w ? Number(w) : 0) + { '½': 0.5, '¼': 0.25, '¾': 0.75 }[fr]));
    t = t.replace(/(?<![\d.,\/])([1-7])\s*\/\s*([2-8])(?![\d.,\/])(?=\s*\p{L})/gu, (m, a, b) => (Number(a) < Number(b) ? String(round(a / b)) : m));
    return t;
  }

  function parseSize(text, opts) {
    if (!text) return null;
    const drained = parseDrainedSize(text);
    let t = prep(text);
    function finish(size) {
      if (drained && (!size || (size.unit === drained.unit && drained.amount <= size.amount))) return drained;
      return size;
    }
    const m = t.match(MULTI);
    if (m) {
      const [base, f] = UNITS[m[3].toLowerCase()];
      const count = num(m[1]);
      const each = sizeNum(m[2], m[3]) * f;
      return finish({ amount: round(count * each), unit: base, count, each: round(each) });
    }
    const o = t.match(MULTI_OF);
    if (o) {
      const count = parseInt(o[1], 10);
      const [base, f] = UNITS[o[3].toLowerCase()];
      const each = sizeNum(o[2], o[3]) * f;
      if (count >= 2 && count <= 100 && each > 0) return finish({ amount: round(count * each), unit: base, count, each: round(each) });
    }
    const a = t.match(MULTI_AFTER);
    if (a) {
      const [base, f] = UNITS[a[2].toLowerCase()];
      const count = num(a[3]);
      const each = sizeNum(a[1], a[2]) * f;
      if (base !== 'pc' && count >= 2 && each > 0) return finish({ amount: round(count * each), unit: base, count, each: round(each) });
    }
    let last = null;
    for (const s of t.matchAll(SINGLE)) {
      const uKey = s[2].toLowerCase();
      if (uKey === 'st' && /1st$/i.test(s[0])) continue; // English ordinal ("1st", "21st"), not Swedish "st"
      const [base, f] = UNITS[uKey];
      if (base === 'pc' && last) continue; // prefer weight/volume
      const n = sizeNum(s[1], uKey);
      last = { amount: round(n * f), unit: base, count: 1, each: round(n * f) };
      if (base !== 'pc') break;
    }
    if (last && last.amount > 0) {
      const count = last.unit === 'pc' ? 1 : packCount(t);
      return finish(count > 1 ? { amount: round(count * last.each), unit: last.unit, count, each: last.each } : last);
    }
    const u = t.match(UNIT_FIRST);
    if (u) {
      const [base, f] = UNITS[u[1].toLowerCase()];
      const count = u[3] ? num(u[3]) : 1;
      const each = sizeNum(u[2], u[1]) * f;
      if (each > 0) return finish({ amount: round(count * each), unit: base, count, each: round(each) });
    }
    const pc = packCount(t);
    if (pc > 1) return finish({ amount: pc, unit: 'pc', count: 1, each: pc });
    const xc = timesCount(t);
    if (xc >= 2) return finish({ amount: xc, unit: 'pc', count: 1, each: xc });
    const sv = opts && opts.svPieces ? t.match(SV_PIECES) : null;
    if (sv) { const n = parseInt(sv[1], 10); if (n >= 2 && n <= 100) return finish({ amount: n, unit: 'pc', count: 1, each: n }); }
    return finish(null);
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
    // Forint prices have no decimals in shops ("2999 Ft", "1 kg = 5 998 Ft").
    if (SUFFIX[cur]) return n.toFixed(cur === 'HUF' ? 0 : 2) + ' ' + SUFFIX[cur];
    try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur || 'EUR' }).format(n); } catch (e) { return n.toFixed(2) + ' ' + cur; }
  }

  const api = { parseSize, parseDrainedSize, unitPrice, parsePrice, formatSize, formatMoney };
  root.SW = Object.assign(root.SW || {}, api);
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
