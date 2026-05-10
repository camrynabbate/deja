import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyCJOsAgAkplZi6ZZNCpkJDRTGpgsO0zaB8",
  authDomain: "deja-b5169.firebaseapp.com",
  projectId: "deja-b5169",
  storageBucket: "deja-b5169.firebasestorage.app",
  messagingSenderId: "135142941533",
  appId: "1:135142941533:web:8b1afd5ddfd31732993eb4",
  measurementId: "G-9TMQH9ZFKJ",
};

const app = initializeApp(firebaseConfig);

export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
  : getAuth(app);

let dbPromise;
export function getDb() {
  if (!dbPromise) {
    dbPromise = import('firebase/firestore').then(({ getFirestore }) => getFirestore(app));
  }
  return dbPromise;
}

if (!Capacitor.isNativePlatform() && typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => getAnalytics(app)).catch(() => {});
}
