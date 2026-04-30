import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFeedItems } from '@/lib/algolia';
import { Skeleton } from '@/components/ui/skeleton';
import FeedGrid from '@/components/feed/FeedGrid';
import CategoryFilter from '@/components/feed/CategoryFilter';
import FeedFilters, { PRICE_RANGES } from '@/components/feed/FeedFilters';
import RecentlyViewed from '@/components/feed/RecentlyViewed';
import ItemDetailModal from '@/components/feed/ItemDetailModal';
import usePreferences from '@/hooks/usePreferences';
import useRecentlyViewed from '@/hooks/useRecentlyViewed';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import useGenderPreference from '@/hooks/useGenderPreference';
import { cn } from '@/lib/utils';
import PullToRefreshIndicator from '@/components/ui/PullToRefreshIndicator';


export default function Feed() {
  const [category, setCategory] = useState('all');
  const [filters, setFilters] = useState({ priceRange: PRICE_RANGES[0], color: null });
  const [selectedItem, setSelectedItem] = useState(null);
  const { likedIds, savedIds, dislikedIds, scoreItem, recordPreference, tasteProfile } = usePreferences();
  const { viewed, addViewed } = useRecentlyViewed();
  const { preference: genderPref, setPreference: setGenderPref } = useGenderPreference();
  const queryClient = useQueryClient();

  const handleOpenItem = (item) => {
    addViewed(item);
    setSelectedItem(item);
  };

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['feedItems', genderPref],
    queryFn: () => fetchFeedItems({ hitsPerPage: 100, gender: genderPref }),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev, // keep showing old data while refetching
  });

  const { pullDistance, isPulling } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ['feedItems'] });
    queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
  });

  const hasPreferences = Object.keys(tasteProfile.tagScores).length > 0;

  const topTags = useMemo(() => {
    return Object.entries(tasteProfile.tagScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .filter(([, score]) => score > 0)
      .map(([tag]) => tag);
  }, [tasteProfile]);

  const displayedItems = useMemo(() => {
    const filtered = items.filter(item => {
      if (dislikedIds.has(item.id)) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (item.price !== undefined && item.price !== null) {
        if (item.price < filters.priceRange.min || item.price > filters.priceRange.max) return false;
      }
      if (filters.color) {
        const itemColor = (item.color || '').toLowerCase();
        if (!itemColor.includes(filters.color)) return false;
      }
      return true;
    });

    if (!hasPreferences) return filtered;

    return filtered
      .map(item => ({ ...item, _score: scoreItem(item) }))
      .sort((a, b) => b._score - a._score);
  }, [items, dislikedIds, category, hasPreferences, scoreItem]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 overscroll-none">
      <PullToRefreshIndicator pullDistance={pullDistance} isPulling={isPulling} />

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight italic">
            déjà
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {hasPreferences
            ? 'Curated to your taste — the more you interact, the better it gets'
            : 'Explore the latest finds — double-tap to like'}
        </p>


      </div>

      <RecentlyViewed items={viewed} likedIds={likedIds} onOpen={handleOpenItem} />

      <div className="mb-4">
        <div role="tablist" aria-label="Show items for" className="inline-flex p-1 rounded-full bg-secondary">
          {[
            { value: 'womens', label: 'Women' },
            { value: 'mens', label: 'Men' },
            { value: 'all', label: 'Both' },
          ].map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={genderPref === opt.value}
              onClick={() => setGenderPref(opt.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                genderPref === opt.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 space-y-3">
        <div className="overflow-x-auto">
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>
        <FeedFilters filters={filters} onChange={setFilters} />
      </div>

      {isLoading ? (
        <div className="columns-2 md:columns-3 xl:columns-4 gap-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid">
              <Skeleton className="aspect-[3/4] rounded-xl" />
              <Skeleton className="h-4 w-3/4 mt-3" />
              <Skeleton className="h-3 w-1/2 mt-2" />
            </div>
          ))}
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-serif text-xl text-muted-foreground italic">Nothing here yet</p>
          <p className="text-sm text-muted-foreground mt-2">Items will appear as they're added to the collection</p>
        </div>
      ) : (
        <FeedGrid
          items={displayedItems}
          likedIds={likedIds}
          savedIds={savedIds}
          onLike={(item) => recordPreference(item, 'like')}
          onDislike={(item) => recordPreference(item, 'dislike')}
          onSave={(item) => recordPreference(item, 'save')}
          onOpen={handleOpenItem}
        />
      )}

      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onLike={(item) => recordPreference(item, 'like')}
        onSave={(item) => recordPreference(item, 'save')}
        onDislike={(item) => { recordPreference(item, 'dislike'); setSelectedItem(null); }}
        isLiked={selectedItem ? likedIds.has(selectedItem.id) : false}
        isSaved={selectedItem ? savedIds.has(selectedItem.id) : false}
        allItems={items}
      />
    </div>
  );
}