import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';

const algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);

let cursor;
const counts = new Map();
const domains = new Map();
// eslint-disable-next-line no-constant-condition
while (true) {
  const res = await algolia.browse({
    indexName: 'clothing_items',
    browseParams: { hitsPerPage: 1000, cursor },
  });
  for (const h of res.hits) {
    const brand = h.brand || '(unknown)';
    counts.set(brand, (counts.get(brand) || 0) + 1);
    if (h.brand_domain && !domains.has(brand)) domains.set(brand, h.brand_domain);
  }
  if (!res.cursor) break;
  cursor = res.cursor;
}

const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
console.log(`${sorted.length} brands, ${[...counts.values()].reduce((a, b) => a + b, 0)} items total\n`);
for (const [brand, n] of sorted) {
  const d = domains.get(brand) || '';
  console.log(`  ${String(n).padStart(5)}  ${brand.padEnd(28)} ${d}`);
}
