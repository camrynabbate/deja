import 'dotenv/config';
import { algoliasearch } from 'algoliasearch';
import { Pinecone } from '@pinecone-database/pinecone';

const VOYAGE_KEY = process.env.VOYAGE_API_KEY;
const PINECONE_KEY = process.env.PINECONE_API_KEY;
const ALGOLIA_APP = process.env.ALGOLIA_APP_ID;
const ALGOLIA_KEY = process.env.ALGOLIA_WRITE_KEY;

const INDEX_NAME = 'deja-products';
const DIMENSION = 1024;
const VOYAGE_MODEL = 'voyage-multimodal-3';
const BATCH_SIZE = 8;
const PINECONE_BATCH = 100;

if (!VOYAGE_KEY || !PINECONE_KEY) {
  console.error('Missing VOYAGE_API_KEY or PINECONE_API_KEY in .env');
  process.exit(1);
}

const algolia = algoliasearch(ALGOLIA_APP, ALGOLIA_KEY);
const pc = new Pinecone({ apiKey: PINECONE_KEY });

async function ensureIndex() {
  const list = await pc.listIndexes();
  if (list.indexes?.some((i) => i.name === INDEX_NAME)) {
    console.log(`Index "${INDEX_NAME}" already exists`);
    return;
  }
  console.log(`Creating index "${INDEX_NAME}"...`);
  await pc.createIndex({
    name: INDEX_NAME,
    dimension: DIMENSION,
    metric: 'cosine',
    spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
  });
  // Wait for index to be ready
  let ready = false;
  for (let i = 0; i < 30 && !ready; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const desc = await pc.describeIndex(INDEX_NAME);
    ready = desc.status?.ready === true;
  }
  console.log(`Index ready`);
}

async function fetchAllProducts() {
  const products = [];
  let cursor;
  do {
    const result = await algolia.browseObjects({
      indexName: 'clothing_items',
      browseParams: { hitsPerPage: 1000, ...(cursor ? { cursor } : {}) },
    });
    products.push(...(result.hits || []));
    cursor = result.cursor;
    console.log(`  fetched ${products.length} products so far...`);
  } while (cursor);
  return products;
}

async function fetchImageBase64(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'deja/1.0' } });
  if (!res.ok) throw new Error(`image fetch ${res.status}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString('base64');
}

async function embedBatch(items) {
  // items: [{ id, image_url, title }]
  const inputs = await Promise.all(items.map(async (it) => {
    try {
      const b64 = await fetchImageBase64(it.image_url);
      return {
        id: it.id,
        content: [
          { type: 'image_base64', image_base64: `data:image/jpeg;base64,${b64}` },
          { type: 'text', text: `${it.title || ''} ${it.brand || ''} ${it.category || ''}`.trim() },
        ],
      };
    } catch (err) {
      return { id: it.id, error: err.message };
    }
  }));

  const valid = inputs.filter((i) => !i.error);
  if (valid.length === 0) return [];

  const res = await fetch('https://api.voyageai.com/v1/multimodalembeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VOYAGE_KEY}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      inputs: valid.map((v) => ({ content: v.content })),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage API ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.data.map((d, i) => ({
    id: valid[i].id,
    values: d.embedding,
  }));
}

async function main() {
  await ensureIndex();
  const index = pc.index(INDEX_NAME);

  console.log('Fetching all products from Algolia...');
  const products = await fetchAllProducts();
  console.log(`Total: ${products.length} products`);

  // Filter: must have image
  const eligible = products.filter((p) => p.image_url && p.objectID);
  console.log(`With images: ${eligible.length}`);

  let pendingUpserts = [];
  let processed = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const slice = eligible.slice(i, i + BATCH_SIZE);
    try {
      const vectors = await embedBatch(
        slice.map((p) => ({ id: p.objectID, image_url: p.image_url, title: p.title, brand: p.brand, category: p.category }))
      );
      pendingUpserts.push(
        ...vectors.map((v) => ({
          id: v.id,
          values: v.values,
          metadata: {
            // keep metadata small — full data still lives in Algolia
            brand: slice.find((s) => s.objectID === v.id)?.brand || '',
          },
        }))
      );
      processed += vectors.length;
      failed += slice.length - vectors.length;
    } catch (err) {
      failed += slice.length;
      console.warn(`  batch ${i}-${i + BATCH_SIZE} failed: ${err.message}`);
    }

    if (pendingUpserts.length >= PINECONE_BATCH) {
      await index.upsert(pendingUpserts);
      pendingUpserts = [];
    }

    if ((i / BATCH_SIZE) % 20 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = processed / Math.max(elapsed, 1);
      const remaining = (eligible.length - i - BATCH_SIZE) / Math.max(rate, 0.1);
      console.log(`  ${processed}/${eligible.length} embedded (${failed} failed) — ${rate.toFixed(1)}/s — ETA ${Math.round(remaining / 60)}m`);
    }
  }

  if (pendingUpserts.length > 0) {
    await index.upsert(pendingUpserts);
  }

  console.log(`\nDone. Embedded: ${processed}, Failed: ${failed}`);
  process.exit(0);
}

main();
