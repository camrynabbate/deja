import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';

const algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_WRITE_KEY);
const INDEX_NAME = 'clothing_items';

const BRANDS = [
  // Original 7
  { domain: 'cuyana.com', name: 'Cuyana' },
  { domain: 'fahertybrand.com', name: 'Faherty' },
  { domain: 'gymshark.com', name: 'Gymshark' },
  { domain: 'outdoorvoices.com', name: 'Outdoor Voices' },
  { domain: 'girlfriend.com', name: 'Girlfriend Collective' },
  { domain: 'nakedcashmere.com', name: 'NAKEDCASHMERE' },
  { domain: 'naadam.co', name: 'NAADAM' },
  // Women-leaning expansion
  { domain: 'shopdoen.com', name: 'Doen' },
  { domain: 'hillhousehome.com', name: 'Hill House Home' },
  { domain: 'christydawn.com', name: 'Christy Dawn' },
  { domain: 'aviatornation.com', name: 'Aviator Nation' },
  { domain: 'tuckernuck.com', name: 'Tuckernuck' },
  { domain: 'ullajohnson.com', name: 'Ulla Johnson' },
  { domain: 'ayr.com', name: 'AYR' },
  { domain: 'loefflerrandall.com', name: 'Loeffler Randall' },
  { domain: 'veronicabeard.com', name: 'Veronica Beard' },
  { domain: 'stoneyclover.com', name: 'Stoney Clover Lane' },
  { domain: 'loveshackfancy.com', name: 'LoveShackFancy' },
  { domain: 'spell.co', name: 'Spell' },
  { domain: 'weworewhat.com', name: 'We Wore What' },
  { domain: 'solidandstriped.com', name: 'Solid & Striped' },
  { domain: 'shopswan.com', name: 'SWAN' },
  { domain: 'beachriot.com', name: 'Beach Riot' },
  { domain: 'showpo.com', name: 'Showpo' },
  { domain: 'merlette.com', name: 'Merlette' },
  { domain: 'motherdenim.com', name: 'Mother Denim' },
  { domain: 'agolde.com', name: 'AGOLDE' },
  { domain: 'khaite.com', name: 'Khaite' },
  { domain: 'staud.clothing', name: 'STAUD' },
  { domain: 'rixo.co.uk', name: 'RIXO' },
  // Mass-market expansion
  { domain: 'setactive.co', name: 'Set Active' },
  { domain: 'aloyoga.com', name: 'Alo Yoga' },
  { domain: 'us.princesspolly.com', name: 'Princess Polly' },
];

const STYLE_TAGS = ['minimalist', 'casual', 'elegant', 'bohemian', 'streetwear', 'trendy', 'cozy', 'classic', 'preppy', 'edgy', 'romantic', 'sporty'];

const CATEGORY_KEYWORDS = [
  ['dresses', /\b(dress|gown|jumpsuit)\b/i],
  ['outerwear', /\b(jacket|coat|blazer|outerwear|parka|trench|puffer)\b/i],
  ['bottoms', /\b(pants?|jeans?|shorts|skirt|trouser|legging|joggers?)\b/i],
  ['shoes', /\b(shoe|sneaker|boot|sandal|heel|loafer|flat)\b/i],
  ['bags', /\b(bag|tote|clutch|backpack|crossbody|handbag|purse)\b/i],
  ['accessories', /\b(belt|hat|scarf|jewelry|earring|necklace|bracelet|sunglass)\b/i],
  ['activewear', /\b(active|sport|workout|gym|yoga|run)\b/i],
  ['swimwear', /\b(swim|bikini|swimsuit|swimwear)\b/i],
  ['tops', /\b(top|tee|t-shirt|shirt|blouse|sweater|hoodie|cardigan|tank)\b/i],
];

function priceToTier(price) {
  if (!price) return 'mid_range';
  if (price < 30) return 'budget';
  if (price < 80) return 'mid_range';
  if (price < 200) return 'premium';
  return 'luxury';
}

function inferCategory(productType, tags, title) {
  const haystack = `${productType || ''} ${(tags || []).join(' ')} ${title || ''}`.toLowerCase();
  for (const [category, regex] of CATEGORY_KEYWORDS) {
    if (regex.test(haystack)) return category;
  }
  return 'tops';
}

