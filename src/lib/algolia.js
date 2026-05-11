import { algoliasearch } from 'algoliasearch';

const APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID;
const SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;

export const algoliaClient = APP_ID && SEARCH_KEY ? algoliasearch(APP_ID, SEARCH_KEY) : null;

export const CLOTHING_INDEX = 'clothing_items';

export async function searchClothing(query, { hitsPerPage = 20 } = {}) {
  if (!algoliaClient) throw new Error('Algolia not configured (missing VITE_ALGOLIA_APP_ID/SEARCH_KEY)');
  const { results } = await algoliaClient.search({
    requests: [{ indexName: CLOTHING_INDEX, query, hitsPerPage }],
  });
  return results[0]?.hits || [];
}

export async function searchClothingStructured({ item_type, colors = [], modifiers = [], rawQuery }, { hitsPerPage = 20 } = {}) {
  if (!algoliaClient) throw new Error('Algolia not configured');

  // Build the primary query — prefer the noun if we have it, otherwise the raw query.
  const primaryQuery = item_type || modifiers.join(' ') || rawQuery || '';

  // Color filter — match either the primary `color` field or any value in `colors[]`.
  const colorFilter = colors.length
    ? colors.map((c) => `color:"${c}" OR colors:"${c}"`).join(' OR ')
    : '';

  // First attempt: stricter — primary query + color filter.
  const requests = [{
    indexName: CLOTHING_INDEX,
    query: primaryQuery,
    filters: colorFilter || undefined,
    hitsPerPage,
  }];

  const { results } = await algoliaClient.search({ requests });
  let hits = results[0]?.hits || [];

  // Fallback: if nothing matches the strict query, drop the color filter.
  if (hits.length === 0 && colorFilter) {
    const fallback = await algoliaClient.search({
      requests: [{ indexName: CLOTHING_INDEX, query: primaryQuery, hitsPerPage }],
    });
    hits = fallback.results[0]?.hits || [];
  }

  // Final fallback: original raw query, no filter.
  if (hits.length === 0 && rawQuery && rawQuery !== primaryQuery) {
    const last = await algoliaClient.search({
      requests: [{ indexName: CLOTHING_INDEX, query: rawQuery, hitsPerPage }],
    });
    hits = last.results[0]?.hits || [];
  }

  return hits;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchRandomPage(filters, hitsPerPage) {
  const probe = await algoliaClient.search({
    requests: [{ indexName: CLOTHING_INDEX, query: '', filters, hitsPerPage }],
  });
  const nbPages = probe.results[0]?.nbPages || 1;
  const page = Math.floor(Math.random() * nbPages);
  const target = page === 0
    ? probe
    : await algoliaClient.search({
        requests: [{ indexName: CLOTHING_INDEX, query: '', filters, hitsPerPage, page }],
      });
  return target.results[0]?.hits || [];
}

const ALL_BRANDS = [
  'Cuyana', 'Faherty', 'Gymshark', 'Outdoor Voices', 'Girlfriend Collective',
  'NAKEDCASHMERE', 'NAADAM', 'Doen', 'Hill House Home', 'Christy Dawn',
  'Aviator Nation', 'Ulla Johnson', 'AYR', 'Loeffler Randall', 'Veronica Beard',
  'Stoney Clover Lane', 'LoveShackFancy', 'Spell', 'We Wore What',
  'Solid & Striped', 'Beach Riot', 'Showpo', 'Mother Denim', 'AGOLDE',
  'Khaite', 'STAUD', 'RIXO',
  'Set Active', 'Alo Yoga', 'Princess Polly',
];

function genderFilter(gender) {
  if (gender === 'womens') return 'gender:womens OR gender:unisex';
  if (gender === 'mens') return 'gender:mens OR gender:unisex';
  return 'gender:womens OR gender:unisex OR gender:mens OR gender:unknown';
}

async function fetchAcrossBrands({ hitsPerPage, gender, brandsToSample = 12 }) {
  const sampled = shuffle(ALL_BRANDS).slice(0, brandsToSample);
  const perBrand = Math.ceil((hitsPerPage * 1.5) / brandsToSample);

  const requests = sampled.map((brand) => ({
    indexName: CLOTHING_INDEX,
    query: '',
    filters: `brand:"${brand.replace(/"/g, '\\"')}" AND (${genderFilter(gender)})`,
    hitsPerPage: perBrand,
    page: Math.floor(Math.random() * 30),
  }));

  const { results } = await algoliaClient.search({ requests });
  return results.flatMap((r) => r.hits || []);
}

function dedupByTitle(hits) {
  const seen = new Set();
  return hits.filter((h) => {
    const key = `${h.brand || ''}::${(h.title || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function capPerBrand(hits, maxPerBrand) {
  const counts = new Map();
  return hits.filter((h) => {
    const n = counts.get(h.brand) || 0;
    if (n >= maxPerBrand) return false;
    counts.set(h.brand, n + 1);
    return true;
  });
}

export async function fetchFeedItems({ hitsPerPage = 100, gender = 'womens' } = {}) {
  if (!algoliaClient) throw new Error('Algolia not configured');

  // Fetch a few products from each of ~12 random brands so the page is naturally diverse.
  const combined = await fetchAcrossBrands({ hitsPerPage, gender, brandsToSample: 12 });

  // Cap each brand at ~hitsPerPage / brandsToSample so no brand can dominate even after dedup drops some.
  const maxPerBrand = Math.max(6, Math.ceil(hitsPerPage / 10));
  const merged = shuffle(combined);
  const deduped = dedupByTitle(merged);
  const balanced = capPerBrand(deduped, maxPerBrand);

  return balanced.slice(0, hitsPerPage).map((h) => ({ ...h, id: h.objectID }));
}
