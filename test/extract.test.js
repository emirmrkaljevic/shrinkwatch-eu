const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { parseHTML } = require('linkedom');
require('../src/units.js');
const { extract } = require('../src/extract.js');
const { adapterFor } = require('../src/adapters.js');

const load = f => parseHTML(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8')).document;

test('Konzum product page (real fixture)', () => {
  const p = extract(load('konzum-mutti-560g.html'), adapterFor('www.konzum.hr'));
  assert.strictEqual(p.name, 'Mutti Pasirana rajčica 560 g');
  assert.strictEqual(p.price, 1.59);
  assert.strictEqual(p.currency, 'EUR');
  assert.strictEqual(p.size.amount, 560);
  assert.strictEqual(p.unitPrice.value.toFixed(2), '2.84');
  assert.strictEqual(p.id, '90704929');
});

test('Lidl static HTML has no price, so extraction waits for rendering', () => {
  assert.strictEqual(extract(load('lidl-muffin.html'), adapterFor('www.lidl.hr')), null);
});

test('WooCommerce-style fallback without JSON-LD', () => {
  const { document } = parseHTML('<html><head><meta property="og:title" content="Mlijeko 1 l"></head><body><h1>Mlijeko 1 l</h1><p class="price"><span class="woocommerce-Price-amount">1,95 KM</span></p></body></html>');
  const p = extract(document, adapterFor('www.bingotuzla.ba'), 'https://www.bingotuzla.ba/x');
  assert.strictEqual(p.price, 1.95);
  assert.strictEqual(p.currency, 'BAM');
  assert.strictEqual(p.unitPrice.value, 1.95);
});

test('adapter lookup', () => {
  assert.strictEqual(adapterFor('www.lidl.de').id, 'lidl');
  assert.strictEqual(adapterFor('example.com'), null);
});
