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
  const cases = ['Jaja 10 szt.', 'Vejce 10 ks', 'Tojás 10 db', 'Ouă 10 buc', 'Eieren 10 stuks', 'Uova 10 pz', 'Uova fresche 10 pezzi', 'Huevos 12 uds', 'Huevos 12 unidades', 'Œufs 12 pièces', 'Kananmunat 10 kpl', 'Munad 10 tk', 'Kiaušiniai 10 vnt', 'Olas 10 gab', 'Αυγά 10 τεμ.', 'Αυγά 10 τεμάχια', 'Яйца 10 бр', 'Яйца 10 шт', 'Jaja M 10 sztuk', 'Bułki 10 sztuki', 'Vejce 10 kusů', 'Rohlíky 10 kusy', 'Vajcia 10 kusov', 'Tojás 10 darab'];
  for (const c of cases) {
    const r = parseSize(c);
    assert.ok(r, c);
    assert.strictEqual(r.unit, 'pc', c);
    assert.ok(r.amount === 10 || r.amount === 12, c);
  }
  // Weight still wins over a piece count.
  assert.strictEqual(parseSize('Kawa kapsułki 10 szt. 52 g').unit, 'g');
  // Nordic, Portuguese, French and Romanian piece words, plus pack-count-only items.
  for (const c of ['Ägg frigående 12 st', 'Avokado 10 styck', 'Bullar 10 stycken', 'Æg 10 styk', 'Æg 10 stykker', 'Ovos M 12 un.', 'Cápsulas 10 unid.', 'Œuf 10 pièce', 'Ouă 10 bucăți', 'Bio-Eier 10er Pack', 'Ägg 12-pack', 'Ägg 12-p', 'Free range eggs pack of 10', 'Œufs bio lot de 12', 'Œufs plein air boîte de 10', 'Uova fresche confezione da 10']) {
    const r = parseSize(c);
    assert.ok(r, c);
    assert.strictEqual(r.unit, 'pc', c);
    assert.ok(r.amount === 10 || r.amount === 12, c);
  }
  // Short words inside other words and English ordinals are not counts.
  assert.strictEqual(parseSize('Mleko 1 l 3,2 dbałość').unit, 'ml');
  assert.strictEqual(parseSize('1st Grade Apples'), null);
});

test('grams and millilitres with a thousands separator', () => {
  assert.strictEqual(parseSize('Weizenmehl Type 405 1.000 g').amount, 1000);
  assert.strictEqual(parseSize('Haferflocken 1.000g').amount, 1000);
  assert.strictEqual(parseSize('Olio 1.500 ml').amount, 1500);
  assert.strictEqual(parseSize('Rice 1,250 g').amount, 1250);
  assert.deepStrictEqual(parseSize('Wasser 6 x 1.000 ml'), { amount: 6000, unit: 'ml', count: 6, each: 1000 });
  // Space-grouped thousands (French / Nordic shops).
  assert.strictEqual(parseSize('Farine 1 000 g').amount, 1000);
  assert.strictEqual(parseSize('Huile 1 000 ml').amount, 1000);
  assert.deepStrictEqual(parseSize('Eau 6 x 1 000 ml'), { amount: 6000, unit: 'ml', count: 6, each: 1000 });
  assert.strictEqual(parseSize('Farine 1\u202f000 g').amount, 1000);
  // Larger units keep the decimal meaning.
  assert.strictEqual(parseSize('Zucker 1,000 kg').amount, 1000);
  assert.strictEqual(parseSize('Wine 0,750 l').amount, 750);
  assert.strictEqual(parseSize('Tea 20 x 1.75 g').amount, 35);
});

test('reads fractions written before the unit', () => {
  assert.strictEqual(parseSize('Pan de molde 1/2 kg').amount, 500);
  assert.strictEqual(parseSize('Olio 3/4 l').amount, 750);
  assert.strictEqual(parseSize('Kava ½ kg').amount, 500);
  assert.strictEqual(parseSize('Mlijeko 1½ l').amount, 1500);
  assert.strictEqual(parseSize('Brašno ¼ kg').amount, 250);
  assert.strictEqual(parseSize('Promo 24/7, 500 g').amount, 500);
  assert.strictEqual(parseSize('Sok 2 x 1,5 l').amount, 3000);
});

test('multipacks written as a count of containers and the size of each', () => {
  assert.deepStrictEqual(parseSize('Joghurt 4 Becher à 125 g'), { amount: 500, unit: 'g', count: 4, each: 125 });
  assert.strictEqual(parseSize('Yaourt nature 4 pots de 125 g').amount, 500);
  assert.strictEqual(parseSize('Bière 6 bouteilles de 25 cl').amount, 1500);
  assert.strictEqual(parseSize('Yogurt 4 vasetti da 125 g').amount, 500);
  assert.strictEqual(parseSize('Acqua 6 bottiglie da 1,5 l').amount, 9000);
  assert.strictEqual(parseSize('Yogur 4 unidades de 125 g').amount, 500);
  assert.strictEqual(parseSize('Thee 20 zakjes à 1,5 g').amount, 30);
  assert.strictEqual(parseSize('Water 6 bottles of 500 ml').amount, 3000);
  assert.strictEqual(parseSize('Jogurt 4 kubeczki po 125 g').amount, 500);
  assert.strictEqual(parseSize('Kräutertee 20 Beutel x 1,75 g').amount, 35);
  assert.strictEqual(parseSize('Kaffee 10 Kapseln à 5,2 g').amount, 52);
  assert.strictEqual(parseSize('Yoghurt 4 st à 125 g').amount, 500);
  assert.deepStrictEqual(parseSize('Eier 4 Packungen à 10 Stück'), { amount: 40, unit: 'pc', count: 4, each: 10 });
  // Not a count: no container word, a year, or a brand between count and size.
  assert.strictEqual(parseSize('Gouda 48 de 400 g').amount, 400);
  assert.strictEqual(parseSize('Vin 2020 bouteilles de 75 cl').amount, 750);
  assert.strictEqual(parseSize('Joghurt 4 Becher Danone 125 g').amount, 125);
  // Unit price uses the whole pack.
  assert.strictEqual(unitPrice(1.99, parseSize('Joghurt 4 Becher à 125 g')).value.toFixed(2), '3.98');
});

