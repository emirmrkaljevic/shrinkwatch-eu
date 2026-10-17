const test = require('node:test');
const assert = require('node:assert');
require('../src/units.js');
const { historyPoints, layout } = require('../src/chart.js');

const g = n => ({ amount: n, unit: 'g', count: 1, each: n });

test('history points use unit price and keep order', () => {
  const pts = historyPoints([{ ts: 2, price: 2.49, size: g(450), currency: 'EUR' }, { ts: 1, price: 2.49, size: g(500), currency: 'EUR' }, { ts: 3, price: 1 }]);
  assert.equal(pts.length, 2);
  assert.equal(pts[0].ts, 1);
  assert.ok(Math.abs(pts[0].value - 4.98) < 1e-9);
  assert.equal(pts[1].per, 'kg');
});

test('layout puts a higher unit price higher on the chart', () => {
  const xy = layout([{ ts: 0, value: 4 }, { ts: 10, value: 5 }], 100, 50);
  assert.equal(xy[0].x, 6); assert.equal(xy[1].x, 94);
  assert.ok(xy[1].y < xy[0].y);
  assert.equal(layout([{ ts: 5, value: 3 }], 100, 50)[0].x, 50);
});
