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

test('pack size from a labelled field', () => {
  const { document } = parseHTML('<html><head><meta property="og:title" content="Bio Haferdrink"></head><body><span class="price">1,49 €</span><dl><dt>Inhalt</dt><dd>1 Liter</dd></dl></body></html>');
  const p = extract(document, { price: '.price' });
  assert.strictEqual(p.size.amount, 1000);
  const d2 = parseHTML('<html><head><meta property="og:title" content="Fromage"></head><body><p class="price">3,20 €</p><p>Poids net : 200 g</p></body></html>').document;
  assert.strictEqual(extract(d2, { price: '.price' }).size.amount, 200);
});

test('pack size from schema.org netContent', () => {
  const { document } = parseHTML('<html><head><script type="application/ld+json">{"@type":"Product","name":"Rice","netContent":{"@type":"QuantitativeValue","value":2,"unitCode":"KGM"},"offers":{"price":"3.98","priceCurrency":"EUR"}}</script></head></html>');
  assert.strictEqual(extract(document).size.amount, 2000);
});

test('pack size derived from the shop unit price', () => {
  const { document } = parseHTML('<html><head><meta property="og:title" content="Grødris øko"></head><body><div><div><div><span class="p">32,-</span></div><span>64,00 kr/kg</span></div></div></body></html>');
  const p = extract(document, { price: '.p', currency: 'DKK' });
  assert.strictEqual(p.size.amount, 500);
  assert.ok(p.size.derived);
});

test('size shown as its own line under the title', () => {
  const { document } = parseHTML('<html><head><meta property="og:title" content="Port Salut"></head><body><main><h1>Port Salut 26%</h1><span>Arla</span><span>ca: 750g</span><span class="price">69,90 kr</span></main></body></html>');
  assert.strictEqual(extract(document, { price: '.price', currency: 'SEK' }).size.amount, 750);
});

test('offers list where the first offer has no price', () => {
  const { document } = parseHTML('<html><head><script type="application/ld+json">{"@type":"Product","name":"Thé vert 100 g","offers":[{"@type":"Offer","url":"x"},{"@type":"AggregateOffer","lowPrice":2.5,"priceCurrency":"EUR"}]}</script></head></html>');
  assert.strictEqual(extract(document).price, 2.5);
});
