const test = require('node:test');
const assert = require('node:assert');
const { parseSize, unitPrice, parsePrice, formatSize } = require('../src/units.js');

test('parses single sizes', () => {
  assert.deepStrictEqual(parseSize('Mutti Pasirana rajčica 560 g'), { amount: 560, unit: 'g', count: 1, each: 560 });
  assert.strictEqual(parseSize('Milk 2,8% 1L').amount, 1000);
  assert.strictEqual(parseSize('Wine 0,75 l').amount, 750);
  assert.strictEqual(parseSize('Coffee 1.5kg').amount, 1500);
  assert.strictEqual(parseSize('Juice 33 cl').amount, 330);
  assert.strictEqual(parseSize('Ham 25 dag').amount, 250);
  assert.strictEqual(parseSize('Prawns 400 grama').amount, 400);
});

test('parses multipacks', () => {
  assert.deepStrictEqual(parseSize('Cola 6x0,5l'), { amount: 3000, unit: 'ml', count: 6, each: 500 });
  assert.strictEqual(parseSize('Yogurt 4 × 125 g').amount, 500);
});

test('pieces and missing sizes', () => {
  assert.strictEqual(parseSize('Eggs 10 kom').unit, 'pc');
  assert.strictEqual(parseSize('Golden Delicious apple'), null);
  assert.strictEqual(parseSize(''), null);
  assert.strictEqual(parseSize('Milk 2.8% fat 1 l').amount, 1000);
});

test('does not match units inside words', () => {
  assert.strictEqual(parseSize('Lager 5 large'), null);
});

test('unit price', () => {
  const u = unitPrice(1.59, parseSize('560 g'));
  assert.strictEqual(u.per, 'kg');
  assert.strictEqual(u.value.toFixed(2), '2.84'); // matches the shop's own 2,84 €/kg
  assert.strictEqual(unitPrice(2, { amount: 10, unit: 'pc' }).value, 0.2);
  assert.strictEqual(unitPrice(0, parseSize('1 l')), null);
});

test('price parsing', () => {
  assert.strictEqual(parsePrice('1,59 €'), 1.59);
  assert.strictEqual(parsePrice('1.299,00 KM'), 1299);
  assert.strictEqual(parsePrice('12.5'), 12.5);
  assert.strictEqual(parsePrice('€ 3'), 3);
  assert.strictEqual(parsePrice(null), null);
});

test('format', () => {
  assert.strictEqual(formatSize({ amount: 1500, unit: 'g' }), '1.5 kg');
  assert.strictEqual(formatSize({ amount: 330, unit: 'ml' }), '330 ml');
});

test('prices with the cents written separately', () => {
  assert.strictEqual(parsePrice('269 99 RSD'), 269.99);
  assert.strictEqual(parsePrice('1 59 €/kom'), 1.59);
  assert.strictEqual(parsePrice('32,-'), 32);
  assert.strictEqual(parsePrice('1 299,00 kr'), 1299);
});