test('prefers drained weight over the net weight of the can', () => {
  const { parseDrainedSize, unitPrice } = require('../src/units.js');
  assert.deepStrictEqual(parseSize('Thunfisch in Öl 185 g (Abtropfgewicht 140 g)'), { amount: 140, unit: 'g', count: 1, each: 140 });
  assert.strictEqual(parseSize('Thunfisch, Nettofüllmenge 185 g, Abtropfgewicht 140 g').amount, 140);
  assert.strictEqual(parseSize('Abtropfgewicht: 140 g').amount, 140);
  assert.strictEqual(parseSize('Thon albacore 185 g, poids égoutté 140 g').amount, 140);
  assert.strictEqual(parseSize('Thon 185 g dont 140 g égoutté').amount, 140);
  assert.strictEqual(parseSize('Tonno 185 g, peso sgocciolato 140 g').amount, 140);
  assert.strictEqual(parseSize('Atún 185 g, peso escurrido 140 g').amount, 140);
  assert.strictEqual(parseSize('Tuna 185 g, drained weight 140 g').amount, 140);
  assert.strictEqual(parseSize('Tonijn 185 g, uitlekgewicht 140 g').amount, 140);
  assert.strictEqual(parseSize('Atum 185 g, peso escorrido 140 g').amount, 140);
  assert.deepStrictEqual(parseSize('Mais 3 x 140 g (Abtropfgewicht 3 x 85 g)'), { amount: 255, unit: 'g', count: 3, each: 85 });
  assert.strictEqual(parseSize('Thon, Abtropfgewicht 4 x 140 g').amount, 560);
  // No drained phrase: the net weight is unchanged.
  assert.strictEqual(parseSize('Thunfisch in Öl 185 g').amount, 185);
  assert.strictEqual(parseDrainedSize('Thunfisch in Öl 185 g'), null);
  // A cooking line with words between the size and "égoutté" is not a drained weight.
  assert.strictEqual(parseSize('Pour 200 g de pâtes égouttées, 500 g de tomates').amount, 200);
  // Unit price uses the food weight, not the can including oil.
  assert.strictEqual(unitPrice(1.99, parseSize('Thunfisch in Öl 185 g (Abtropfgewicht 140 g)')).value.toFixed(2), '14.21');
});

test('count packs with a product word or a times sign, when there is no weight or volume', () => {
  assert.deepStrictEqual(parseSize('Küchenrollen 12 Rollen'), { amount: 12, unit: 'pc', count: 1, each: 12 });
  assert.strictEqual(parseSize('12 Rollen').amount, 12);
  assert.strictEqual(parseSize('Kitchen Towels 6 rolls').amount, 6);
  assert.strictEqual(parseSize('x 12 rolls').amount, 12);
  assert.strictEqual(parseSize('Papier toilette x 12 rouleaux').amount, 12);
  assert.strictEqual(parseSize('12 rouleaux').amount, 12);
  assert.strictEqual(parseSize('30 lavettes').amount, 30);
  assert.strictEqual(parseSize('Lavettes x 30').amount, 30);
  assert.strictEqual(parseSize('Lingettes 80 lingettes').amount, 80);
  assert.strictEqual(parseSize('Toiletpapier 8 rollen').amount, 8);
  assert.strictEqual(parseSize('Carta igienica 12 rotoli').amount, 12);
  assert.strictEqual(parseSize('Papel 6 rollos').amount, 6);
  assert.strictEqual(parseSize('Eggs x 6').amount, 6);
  assert.strictEqual(parseSize('Pack x 6').amount, 6);
  assert.deepStrictEqual(parseSize('x 12'), { amount: 12, unit: 'pc', count: 1, each: 12 });
  // Already-supported piece words still work, and weight still wins.
  assert.strictEqual(parseSize('Eier 10 Stück').amount, 10);
  assert.strictEqual(parseSize('Uova 20 pz').amount, 20);
  assert.strictEqual(parseSize('Jaja 10 szt.').amount, 10);
  assert.strictEqual(parseSize('Küchenrollen 12 Rollen 2.4 kg').unit, 'g');
  assert.strictEqual(parseSize('Cola 6 x 0,5 l').amount, 3000);
  // A dimension is not a pack count.
  assert.strictEqual(parseSize('Beutel 4.5 x 6 cm'), null);
  // Unit price is per piece.
  assert.strictEqual(unitPrice(2.40, parseSize('Küchenrollen 12 Rollen')).per, 'pc');
  assert.strictEqual(unitPrice(2.40, parseSize('Küchenrollen 12 Rollen')).value.toFixed(2), '0.20');
});
