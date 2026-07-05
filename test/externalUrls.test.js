import test from 'node:test';
import assert from 'node:assert/strict';
import { getSafeExternalUrl } from '../src/lib/externalUrls.js';

test('shopping links allow only http and https URLs', () => {
  assert.equal(getSafeExternalUrl('https://example.com/item'), 'https://example.com/item');
  assert.equal(getSafeExternalUrl('http://example.com/item'), 'http://example.com/item');
  assert.equal(getSafeExternalUrl('javascript:alert(1)'), null);
  assert.equal(getSafeExternalUrl('data:text/html,hello'), null);
  assert.equal(getSafeExternalUrl('not a url'), null);
});
