import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BottomSheet, BottomSheetItem } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { Heart, Bookmark, ExternalLink, X, Layout, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

function useIsMobile() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

export default function ItemDetailModal({ item, onClose, onLike, onSave, onDislike, isLiked, isSaved, allItems }) {
  const [addToBoardOpen, setAddToBoardOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: boards = [] } = useQuery({
    queryKey: ['styleboards', 'mine'],
    queryFn: () => base44.entities.Styleboard.list('-created_date', 50),
  });

  const { user } = useAuth();

  const similarItems = useMemo(() => {
    if (!item || !allItems?.length) return [];
    return allItems
      .filter(i => i.id !== item.id)
      .map(i => {
        let score = 0;
        if (i.category === item.category) score += 3;
        const sharedTags = (i.style_tags || []).filter(t => (item.style_tags || []).includes(t));
        score += sharedTags.length * 2;
        if (i.price_tier === item.price_tier) score += 1;
        if (i.color && item.color && i.color.toLowerCase() === item.color.toLowerCase()) score += 2;
        return { ...i, _sim: score };
      })
      .filter(i => i._sim > 0)
      .sort((a, b) => b._sim - a._sim)
      .slice(0, 6);
  }, [item, allItems]);

  const handleAddToBoard = async (board) => {
    const newItem = {
      item_id: item.id,
      image_url: item.image_url || '',
      title: item.title,
      brand: item.brand || '',
      price: item.price || 0,
      x: 20, y: 20, w: 22, h: 30,
      z: (board.canvas_items || []).length,
    };
    await base44.entities.Styleboard.update(board.id, {
      canvas_items: [...(board.canvas_items || []), newItem],
      author_name: user?.full_name || 'Anonymous',
    });
    setAddToBoardOpen(false);
  };

  if (!item) return null;

  const content = (
    <div className="flex flex-col sm:flex-row gap-0 sm:gap-6 max-h-[85vh] overflow-y-auto">
      {/* Image */}
      <div className="sm:w-72 shrink-0">
        <div className="aspect-[3/4] sm:rounded-xl overflow-hidden bg-secondary">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif italic">No Image</div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-5 sm:p-0 sm:py-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{item.brand || 'Unknown Brand'}</p>
        <h2 className="font-serif text-xl font-semibold text-foreground mt-1">{item.title}</h2>
        {item.price && <p className="text-2xl font-semibold text-foreground mt-2">${item.price}</p>}
        {item.color && <p className="text-sm text-muted-foreground mt-1 capitalize">Color: {item.color}</p>}
        {item.material && <p className="text-sm text-muted-foreground capitalize">Material: {item.material}</p>}
        {item.description && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{item.description}</p>}

        {item.style_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {item.style_tags.map(tag => (
              <span key={tag} className="text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full capitalize">{tag}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-5">
          <Button
            variant={isLiked ? "default" : "outline"}
            size="sm"
            onClick={() => { onLike(item); }}
            className="gap-1.5"
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
            {isLiked ? 'Liked' : 'Like'}
          </Button>
          <Button
            variant={isSaved ? "default" : "outline"}
            size="sm"
            onClick={() => { onSave(item); }}
            className="gap-1.5"
          >
            <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddToBoardOpen(true)}
            className="gap-1.5"
          >
            <Layout className="w-4 h-4" />
            Add to Board
          </Button>
          {item.source_url && (
            <a href={item.source_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-4 h-4" />
                Shop
              </Button>
            </a>
          )}
        </div>

        {/* Similar Items */}
        {similarItems.length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Similar Items</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {similarItems.map(sim => (
                <button
                  key={sim.id}
                  onClick={() => {
                    onClose();
                    setTimeout(() => {}, 100);
                  }}
                  className="shrink-0 rounded-lg overflow-hidden border border-border/50 hover:border-border transition-all group"
                  style={{ width: 72, height: 96 }}
                >
                  {sim.image_url ? (
                    <img src={sim.image_url} alt={sim.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Add to Board Sheet */}
      <BottomSheet open={addToBoardOpen} onClose={() => setAddToBoardOpen(false)} title="Add to Styleboard">
        {boards.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-muted-foreground">
            No styleboards yet — create one first in the Styleboards tab.
          </div>
        ) : (
          boards.map(board => (
            <BottomSheetItem key={board.id} onSelect={() => handleAddToBoard(board)}>
              <Layout className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1">{board.title}</span>
              <span className="text-xs text-muted-foreground">{(board.canvas_items || []).length} items</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </BottomSheetItem>
          ))
        )}
      </BottomSheet>

      {/* Main modal — Dialog on desktop, BottomSheet on mobile */}
      {isMobile ? (
        <BottomSheet open={!!item} onClose={onClose} title="">
          {content}
        </BottomSheet>
      ) : (
        <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
          <DialogContent className="max-w-2xl p-6">
            {content}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}