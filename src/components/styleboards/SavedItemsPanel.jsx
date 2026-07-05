import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SavedItemsPanel({ items, onAdd }) {
  const [search, setSearch] = useState('');

  const filtered = items.filter(item =>
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-full h-36 lg:w-64 lg:h-auto shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card flex flex-col overflow-hidden">
      <div className="px-3 py-2 lg:p-3 border-b border-border flex lg:block items-center gap-3">
        <div className="shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Items</p>
          <p className="text-[10px] text-muted-foreground lg:mt-1">Tap to add</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1.5 lg:top-2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-7 pl-7 text-xs bg-secondary border-none w-full"
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto p-2 flex lg:block gap-2 lg:space-y-1.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 italic">
            {items.length === 0 ? 'Save items from the feed first' : 'No results'}
          </p>
        ) : (
          filtered.map((item) => (
            <button
              type="button"
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onClick={() => onAdd(item)}
              aria-label={`Add ${item.title} to board`}
              className="relative w-28 lg:w-full shrink-0 flex items-center gap-2 p-2 rounded-lg cursor-pointer lg:cursor-grab lg:active:cursor-grabbing hover:bg-secondary transition-colors group select-none text-left"
              title={`${item.brand} – ${item.title}`}
            >
              <div className="w-10 h-12 rounded-md overflow-hidden bg-secondary shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.brand}</p>
                {item.price && (
                  <p className="text-[10px] text-accent font-medium">${item.price}</p>
                )}
              </div>
              <Plus className="absolute top-1 right-1 w-3.5 h-3.5 text-muted-foreground lg:hidden" />
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
