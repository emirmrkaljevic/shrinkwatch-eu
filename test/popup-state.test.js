const test = require('node:test');
const assert = require('node:assert');
const { popupState } = require('../src/popup-state.js');

test('no hostname: prompt to open a shop page', () => {
  const s = popupState({ hostname: null, adapter: null, granted: false });
  assert.match(s.siteText, /Open a shop/);
  assert.equal(s.showEnable, false);
  assert.equal(s.showDisable, false);
  assert.equal(s.showCheck, false);
});

test('unknown host: check only', () => {
  const s = popupState({ hostname: 'example.com', adapter: null, granted: false });
  assert.match(s.siteText, /not a known shop/);
  assert.equal(s.showEnable, false);
  assert.equal(s.showDisable, false);
  assert.equal(s.showCheck, true);
});

test('core shop: active, neither enable nor disable, no check', () => {
  const s = popupState({ hostname: 'www.konzum.hr', adapter: { core: true }, granted: true });
  assert.equal(s.siteText, 'Active on www.konzum.hr');
  assert.equal(s.showEnable, false);
  assert.equal(s.showDisable, false);
  assert.equal(s.showCheck, false);
});

test('optional shop not granted: enable + check', () => {
  const s = popupState({ hostname: 'www.gurkerl.at', adapter: { core: false }, granted: false });
  assert.match(s.siteText, /not enabled yet/);
  assert.equal(s.showEnable, true);
  assert.equal(s.showDisable, false);
  assert.equal(s.showCheck, true);
});

test('optional shop granted: active + disable only', () => {
  const s = popupState({ hostname: 'www.gurkerl.at', adapter: { core: false }, granted: true });
  assert.equal(s.siteText, 'Active on www.gurkerl.at');
  assert.equal(s.showEnable, false);
  assert.equal(s.showDisable, true);
  assert.equal(s.showCheck, false);
});