// Default gender for brands that are explicitly women-only or men-only.
// Used when text inference returns "unknown".
const BRAND_GENDER_DEFAULTS = {
  'Cuyana': 'womens',
  'Doen': 'womens',
  'Hill House Home': 'womens',
  'Christy Dawn': 'womens',
  'Tuckernuck': 'womens',
  'Ulla Johnson': 'womens',
  'AYR': 'womens',
  'Loeffler Randall': 'womens',
  'Veronica Beard': 'womens',
  'Stoney Clover Lane': 'womens',
  'LoveShackFancy': 'womens',
  'Spell': 'womens',
  'We Wore What': 'womens',
  'SWAN': 'womens',
  'Beach Riot': 'womens',
  'Showpo': 'womens',
  'Merlette': 'womens',
  'Khaite': 'womens',
  'STAUD': 'womens',
  'RIXO': 'womens',
  'Girlfriend Collective': 'womens',
  'Set Active': 'womens',
  'Princess Polly': 'womens',
  'Alo Yoga': 'unisex',
};

function inferGender(product, brandName) {
  const text = `${product.title || ''} ${product.product_type || ''} ${(product.tags || []).join(' ')} ${product.handle || ''}`.toLowerCase();
  const womens = /\b(women|womens|woman|female|ladies|girl|girls|her|she|bra|bralette|skirt|dress|gown|leggings|legging)\b/.test(text);
  const mens = /\b(men|mens|man|male|guys|him|his|he|boxer|trunk)\b/.test(text);
  if (womens && !mens) return 'womens';
  if (mens && !womens) return 'mens';
  if (mens && womens) return 'unisex';
  // Fall back to brand default for clearly-gendered brands.
  return BRAND_GENDER_DEFAULTS[brandName] || 'unknown';
}

function filterStyleTags(tags) {
  const list = Array.isArray(tags) ? tags : String(tags || '').split(',');
  const lower = list.map((t) => String(t).trim().toLowerCase());
  return STYLE_TAGS.filter((s) => lower.some((t) => t.includes(s)));
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
}

const STANDARD_COLORS = [
  'black', 'white', 'cream', 'ivory', 'beige', 'tan', 'taupe', 'nude', 'camel',
  'brown', 'chocolate', 'mocha', 'espresso', 'khaki',
  'navy', 'blue', 'denim', 'cobalt', 'teal', 'turquoise',
  'red', 'burgundy', 'wine', 'maroon', 'crimson',
  'pink', 'rose', 'blush', 'mauve', 'fuchsia', 'magenta', 'coral',
  'green', 'sage', 'olive', 'forest', 'mint', 'emerald',
  'yellow', 'mustard', 'gold', 'butter',
  'orange', 'rust', 'terracotta', 'peach',
  'purple', 'lavender', 'lilac', 'plum',
  'grey', 'gray', 'charcoal', 'silver',
  'multicolor', 'multi',
];

const SIZE_PATTERN = /^(xx{0,3}s|xs|s|m|l|xx{0,3}l|xl|\d+xl|\d{1,2}|\d+\/\d+|small|medium|large|one size|petite|tall|plus|os|0|2|4|6|8|10|12|14|16|18|20)$/i;

function isSizeLike(value) {
  return SIZE_PATTERN.test(String(value).trim());
}

function colorWordsFrom(text) {
  const lower = String(text || '').toLowerCase();
  return STANDARD_COLORS.filter((c) => new RegExp(`\\b${c}\\b`).test(lower));
}

function extractColors(product) {
  let raw = [];

  const colorOpt = (product.options || []).find((o) => /colou?r/i.test(o.name || ''));
  if (colorOpt?.values?.length) {
    raw = colorOpt.values;
  } else {
    const nonSizeOpt = (product.options || []).find((o) => !/size/i.test(o.name || ''));
    if (nonSizeOpt?.values?.length && !nonSizeOpt.values.every(isSizeLike)) {
      raw = nonSizeOpt.values;
    } else {
      raw = (product.variants || [])
        .map((v) => v.option1)
        .filter((v) => v && !isSizeLike(v));
    }
  }

  const variantColors = [...new Set(raw.map((v) => String(v).toLowerCase().trim()).filter(Boolean))];

  // Augment with standard color words found in title/tags so brand-specific names
  // ("twilight", "sports car") still match queries like "black" or "red" when the
  // title contains the standard word.
  const titleText = `${product.title || ''} ${(product.tags || []).join(' ')}`;
  const titleColors = colorWordsFrom(titleText);

  return [...new Set([...variantColors, ...titleColors])];
}

