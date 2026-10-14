const test = require('node:test');
const assert = require('node:assert');
const { compare, record, detect } = require('../src/history.js');

const o = (amount, price, ts = 1) => ({ size: { amount, unit: 'g' }, price, currency: 'EUR', ts });

test('detects smaller pack at same price', () => {
  const r = compare(o(500, 2), o(450, 2));
  assert.strictEqual(r.type, 'shrinkflation');
  assert.strictEqual(r.unitPriceIncrease, 11.1);
  assert.strictEqual(r.sizeChange, -10);
});

test('ignores proportional price cuts and size increases', () => {
  assert.strictEqual(compare(o(500, 2), o(250, 1)), null);
  assert.strictEqual(compare(o(500, 2), o(600, 2)), null);
  assert.strictEqual(compare(o(500, 2), { ...o(450, 2), currency: 'BAM' }), null);
});

test('record only stores changes', () => {
  let h = record([], o(500, 2, 1));
  h = record(h, o(500, 2, 2));
  assert.strictEqual(h.length, 1);
  assert.strictEqual(h[0].seen, 2);
  h = record(h, o(450, 2, 3));
  assert.strictEqual(h.length, 2);
  assert.ok(detect(h.slice(0, 1), o(450, 2)));
});

test('history is capped', () => {
  let h = [];
  for (let i = 0; i < 30; i++) h = record(h, o(500, i + 1, i));
  assert.strictEqual(h.length, 20);
});

test('derived sizes never trigger a warning', () => {
  const d = (amount, price) => ({ size: { amount, unit: 'g', derived: true }, price, currency: 'EUR', ts: 1 });
  assert.strictEqual(compare(d(500, 2), d(450, 2)), null);
});
