export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_SEARCHES_PER_MINUTE = 5;
export const MAX_SEARCHES_PER_DAY = 30;
export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const DEFAULT_ALLOWED_ORIGINS = new Set([
  'https://bedeja.com',
  'https://www.bedeja.com',
  'https://localhost',
  'capacitor://localhost',
  'ionic://localhost',
]);

export function isAllowedOrigin(origin, configuredOrigins = '') {
  if (!origin) return true;
  const configured = configuredOrigins
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (DEFAULT_ALLOWED_ORIGINS.has(origin) || configured.includes(origin)) return true;
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && url.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

export function validateImagePayload(body) {
  const { base64, mimeType } = body || {};
  if (typeof base64 !== 'string' || typeof mimeType !== 'string') {
    return { ok: false, status: 400, error: 'Choose an image and try again.' };
  }
  if (!ALLOWED_IMAGE_TYPES.has(mimeType.toLowerCase())) {
    return { ok: false, status: 415, error: 'Use a JPEG, PNG, WebP, or GIF image.' };
  }
  if (base64.length === 0 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return { ok: false, status: 400, error: 'The selected image could not be read.' };
  }

  const decodedBytes = Buffer.byteLength(base64, 'base64');
  if (decodedBytes > MAX_IMAGE_BYTES) {
    return { ok: false, status: 413, error: 'Choose an image smaller than 5 MB.' };
  }
  return { ok: true, base64, mimeType: mimeType.toLowerCase() };
}

export function nextRateLimitState(previous = {}, now = Date.now()) {
  const minuteStart = Math.floor(now / 60_000) * 60_000;
  const dayKey = new Date(now).toISOString().slice(0, 10);
  const minuteCount = previous.minuteStart === minuteStart ? previous.minuteCount || 0 : 0;
  const dayCount = previous.dayKey === dayKey ? previous.dayCount || 0 : 0;

  if (minuteCount >= MAX_SEARCHES_PER_MINUTE) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((minuteStart + 60_000 - now) / 1000)),
    };
  }
  if (dayCount >= MAX_SEARCHES_PER_DAY) {
    return { allowed: false, retryAfterSeconds: 3600 };
  }

  return {
    allowed: true,
    value: {
      minuteStart,
      minuteCount: minuteCount + 1,
      dayKey,
      dayCount: dayCount + 1,
      updatedAt: now,
    },
  };
}
