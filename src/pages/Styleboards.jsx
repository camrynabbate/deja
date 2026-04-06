import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Layout } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Skeleton } from '@/components/ui/skeleton';
import BoardCard from '@/components/styleboards/BoardCard';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function Styleboards() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['styleboards', 'mine'],
    queryFn: () => base44.entities.Styleboard.list('-created_date', 50),
  });

  const { user } = useAuth();

  const createBoard = useMutation({
    mutationFn: (data) => base44.entities.Styleboard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styleboards'] });
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
    },
  });

  const deleteBoard = useMutation({
    mutationFn: (id) => base44.entities.Styleboard.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['styleboards'] }),
  });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createBoard.mutate({
      title: newTitle.trim(),
      description: newDesc.trim(),
      canvas_items: [],
      background_color: '#FAF9F7',
      is_shared: false,
      author_name: user?.full_name || 'Anonymous',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
            Styleboards
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Create outfit collages from your saved items
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> New Board
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="text-center py-24">
          <Layout className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-serif text-xl text-muted-foreground italic">No styleboards yet</p>
          <p className="text-sm text-muted-foreground mt-2 mb-6">Create your first board to start building outfits</p>
          <Button onClick={() => setShowCreate(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Create your first board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} onDelete={() => deleteBoard.mutate(board.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create form — Dialog on desktop, BottomSheet on mobile */}
      {isMobile ? (
        <BottomSheet open={showCreate} onClose={() => setShowCreate(false)} title="New Styleboard">
          <div className="px-5 py-4 space-y-4">
            <Input
              placeholder="Board title (e.g. 'Winter in Paris')"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Input
              placeholder="Description or caption (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={!newTitle.trim() || createBoard.isPending}>
                Create Board
              </Button>
            </div>
          </div>
        </BottomSheet>
      ) : (
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">New Styleboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                placeholder="Board title (e.g. 'Winter in Paris')"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <Input
                placeholder="Description or caption (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newTitle.trim() || createBoard.isPending}>
                Create Board
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}