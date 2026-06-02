import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';
import { inferCategory } from './import-shopify.mjs';

const algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);
const INDEX = 'clothing_items';

const TARGET_FROM = process.argv[2] || 'dresses';
const TARGET_TO = process.argv[3] || 'tops';

const TITLE_HAS_GARMENT_WORD = /\b(dress(es)?|shirt[- ]?dress(es)?|sundress(es)?|gowns?|jumpsuits?|rompers?|playsuits?|jackets?|coats?|blazers?|outerwear|parkas?|trench(es)?|puffers?|vests?|anoraks?|windbreakers?|shoes?|sneakers?|boots?|sandals?|heels?|loafers?|flats?|pumps?|mules?|clogs?|slippers?|trainers?|bags?|totes?|clutch(es)?|backpacks?|crossbody|handbags?|purses?|satchels?|pouch(es)?|wallets?|belts?|hats?|caps?|beanies?|scarves?|scarf|gloves?|jewelry|earrings?|necklaces?|bracelets?|sunglasses?|rings?|watches?|ties?|socks?|hair clip|pants?|jeans?|shorts?|skirts?|skorts?|trousers?|leggings?|joggers?|sweatpants?|chinos?|culottes?|denim|slacks?|bottoms?|tops?|tees?|t-?shirts?|shirts?|blouses?|sweaters?|hoodies?|cardigans?|tanks?|camis?|camisoles?|bodysuits?|polos?|henleys?|turtlenecks?|sweatshirts?|button[- ]?(up|down)|bras?|bralettes?)\b/i;

let cursor;
let printed = 0;
// eslint-disable-next-line no-constant-condition
while (printed < 15) {
  const res = await algolia.browse({
    indexName: INDEX,
    browseParams: { hitsPerPage: 1000, cursor },
  });
  for (const h of res.hits) {
    if (h.category !== TARGET_FROM) continue;
    const tags = Array.isArray(h.style_tags) ? h.style_tags : [];
    const titleIsInformative = TITLE_HAS_GARMENT_WORD.test(h.title || '');
    const isLegacy = h.category === 'activewear' || h.category === 'swimwear';
    const next = titleIsInformative || isLegacy
      ? inferCategory('', tags, h.title)
      : h.category;
    if (next !== TARGET_TO) continue;
    console.log(`\n[${h.brand}] "${h.title}"`);
    console.log(`  style_tags: ${JSON.stringify(tags)}`);
    console.log(`  desc: ${(h.description || '').slice(0, 160)}`);
    if (++printed >= 15) break;
  }
  if (!res.cursor) break;
  cursor = res.cursor;
}
