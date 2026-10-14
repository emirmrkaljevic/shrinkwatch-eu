// Regression checks against trimmed excerpts of real product pages.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { parseHTML } = require('linkedom');
require('../src/units.js');
const { extract } = require('../src/extract.js');
const { ADAPTERS } = require('../src/adapters.js');

const dir = path.join(__dirname, 'fixtures');
const expected = JSON.parse(fs.readFileSync(path.join(dir, 'expected.json'), 'utf8'));

for (const [id, [price, currency, amount, unit]] of Object.entries(expected)) {
  test(`shop fixture: ${id}`, () => {
    const { document } = parseHTML(fs.readFileSync(path.join(dir, id + '.html'), 'utf8'));
    const p = extract(document, ADAPTERS.find(a => a.id === id), '');
    assert.ok(p, 'product found');
    assert.equal(p.price, price);
    assert.equal(p.currency, currency);
    assert.equal(p.size && p.size.amount, amount);
    assert.equal(p.size && p.size.unit, unit);
  });
}
