import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Globe, Lock, Trash2, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import usePreferences from '@/hooks/usePreferences';
import CanvasItem from '@/components/styleboards/CanvasItem';
import SavedItemsPanel from '@/components/styleboards/SavedItemsPanel';
import BackgroundPicker from '@/components/styleboards/BackgroundPicker.jsx';
import { toast } from 'sonner';

export default function StyleboardBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);
  const { preferences } = usePreferences();

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['styleboard', id],
    queryFn: () => base44.entities.Styleboard.filter({ id }),
    select: (data) => data[0],
  });

  const allItems = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const p of preferences) {
      if (p.action !== 'save' && p.action !== 'like') continue;
      if (!p.image_url) continue;
      if (seen.has(p.item_id)) continue;
      seen.add(p.item_id);
      out.push({
        id: p.item_id,
        title: p.title || '',
        brand: p.brand || '',
        image_url: p.image_url || '',
        price: p.price ?? undefined,
        color: p.color || '',
        source_url: p.source_url || '',
        style_tags: p.style_tags || [],
        category: p.category || '',
        price_tier: p.price_tier || '',
      });
    }
    return out;
  }, [preferences]);

  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [canvasItems, setCanvasItems] = useState([]);
  const [bgColor, setBgColor] = useState('#FAF9F7');
  const [isShared, setIsShared] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Sync board data once loaded
  useEffect(() => {
    if (board) {
      setTitle(board.title || '');
      setCanvasItems(board.canvas_items || []);
      setBgColor(board.background_color || '#FAF9F7');
      setIsShared(board.is_shared || false);
    }
  }, [board]);

  const saveBoard = useMutation({
    mutationFn: (data) => base44.entities.Styleboard.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styleboards'] });
      queryClient.invalidateQueries({ queryKey: ['styleboard', id] });
      toast.success('Styleboard saved');
    },
  });

  const handleSave = useCallback(() => {
    saveBoard.mutate({
      title,
      canvas_items: canvasItems,
      background_color: bgColor,
      is_shared: isShared,
      author_name: user?.full_name || 'Anonymous',
    });
  }, [title, canvasItems, bgColor, isShared, user]);

  const handleToggleShare = useCallback(() => {
    const next = !isShared;
    setIsShared(next);
    saveBoard.mutate({
      title,
      canvas_items: canvasItems,
      background_color: bgColor,
      is_shared: next,
      author_name: user?.full_name || 'Anonymous',
    });
  }, [isShared, title, canvasItems, bgColor, user]);

  // Drop item from panel onto canvas
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    const item = JSON.parse(raw);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCanvasItems(prev => [...prev, {
      item_id: item.id,
      image_url: item.image_url || '',
      title: item.title,
      brand: item.brand || '',
      price: item.price || 0,
      x: Math.max(5, Math.min(75, x)),
      y: Math.max(5, Math.min(75, y)),
      w: 22,
      h: 30,
      z: prev.length,
    }]);
  }, []);

  const handleMoveItem = useCallback((index, dx, dy) => {
    setCanvasItems(prev => prev.map((it, i) =>
      i === index
        ? { ...it, x: Math.max(0, Math.min(78, it.x + dx)), y: Math.max(0, Math.min(70, it.y + dy)) }
        : it
    ));
  }, []);

  const handleResizeItem = useCallback((index, dw, dh) => {
    setCanvasItems(prev => prev.map((it, i) =>
      i === index ? { ...it, w: Math.max(10, it.w + dw), h: Math.max(12, it.h + dh) } : it
    ));
  }, []);

  const handleRemoveItem = useCallback((index) => {
    setCanvasItems(prev => prev.filter((_, i) => i !== index));
    setSelectedId(null);
  }, []);

  const handleBringForward = useCallback((index) => {
    setCanvasItems(prev => prev.map((it, i) =>
      i === index ? { ...it, z: (it.z || 0) + 1 } : it
    ));
  }, []);

  // Items available in panel (saved + liked)
  const panelItems = allItems;

  if (boardLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Toolbar */}
      <header className="border-b border-border bg-card flex items-center gap-3 px-4 shrink-0 z-20"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
          paddingRight: 'calc(1rem + env(safe-area-inset-right))',
          minHeight: 'calc(3.5rem + env(safe-area-inset-top))',
        }}
      >
        <button
          aria-label="Back to Styleboards"
          onClick={() => navigate('/styleboards')}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="w-px h-5 bg-border" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8 text-sm font-medium border-none shadow-none bg-transparent focus-visible:ring-0 px-0 w-48"
          placeholder="Board title"
        />
        <div className="flex-1" />
        <BackgroundPicker value={bgColor} onChange={setBgColor} />
        <button
          onClick={handleToggleShare}
          aria-label={isShared ? 'Make board private' : 'Share board publicly'}
          aria-pressed={isShared}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 min-h-[44px] rounded-full border transition-all ${
            isShared ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          {isShared ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {isShared ? 'Shared' : 'Share'}
        </button>
        <Button size="sm" onClick={handleSave} disabled={saveBoard.isPending} className="gap-1.5">
          {saveBoard.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — saved items */}
        <SavedItemsPanel items={panelItems} />

        {/* Canvas */}
        <div className="flex-1 overflow-hidden p-4 flex items-center justify-center bg-muted/30">
          <div
            ref={canvasRef}
            className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl"
            style={{ backgroundColor: bgColor, maxWidth: '1100px', maxHeight: '700px', touchAction: 'none' }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => setSelectedId(null)}
          >
            {canvasItems.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="border-2 border-dashed border-border/50 rounded-2xl px-12 py-10 text-center">
                  <p className="font-serif text-xl text-muted-foreground/50 italic">Drag items here</p>
                  <p className="text-sm text-muted-foreground/40 mt-1">From your saved collection on the left</p>
                </div>
              </div>
            )}
            {canvasItems.map((ci, index) => (
              <CanvasItem
                key={`${ci.item_id}-${index}`}
                item={ci}
                index={index}
                isSelected={selectedId === index}
                onSelect={() => setSelectedId(index)}
                onMove={handleMoveItem}
                onResize={handleResizeItem}
                onRemove={handleRemoveItem}
                onBringForward={handleBringForward}
                canvasRef={canvasRef}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}