import 'dotenv/config';
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// Test Pinecone connection
const list = await pc.listIndexes();
console.log('Pinecone indexes:', list.indexes?.map((i) => i.name) || []);

// Test Voyage with a single trivial input
const res = await fetch('https://api.voyageai.com/v1/multimodalembeddings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'voyage-multimodal-3',
    inputs: [{ content: [{ type: 'text', text: 'black leather wallet' }] }],
  }),
});
const data = await res.json();
if (res.ok) {
  console.log('Voyage works. Embedding dimension:', data.data?.[0]?.embedding?.length);
} else {
  console.error('Voyage error:', data);
}
