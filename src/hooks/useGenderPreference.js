import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'deja_gender_preference';
const VALID = new Set(['womens', 'mens', 'all']);
const DEFAULT = 'womens';

function read() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return VALID.has(v) ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export default function useGenderPreference() {
  const [preference, setPreferenceState] = useState(read);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setPreferenceState(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPreference = useCallback((next) => {
    if (!VALID.has(next)) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch { /* ignore */ }
    setPreferenceState(next);
  }, []);

  return { preference, setPreference };
}
