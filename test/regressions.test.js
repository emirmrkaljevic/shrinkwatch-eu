// Regressions from the real-browser check of 16 October 2026 (Carrefour FR, Tesco IE, Kaufland DE).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { parseHTML } = require('linkedom');
const { formatSize, formatMoney } = require('../src/units.js');
const { extract } = require('../src/extract.js');
const { adapterFor, originsForHost, grantedPatterns, matchPatterns } = require('../src/adapters.js');

const load = f => parseHTML(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8')).document;
const page = (head, body = '') => parseHTML(`<html><head>${head}</head><body>${body}</body></html>`).document;
const ld = o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
// Same text as the badge in content.js
const badge = p => `${formatMoney(p.unitPrice.value, p.currency)} / ${p.unitPrice.per} (${formatSize(p.size)})`;

test('Carrefour FR: AggregateOffer with nested offer, size only in description and title', () => {
  const p = extract(load('carrefour-fr.html'), adapterFor('www.carrefour.fr'), 'https://www.carrefour.fr/p/lait-demi-ecreme-uht-vitamine-d-lactel-3252210390014');
  assert.strictEqual(p.name, 'Lait Demi-Ecrémé UHT Vitamine D LACTEL');
  assert.strictEqual(p.price, 1.26);
  assert.strictEqual(p.currency, 'EUR');
  assert.strictEqual(p.id, '3252210390014');
  assert.strictEqual(badge(p), '€1.26 / l (1 l)');
});

test('AggregateOffer: nested offer price wins over lowPrice, lowPrice is the fallback', () => {
  const agg = offers => ({ '@type': 'Product', name: 'Lait 1L', offers: { '@type': 'AggregateOffer', lowPrice: 1.1, highPrice: 1.5, priceCurrency: 'EUR', offers } });
  assert.strictEqual(extract(page(ld(agg([{ '@type': 'Offer', price: 1.26 }])))).price, 1.26);
  assert.strictEqual(extract(page(ld(agg([{ '@type': 'Offer', url: 'x' }])))).price, 1.1);
  assert.strictEqual(extract(page(ld(agg(undefined)))).price, 1.1);
});

test('size from a short description or og:title when the name has none', () => {
  const base = { '@type': 'Product', name: 'Lait Demi-Ecrémé', offers: { price: 1.26, priceCurrency: 'EUR' } };
  assert.strictEqual(extract(page(ld({ ...base, description: 'la bouteille 1L' }))).size.amount, 1000);
  assert.strictEqual(extract(page(ld(base) + '<meta property="og:title" content="Lait Demi-Ecrémé : la bouteille 50cl à Prix Carrefour">')).size.amount, 500);
  // a long description is read only as a last resort, after the page's own size fields
  const long = 'Lait demi-écrémé. ' + 'Valeurs nutritionnelles pour 100 ml : énergie 46 kcal, matières grasses 1,5 g. '.repeat(2);
  assert.strictEqual(extract(page(ld({ ...base, description: long }), '<dl><dt>Contenance</dt><dd>1 L</dd></dl>')).size.amount, 1000);
});

test('Tesco IE: JSON-LD says GBP but the shop sells in euro', () => {
  const doc = load('tesco.html');
  const ie = extract(doc, adapterFor('www.tesco.ie'), 'https://www.tesco.ie/shop/en-IE/products/250005606');
  assert.strictEqual(ie.currency, 'EUR');
  assert.strictEqual(ie.price, 2.25);
  assert.strictEqual(badge(ie), '€1.13 / l (2 l)'); // the shop prints €1.12/litre (it cuts instead of rounding)
  // tesco.com keeps pounds
  assert.strictEqual(extract(doc, adapterFor('www.tesco.com'), 'https://www.tesco.com/groceries/en-GB/products/250005606').currency, 'GBP');
  // without a known host, the € printed next to the price wins over the declared GBP
  assert.strictEqual(extract(doc, {}, '').currency, 'EUR');
});

test('declared currency is kept when nothing on the page contradicts it', () => {
  const doc = page(ld({ '@type': 'Product', name: 'Milk 2 l', offers: { price: 1.99, priceCurrency: 'GBP' } }), '<h1>Milk 2 l</h1><p>£1.99</p>');
  assert.strictEqual(extract(doc, {}, 'https://shop.example/p/1').currency, 'GBP');
  const plain = page(ld({ '@type': 'Product', name: 'Mlijeko 1 l', offers: { price: 1.2, priceCurrency: 'EUR' } }));
  assert.strictEqual(extract(plain, {}, '').currency, 'EUR');
});

test('Tesco IE: enabling on tesco.ie asks for and registers tesco.ie, not tesco.com', () => {
  const a = adapterFor('www.tesco.ie');
  const want = originsForHost(a, 'www.tesco.ie');
  assert.deepStrictEqual(want, ['https://tesco.ie/*', 'https://*.tesco.ie/*']);
  assert.ok(want.every(o => matchPatterns(a).includes(o)));
  // granting tesco.com alone (the old bug) does not count as tesco.ie
  assert.deepStrictEqual(grantedPatterns(want, ['https://tesco.com/*', 'https://*.tesco.com/*']), []);
  assert.deepStrictEqual(grantedPatterns(matchPatterns(a), want), want);
  assert.ok(a.productPath.test('/shop/en-IE/products/250005606'));
});

test('Kaufland DE: buybox price, not the struck price or a recommendation tile', () => {
  const p = extract(load('kaufland.html'), adapterFor('www.kaufland.de'), 'https://www.kaufland.de/product/300588093/');
  assert.strictEqual(p.name, 'Terra Creta Kolymvari P.D.O. Olivenöl 5,0l');
  assert.strictEqual(p.price, 49.99);
  assert.strictEqual(p.currency, 'EUR');
  assert.ok(!p.unitPriceFromShop);
  assert.strictEqual(badge(p), '€10.00 / l (5 l)'); // shop: 10,00 € / 1l
});

test('Kaufland CZ prices are in koruna', () => {
  const doc = load('kaufland.html');
  assert.strictEqual(extract(doc, adapterFor('www.kaufland.cz'), 'https://www.kaufland.cz/product/1/').currency, 'CZK');
});

test('prices inside recommendation sliders and struck-out prices are skipped', () => {
  const doc = page('<meta property="og:title" content="Olivenöl 5 l">',
    '<div class="slider"><div class="tile"><span class="price">9,10 €</span></div></div>' +
    '<div class="buybox"><s class="price">58,00 €</s><span class="price">49,99 €</span></div>');
  assert.strictEqual(extract(doc, { price: '.price' }).price, 49.99);
  // nothing but tile prices: no badge rather than a wrong one
  const only = page('<meta property="og:title" content="Olivenöl 5 l">', '<div class="product-carousel"><span class="price">9,10 €</span></div>');
  assert.strictEqual(extract(only, { price: '.price' }), null);
});

test('pack price that disagrees with the shop unit price by more than 5 %: the shop unit price is shown', () => {
  const doc = page('<meta property="og:title" content="Olivenöl 5,0l">',
    '<div><div><p><span class="p">9,10 €</span></p></div><p class="u"><span>10,00 € / 1l</span></p></div>');
  const p = extract(doc, { price: '.p', unitPrice: '.u' });
  assert.strictEqual(p.unitPriceFromShop, true);
  assert.strictEqual(badge(p), '€10.00 / l (5 l)');
  // within 5 %: our own figure stays
  const ok = page('<meta property="og:title" content="Olivenöl 5,0l">', '<div><span class="p">49,99 €</span><p class="u">10,00 € / 1l</p></div>');
  const q = extract(ok, { price: '.p', unitPrice: '.u' });
  assert.ok(!q.unitPriceFromShop);
  assert.strictEqual(q.unitPrice.value.toFixed(3), '9.998');
  // per 100 g unit prices are compared per kg
  const g = page('<meta property="og:title" content="Kaffee 500 g">', '<div><span class="p">7,99 €</span><p class="u">1,60 € / 100 g</p></div>');
  assert.ok(!extract(g, { price: '.p', unitPrice: '.u' }).unitPriceFromShop);
});

// Real-browser check, 16 October 2026, 11:35: Netto and Rewe.
test('Netto DE: JSON-LD price wins; stray "08" cents nodes are never joined into a price', () => {
  const url = 'https://www.netto-online.de/melitta-auslese-500-g-12er-pack/p-2939648000';
  const a = adapterFor('www.netto-online.de');
  assert.ok(a.productPath.test(new URL(url).pathname));
  const p = extract(load('netto.html'), a, url);
  assert.strictEqual(p.name, 'Melitta Auslese 500 g, 12er Pack');
  assert.strictEqual(p.price, 90.48);
  assert.ok(!p.unitPriceFromShop);
  assert.strictEqual(badge(p), '€15.08 / kg (6 kg)'); // shop: Grundpreis: 15.08 / kg; the old build showed €1.35 / kg (8.08 from "08" + "08")
  // without the JSON-LD block, the buybox selector gives the same price
  const html = fs.readFileSync(path.join(__dirname, 'fixtures', 'netto.html'), 'utf8').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
  const q = extract(parseHTML(html).document, a, url);
  assert.strictEqual(q.name, 'Melitta Auslese 500 g, 12er Pack'); // screen-reader note "(Produkt aktuell ausverkauft)" left out
  assert.strictEqual(badge(q), '€15.08 / kg (6 kg)');
  // and a page with no known selectors shows nothing rather than a price made of fragments
  assert.strictEqual(extract(parseHTML(html).document, {}, url), null);
});

test('JSON-LD with raw line breaks, tabs, invalid escapes and trailing commas is still read', () => {
  const raw = '{"@type":"Product","name":"Kaffee 500 g","description":"Zeile 1\nZeile\t2 \\\'gut\\\'",\n"offers":{"price":"4.99","priceCurrency":"EUR",},}';
  assert.throws(() => JSON.parse(raw));
  const p = extract(page(`<script type="application/ld+json">${raw}</script>`));
  assert.strictEqual(p.price, 4.99);
  assert.strictEqual(p.size.amount, 500);
});

test('split euro/cent prices: only neighbouring parts, never a cents-looking euro part', () => {
  const t = body => extract(page('<meta property="og:title" content="Mleko 1 l">', `<h1>Mleko 1 l</h1>${body}`));
  assert.strictEqual(t('<div class="price"><b>1</b><sup>19</sup></div>').price, 1.19);
  assert.strictEqual(t('<span>08</span><span>08</span>'), null);
  assert.strictEqual(t('<p>Mindestbestellmenge: <span>1</span></p><span>08</span>'), null);
  assert.strictEqual(t('<div><span class="digits-after-comma">48</span><span class="digits-after-comma">48</span></div>'), null);
});

test('shop unit price cross-check reads "Grundpreis: 15.08 / kg"', () => {
  // a wrong pack price (8.08 for 6 kg) is caught by the labelled Grundpreis even without a unitPrice selector
  const doc = page('<meta property="og:title" content="Melitta Auslese 500 g, 12er Pack">',
    '<div><span class="p">8,08 €</span></div><div class="info"><div class="base"><span>Grundpreis:</span> 15.08 / kg <span class="sr-only">15,08€ pro Kilogramm</span></div></div>');
  const p = extract(doc, { price: '.p' });
  assert.strictEqual(p.unitPriceFromShop, true);
  assert.strictEqual(badge(p), '€15.08 / kg (6 kg)');
  // with Netto's unitPrice selector
  const n = extract(load('netto.html'), { ...adapterFor('www.netto-online.de'), custom: () => ({ price: 8.08 }) });
  assert.strictEqual(n.unitPriceFromShop, true);
  assert.strictEqual(n.unitPrice.value, 15.08);
});

test('Rewe: price only in <mark itemprop="price">, size in the grammage field, empty h1 elements first', () => {
  const url = 'https://www.rewe.de/shop/p/ja-frische-fettarme-milch-1-5-1l/2865662';
  const p = extract(load('rewe.html'), adapterFor('www.rewe.de'), url);
  assert.strictEqual(p.name, 'ja! Frische fettarme Milch 1,5% 1l');
  assert.strictEqual(p.price, 0.85);
  assert.strictEqual(p.currency, 'EUR');
  assert.strictEqual(p.id, '4337256283960');
  assert.strictEqual(badge(p), '€0.85 / l (1 l)');
  // the lone itemprop="price" is also found without the Rewe selectors; the slider price is not used
  assert.strictEqual(extract(load('rewe.html'), {}, url).price, 0.85);
});

// Real-browser check of 17 October 2026: Eroski's JSON-LD name is cut short ("Leche semi presid.1"); the size is only
// in the description and the visible title, written out as "1 litro".
test('Eroski: size from "1 litro" in the description', () => {
  const head = ld({ '@type': 'Product', name: 'Leche semi presid.1', description: 'Leche semidesnatada PRESIDENT, brik 1 litro', offers: { '@type': 'Offer', price: '1.12', priceCurrency: 'EUR' } });
  const body = '<p class="text-desktop">Leche semidesnatada PRESIDENT, brik 1 litro</p><span class="price-now"><span itemprop="price" class="offer-now"> 1,12</span><span class="euro">€</span></span>';
  const p = extract(page(head, body), adapterFor('supermercado.eroski.es'), 'https://supermercado.eroski.es/es/productdetail/3360443-leche-semidesnatada-president-brik-1-litro/');
  assert.strictEqual(p.price, 1.12);
  assert.strictEqual(p.name, 'Leche semidesnatada PRESIDENT, brik 1 litro');
  assert.strictEqual(badge(p), '€1.12 / l (1 l)');
});

test('Carrefour PL: złoty shown after the amount', () => {
  const head = ld({ '@type': 'Product', name: 'Łaciate Mleko UHT 3,2% 1 l', offers: { '@type': 'Offer', price: '4.49', priceCurrency: 'PLN' } });
  const p = extract(page(head), adapterFor('www.carrefour.pl'), 'https://www.carrefour.pl/napoje/mleko-napoje-mleczne-i-roslinne/mleko-uht/laciate-mleko-uht-32-1-l');
  assert.strictEqual(badge(p), '4.49 zł / l (1 l)');
});

// Real-browser check of 19 October 2026: K-Ruoka, Selver and Sklavenitis.
test('K-Ruoka: the "1l" in the title wins over the JSON-LD packed weight of 1.032 kg', () => {
  const p = extract(load('k-ruoka.html'), adapterFor('www.k-ruoka.fi'), 'https://www.k-ruoka.fi/kauppa/tuote/pirkka-kevytmaito-1-l-6410405082657');
  assert.strictEqual(p.id, '6410405082657');
  assert.strictEqual(p.price, 0.99);
  assert.strictEqual(badge(p), '€0.99 / l (1 l)');
});

test('JSON-LD weight is used when the title has no size; netContent still wins over the title', () => {
  const base = { '@type': 'Product', offers: { price: 2, priceCurrency: 'EUR' } };
  const w = { '@type': 'QuantitativeValue', value: 0.5, unitText: 'kg' };
  assert.strictEqual(extract(page(ld({ ...base, name: 'Kahvi', weight: w }))).size.amount, 500);
  assert.strictEqual(extract(page(ld({ ...base, name: 'Kahvi 450 g', weight: w }))).size.amount, 450);
  assert.strictEqual(extract(page(ld({ ...base, name: 'Kahvi 450 g', netContent: '500 g' }))).size.amount, 500);
});

test('Selver: the product block price, not a product card or a structured price before VAT', () => {
  const html = fs.readFileSync(path.join(__dirname, 'fixtures', 'selver.html'), 'utf8');
  const a = adapterFor('www.selver.ee');
  const url = 'https://www.selver.ee/piim-2-5-kiles-farmi-1-l';
  assert.strictEqual(badge(extract(parseHTML(html).document, a, url)), '€0.62 / l (1 l)');
  const net = { '@type': 'Product', name: 'Piim 2,5%, kiles, FARMI, 1 L', offers: { price: 0.5, priceCurrency: 'EUR' } };
  assert.strictEqual(extract(parseHTML(html.replace('</head>', ld(net) + '</head>')).document, a, url).price, 0.62);
  assert.strictEqual(extract(parseHTML(html.replace('</head>', '<meta property="product:price:amount" content="0.50"></head>')).document, a, url).price, 0.62);
  // on offer: the struck original price is skipped
  const sale = html.replace('<div class="ProductPrice">0,62 €', '<div class="ProductPrice ProductPrice--original">0,79 €</div><div class="ProductPrice">0,62 €');
  assert.strictEqual(extract(parseHTML(sale).document, a, url).price, 0.62);
});

test('Sklavenitis: price block before the title, Greek unit words in the shop unit price', () => {
  const p = extract(load('sklavenitis.html'), adapterFor('www.sklavenitis.gr'), 'https://www.sklavenitis.gr/galata-rofimata-chymoi-psygeioy/galata-psygeioy/galata-agelados-freska/marata-fresko-gala-plires-35-1lt/');
  assert.strictEqual(p.name, 'ΜΑΡΑΤΑ Φρέσκο Γάλα Πλήρες 3,5% 1lt');
  assert.strictEqual(badge(p), '€1.05 / l (1 l)');
  assert.ok(!p.unitPriceFromShop);
  // a wrong pack size is caught by the shop's "/λίτρο" and "/κιλό" unit prices
  const shop = (unit, body) => extract(page('', `<section class="product-detail"><div class="priceKil">${unit}</div><div class="main-price"><div class="price">1,05 €<span>/τεμ.</span></div></div><h1>${body}</h1></section>`), adapterFor('www.sklavenitis.gr'));
  const l = shop('1,05 €<span>/λίτρο</span>', 'Γάλα 500ml');
  assert.deepStrictEqual([l.unitPriceFromShop, l.unitPrice.value, l.unitPrice.per], [true, 1.05, 'l']);
  const kg = shop('8,40 €<span>/κιλό</span>', 'Τυρί 250γρ');
  assert.deepStrictEqual([kg.unitPriceFromShop, kg.unitPrice.value, kg.unitPrice.per], [true, 8.4, 'kg']);
});
