// Lidl ES/IT/PL show the pack size in a line under the price, not in the title (real Chrome check, 24 October 2026).
const test = require('node:test');
const assert = require('node:assert');
const { parseHTML } = require('linkedom');
const { formatSize, formatMoney } = require('../src/units.js');
const { extract } = require('../src/extract.js');
const { adapterFor } = require('../src/adapters.js');

const badge = p => `${formatMoney(p.unitPrice.value, p.currency)} / ${p.unitPrice.per} (${formatSize(p.size)})`;
const lidl = (title, price, pack, unit = '') => parseHTML(`<html><head><title>${title} | Lidl</title></head><body>
  <h1>${title}</h1>
  <div class="ods-price"><div class="ods-price__value">${price}</div>
  <div class="ods-price__footer"><span class="block-text">${pack}</span><div>${unit}</div></div></div>
</body></html>`).document;

test('Lidl IT: "125 g confezione" under the price', () => {
  const p = extract(lidl('Burro di centrifuga', '0.89€*', '125 g confezione', '1 kg = 7.12 €'), adapterFor('www.lidl.it'), 'https://www.lidl.it/p/burro/p11143048');
  assert.strictEqual(formatSize(p.size), '125 g');
  assert.match(badge(p), /^€7\.12 \/ kg/);
});

test('Lidl ES: "75cl" and "85 g" under the price', () => {
  const oil = extract(lidl('Aceite de oliva virgen extra', '5.25€', '75cl'), adapterFor('www.lidl.es'), 'https://www.lidl.es/p/aceite/p11137322');
  assert.strictEqual(badge(oil), '€7.00 / l (750 ml)');
  const choc = extract(lidl('Chocolate', '5.99€', '85 g'), adapterFor('www.lidl.es'), 'https://www.lidl.es/p/chocolate/p11008202');
  assert.strictEqual(formatSize(choc.size), '85 g');
  assert.match(badge(choc), /^€70\.47 \/ kg/);
});

test('Lidl PL: "100 g" under the price, priced in zloty', () => {
  const p = extract(lidl('Czekolada', '4.49', '100 g'), adapterFor('www.lidl.pl'), 'https://www.lidl.pl/p/fincarre/p11001765');
  assert.strictEqual(formatSize(p.size), '100 g');
  assert.strictEqual(p.unitPrice.per, 'kg');
});

test('Lidl PL: a price printed without a currency sign is still in zloty', () => {
  const p = extract(lidl('Halibut filet', '69.90', '1 kg'), adapterFor('www.lidl.pl'), 'https://www.lidl.pl/p/halibut/p11428347');
  assert.strictEqual(p.currency, 'PLN');
  assert.strictEqual(badge(p), '69.90 zł / kg (1 kg)');
});
