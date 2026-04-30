// Visual similarity search via Voyage (embedding) + Pinecone (vector store).
// Runs entirely client-side for now — same caveat as the Anthropic key:
// the API keys are exposed in the bundle, fine for development, requires a
// proxy before public launch.

import { algoliaClient, CLOTHING_INDEX } from './algolia';

const VOYAGE_KEY = import.meta.env.VITE_VOYAGE_API_KEY;
const PINECONE_KEY = import.meta.env.VITE_PINECONE_API_KEY;
const PINECONE_HOST = import.meta.env.VITE_PINECONE_HOST; // e.g. https://deja-products-XXXX.svc.aped-4627-b74a.pinecone.io
const VOYAGE_MODEL = 'voyage-multimodal-3';

export const vectorSearchEnabled = Boolean(VOYAGE_KEY && PINECONE_KEY && PINECONE_HOST);

async function embedImage({ base64, mimeType }) {
  const res = await fetch('https://api.voyageai.com/v1/multimodalembeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${VOYAGE_KEY}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      inputs: [{ content: [{ type: 'image_base64', image_base64: `data:${mimeType};base64,${base64}` }] }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Voyage error ${res.status}`);
  return data.data?.[0]?.embedding;
}

async function queryPinecone(vector, topK = 30) {
  const res = await fetch(`${PINECONE_HOST}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': PINECONE_KEY,
      'X-Pinecone-API-Version': '2024-07',
    },
    body: JSON.stringify({ vector, topK, includeMetadata: false }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Pinecone error ${res.status}`);
  return data.matches || [];
}

async function hydrateFromAlgolia(ids) {
  if (!ids.length) return [];
  const { results } = await algoliaClient.search({
    requests: ids.map((id) => ({
      indexName: CLOTHING_INDEX,
      query: '',
      filters: `objectID:"${id}"`,
      hitsPerPage: 1,
    })),
  });
  // Map ID → record so we can preserve Pinecone's similarity ranking.
  const byId = new Map();
  for (const r of results) {
    const hit = r.hits?.[0];
    if (hit) byId.set(hit.objectID, hit);
  }
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

export async function searchByImage({ base64, mimeType }, { topK = 20 } = {}) {
  if (!vectorSearchEnabled) throw new Error('Vector search not configured');
  const vector = await embedImage({ base64, mimeType });
  const matches = await queryPinecone(vector, topK);
  const ids = matches.map((m) => m.id);
  return hydrateFromAlgolia(ids);
}
