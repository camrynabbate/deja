import { Capacitor } from '@capacitor/core';

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MODEL = 'claude-haiku-4-5';

const PROMPT = `You are tagging a clothing or accessory item for a fashion search engine.
Output a single search query (5-15 words) describing the item.
Include in this order: garment type, primary color, material if visible, key style features.
Examples:
- "black leather crossbody bag with gold chain minimalist"
- "white linen midi dress short sleeves casual"
- "navy cashmere crewneck sweater classic"
Output ONLY the description text, no preamble, no quotes.`;

export async function pickImage() {
  if (Capacitor.isNativePlatform()) {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      quality: 70,
      source: CameraSource.Prompt,
      width: 1024,
      correctOrientation: true,
    });
    return {
      base64: photo.base64String,
      mimeType: photo.format ? `image/${photo.format}` : 'image/jpeg',
    };
  }
  // Web fallback — use a hidden file input
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const base64 = result.split(',')[1] || '';
        resolve({ base64, mimeType: file.type || 'image/jpeg' });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

export async function describeImage({ base64, mimeType }) {
  if (!ANTHROPIC_KEY) throw new Error('Anthropic API key not configured');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
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
              source: { type: 'base64', media_type: mimeType, data: base64 },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Vision API error (${response.status})`);
  }
  return (data.content?.[0]?.text || '').trim();
}
