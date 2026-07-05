import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyOptimisticPreferenceChange,
  preferenceChange,
} from '../src/lib/preferenceState.js';

const item = { id: 'item-1', title: 'Coat' };

test('tapping an existing preference removes it', () => {
  const preferences = [{ id: 'save-1', item_id: item.id, action: 'save' }];
  const change = preferenceChange(preferences, item, 'save');
  const next = applyOptimisticPreferenceChange(preferences, change, 'optimistic-1');

  assert.equal(change.adding, false);
  assert.deepEqual(next, []);
});

test('liking a disliked item replaces the dislike', () => {
  const preferences = [{ id: 'dislike-1', item_id: item.id, action: 'dislike' }];
  const change = preferenceChange(preferences, item, 'like');
  const next = applyOptimisticPreferenceChange(preferences, change, 'optimistic-1');

  assert.equal(change.adding, true);
  assert.equal(next.length, 1);
  assert.equal(next[0].action, 'like');
});

test('saving an item does not remove its like', () => {
  const preferences = [{ id: 'like-1', item_id: item.id, action: 'like' }];
  const change = preferenceChange(preferences, item, 'save');
  const next = applyOptimisticPreferenceChange(preferences, change, 'optimistic-1');

  assert.deepEqual(next.map((preference) => preference.action), ['save', 'like']);
});

test('toggling a conflicted item removes both like and dislike records', () => {
  const preferences = [
    { id: 'like-1', item_id: item.id, action: 'like' },
    { id: 'dislike-1', item_id: item.id, action: 'dislike' },
  ];
  const change = preferenceChange(preferences, item, 'like');
  const next = applyOptimisticPreferenceChange(preferences, change, 'optimistic-1');

  assert.deepEqual(next, []);
});
