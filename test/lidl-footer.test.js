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

// Lidl CZ and HU print pack size and unit price in one plain line under the price, with no .block-text
// element: "580 g, 1 kg = 344,66 Kč" (real Chrome check, 25 October 2026).
const lidlPlain = (title, price, footer) => parseHTML(`<html><head><title>${title} | Lidl</title></head><body>
  <h1>${title}</h1>
  <div class="ods-price"><div class="ods-price__main-wrapper"><div class="ods-price__value">${price}</div></div>
  <div class="ods-price__footer"><div>${footer}</div><span class="ods-footer-item"></span></div></div>
</body></html>`).document;

test('Lidl CZ: "580 g, 1 kg = 344,66 Kč" in one line, priced in koruna', () => {
  const p = extract(lidlPlain('Tea concentrate', '199,90Kč', '580 g, 1 kg = 344,66 Kč'), adapterFor('www.lidl.cz'), 'https://www.lidl.cz/p/tea/p10000001');
  assert.strictEqual(p.price, 199.9);
  assert.strictEqual(p.currency, 'CZK');
  assert.strictEqual(formatSize(p.size), '580 g');
  assert.strictEqual(badge(p), '344.66 Kč / kg (580 g)');
});

test('Lidl CZ: in-store item with only "1 kg," under the price', () => {
  const p = extract(lidlPlain('Espresso beans', '299,90Kč', '1 kg,'), adapterFor('www.lidl.cz'), 'https://www.lidl.cz/p/espresso/p10000002');
  assert.strictEqual(p.currency, 'CZK');
  assert.strictEqual(badge(p), '299.90 Kč / kg (1 kg)');
});

test('Lidl HU: forint prices and a thousands space in the unit price', () => {
  const coffee = extract(lidlPlain('Coffee beans', '2999Ft', '500 g, 1 kg = 5 998 Ft'), adapterFor('www.lidl.hu'), 'https://www.lidl.hu/p/coffee/p100003');
  assert.strictEqual(coffee.currency, 'HUF');
  assert.strictEqual(badge(coffee), '5998 Ft / kg (500 g)');
  assert.ok(!coffee.unitPriceFromShop);
  const oil = extract(lidlPlain('Olive oil', '2499Ft', '500 ml, 1 l = 4 998 Ft'), adapterFor('www.lidl.hu'), 'https://www.lidl.hu/p/oil/p100004');
  assert.strictEqual(badge(oil), '4998 Ft / l (500 ml)');
});

test('Lidl: a footer line with only the unit price is not read as the pack size', () => {
  const p = extract(lidlPlain('Mineral water', '0.49€', '1 l = 0,33 €'), adapterFor('www.lidl.sk'), 'https://www.lidl.sk/p/water/p10000005');
  assert.ok(!p.size || formatSize(p.size) !== '1 l');
});

test('Lidl: the "1 kg = ..." unit price is used to cross-check a misread pack', () => {
  // Title says 1 kg but the footer pack line is missing: the shop figure (344,66 Kč/kg) wins over 199.90 Kč/kg.
  const p = extract(lidlPlain('Tea concentrate 1 kg', '199,90Kč', '1 kg = 344,66 Kč'), adapterFor('www.lidl.cz'), 'https://www.lidl.cz/p/tea/p10000006');
  assert.strictEqual(p.unitPriceFromShop, true);
  assert.strictEqual(badge(p), '344.66 Kč / kg (1 kg)');
});
