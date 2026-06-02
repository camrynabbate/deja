// Re-applies the corrected inferCategory / inferContext to every record
// already in Algolia, partial-updating only those whose category or
// activewear/swimwear flags change.
//
// Run with:  node scripts/recategorize-algolia.mjs            (dry run)
//            node scripts/recategorize-algolia.mjs --apply    (writes)
import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';
import { inferCategory, inferContext } from './import-shopify.mjs';

const APPLY = process.argv.includes('--apply');
const INDEX = 'clothing_items';

const algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);

async function fetchAll() {
  const all = [];
  let cursor;
  // browse iterates the entire index without the 1000-hit search cap.
   
  while (true) {
    const res = await algolia.browse({
      indexName: INDEX,
      browseParams: { hitsPerPage: 1000, cursor },
    });
    all.push(...(res.hits || []));
    if (!res.cursor) break;
    cursor = res.cursor;
  }
  return all;
}

// A title is "informative" if it contains any known garment word — i.e.
// inferCategory matched a regex rather than falling through to the default.
// We detect that by checking whether running inferCategory on an empty title
// would also return the same fallback.
const TITLE_HAS_GARMENT_WORD = /\b(dress(es)?|shirt[- ]?dress(es)?|sundress(es)?|gowns?|jumpsuits?|rompers?|playsuits?|jackets?|coats?|blazers?|outerwear|parkas?|trench(es)?|puffers?|vests?|anoraks?|windbreakers?|shoes?|sneakers?|boots?|sandals?|heels?|loafers?|flats?|pumps?|mules?|clogs?|slippers?|trainers?|bags?|totes?|clutch(es)?|backpacks?|crossbody|handbags?|purses?|satchels?|pouch(es)?|wallets?|belts?|hats?|caps?|beanies?|scarves?|scarf|gloves?|jewelry|earrings?|necklaces?|bracelets?|sunglasses?|rings?|watches?|ties?|socks?|hair clip|pants?|jeans?|shorts?|skirts?|skorts?|trousers?|leggings?|joggers?|sweatpants?|chinos?|culottes?|denim|slacks?|bottoms?|tops?|tees?|t-?shirts?|shirts?|blouses?|sweaters?|hoodies?|cardigans?|tanks?|camis?|camisoles?|bodysuits?|polos?|henleys?|turtlenecks?|sweatshirts?|button[- ]?(up|down)|bras?|bralettes?)\b/i;

function diffRecord(h) {
  // We only have post-import fields (title, style_tags, brand) — descriptions
  // are freeform prose and produce false positives, so we don't include them.
  const tags = Array.isArray(h.style_tags) ? h.style_tags : [];
  const titleIsInformative = TITLE_HAS_GARMENT_WORD.test(h.title || '');

  // If the title says nothing about the garment type, keep the existing category
  // (the original import had access to product_type + tags and was likely right).
  // Treat legacy "activewear"/"swimwear" as exceptions — those are being demoted
  // and need a real category, so we still run inferCategory on the title alone.
  const isLegacy = h.category === 'activewear' || h.category === 'swimwear';
  const nextCategory = titleIsInformative || isLegacy
    ? inferCategory('', tags, h.title)
    : h.category;
  const nextContext = inferContext({
    productType: '',
    tags,
    title: h.title,
    brand: h.brand,
  });

  const changes = {};
  if (nextCategory !== h.category) changes.category = nextCategory;
  if ((h.is_activewear ?? false) !== nextContext.is_activewear) {
    changes.is_activewear = nextContext.is_activewear;
  }
  if ((h.is_swimwear ?? false) !== nextContext.is_swimwear) {
    changes.is_swimwear = nextContext.is_swimwear;
  }
  return changes;
}

const hits = await fetchAll();
console.log(`fetched ${hits.length} records`);

const updates = [];
const moveCounts = new Map();
for (const h of hits) {
  const changes = diffRecord(h);
  if (Object.keys(changes).length === 0) continue;
  updates.push({ objectID: h.objectID, ...changes });
  if (changes.category) {
    const key = `${h.category} -> ${changes.category}`;
    moveCounts.set(key, (moveCounts.get(key) || 0) + 1);
  }
}

console.log(`\n${updates.length} records need updates`);
console.log('\ncategory moves:');
[...moveCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, n]) => console.log(`  ${n.toString().padStart(5)}  ${k}`));

const flagOnly = updates.filter((u) => !u.category).length;
console.log(`  ${flagOnly.toString().padStart(5)}  (flag-only updates)`);

if (!APPLY) {
  console.log('\nDry run. Re-run with --apply to write to Algolia.');
  process.exit(0);
}

console.log('\nApplying...');
const CHUNK = 1000;
for (let i = 0; i < updates.length; i += CHUNK) {
  const chunk = updates.slice(i, i + CHUNK);
  await algolia.partialUpdateObjects({ indexName: INDEX, objects: chunk });
  console.log(`  ${Math.min(i + CHUNK, updates.length)} / ${updates.length}`);
}
console.log('done.');
