import { useState, useCallback } from 'react';

const MAX = 10;

export default function useRecentlyViewed() {
  const [viewed, setViewed] = useState([]);

  const addViewed = useCallback((item) => {
    setViewed(prev => [item, ...prev.filter(i => i.id !== item.id)].slice(0, MAX));
  }, []);

  return { viewed, addViewed };
}
