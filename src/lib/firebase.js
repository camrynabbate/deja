import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
export const auth = getAuth(app);
