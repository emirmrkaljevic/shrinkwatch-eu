const test = require('node:test');
const assert = require('node:assert');
const { exportData, mergeImport } = require('../src/backup.js');
const e = (ts, price, amount) => ({ ts, price, currency: 'EUR', size: { amount, unit: 'g', count: 1, each: amount } });

test('export keeps only product history', () => {
  const d = exportData({ 'p:konzum:1': [e(1, 2, 500)], other: 5 }, 0);
  assert.deepEqual(Object.keys(d.products), ['p:konzum:1']);
  assert.equal(d.format, 'shrinkwatch-history');
});

test('import merges, sorts, drops duplicates and bad entries', () => {
  const file = exportData({ 'p:konzum:1': [e(3, 2.49, 450), e(1, 2.49, 500), { ts: 'x' }], 'p:bad': [e(1, 1, 1)], junk: [] });
  const { updates, count } = mergeImport({ 'p:konzum:1': [e(1, 2.49, 500)] }, file);
  assert.equal(count, 1);
  assert.deepEqual(updates['p:konzum:1'].map(x => x.ts), [1, 3]);
});

test('import rejects other files', () => {
  assert.throws(() => mergeImport({}, { hello: 1 }), /not a ShrinkWatch history file/);
});
