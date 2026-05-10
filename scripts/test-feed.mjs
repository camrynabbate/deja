import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';

const algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);

const ALL_BRANDS = [
  'Cuyana', 'Faherty', 'Gymshark', 'Outdoor Voices', 'Girlfriend Collective',
  'NAKEDCASHMERE', 'NAADAM', 'Doen', 'Hill House Home', 'Christy Dawn',
  'Aviator Nation', 'Ulla Johnson', 'AYR', 'Loeffler Randall', 'Veronica Beard',
  'Stoney Clover Lane', 'LoveShackFancy', 'Spell', 'We Wore What',
  'Solid & Striped', 'Beach Riot', 'Showpo', 'Mother Denim', 'AGOLDE',
  'Khaite', 'STAUD', 'RIXO',
];

const sampled = ALL_BRANDS.slice(0, 12);
const requests = sampled.map((brand) => ({
  indexName: 'clothing_items',
  query: '',
  filters: `brand:"${brand}" AND (gender:womens OR gender:unisex)`,
  hitsPerPage: 13,
  page: Math.floor(Math.random() * 30),
}));

const { results } = await algolia.search({ requests });
results.forEach((r, i) => {
  console.log(`${sampled[i]}: ${r.hits.length} hits, ${r.nbHits} total, ${r.nbPages} pages, requested page ${requests[i].page}`);
});
const total = results.reduce((s, r) => s + r.hits.length, 0);
console.log(`\nTotal items returned: ${total}`);
