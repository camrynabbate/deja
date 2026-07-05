import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadRecentlyViewed,
  recentlyViewedKey,
  updateRecentlyViewed,
} from '../src/lib/recentlyViewed.js';

test('recently viewed keeps the latest version of an item first', () => {
  const next = updateRecentlyViewed(
    [{ id: 'one', title: 'Old' }, { id: 'two' }],
    { id: 'one', title: 'New' },
  );

  assert.deepEqual(next, [{ id: 'one', title: 'New' }, { id: 'two' }]);
});

test('recently viewed data is isolated by account', () => {
  const values = new Map([
    [recentlyViewedKey('user-a'), JSON.stringify([{ id: 'a' }])],
    [recentlyViewedKey('user-b'), JSON.stringify([{ id: 'b' }])],
  ]);
  const storage = { getItem: (key) => values.get(key) || null };

  assert.deepEqual(loadRecentlyViewed(storage, 'user-a'), [{ id: 'a' }]);
  assert.deepEqual(loadRecentlyViewed(storage, 'user-b'), [{ id: 'b' }]);
});
