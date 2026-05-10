import { useState, useRef } from 'react';
import { Heart, Bookmark, X, ExternalLink, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BottomSheet, BottomSheetItem } from '@/components/ui/BottomSheet';

export default function FeedCard({ item, onLike, onDislike, onSave, onOpen, isLiked, isSaved }) {
  const [showHeart, setShowHeart] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const tapTimer = useRef(null);
  const tapCount = useRef(0);

  // Single tap → open detail, double tap → like
  const handleTap = () => {
    tapCount.current += 1;
    if (tapCount.current === 1) {
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
        onOpen?.(item);
      }, 280);
    } else if (tapCount.current === 2) {
      clearTimeout(tapTimer.current);
      tapCount.current = 0;
      if (!isLiked) onLike(item);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
  };

  const priceTierLabel = {
    budget: 'Budget Friendly',
    mid_range: 'Mid Range',
    premium: 'Premium',
    luxury: 'Luxury',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg"
    >
      {/* Image */}
      <div
        role="img"
        aria-label={`${item.title}${item.brand ? ` by ${item.brand}` : ''} — double-tap to like`}
        className="relative aspect-[3/4] overflow-hidden cursor-pointer bg-secondary"
        onDoubleClick={handleTap}
        onClick={handleTap}
      >
        {item.image_url ? (
          <img
            src={`${item.image_url}${item.image_url.includes('?') ? '&' : '?'}width=600`}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="font-serif text-lg italic">No Image</span>
          </div>
        )}

        {/* Double-tap heart animation */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-20 h-20 text-white fill-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay actions — desktop hover, mobile always-visible "more" button */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {/* Desktop: show all actions on hover */}
          <div className="hidden sm:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              aria-label={isSaved ? "Remove from saved" : "Save item"}
              onClick={(e) => { e.stopPropagation(); onSave(item); }}
              className={cn(
                "w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all",
                isSaved ? "bg-accent text-accent-foreground" : "bg-black/30 text-white hover:bg-black/50"
              )}
            >
              <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
            </button>
            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Shop ${item.title}`}
                onClick={(e) => e.stopPropagation()}
                className="w-11 h-11 rounded-full bg-black/30 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              aria-label="Not interested"
              onClick={(e) => { e.stopPropagation(); onDislike(item); }}
              className="w-11 h-11 rounded-full bg-black/30 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Mobile: single "more" button opens BottomSheet */}
          <button
            aria-label="Item options"
            onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }}
            className="sm:hidden w-11 h-11 rounded-full bg-black/40 text-white backdrop-blur-md flex items-center justify-center"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Price badge */}
        {item.price && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-black/60 backdrop-blur-md text-white text-sm font-medium px-3 py-1.5 rounded-full">
              ${item.price}
            </span>
          </div>
        )}

        {item.is_dupe_of && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-accent text-accent-foreground text-[10px] tracking-wider uppercase font-semibold">
              Dupe
            </Badge>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {item.brand || 'Unknown Brand'}
            </p>
            <h3 className="text-sm font-medium text-foreground mt-1 truncate">{item.title}</h3>
          </div>
          <button
            aria-label={isLiked ? "Liked" : "Like item"}
            onClick={() => isLiked ? null : onLike(item)}
            className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
          >
            <Heart className={cn(
              "w-5 h-5 transition-all",
              isLiked ? "text-accent fill-accent" : "text-muted-foreground hover:text-accent"
            )} />
          </button>
        </div>

        {item.style_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.style_tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {item.price_tier && (
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
            {priceTierLabel[item.price_tier]}
          </p>
        )}
      </div>

      {/* Mobile action sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={item.title}>
        <BottomSheetItem onSelect={() => { onSave(item); setSheetOpen(false); }}>
          <Bookmark className={cn("w-4 h-4", isSaved && "fill-current text-accent")} />
          {isSaved ? 'Remove from Saved' : 'Save Item'}
        </BottomSheetItem>
        {!isLiked && (
          <BottomSheetItem onSelect={() => { onLike(item); setSheetOpen(false); }}>
            <Heart className="w-4 h-4" />
            Like Item
          </BottomSheetItem>
        )}
        {item.source_url && (
          <BottomSheetItem onSelect={() => { window.open(item.source_url, '_blank'); setSheetOpen(false); }}>
            <ExternalLink className="w-4 h-4" />
            Shop Item
          </BottomSheetItem>
        )}
        <BottomSheetItem onSelect={() => { onOpen?.(item); setSheetOpen(false); }}>
          <ExternalLink className="w-4 h-4" />
          View Details
        </BottomSheetItem>
        <BottomSheetItem onSelect={() => { onDislike(item); setSheetOpen(false); }} destructive>
          <X className="w-4 h-4" />
          Not Interested
        </BottomSheetItem>
      </BottomSheet>
    </motion.div>
  );
}