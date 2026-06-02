import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';

const algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);
const INDEX = 'clothing_items';

// Items currently categorized as `tops` whose titles look like other categories.
const BAD_IN_TOPS = [
  ['short', /\bshort\b/i],
  ['skort', /\bskort\b/i],
  ['romper', /\bromper\b/i],
  ['jumpsuit', /\bjumpsuit\b/i],
  ['pant', /\bpant\b/i],
  ['jean', /\bjean\b/i],
  ['skirt', /\bskirt\b/i],
  ['trouser', /\btrouser\b/i],
  ['legging', /\blegging\b/i],
  ['dress', /\bdress\b/i],
  ['boot', /\bboot\b/i],
  ['bag', /\bbag\b/i],
];

const { results } = await algolia.search({
  requests: [{ indexName: INDEX, query: '', filters: 'category:"tops"', hitsPerPage: 1000 }],
});

const counts = Object.fromEntries(BAD_IN_TOPS.map(([k]) => [k, []]));
for (const h of results[0].hits) {
  for (const [k, re] of BAD_IN_TOPS) {
    if (re.test(h.title || '')) counts[k].push(h.title);
  }
}

for (const [k, list] of Object.entries(counts)) {
  console.log(`\n${k}: ${list.length} suspect`);
  list.slice(0, 5).forEach((t) => console.log('  -', t));
}
