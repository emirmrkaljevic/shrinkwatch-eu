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

test('unit-first multipack (carrefour.it style)', () => {
  const s = parseSize("Sant'Anna Pet Lt 2,0X6 Naturale");
  assert.equal(s.amount, 12000); assert.equal(s.count, 6);
  assert.equal(parseSize('Raclette Grill 6 coupelles'), null);
});

test('multipacks written as a pack count (German and similar)', () => {
  assert.deepStrictEqual(parseSize('Melitta Auslese 500 g, 12er Pack'), { amount: 6000, unit: 'g', count: 12, each: 500 });
  assert.strictEqual(parseSize('12er Pack Kaffee 500 g').amount, 6000);
  assert.strictEqual(parseSize('Kaffee 12 x 500 g').amount, 6000);
  assert.strictEqual(parseSize('Cola 1,5 l 6er-Pack').amount, 9000);
  assert.strictEqual(parseSize('Bier 0,5 l 20er Kiste').amount, 10000);
  assert.strictEqual(parseSize('Nüsse 200 g, Packung mit 3').amount, 600);
  assert.strictEqual(parseSize('Water 500 ml pack of 24').amount, 12000);
  assert.strictEqual(parseSize('Tonic 330 ml 6-pack').amount, 1980);
  assert.strictEqual(parseSize('Tomaten 500 g x 3').amount, 1500);
  // the count is not doubled when the name already says 6 x 1,5 l
  assert.strictEqual(parseSize('Wasser 6 x 1,5 l, 6er Pack').amount, 9000);
  // decimals after "mit" are a size, not a count
  assert.strictEqual(parseSize('Packung mit 12,5 g').amount, 12.5);
  assert.strictEqual(parseSize('Mutti 560 g').count, 1);
});

test('unit price of a counted multipack (Netto Melitta 12er Pack)', () => {
  assert.strictEqual(unitPrice(90.48, parseSize('Melitta Auslese 500 g, 12er Pack')).value.toFixed(2), '15.08');
});

test('parses Spanish, Italian and Czech unit words', () => {
  assert.strictEqual(parseSize('Leche semidesnatada PRESIDENT, brik 1 litro').amount, 1000);
  assert.strictEqual(parseSize('Agua mineral 1,5 litros').amount, 1500);
  assert.strictEqual(parseSize('Latte intero 1 litri').amount, 1000);
  assert.strictEqual(parseSize('Arroz redondo 500 gramos').amount, 500);
  assert.strictEqual(parseSize('Leche 6 x 1 litro').amount, 6000);
});

test('parses Greek unit words and abbreviations', () => {
  assert.strictEqual(parseSize('ΜΑΡΑΤΑ Φρέσκο Γάλα Πλήρες 3,5% 1lt').amount, 1000);
  assert.strictEqual(parseSize('Νερό 1,5 λίτρα').amount, 1500);
  assert.strictEqual(parseSize('Γάλα 1 λίτρο').amount, 1000);
  assert.deepStrictEqual(parseSize('Φέτα 400γρ'), { amount: 400, unit: 'g', count: 1, each: 400 });
  assert.strictEqual(parseSize('Πατάτες 2 κιλά').amount, 2000);
  assert.strictEqual(parsePrice('1,05 €'), 1.05);
});

test('formats money with the symbol shoppers expect', () => {
  const { formatMoney } = require('../src/units.js');
  assert.strictEqual(formatMoney(4.49, 'EUR'), '€4.49');
  assert.strictEqual(formatMoney(4.49, 'GBP'), '£4.49');
  assert.strictEqual(formatMoney(4.49, 'PLN'), '4.49 zł');
  assert.strictEqual(formatMoney(129.9, 'CZK'), '129.90 Kč');
  assert.strictEqual(formatMoney(2.5, 'BAM'), '2.50 KM');
  assert.strictEqual(formatMoney(199, 'RSD'), '199.00 din');
});

test('reads multipacks with a container word before the x', () => {
  assert.strictEqual(parseSize('6 briks x 1 Litro | 4,98').amount, 6000);
  assert.strictEqual(parseSize('6 mini briks x 200 ml').amount, 1200);
  assert.strictEqual(parseSize('6 botellas x 1,5 L').amount, 9000);
  assert.strictEqual(parseSize('4 latas x 33 cl').amount, 1320);
  assert.strictEqual(parseSize('Brik 1 Litro | 2,45').amount, 1000);
});

test('piece counts in other EU languages', () => {
  const cases = ['Jaja 10 szt.', 'Vejce 10 ks', 'Tojás 10 db', 'Ouă 10 buc', 'Eieren 10 stuks', 'Uova 10 pz', 'Uova fresche 10 pezzi', 'Huevos 12 uds', 'Huevos 12 unidades', 'Œufs 12 pièces', 'Kananmunat 10 kpl', 'Munad 10 tk', 'Kiaušiniai 10 vnt', 'Olas 10 gab', 'Αυγά 10 τεμ.', 'Αυγά 10 τεμάχια', 'Яйца 10 бр', 'Яйца 10 шт'];
  for (const c of cases) {
    const r = parseSize(c);
    assert.ok(r, c);
    assert.strictEqual(r.unit, 'pc', c);
    assert.ok(r.amount === 10 || r.amount === 12, c);
  }
  // Weight still wins over a piece count.
  assert.strictEqual(parseSize('Kawa kapsułki 10 szt. 52 g').unit, 'g');
  // Short words inside other words are not counts.
  assert.strictEqual(parseSize('Mleko 1 l 3,2 dbałość').unit, 'ml');
});
