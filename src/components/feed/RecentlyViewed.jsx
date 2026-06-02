import { Heart } from 'lucide-react';

export default function RecentlyViewed({ items, likedIds, onOpen }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
        Recently Viewed
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onOpen(item)}
            className="shrink-0 relative rounded-xl overflow-hidden border border-border/50 hover:border-border transition-all hover:shadow-md group"
            style={{ width: 80, height: 108 }}
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">No img</span>
              </div>
            )}
            {likedIds.has(item.id) && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                <Heart className="w-2.5 h-2.5 text-white fill-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}