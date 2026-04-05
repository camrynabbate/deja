import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, Upload, Loader2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DupeResult from '@/components/dupes/DupeResult';

export default function FindDupes() {
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);

  const searchMutation = useMutation({
    mutationFn: async () => {
      // Mock dupe results — replace with a real API call (e.g. Claude API) for production
      const mockDupes = [
        { title: 'Faux Leather Crossbody', brand: 'Zara', price: 35.99, similarity_score: 0.92, description: 'Similar silhouette and hardware detailing at a fraction of the price.', where_to_buy: 'Zara' },
        { title: 'Quilted Shoulder Bag', brand: 'H&M', price: 24.99, similarity_score: 0.85, description: 'Quilted texture and chain strap give a luxury feel on a budget.', where_to_buy: 'H&M' },
        { title: 'Mini Flap Bag', brand: 'Mango', price: 45.99, similarity_score: 0.88, description: 'Structured shape with gold-tone clasp, very close to the original.', where_to_buy: 'Mango' },
        { title: 'Chain Detail Bag', brand: 'ASOS', price: 29.00, similarity_score: 0.80, description: 'Affordable option with similar proportions and chain accent.', where_to_buy: 'ASOS' },
        { title: 'Compact Crossbody', brand: 'COS', price: 69.00, similarity_score: 0.90, description: 'Higher quality materials with clean minimalist design.', where_to_buy: 'COS' },
      ];

      // Save the search
      await base44.entities.DupeSearch.create({
        original_description: description,
        original_image_url: imagePreview || '',
        results: mockDupes,
        status: 'completed',
      });

      return mockDupes;
    },
    onSuccess: (data) => setResults(data),
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
          Find Dupes
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Describe or upload a piece — we'll find affordable alternatives
        </p>
      </div>

      {/* Search Form */}
      <div className="mb-10 space-y-4">
        {/* Text area */}
        <div className="relative">
          <Textarea
            placeholder="e.g. 'Bottega Veneta padded cassette bag in olive green leather, $2400'"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px] text-sm resize-none bg-card border-border/60 rounded-2xl px-5 pt-5 pb-14 shadow-sm focus-visible:ring-1 focus-visible:ring-accent/50 placeholder:text-muted-foreground/50"
          />
          {/* Bottom bar inside textarea */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-border/40">
            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-xs font-medium">
                {imageFile ? imageFile.name.slice(0, 20) + (imageFile.name.length > 20 ? '…' : '') : 'Attach image'}
              </span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            <div className="flex items-center gap-2">
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-8 h-8 object-cover rounded-lg border border-border" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-foreground text-background rounded-full flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
              <Button
                onClick={() => searchMutation.mutate()}
                disabled={!description.trim() || searchMutation.isPending}
                size="sm"
                className="rounded-xl px-5 h-8 text-xs font-semibold gap-1.5"
              >
                {searchMutation.isPending ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> Find Dupes</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="font-serif text-xl font-semibold">
                {results.length} Dupes Found
              </h2>
            </div>
            <div className="grid gap-4">
              {results.map((dupe, index) => (
                <DupeResult key={index} dupe={dupe} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}