import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(join(testDirectory, '..', 'firestore.rules'), 'utf8');

function getMatchBlock(path) {
  const marker = `match ${path}`;
  const start = rules.indexOf(marker);
  assert.notEqual(start, -1, `Missing rules block for ${path}`);

  const openingBrace = rules.indexOf('{', start + marker.length);
  let depth = 0;
  for (let index = openingBrace; index < rules.length; index += 1) {
    if (rules[index] === '{') depth += 1;
    if (rules[index] === '}') depth -= 1;
    if (depth === 0) return rules.slice(openingBrace + 1, index);
  }
  throw new Error(`Unclosed rules block for ${path}`);
}

test('user collections require the signed-in owner', () => {
  const block = getMatchBlock('/users/{userId}/{document=**}');
  assert.match(block, /request\.auth\s*!=\s*null/);
  assert.match(block, /request\.auth\.uid\s*==\s*userId/);
  assert.doesNotMatch(block, /allow\s+read,\s*write:\s*if\s+true/);
});

test('catalog reads require authentication and writes require the admin claim', () => {
  const block = getMatchBlock('/clothing_items/{itemId}');
  assert.match(block, /allow\s+read:\s*if\s+request\.auth\s*!=\s*null/);
  assert.match(block, /allow\s+write:\s*if\s+request\.auth\s*!=\s*null/);
  assert.match(block, /request\.auth\.token\.admin\s*==\s*true/);
});

test('legacy global dupe-search records are closed to clients', () => {
  const block = getMatchBlock('/dupe_searches/{searchId}');
  assert.match(block, /allow\s+read,\s*write:\s*if\s+false/);
  assert.doesNotMatch(block, /request\.auth/);
});
