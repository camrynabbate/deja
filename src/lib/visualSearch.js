import { Capacitor } from '@capacitor/core';
import { getAuth } from 'firebase/auth';

const VISUAL_SEARCH_URL = import.meta.env.VITE_VISUAL_SEARCH_URL;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function validateImage({ base64, mimeType }) {
  if (!ALLOWED_IMAGE_TYPES.has(mimeType?.toLowerCase())) {
    throw new Error('Use a JPEG, PNG, WebP, or GIF image.');
  }
  const approximateBytes = Math.floor((base64?.length || 0) * 0.75);
  if (!base64) throw new Error('The selected image could not be read.');
  if (approximateBytes > MAX_IMAGE_BYTES) throw new Error('Choose an image smaller than 5 MB.');
}

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
      if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
        reject(new Error('Use a JPEG, PNG, WebP, or GIF image.'));
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        reject(new Error('Choose an image smaller than 5 MB.'));
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
  validateImage({ base64, mimeType });
  if (!VISUAL_SEARCH_URL) throw new Error('Visual search URL not configured');
  const user = getAuth().currentUser;
  if (!user) throw new Error('Sign in to use visual search');
  const token = await user.getIdToken();

  const response = await fetch(VISUAL_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ base64, mimeType }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Vision API error (${response.status})`);
  }
  return (data.text || '').trim();
}
