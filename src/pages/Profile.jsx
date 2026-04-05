import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import usePreferences from '@/hooks/usePreferences';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Bookmark, Search, TrendingUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { preferences, tasteProfile, likedIds, savedIds } = usePreferences();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: searches = [] } = useQuery({
    queryKey: ['dupeSearches'],
    queryFn: () => base44.entities.DupeSearch.list('-created_date', 50),
  });

  const topStyles = useMemo(() => {
    return Object.entries(tasteProfile.tagScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .filter(([, score]) => score > 0);
  }, [tasteProfile]);

  const topCategories = useMemo(() => {
    return Object.entries(tasteProfile.categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .filter(([, score]) => score > 0);
  }, [tasteProfile]);

  const stats = [
    { icon: Heart, label: 'Liked', value: likedIds.size, color: 'text-accent' },
    { icon: Bookmark, label: 'Saved', value: savedIds.size, color: 'text-foreground' },
    { icon: Search, label: 'Searches', value: searches.length, color: 'text-muted-foreground' },
    { icon: TrendingUp, label: 'Interactions', value: preferences.length, color: 'text-accent' },
  ];

  const categoryLabels = {
    tops: 'Tops', bottoms: 'Bottoms', dresses: 'Dresses', outerwear: 'Outerwear',
    shoes: 'Shoes', bags: 'Bags', accessories: 'Accessories', activewear: 'Activewear', swimwear: 'Swimwear',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center mb-4">
          <span className="font-serif text-2xl font-semibold">
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          {user?.full_name || 'Your Profile'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
              <p className="text-2xl font-semibold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Style DNA */}
      <div className="mb-10">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Your Style DNA</h2>
        {topStyles.length > 0 ? (
          <div className="space-y-3">
            {topStyles.map(([tag, score]) => {
              const maxScore = topStyles[0][1];
              const percentage = Math.round((score / maxScore) * 100);
              return (
                <div key={tag} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground w-28 truncate capitalize">{tag}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{score}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Interact with items on the feed to build your style profile
          </p>
        )}
      </div>

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="mb-10">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Favourite Categories</h2>
          <div className="flex flex-wrap gap-2">
            {topCategories.map(([cat, score]) => (
              <span
                key={cat}
                className="px-4 py-2 bg-secondary text-foreground text-sm rounded-full font-medium"
              >
                {categoryLabels[cat] || cat} · {score}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Account Actions */}
      <div className="pt-6 border-t border-border space-y-2">
        <div>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </div>
      </div>

      {/* Delete Data Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Clear All Data</DialogTitle>
            <DialogDescription>
              This will delete all your preferences, saved items, styleboards, and search history from this browser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(''); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirm !== 'DELETE' || isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const prefs = await base44.entities.UserPreference.list('-created_date', 1000);
                    for (const p of prefs) await base44.entities.UserPreference.delete(p.id);

                    const boards = await base44.entities.Styleboard.list('-created_date', 1000);
                    for (const b of boards) await base44.entities.Styleboard.delete(b.id);

                    const dupes = await base44.entities.DupeSearch.list('-created_date', 1000);
                    for (const s of dupes) await base44.entities.DupeSearch.delete(s.id);

                    queryClient.invalidateQueries();
                    setShowDeleteDialog(false);
                    setDeleteConfirm('');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? 'Deleting...' : 'Clear Everything'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
