import { Capacitor } from '@capacitor/core';
import { getAuth } from 'firebase/auth';

const VISUAL_SEARCH_URL = import.meta.env.VITE_VISUAL_SEARCH_URL;

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
