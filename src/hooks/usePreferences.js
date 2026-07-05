import { useCallback, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hapticLight, hapticMedium } from '@/lib/native';
import { useAuth } from '@/lib/AuthContext';
import {
  applyOptimisticPreferenceChange,
  preferenceChange,
} from '@/lib/preferenceState';

export default function usePreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const uid = user?.uid;

  // Key the cache by uid so switching accounts can't show stale prefs from a
  // previous user, and gate on `enabled` so we never query before auth resolves
  // (otherwise getUid() falls back to 'anonymous' and returns nothing).
  const { data: preferences = [], error: prefsError } = useQuery({
    queryKey: ['userPreferences', uid],
    queryFn: () => base44.entities.UserPreference.list('-created_date', 500),
    staleTime: 2 * 60 * 1000,
    enabled: !!uid,
  });

  useEffect(() => {
    if (prefsError) console.error('[usePreferences] load failed:', prefsError);
  }, [prefsError]);

  const preferenceKey = useMemo(() => ['userPreferences', uid], [uid]);

  const updatePreference = useMutation({
    mutationFn: async (change) => {
      await Promise.all(
        change.remove
          .filter((preference) => !String(preference.id).startsWith('optimistic-'))
          .map((preference) => base44.entities.UserPreference.delete(preference.id)),
      );
      if (change.adding) {
        await base44.entities.UserPreference.create(change.payload);
      }
    },
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: preferenceKey });
      const previous = queryClient.getQueryData(preferenceKey) || [];
      queryClient.setQueryData(
        preferenceKey,
        applyOptimisticPreferenceChange(
          previous,
          change,
          `optimistic-${Date.now()}`,
        ),
      );
      return { previous };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: preferenceKey });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(preferenceKey, context.previous);
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
    const change = preferenceChange(preferences, item, action);
    if (change.adding) {
      if (action === 'dislike') hapticMedium(); else hapticLight();
    }
    updatePreference.mutate(change);
  }, [preferences, updatePreference]);

  return { preferences, likedIds, dislikedIds, savedIds, tasteProfile, scoreItem, recordPreference };
}
