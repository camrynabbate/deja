import { useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hapticLight, hapticMedium } from '@/lib/native';

export default function usePreferences() {
  const queryClient = useQueryClient();

  const { data: preferences = [] } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: () => base44.entities.UserPreference.list('-created_date', 500),
    staleTime: 2 * 60 * 1000,
  });

  const createPref = useMutation({
    mutationFn: (data) => base44.entities.UserPreference.create(data),
    // Optimistic update: immediately add the preference to the cache
    onMutate: async (newPref) => {
      await queryClient.cancelQueries({ queryKey: ['userPreferences'] });
      const previous = queryClient.getQueryData(['userPreferences']);
      queryClient.setQueryData(['userPreferences'], (old = []) => [
        { ...newPref, id: `optimistic-${Date.now()}`, created_date: new Date().toISOString() },
        ...old,
      ]);
      return { previous };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['userPreferences'], context.previous);
      }
    },
  });

  const likedIds = useMemo(() => new Set(
    preferences.filter(p => p.action === 'like').map(p => p.item_id)
  ), [preferences]);

  const dislikedIds = useMemo(() => new Set(
    preferences.filter(p => p.action === 'dislike').map(p => p.item_id)
  ), [preferences]);

  const savedIds = useMemo(() => new Set(
    preferences.filter(p => p.action === 'save').map(p => p.item_id)
  ), [preferences]);

  const tasteProfile = useMemo(() => {
    const tagScores = {};
    const categoryScores = {};
    const priceTierScores = {};

    preferences.forEach(pref => {
      const weight = pref.action === 'like' ? 2 : pref.action === 'save' ? 3 : pref.action === 'dislike' ? -2 : 0;
      (pref.style_tags || []).forEach(tag => {
        tagScores[tag] = (tagScores[tag] || 0) + weight;
      });
      if (pref.category) categoryScores[pref.category] = (categoryScores[pref.category] || 0) + weight;
      if (pref.price_tier) priceTierScores[pref.price_tier] = (priceTierScores[pref.price_tier] || 0) + weight;
    });

    return { tagScores, categoryScores, priceTierScores };
  }, [preferences]);

  const scoreItem = useCallback((item) => {
    let score = 0;
    const { tagScores, categoryScores, priceTierScores } = tasteProfile;
    (item.style_tags || []).forEach(tag => { score += tagScores[tag] || 0; });
    if (item.category) score += categoryScores[item.category] || 0;
    if (item.price_tier) score += priceTierScores[item.price_tier] || 0;
    return score;
  }, [tasteProfile]);

  const recordPreference = useCallback((item, action) => {
    const existingSet = action === 'like' ? likedIds : action === 'save' ? savedIds : dislikedIds;
    if (existingSet.has(item.id)) return;
    if (action === 'dislike') hapticMedium(); else hapticLight();
    createPref.mutate({
      item_id: item.id,
      action,
      style_tags: item.style_tags || [],
      category: item.category || '',
      price_tier: item.price_tier || '',
      title: item.title || '',
      brand: item.brand || '',
      image_url: item.image_url || '',
      price: item.price ?? null,
      color: item.color || '',
      source_url: item.source_url || '',
    });
  }, [createPref, likedIds, savedIds, dislikedIds]);

  return { preferences, likedIds, dislikedIds, savedIds, tasteProfile, scoreItem, recordPreference };
}