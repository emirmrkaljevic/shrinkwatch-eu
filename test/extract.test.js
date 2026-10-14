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

test('Bingo-style page without JSON-LD', () => {
  const { document } = parseHTML('<html><head><meta property="og:title" content="Mlijeko 1 l"></head><body><h1>Mlijeko 1 l</h1><div class="price">1,95 KM</div></body></html>');
  const p = extract(document, adapterFor('bingoshop.ba'), 'https://bingoshop.ba/proizvod/x');
  assert.strictEqual(p.price, 1.95);
  assert.strictEqual(p.currency, 'BAM');
  assert.strictEqual(p.unitPrice.value, 1.95);
});

test('adapter lookup', () => {
  assert.strictEqual(adapterFor('www.lidl.de').id, 'lidl');
  assert.strictEqual(adapterFor('example.com'), null);
});

test('schema.org microdata fallback', () => {
  const { document } = parseHTML('<html><body><div itemscope itemtype="https://schema.org/Product"><h2 itemprop="name">Kaffee Crema 500 g</h2><div itemprop="offers" itemscope itemtype="https://schema.org/Offer"><span itemprop="price" content="7.99">7,99 €</span><meta itemprop="priceCurrency" content="EUR"></div></div></body></html>');
  const p = extract(document, {}, 'https://shop.example/p/1');
  assert.strictEqual(p.name, 'Kaffee Crema 500 g');
  assert.strictEqual(p.price, 7.99);
  assert.strictEqual(p.unitPrice.value.toFixed(2), '15.98');
});

test('every shop has unique hosts and valid patterns', () => {
  const { ADAPTERS, matchPatterns } = require('../src/adapters.js');
  const hosts = ADAPTERS.flatMap(a => a.hosts);
  assert.strictEqual(new Set(hosts).size, hosts.length);
  for (const a of ADAPTERS) for (const m of matchPatterns(a)) assert.match(m, /^https:\/\/(\*\.)?[a-z0-9.-]+\/\*$/);
  assert.ok(ADAPTERS.filter(a => a.core).length <= 6);
});
