import { useState, useMemo } from 'react';
import { searchClothingStructured } from '@/lib/algolia';
import { pickImage, describeImage } from '@/lib/visualSearch';
import { parseFashionQuery } from '@/lib/queryParser';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, Loader2, Sparkles, ExternalLink, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Recommended' },
  { value: 'price-asc', label: 'Price ↑' },
  { value: 'price-desc', label: 'Price ↓' },
];

export default function FindDupes() {
  const [description, setDescription] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');

  const sortedResults = useMemo(() => {
    if (!results) return null;
    if (sortBy === 'relevance') return results;
    const copy = [...results];
    if (sortBy === 'price-asc') {
      copy.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    } else if (sortBy === 'price-desc') {
      copy.sort((a, b) => (b.price || -Infinity) - (a.price || -Infinity));
    }
    return copy;
  }, [results, sortBy]);

  const runSearch = async (query) => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const parsed = await parseFashionQuery(query);
      const hits = await searchClothingStructured(parsed, { hitsPerPage: 20 });
      const filtered = hits.filter((h) => h.source_url && h.image_url);
      setResults(filtered.map((h) => ({ ...h, id: h.objectID })));
    } catch (err) {
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => runSearch(description);

  const handleImageSearch = async () => {
    setError(null);
    setAnalyzing(true);
    try {
      const image = await pickImage();
      const generated = await describeImage(image);
      setDescription(generated);
      await runSearch(generated);
    } catch (err) {
      if (err?.message && !/cancel/i.test(err.message)) {
        setError(err.message);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Search header — never scrolls */}
      <div className="bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 sm:px-6 pt-6 pb-4 space-y-3 shrink-0">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            Find Dupes
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Describe a piece you love — we'll find similar items you can actually buy
          </p>
        </div>
        <Textarea
          placeholder="e.g. black leather crossbody bag"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => {
            document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSearch();
            }
          }}
          rows={2}
          enterKeyHint="search"
          className="min-h-[64px] text-base resize-none bg-card border-border/60 rounded-2xl px-4 py-3 shadow-sm focus-visible:ring-1 focus-visible:ring-accent/50 placeholder:text-muted-foreground/50"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleSearch}
            disabled={!description.trim() || searching || analyzing}
            className="gap-2 flex-1"
          >
            {searching ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
            ) : (
              <><Search className="w-4 h-4" /> Find Dupes</>
            )}
          </Button>
          <Button
            onClick={handleImageSearch}
            disabled={searching || analyzing}
            variant="outline"
            className="gap-2 flex-1"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing image…</>
            ) : (
              <><Camera className="w-4 h-4" /> Search by photo</>
            )}
          </Button>
        </div>
      </div>

      {/* Results — only this area scrolls */}
      <div className="flex-1 overflow-y-auto">
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 px-4 sm:px-6 py-6"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <h2 className="font-serif text-xl font-semibold">
                  {results.length} {results.length === 1 ? 'Match' : 'Matches'} Found
                </h2>
              </div>
              {results.length > 1 && (
                <div className="inline-flex p-0.5 rounded-full bg-secondary text-xs">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={cn(
                        'px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap',
                        sortBy === opt.value
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error ? (
              <p className="text-sm text-destructive py-8 text-center">{error}</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No matches yet. Try different keywords, or check back as we add more products.
              </p>
            ) : (
              <div className="grid gap-3">
                {sortedResults.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(index, 5) * 0.03 }}
                  >
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-border hover:shadow-md transition-all group"
                    >
                      {/* Image */}
                      <div className="w-16 h-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">
                            No img
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 min-h-[80px] flex flex-col">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                          {item.brand || 'Unknown Brand'}
                        </p>
                        <h3 className="text-sm font-medium text-foreground mt-0.5 line-clamp-2 leading-snug">{item.title}</h3>
                        <div className="mt-auto pt-1 flex items-center gap-2 flex-wrap">
                          {item.price > 0 && (
                            <span className="text-sm font-semibold text-foreground">${item.price}</span>
                          )}
                          {item.style_tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Shop link */}
                      <div className="shrink-0 text-muted-foreground group-hover:text-accent transition-colors pt-1">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
