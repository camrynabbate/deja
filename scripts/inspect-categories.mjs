import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';

const algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);
const INDEX = 'clothing_items';

const CATS = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'bags', 'accessories', 'activewear', 'swimwear'];

for (const cat of CATS) {
  const { results } = await algolia.search({
    requests: [{ indexName: INDEX, query: '', filters: `category:"${cat}"`, hitsPerPage: 8 }],
  });
  const r = results[0];
  console.log(`\n=== ${cat} (${r.nbHits} total) ===`);
  for (const h of r.hits) {
    console.log(`  [${h.brand}] ${h.title}`);
  }
}
