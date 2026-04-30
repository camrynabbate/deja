import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';

const algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);

const settings = await algolia.getSettings({ indexName: 'clothing_items' });
console.log('paginationLimitedTo:', settings.paginationLimitedTo);
console.log('hitsPerPage default:', settings.hitsPerPage);

for (const page of [0, 5, 9, 10, 20, 39]) {
  const { results } = await algolia.search({
    requests: [{ indexName: 'clothing_items', query: '', hitsPerPage: 100, page }],
  });
  console.log(`page ${page}: nbHits=${results[0].nbHits}, returned=${results[0].hits.length}, nbPages=${results[0].nbPages}`);
}
