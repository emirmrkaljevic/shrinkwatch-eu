const test = require('node:test');
const assert = require('node:assert');
const { missingSizeText } = require('../src/adapters.js');

test('missing pack size hint explains the cause and how to report it', () => {
  const [title, hint] = missingSizeText();
  assert.strictEqual(title, 'Pack size not found');
  assert.match(hint, /photo/);
  assert.match(hint, /GitHub/);
  assert.ok(!/\u2014/.test(hint));
});
