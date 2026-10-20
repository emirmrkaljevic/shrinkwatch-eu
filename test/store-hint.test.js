const test = require('node:test');
const assert = require('node:assert');
const { ADAPTERS, adapterFor, storeHintText } = require('../src/adapters.js');

test('store-gated shops are flagged and only on product pages', () => {
  for (const [host, path] of [['www.auchan.fr', '/x/pr-C1889298'], ['tienda.mercadona.es', '/product/10005/x'], ['spesaonline.conad.it', '/p/x--10717543'], ['www.coopshop.it', '/product/099-x'], ['spesaonline.esselunga.it', '/commerce/nav/supermercato/store/prodotto/212077']]) {
    const a = adapterFor(host);
    assert.ok(a && a.needsStore, host);
    assert.ok(a.productPath.test(path), host + path);
    assert.ok(!a.productPath.test('/'), host + ' home page');
  }
  assert.match(storeHintText(), /Choose a store/);
  assert.ok(!ADAPTERS.find(a => a.id === 'konzum').needsStore);
});
