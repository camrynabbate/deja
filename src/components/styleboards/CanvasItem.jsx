import { useRef, useState } from 'react';
import { X, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CanvasItem({
  item, index, isSelected, onSelect, onMove, onResize, onRemove, onBringForward, canvasRef,
}) {
  const dragStart = useRef(null);
  const resizeStart = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Pointer-based drag for moving
  const handlePointerDown = (e) => {
    if (e.target.closest('[data-resize]') || e.target.closest('[data-action]')) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    const rect = canvasRef.current.getBoundingClientRect();
    dragStart.current = {
      px: e.clientX,
      py: e.clientY,
      ox: item.x,
      oy: item.y,
      rw: rect.width,
      rh: rect.height,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragStart.current) return;
    const { px, py, ox, oy, rw, rh } = dragStart.current;
    const dx = ((e.clientX - px) / rw) * 100;
    const dy = ((e.clientY - py) / rh) * 100;
    const newX = Math.max(0, Math.min(100 - item.w, ox + dx));
    const newY = Math.max(0, Math.min(100 - item.h, oy + dy));
    onMove(index, newX - item.x, newY - item.y);
  };

  const handlePointerUp = () => {
    dragStart.current = null;
    setIsDragging(false);
  };

  // Resize handle
  const handleResizePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    resizeStart.current = {
      px: e.clientX,
      py: e.clientY,
      ow: item.w,
      oh: item.h,
      rw: rect.width,
      rh: rect.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (e) => {
    if (!resizeStart.current) return;
    const { px, py, ow, oh, rw, rh } = resizeStart.current;
    const dw = ((e.clientX - px) / rw) * 100;
    const dh = ((e.clientY - py) / rh) * 100;
    onResize(index, (ow + dw) - item.w, (oh + dh) - item.h);
  };

  const handleResizePointerUp = () => {
    resizeStart.current = null;
  };

  return (
    <div
      className={cn(
        'absolute group/item',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
      )}
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        width: `${item.w}%`,
        height: `${item.h}%`,
        zIndex: (item.z || 0) + (isSelected ? 100 : 0),
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Image */}
      <div className={cn(
        'w-full h-full rounded-xl overflow-hidden shadow-lg transition-all duration-150',
        isSelected ? 'ring-2 ring-accent ring-offset-1' : 'hover:shadow-xl'
      )}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="text-xs text-muted-foreground font-medium text-center px-2">{item.title}</span>
          </div>
        )}

        {/* Hover label */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover/item:opacity-100 transition-opacity rounded-b-xl">
          <p className="text-white text-[10px] font-medium truncate">{item.brand}</p>
          {item.price > 0 && <p className="text-white/80 text-[10px]">${item.price}</p>}
        </div>
      </div>

      {/* Controls — only when selected. Min 44px touch target via padding trick */}
      {isSelected && (
        <>
          <button
            data-action
            aria-label="Remove item"
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            className="absolute -top-3 -right-3 w-[44px] h-[44px] flex items-center justify-center z-10 group/btn"
          >
            <span className="w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md group-hover/btn:scale-110 transition-transform">
              <X className="w-3 h-3" aria-hidden="true" />
            </span>
          </button>
          <button
            data-action
            aria-label="Bring forward"
            onClick={(e) => { e.stopPropagation(); onBringForward(index); }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-[44px] h-[44px] flex items-center justify-center z-10 group/btn"
          >
            <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-md group-hover/btn:scale-110 transition-transform">
              <ArrowUp className="w-3 h-3" aria-hidden="true" />
            </span>
          </button>
        </>
      )}

      {/* Resize handle */}
      <div
        data-resize
        aria-label="Resize item"
        className={cn(
          'absolute bottom-0 right-0 w-11 h-11 lg:w-5 lg:h-5 cursor-se-resize transition-opacity flex items-end justify-end p-2 lg:p-0',
          isSelected ? 'opacity-100' : 'opacity-0 lg:group-hover/item:opacity-100',
        )}
        style={{ touchAction: 'none' }}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerCancel={handleResizePointerUp}
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 lg:w-full lg:h-full drop-shadow">
          <path d="M14 6 L6 14 M14 10 L10 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
