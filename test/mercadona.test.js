const test = require('node:test');
const assert = require('node:assert');
const U = require('../src/units.js');
const { ADAPTERS } = require('../src/adapters.js');
const a = ADAPTERS.find(x => x.id === 'mercadona');
const d = require('./fixtures/mercadona-api.json');

test('mercadona: product data from the shop API without a store', () => {
  assert.equal(a.apiUrl(new URL('https://tienda.mercadona.es/product/10005/chocolate-liquido')), 'https://tienda.mercadona.es/api/products/10005/');
  const p = a.fromApi(d, U);
  assert.equal(p.price, 2.45);
  assert.equal(p.size.amount, 1000); assert.equal(p.size.unit, 'ml');
  assert.equal(p.unitPrice.per, 'l');
});

test('mercadona: packs and approximate weights', () => {
  const pack = a.fromApi({ id: 1, price_instructions: { unit_price: '3.00', is_pack: true, total_units: 6, pack_size: 0.2, size_format: 'l' } }, U);
  assert.equal(pack.size.amount, 1200);
  const approx = a.fromApi({ id: 2, price_instructions: { unit_price: '4.10', unit_size: 0.5, approx_size: true, size_format: 'kg' } }, U);
  assert.equal(approx.size, null);
});
