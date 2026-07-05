import admin from 'firebase-admin';
import {
  isAllowedOrigin,
  nextRateLimitState,
  validateImagePayload,
} from './visual-search-policy.js';

const MODEL = 'claude-haiku-4-5';
const UPSTREAM_TIMEOUT_MS = 20_000;

const PROMPT = `You are tagging a clothing or accessory item for a fashion search engine.
Output a single search query (5-15 words) describing the item.
Include in this order: garment type, primary color, material if visible, key style features.
Examples:
- "black leather crossbody bag with gold chain minimalist"
- "white linen midi dress short sleeves casual"
- "navy cashmere crewneck sweater classic"
Output ONLY the description text, no preamble, no quotes.`;

function initializeFirebase() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured');
  const decoded = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(decoded);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

async function useSearchQuota(uid) {
  const ref = admin.firestore().collection('_visual_search_limits').doc(uid);
  return admin.firestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const next = nextRateLimitState(snapshot.data());
    if (next.allowed) transaction.set(ref, next.value);
    return next;
  });
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '7mb',
    },
  },
};

export default async function handler(req, res) {
  const originAllowed = isAllowedOrigin(
    req.headers.origin,
    process.env.VISUAL_SEARCH_ALLOWED_ORIGINS,
  );
  if (!originAllowed) return res.status(403).json({ error: 'Origin not allowed' });

  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    initializeFirebase();
  } catch (error) {
    console.error('[visual-search] Firebase configuration error:', error);
    return res.status(503).json({ error: 'Visual search is temporarily unavailable.' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[visual-search] ANTHROPIC_API_KEY is not configured');
    return res.status(503).json({ error: 'Visual search is temporarily unavailable.' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  const image = validateImagePayload(req.body);
  if (!image.ok) {
    return res.status(image.status).json({ error: image.error });
  }

  let quota;
  try {
    quota = await useSearchQuota(decodedToken.uid);
  } catch (error) {
    console.error('[visual-search] Rate-limit check failed:', error);
    return res.status(503).json({ error: 'Visual search is temporarily unavailable.' });
  }
  if (!quota.allowed) {
    res.setHeader('Retry-After', String(quota.retryAfterSeconds));
    return res.status(429).json({ error: 'You have reached the visual-search limit. Please try again later.' });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
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
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: image.mimeType,
                  data: image.base64,
                },
              },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      console.error('[visual-search] Vision provider error:', upstream.status, data.error?.type);
      return res.status(502).json({ error: 'The image could not be analyzed. Please try again.' });
    }
    const text = (data.content?.[0]?.text || '').trim().slice(0, 300);
    if (!text) return res.status(502).json({ error: 'The image could not be analyzed. Please try again.' });
    return res.status(200).json({ text });
  } catch (error) {
    console.error('[visual-search] Request failed:', error);
    return res.status(504).json({ error: 'Visual search took too long. Please try again.' });
  }
}
