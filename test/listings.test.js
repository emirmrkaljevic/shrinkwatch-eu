const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { parseHTML } = require('linkedom');
require('../src/units.js');
require('../src/history.js');
const { adapterFor } = require('../src/adapters.js');
const { findTiles, extractTile, decorateTile, shopShowsUnitPrice } = require('../src/listings.js');

const load = f => parseHTML(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8')).document;

test('Tommy listing tiles get a unit price (shop does not show one)', () => {
  const doc = load('listing-tommy.html');
  const adapter = adapterFor('www.tommy.hr');
  const tiles = findTiles(doc, adapter);
  assert.equal(tiles.length, 2);
  const p = extractTile(tiles[0], adapter, 'https://www.tommy.hr/kategorije/mlijeko');
  assert.equal(p.price, 1.02);
  assert.equal(p.size.amount, 1000);
  assert.equal(p.size.unit, 'ml');
  assert.ok(Math.abs(p.unitPrice.value - 1.02) < 0.01);
  assert.equal(p.unitPrice.per, 'l');
  assert.equal(shopShowsUnitPrice(tiles[0]), false);
  decorateTile(tiles[0], p, null, true);
  const badge = tiles[0].querySelector('.sw-tile-badge .sw-tile-unit');
  assert.ok(badge);
  assert.match(badge.textContent, /\/ l/);
});

test('Tommy multipack tile uses total volume', () => {
  const doc = load('listing-tommy.html');
  const adapter = adapterFor('tommy.hr');
  const tiles = findTiles(doc, adapter);
  const p = extractTile(tiles[1], adapter, 'https://www.tommy.hr/');
  assert.equal(p.price, 4.08);
  assert.equal(p.size.amount, 4000);
  assert.ok(Math.abs(p.unitPrice.value - 1.02) < 0.01);
});

test('Konzum listing already shows €/kg so unit badge is skipped; shrink mark still works', () => {
  const doc = load('listing-konzum.html');
  const adapter = adapterFor('www.konzum.hr');
  const tiles = findTiles(doc, adapter);
  assert.equal(tiles.length, 1);
  const p = extractTile(tiles[0], adapter, 'https://www.konzum.hr/web/search?search=x');
  assert.equal(p.id, '90130183');
  assert.equal(p.price, 4.99);
  assert.equal(p.size.amount, 300);
  assert.equal(shopShowsUnitPrice(tiles[0]), true);
  const alert = {
    oldSize: { amount: 350, unit: 'g' }, newSize: p.size,
    oldPrice: 4.99, newPrice: 4.99, unitPriceIncrease: 16.7
  };
  decorateTile(tiles[0], p, alert, false);
  assert.ok(!tiles[0].querySelector('.sw-tile-unit'));
  assert.ok(tiles[0].querySelector('.sw-tile-shrink'));
  assert.match(tiles[0].querySelector('.sw-tile-shrink').textContent, /smaller pack/);
});

test('decorateTile puts dynamic values in text nodes only', () => {
  const { document } = parseHTML('<html><body><article><a href="/proizvodi/x">Milk 1 L</a><div>1,50 €</div></article></body></html>');
  const tile = document.querySelector('article');
  const adapter = adapterFor('tommy.hr');
  const p = extractTile(tile, adapter, 'https://www.tommy.hr/');
  decorateTile(tile, p, null, true);
  assert.ok(tile.querySelector('.sw-tile-unit').textContent.includes('/ l'));
  assert.equal(tile.querySelector('.sw-tile-unit').childNodes[0].nodeType, 3);
});
