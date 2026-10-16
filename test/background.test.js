// Content-script registration for opt-in shops, run against a fake chrome API that behaves like Chrome:
// register fails on a duplicate id, update/unregister fail on a missing id, and every call is asynchronous.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');
const tick = () => new Promise(r => setTimeout(r, Math.random() * 3));

function fakeBrowser(optional, granted = []) {
  const scripts = new Map();
  const listeners = { installed: [], startup: [], added: [], removed: [], message: [] };
  const errors = [];
  const on = k => ({ addListener: f => listeners[k].push(f) });
  const chrome = {
    runtime: { getManifest: () => ({ optional_host_permissions: optional }), onInstalled: on('installed'), onStartup: on('startup'), onMessage: on('message') },
    permissions: {
      onAdded: on('added'), onRemoved: on('removed'),
      getAll: async () => { await tick(); return { origins: granted.slice() }; },
      contains: async ({ origins }) => origins.every(o => granted.some(g => g.replace(/^([^:]+:\/\/[^/]+).*$/, '$1') === o.replace(/^([^:]+:\/\/[^/]+).*$/, '$1')))
    },
    scripting: {
      getRegisteredContentScripts: async () => { await tick(); return [...scripts.values()].map(s => ({ ...s })); },
      registerContentScripts: async list => { await tick(); for (const s of list) { if (scripts.has(s.id)) throw new Error(`Duplicate script ID '${s.id}'`); scripts.set(s.id, s); } },
      updateContentScripts: async list => { await tick(); for (const s of list) { if (!scripts.has(s.id)) throw new Error(`Nonexistent script ID '${s.id}'`); scripts.set(s.id, { ...scripts.get(s.id), ...s }); } },
      unregisterContentScripts: async ({ ids }) => { await tick(); for (const id of ids) { if (!scripts.has(id)) throw new Error(`Nonexistent script ID '${id}'`); scripts.delete(id); } }
    }
  };
  const ctx = { chrome, URL, console: { warn: (...a) => errors.push(a.join(' ')), log() {} }, setTimeout };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(src('adapters.js'), ctx);
  vm.runInContext(src('background.js'), ctx);
  const fire = (k, ...a) => listeners[k].forEach(f => f(...a));
  // replies cross the vm realm boundary, so compare them as plain JSON
  const message = (msg, sender = {}) => new Promise(r => { const done = v => r(v === undefined ? v : JSON.parse(JSON.stringify(v))); const ret = listeners.message.map(f => f(msg, sender, done)); if (!ret.includes(true)) done(undefined); });
  return { scripts, granted, errors, fire, message };
}

const OPT = ['https://kaufland.de/*', 'https://*.kaufland.de/*', 'https://www.rewe.de/shop/*', 'https://netto-online.de/*', 'https://*.netto-online.de/*'];

test('events firing together end with exactly one registration and no errors', async () => {
  const b = fakeBrowser(OPT, ['https://www.rewe.de/*']); // Chrome reports the Rewe grant without its /shop/ path
  // Enable on Rewe: onAdded, the popup message, and the worker's own start-up sync all overlap.
  b.fire('installed'); b.fire('added'); b.fire('startup');
  const r = await b.message({ type: 'sync' });
  assert.deepStrictEqual(r, { ok: true, matches: ['https://www.rewe.de/shop/*'] });
  assert.deepStrictEqual(b.errors, []);
  assert.deepStrictEqual([...b.scripts.get('optional-shops').matches], ['https://www.rewe.de/shop/*']);
});

test('a second shop updates the existing registration instead of registering twice', async () => {
  const b = fakeBrowser(OPT, ['https://kaufland.de/*', 'https://*.kaufland.de/*']);
  await b.message({ type: 'sync' });
  b.granted.push('https://netto-online.de/*', 'https://*.netto-online.de/*');
  b.fire('added'); b.fire('added');
  await b.message({ type: 'sync' });
  assert.deepStrictEqual(b.errors, []);
  assert.deepStrictEqual([...b.scripts.get('optional-shops').matches], ['https://kaufland.de/*', 'https://*.kaufland.de/*', 'https://netto-online.de/*', 'https://*.netto-online.de/*']);
});

test('removing the last shop unregisters, and syncing with nothing registered does not throw', async () => {
  const b = fakeBrowser(OPT, ['https://kaufland.de/*', 'https://*.kaufland.de/*']);
  await b.message({ type: 'sync' });
  b.granted.length = 0;
  b.fire('removed'); b.fire('removed');
  const r = await b.message({ type: 'sync' });
  assert.deepStrictEqual(r, { ok: true, matches: [] });
  assert.strictEqual(b.scripts.size, 0);
  b.fire('startup');
  await b.message({ type: 'sync' });
  assert.deepStrictEqual(b.errors, []);
});

test('content scripts on opt-in shops are told whether access is still granted', async () => {
  const b = fakeBrowser(OPT, ['https://kaufland.de/*', 'https://*.kaufland.de/*']);
  assert.strictEqual(await b.message({ type: 'allowed' }, { url: 'https://www.kaufland.de/product/300588093/' }), true);
  assert.strictEqual(await b.message({ type: 'allowed' }, { url: 'https://www.netto-online.de/x/p-1' }), false);
  b.granted.length = 0;
  assert.strictEqual(await b.message({ type: 'allowed' }, { url: 'https://www.kaufland.de/product/300588093/' }), false);
});
