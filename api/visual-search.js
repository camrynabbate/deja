import admin from 'firebase-admin';

const MODEL = 'claude-haiku-4-5';

const PROMPT = `You are tagging a clothing or accessory item for a fashion search engine.
Output a single search query (5-15 words) describing the item.
Include in this order: garment type, primary color, material if visible, key style features.
Examples:
- "black leather crossbody bag with gold chain minimalist"
- "white linen midi dress short sleeves casual"
- "navy cashmere crewneck sweater classic"
Output ONLY the description text, no preamble, no quotes.`;

if (!admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const decoded = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(decoded);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  try {
    await admin.auth().verifyIdToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  const { base64, mimeType } = req.body || {};
  if (!base64 || !mimeType) {
    return res.status(400).json({ error: 'Missing base64 or mimeType' });
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 80,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  });

  const data = await upstream.json();
  if (!upstream.ok) {
    return res.status(upstream.status).json({ error: data.error?.message || 'Vision API error' });
  }
  return res.status(200).json({ text: (data.content?.[0]?.text || '').trim() });
}
