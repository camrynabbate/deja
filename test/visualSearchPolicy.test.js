import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isAllowedOrigin,
  MAX_IMAGE_BYTES,
  MAX_SEARCHES_PER_MINUTE,
  nextRateLimitState,
  validateImagePayload,
} from '../api/visual-search-policy.js';

test('visual search accepts supported images within the size limit', () => {
  const result = validateImagePayload({
    base64: Buffer.from('image').toString('base64'),
    mimeType: 'image/jpeg',
  });
  assert.equal(result.ok, true);
});

test('visual search rejects unsupported or oversized images', () => {
  assert.equal(validateImagePayload({ base64: 'aaaa', mimeType: 'image/svg+xml' }).status, 415);
  const oversized = Buffer.alloc(MAX_IMAGE_BYTES + 1).toString('base64');
  assert.equal(validateImagePayload({ base64: oversized, mimeType: 'image/png' }).status, 413);
});

test('visual search limits repeated requests per user window', () => {
  const now = Date.parse('2026-07-05T12:00:10Z');
  const previous = {
    minuteStart: Math.floor(now / 60_000) * 60_000,
    minuteCount: MAX_SEARCHES_PER_MINUTE,
    dayKey: '2026-07-05',
    dayCount: MAX_SEARCHES_PER_MINUTE,
  };
  assert.equal(nextRateLimitState(previous, now).allowed, false);
});

test('visual search permits production, native, and configured origins', () => {
  assert.equal(isAllowedOrigin('https://bedeja.com'), true);
  assert.equal(isAllowedOrigin('https://localhost'), true);
  assert.equal(isAllowedOrigin('https://preview.vercel.app'), true);
  assert.equal(isAllowedOrigin('https://staging.example.com', 'https://staging.example.com'), true);
  assert.equal(isAllowedOrigin('https://attacker.example'), false);
});