function transformProduct(brand, p) {
  const variant = p.variants?.[0] || {};
  const price = parseFloat(variant.price) || 0;
  const image = p.images?.[0]?.src || '';
  const sourceUrl = `https://${brand.domain}/products/${p.handle}`;
  const colors = extractColors(p);

  return {
    title: p.title || '',
    brand: brand.name,
    price,
    price_tier: priceToTier(price),
    color: colors[0] || '',
    colors,
    material: '',
    style_tags: filterStyleTags(p.tags),
    description: stripHtml(p.body_html),
    image_url: image,
    source_url: sourceUrl,
    category: inferCategory(p.product_type, p.tags, p.title),
    gender: inferGender(p, brand.name),
    likes_count: 0,
    shopify_id: p.id,
    source: 'shopify',
    brand_domain: brand.domain,
    created_date: new Date().toISOString(),
    created_by: 'shopify-importer',
  };
}

async function fetchShopifyProducts(domain, maxProducts) {
  const products = [];
  const perPage = 250;
  const maxPages = Math.ceil(maxProducts / perPage);
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://${domain}/products.json?limit=${perPage}&page=${page}`;
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': 'deja-importer/1.0' } });
    } catch (err) {
      console.warn(`  page ${page} fetch failed: ${err.message}`);
      break;
    }
    if (!res.ok) {
      console.warn(`  page ${page} returned ${res.status}; stopping`);
      break;
    }
    const data = await res.json();
    const batch = data?.products || [];
    if (batch.length === 0) break;
    products.push(...batch);
    if (batch.length < perPage) break;
  }
  return products.slice(0, maxProducts);
}

async function indexAlgolia(items) {
  const objects = items.map((item) => {
    const docId = `shopify-${item.brand_domain.replace(/\./g, '_')}-${item.shopify_id}`;
    return { objectID: docId, ...item };
  });
  for (let i = 0; i < objects.length; i += 1000) {
    const chunk = objects.slice(i, i + 1000);
    await algolia.saveObjects({ indexName: INDEX_NAME, objects: chunk });
  }
}

async function importBrand(brand, maxProducts) {
  console.log(`\n${brand.name} (${brand.domain})`);
  const products = await fetchShopifyProducts(brand.domain, maxProducts);
  if (products.length === 0) {
    console.log('  no products fetched (site may not expose /products.json)');
    return 0;
  }
  console.log(`  fetched ${products.length} products`);
  const items = products.map((p) => transformProduct(brand, p)).filter((i) => i.image_url && i.title);
  console.log(`  transformed ${items.length} items with image + title`);
  await indexAlgolia(items);
  console.log(`  indexed in Algolia`);
  return items.length;
}

async function configureAlgoliaIndex() {
  await algolia.setSettings({
    indexName: INDEX_NAME,
    indexSettings: {
      searchableAttributes: [
        'brand',
        'title',
        'unordered(color,colors)',
        'category',
        'description',
        'material',
        'unordered(style_tags)',
      ],
      attributesForFaceting: [
        'filterOnly(category)',
        'filterOnly(brand)',
        'filterOnly(price_tier)',
        'filterOnly(style_tags)',
        'filterOnly(color)',
        'filterOnly(gender)',
      ],
      customRanking: ['desc(likes_count)'],
      paginationLimitedTo: 30000,
    },
  });
}

async function main() {
  if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_WRITE_KEY) {
    console.error('Missing ALGOLIA_APP_ID or ALGOLIA_WRITE_KEY in .env');
    process.exit(1);
  }

  const argBrand = process.argv[2];
  const maxProducts = Number(process.argv[3]) || 1000;

  await configureAlgoliaIndex();

  const list = argBrand
    ? BRANDS.filter((b) => b.domain.includes(argBrand) || b.name.toLowerCase().includes(argBrand.toLowerCase()))
    : BRANDS;

  if (list.length === 0) {
    console.error(`No brand matched "${argBrand}". Available: ${BRANDS.map((b) => b.domain).join(', ')}`);
    process.exit(1);
  }

  let total = 0;
  for (const brand of list) {
    try {
      total += await importBrand(brand, maxProducts);
    } catch (err) {
      console.error(`  ${brand.name} failed: ${err.message}`);
    }
  }
  console.log(`\nDone. Total imported: ${total}`);
  process.exit(0);
}

main();
