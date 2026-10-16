const test = require('node:test');
const assert = require('node:assert');
const { adapterFor, originsForHost, grantedPatterns, matchPatterns } = require('../src/adapters.js');

const productPage = url => {
  const u = new URL(url);
  const a = adapterFor(u.hostname);
  return !!(a && a.productPath.test(u.pathname));
};

test('enable requests only the shop domain the user is on', () => {
  assert.deepStrictEqual(originsForHost(adapterFor('www.kaufland.de'), 'www.kaufland.de'), ['https://kaufland.de/*', 'https://*.kaufland.de/*']);
  assert.deepStrictEqual(originsForHost(adapterFor('www.kaufland.cz'), 'www.kaufland.cz'), ['https://kaufland.cz/*', 'https://*.kaufland.cz/*']);
  assert.deepStrictEqual(originsForHost(adapterFor('www.dm.de'), 'www.dm.de'), ['https://dm.de/*', 'https://*.dm.de/*']);
  assert.deepStrictEqual(originsForHost(adapterFor('www.tesco.ie'), 'www.tesco.ie'), ['https://tesco.ie/*', 'https://*.tesco.ie/*']);
  assert.deepStrictEqual(originsForHost(adapterFor('www.lidl.fr'), 'www.lidl.fr'), ['https://lidl.fr/*', 'https://*.lidl.fr/*']);
  assert.deepStrictEqual(originsForHost(null, 'example.com'), []);
});

test('every requested origin is declared in the manifest list', () => {
  for (const host of ['www.kaufland.sk', 'www.dm.at', 'www.tesco.com', 'shop.rewe.de', 'www.rewe.de', 'www.ah.be']) {
    const a = adapterFor(host);
    const all = matchPatterns(a);
    const want = originsForHost(a, host);
    assert.ok(want.length > 0, host);
    for (const o of want) assert.ok(all.includes(o), `${host}: ${o}`);
  }
});

test('Rewe: new www.rewe.de/shop/ URLs and the old shop.rewe.de host', () => {
  assert.strictEqual(adapterFor('www.rewe.de').id, 'rewe');
  assert.strictEqual(adapterFor('shop.rewe.de').id, 'rewe');
  assert.strictEqual(adapterFor('mediacenter.rewe.de'), null);
  assert.deepStrictEqual(originsForHost(adapterFor('www.rewe.de'), 'www.rewe.de'), ['https://www.rewe.de/shop/*']);
  assert.deepStrictEqual(originsForHost(adapterFor('shop.rewe.de'), 'shop.rewe.de'), ['https://shop.rewe.de/*']);
  assert.ok(productPage('https://www.rewe.de/shop/p/ja-frische-fettarme-milch-1-5-1l/2865662'));
  assert.ok(productPage('https://shop.rewe.de/p/ja-frische-fettarme-milch-1-5-1l/2865662'));
});

test('Tesco: /groceries/ and /shop/ product URLs on every Tesco host', () => {
  for (const host of ['www.tesco.ie', 'www.tesco.com', 'nakup.itesco.cz', 'potravinydomov.itesco.sk', 'bevasarlas.tesco.hu']) {
    assert.ok(productPage(`https://${host}/shop/en-IE/products/317745633`), host + ' /shop/');
    assert.ok(productPage(`https://${host}/groceries/en-GB/products/317745633`), host + ' /groceries/');
  }
});

test('dm: /p/d/<id>/<slug> and old -p<id>.html URLs', () => {
  assert.ok(productPage('https://www.dm.de/p/d/1453941/dmbio-pflanzendrink-haferdrink-natur'));
  assert.ok(productPage('https://www.dm.at/dmbio-haferdrink-natur-p4066447240931.html'));
  assert.ok(!productPage('https://www.dm.de/lebensmittel/getraenke'));
});

test('granted origins map back to manifest patterns, even when the browser drops the path', () => {
  const optional = ['https://kaufland.de/*', 'https://*.kaufland.de/*', 'https://kaufland.cz/*', 'https://www.rewe.de/shop/*'];
  assert.deepStrictEqual(grantedPatterns(optional, ['https://kaufland.de/*', 'https://*.kaufland.de/*']), ['https://kaufland.de/*', 'https://*.kaufland.de/*']);
  assert.deepStrictEqual(grantedPatterns(optional, ['https://www.rewe.de/*']), ['https://www.rewe.de/shop/*']);
  assert.deepStrictEqual(grantedPatterns(optional, ['https://www.rewe.de/shop/*']), ['https://www.rewe.de/shop/*']);
  assert.deepStrictEqual(grantedPatterns(optional, ['https://example.com/*']), []);
});

test('Disable removes the origins as the browser granted them', () => {
  const { originsToRemove } = require('../src/adapters.js');
  const kaufland = originsForHost(adapterFor('www.kaufland.de'), 'www.kaufland.de');
  // granted exactly as requested
  assert.deepStrictEqual(originsToRemove(kaufland, ['https://kaufland.de/*', 'https://*.kaufland.de/*', 'https://www.dm.de/*']), kaufland);
  // Chrome reports the Rewe grant without the /shop/ path: remove what it reports
  const rewe = originsForHost(adapterFor('www.rewe.de'), 'www.rewe.de');
  assert.deepStrictEqual(originsToRemove(rewe, ['https://www.rewe.de/*', 'https://kaufland.de/*']), ['https://www.rewe.de/*']);
  // other shops and other countries of the same shop stay
  assert.deepStrictEqual(originsToRemove(kaufland, ['https://kaufland.cz/*', 'https://*.kaufland.cz/*', 'https://kaufland.de/*']), ['https://kaufland.de/*']);
  // nothing reported: fall back to the requested list
  assert.deepStrictEqual(originsToRemove(kaufland, []), kaufland);
});
