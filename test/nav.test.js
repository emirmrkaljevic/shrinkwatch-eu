const test = require('node:test');
const assert = require('node:assert');
require('../src/nav.js');
const SW = globalThis.SW;

test('pageMode: product path, listing, forced', () => {
  const a = { productPath: /^\/product\//, listing: {} };
  assert.deepStrictEqual(SW.pageMode(a, '/product/1', false), { product: true, listing: true });
  assert.deepStrictEqual(SW.pageMode(a, '/search', false), { product: false, listing: true });
  assert.strictEqual(SW.pageMode({ productPath: /^\/p\// }, '/x', true).product, true);
  assert.deepStrictEqual(SW.pageMode(null, '/p/1', false), { product: false, listing: false });
});

function fakeTimers() {
  const t = { fn: null, cleared: false };
  return { t, opts: { setInterval: (fn) => { t.fn = fn; return 1; }, clearInterval: () => { t.cleared = true; } } };
}

test('watchPath fires on a client-side move from search to a product, once per change', () => {
  let path = '/search-results?query=leche';
  const seen = [];
  const { t, opts } = fakeTimers();
  SW.watchPath(() => path.split('?')[0], (n, o) => seen.push([n, o]), opts);
  t.fn();
  assert.deepStrictEqual(seen, []);
  path = '/product/3400/leche-semidesnatada';
  t.fn(); t.fn();
  assert.deepStrictEqual(seen, [['/product/3400/leche-semidesnatada', '/search-results']]);
});

test('watchPath ignores query changes and reacts to popstate; stop removes listeners', () => {
  let path = '/p/1';
  const listeners = {};
  const win = { addEventListener: (e, f) => { listeners[e] = f; }, removeEventListener: (e) => { delete listeners[e]; } };
  const { t, opts } = fakeTimers();
  let n = 0;
  const w = SW.watchPath(() => path, () => n++, { ...opts, window: win });
  path = '/p/2';
  listeners.popstate();
  assert.strictEqual(n, 1);
  t.fn();
  assert.strictEqual(n, 1);
  w.stop();
  assert.ok(t.cleared);
  assert.strictEqual(listeners.popstate, undefined);
});
