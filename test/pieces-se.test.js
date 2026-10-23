// Real-browser check of 23 October 2026: Swedish egg boxes on Willys and Mathem (trimmed markup).
const test = require('node:test');
const assert = require('node:assert');
const { parseHTML } = require('linkedom');
const { parseSize, formatSize, formatMoney } = require('../src/units.js');
const { extract } = require('../src/extract.js');
const { adapterFor } = require('../src/adapters.js');

const page = body => parseHTML(`<html lang="sv"><head></head><body>${body}</body></html>`).document;
const ld = o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const badge = p => `${formatMoney(p.unitPrice.value, p.currency)} / ${p.unitPrice.per} (${formatSize(p.size)})`;

test('bare "Np" is a piece count only for Swedish shops and only as the last resort', () => {
  assert.deepStrictEqual(parseSize('Ägg 10p Frigående Utomhus Medium/large', { svPieces: true }), { amount: 10, unit: 'pc', count: 1, each: 10 });
  assert.strictEqual(parseSize('GARANT, 10p', { svPieces: true }).amount, 10);
  assert.strictEqual(parseSize('Ägg 24p', { svPieces: true }).amount, 24);
  // Without the Swedish context nothing changes: "25p" (pence), "5p" coupons
  assert.strictEqual(parseSize('Ägg 10p Frigående'), null);
  assert.strictEqual(parseSize('Freddo PMP 25p'), null);
  assert.strictEqual(parseSize('Save 5p per litre'), null);
  // A weight, volume or other count always wins over "Np", and the number is never multiplied by it
  assert.deepStrictEqual(parseSize('Choklad 18g 25p', { svPieces: true }), { amount: 18, unit: 'g', count: 1, each: 18 });
  assert.strictEqual(parseSize('Falukorv 800g 2p', { svPieces: true }).amount, 800);
  assert.strictEqual(parseSize('Ägg 12 st', { svPieces: true }).amount, 12);
  // Glued to other text, out of range, or a decimal is not a count
  assert.strictEqual(parseSize('Mjölk 1p5', { svPieces: true }), null);
  assert.strictEqual(parseSize('Kaffe 1p', { svPieces: true }), null);
  assert.strictEqual(parseSize('Rabatt 2,5p', { svPieces: true }), null);
  assert.strictEqual(parseSize('Pack 500p', { svPieces: true }), null);
});

test('Willys: "Ägg 10p" title gives a per-piece badge', () => {
  const doc = page(`<main><div class="product-detail"><h1>Ägg 10p Frigående Utomhus Medium/large</h1>
    <div class="brand">GARANT, 10p</div><div class="price"><span>37,90 kr</span></div><div class="compare">Jmf-pris 3,79 kr/st</div></div></main>` +
    ld({ '@type': 'Product', name: 'Ägg 10p Frigående Utomhus Medium/large', offers: { '@type': 'Offer', price: '37.90', priceCurrency: 'SEK' } }));
  const p = extract(doc, adapterFor('www.willys.se'), 'https://www.willys.se/produkt/Agg-10p-Frigaende-Utomhus-Medium-large-100000000_ST');
  assert.ok(p);
  assert.strictEqual(badge(p), '3.79 kr / pc (10 pcs)');
});

const mathemEggs = (compare, line) => page(`<main><section class="product"><h1>Ägg Frigående M 348g</h1>
  <p class="subtitle">${line}</p><div class="price"><span>19,95 kr</span><span>${compare}</span></div></section></main>` +
  ld({ '@type': 'Product', name: 'Ägg Frigående M 348g', offers: { '@type': 'Offer', price: '19.95', priceCurrency: 'SEK' } }));

test('Mathem: the shop prices per piece, so "6 st" wins over 348g in the title', () => {
  const p = extract(mathemEggs('3,33 kr/st', '6 st, Kronägg'), adapterFor('www.mathem.se'), 'https://www.mathem.se/se/products/1-agg-frigaende-m/');
  assert.strictEqual(badge(p), '3.33 kr / pc (6 pcs)');
});

test('Mathem: weight in the title still wins without a matching per-piece price', () => {
  const ad = adapterFor('www.mathem.se');
  // the shop prices per kg
  assert.strictEqual(badge(extract(mathemEggs('57,33 kr/kg', '6 st, Kronägg'), ad, '')), '57.33 kr / kg (348 g)');
  // a per-piece price that does not match pack price / count (another product on the page)
  assert.strictEqual(badge(extract(mathemEggs('2,10 kr/st', '6 st, Kronägg'), ad, '')), '57.33 kr / kg (348 g)');
  // no piece line under the title
  assert.strictEqual(badge(extract(mathemEggs('3,33 kr/st', 'Kronägg'), ad, '')), '57.33 kr / kg (348 g)');
});
