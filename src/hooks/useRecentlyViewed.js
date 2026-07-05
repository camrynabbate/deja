import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  loadRecentlyViewed,
  saveRecentlyViewed,
  updateRecentlyViewed,
} from '@/lib/recentlyViewed';

export default function useRecentlyViewed() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [viewed, setViewed] = useState([]);

  useEffect(() => {
    setViewed(loadRecentlyViewed(window.localStorage, uid));
  }, [uid]);

  const addViewed = useCallback((item) => {
    setViewed((previous) => {
      const next = updateRecentlyViewed(previous, item);
      saveRecentlyViewed(window.localStorage, uid, next);
      return next;
    });
  }, [uid]);

  return { viewed, addViewed };
}
