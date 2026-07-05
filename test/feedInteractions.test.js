import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextFeedPageParam,
  getPullGesture,
  MAX_FEED_PAGES,
} from '../src/lib/feedInteractions.js';

test('feed pagination stops after the configured maximum', () => {
  const pages = Array.from({ length: MAX_FEED_PAGES }, () => [{ id: 'item' }]);
  assert.equal(getNextFeedPageParam(pages.at(-1), pages), undefined);
});

test('feed pagination stops when a request returns no items', () => {
  assert.equal(getNextFeedPageParam([], [[{ id: 'item' }], []]), undefined);
});

test('feed pagination continues while results remain under the limit', () => {
  assert.equal(getNextFeedPageParam([{ id: 'item' }], [[{ id: 'item' }]]), 1);
});

test('pull-to-refresh does not capture a gesture after the feed has scrolled', () => {
  const result = getPullGesture({
    startX: 20,
    startY: 20,
    currentX: 20,
    currentY: 120,
    scrollTop: 1,
  });
  assert.deepEqual(result, {
    shouldPreventDefault: false,
    pullDistance: 0,
    isPulling: false,
  });
});

test('pull-to-refresh ignores horizontal swipes at the top', () => {
  const result = getPullGesture({
    startX: 20,
    startY: 20,
    currentX: 120,
    currentY: 35,
    scrollTop: 0,
  });
  assert.equal(result.shouldPreventDefault, false);
});

test('pull-to-refresh activates only after a downward top-edge pull passes the threshold', () => {
  const belowThreshold = getPullGesture({
    startX: 20,
    startY: 20,
    currentX: 20,
    currentY: 80,
    scrollTop: 0,
  });
  const aboveThreshold = getPullGesture({
    startX: 20,
    startY: 20,
    currentX: 20,
    currentY: 100,
    scrollTop: 0,
  });

  assert.equal(belowThreshold.shouldPreventDefault, true);
  assert.equal(belowThreshold.isPulling, false);
  assert.equal(aboveThreshold.isPulling, true);
});
