import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';

const algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);

const { results } = await algolia.search({
  requests: [{ indexName: 'clothing_items', query: '', hitsPerPage: 6 }],
});

console.log('--- sample records ---');
for (const hit of results[0].hits) {
  console.log({
    title: hit.title,
    brand: hit.brand,
    color: hit.color,
    colors: hit.colors,
  });
}

const black = await algolia.search({
  requests: [{ indexName: 'clothing_items', query: 'black', hitsPerPage: 4 }],
});
console.log('\n--- search "black" ---');
for (const hit of black.results[0].hits) {
  console.log({ title: hit.title, color: hit.color, colors: hit.colors });
}

const settings = await algolia.getSettings({ indexName: 'clothing_items' });
console.log('\n--- searchableAttributes ---');
console.log(settings.searchableAttributes);
