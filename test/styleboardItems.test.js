import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvasItem } from '../src/lib/styleboardItems.js';

test('tap-to-add creates a movable canvas item with safe defaults', () => {
  const item = createCanvasItem(
    { id: 'coat-1', title: 'Coat', image_url: 'https://example.com/coat.jpg' },
    2,
  );

  assert.equal(item.item_id, 'coat-1');
  assert.equal(item.z, 2);
  assert.ok(item.x >= 0 && item.x <= 78);
  assert.ok(item.y >= 0 && item.y <= 70);
  assert.ok(item.w >= 10);
  assert.ok(item.h >= 12);
});

test('desktop drop position is preserved', () => {
  const item = createCanvasItem({ id: 'coat-1' }, 0, { x: 12, y: 18 });
  assert.equal(item.x, 12);
  assert.equal(item.y, 18);
});
