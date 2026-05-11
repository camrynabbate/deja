import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Mobile-first bottom sheet. On desktop it renders as a standard popover/dropdown replacement.
 * Usage:
 *   <BottomSheet open={open} onClose={() => setOpen(false)} title="Options">
 *     <BottomSheetItem onSelect={...}>Option 1</BottomSheetItem>
 *   </BottomSheet>
 */
export function BottomSheet({ open, onClose, title, children, className }) {
  // Lock body scroll when open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet — mobile only */}
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[61] bg-card rounded-t-2xl shadow-2xl lg:left-1/2 lg:right-auto lg:max-w-md lg:w-full lg:-ml-[14rem] lg:rounded-2xl lg:bottom-8",
              className
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <span className="font-medium text-sm text-foreground">{title}</span>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="overflow-y-auto overscroll-contain max-h-[70vh] py-2">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function BottomSheetItem({ onSelect, children, className, destructive }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-5 min-h-[52px] text-sm font-medium text-left transition-colors",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-secondary",
        className
      )}
    >
      {children}
    </button>
  );
}