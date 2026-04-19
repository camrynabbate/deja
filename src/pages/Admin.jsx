import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, AlertCircle, Database, Plus, Trash2, ExternalLink, Image, Upload } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const CATEGORIES = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'bags', 'accessories', 'activewear', 'swimwear'];
const PRICE_TIERS = ['budget', 'mid_range', 'premium', 'luxury'];
const STYLE_TAGS = ['minimalist', 'casual', 'elegant', 'bohemian', 'streetwear', 'trendy', 'cozy', 'classic', 'preppy', 'edgy', 'romantic', 'sporty'];

const emptyForm = {
  title: '',
  brand: '',
  category: 'tops',
  price: '',
  price_tier: 'mid_range',
  color: '',
  material: '',
  style_tags: [],
  description: '',
  image_url: '',
  source_url: '',
};

function MigrateButton({ localItems, onDone }) {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  const handleMigrate = async () => {
    setStatus('loading');
    let added = 0;
    for (const item of localItems) {
      try {
        const { id, created_by, ...data } = item;
        await base44.entities.ClothingItem.create(data);
        added++;
      } catch { /* skip duplicates */ }
    }
    setStatus('success');
    setMessage(`Migrated ${added} product${added !== 1 ? 's' : ''} to Firestore!`);
    onDone();
  };

  if (status === 'success') {
    return (
      <div className="border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 rounded-2xl p-6 mb-10 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
      </div>
    );
  }

  return (
    <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 rounded-2xl p-6 mb-10 space-y-3">
      <h2 className="font-medium text-foreground flex items-center gap-2">
        <Upload className="w-4 h-4" /> Migrate Local Products
      </h2>
      <p className="text-sm text-muted-foreground">
        You have <strong>{localItems.length}</strong> product{localItems.length !== 1 ? 's' : ''} stored in this browser. Upload them to Firestore so everyone can see them.
      </p>
      <Button onClick={handleMigrate} disabled={status === 'loading'} className="gap-2">
        {status === 'loading' ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Migrating...</>
        ) : (
          <><Upload className="w-4 h-4" /> Migrate to Firestore</>
        )}
      </Button>
    </div>
  );
}

export default function Admin() {
  const [form, setForm] = useState(emptyForm);
  const [addStatus, setAddStatus] = useState(null);
  const [addMessage, setAddMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['clothingItems'],
    queryFn: () => base44.entities.ClothingItem.list('-created_date', 500),
  });

  const [fetching, setFetching] = useState(false);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const fetchProductDetails = async () => {
    const url = form.source_url.trim();
    if (!url) {
      setAddStatus('error');
      setAddMessage('Paste a product URL first.');
      return;
    }

    setFetching(true);
    setAddStatus(null);
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      const html = await res.text();

      const getMeta = (property) => {
        const match = html.match(new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
          || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i'));
        return match?.[1] || '';
      };

      const title = getMeta('og:title') || getMeta('twitter:title')
        || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim();

      const image = getMeta('og:image') || getMeta('twitter:image');

      const description = getMeta('og:description') || getMeta('description') || getMeta('twitter:description');

      const brand = getMeta('og:site_name') || getMeta('product:brand')
        || (() => { try { return new URL(url).hostname.replace('www.', '').split('.')[0]; } catch { return ''; } })();

      const priceStr = getMeta('product:price:amount') || getMeta('og:price:amount')
        || (html.match(/"price"\s*:\s*"?([\d.]+)"?/)?.[1] || '');
      const price = parseFloat(priceStr) || 0;

      let priceTier = 'mid_range';
      if (price > 0) {
        if (price < 30) priceTier = 'budget';
        else if (price < 80) priceTier = 'mid_range';
        else if (price < 200) priceTier = 'premium';
        else priceTier = 'luxury';
      }

      setForm(prev => ({
        ...prev,
        title: title || prev.title,
        brand: brand.charAt(0).toUpperCase() + brand.slice(1) || prev.brand,
        image_url: image || prev.image_url,
        description: description || prev.description,
        price: price || prev.price,
        price_tier: price ? priceTier : prev.price_tier,
      }));

      setAddStatus('success');
      setAddMessage('Product details fetched! Review and edit before adding.');
      setTimeout(() => setAddStatus(null), 4000);
    } catch {
      setAddStatus('error');
      setAddMessage('Could not fetch details. Fill in manually.');
    } finally {
      setFetching(false);
    }
  };

  const toggleTag = (tag) => {
    setForm(prev => ({
      ...prev,
      style_tags: prev.style_tags.includes(tag)
        ? prev.style_tags.filter(t => t !== tag)
        : [...prev.style_tags, tag],
    }));
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.source_url.trim()) {
      setAddStatus('error');
      setAddMessage('Title and product URL are required.');
      return;
    }

    setAddStatus('loading');
    try {
      await base44.entities.ClothingItem.create({
        ...form,
        price: form.price ? parseFloat(form.price) : 0,
        likes_count: 0,
      });
      queryClient.invalidateQueries({ queryKey: ['clothingItems'] });
      setForm(emptyForm);
      setAddStatus('success');
      setAddMessage('Product added!');
      setTimeout(() => setAddStatus(null), 3000);
    } catch (err) {
      setAddStatus('error');
      setAddMessage(err.message || 'Failed to add product.');
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.ClothingItem.delete(id);
    queryClient.invalidateQueries({ queryKey: ['clothingItems'] });
  };

  const [bulkText, setBulkText] = useState('');
  const [bulkStatus, setBulkStatus] = useState(null);
  const [bulkMessage, setBulkMessage] = useState('');

  const handleBulkImport = async () => {
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      setBulkStatus('error');
      setBulkMessage('Paste at least one line.');
      return;
    }

    setBulkStatus('loading');
    let added = 0;
    let errors = 0;

    for (const line of lines) {
      // Split by comma, but respect commas inside quotes
      const parts = line.match(/(".*?"|[^,]+)/g)?.map(s => s.trim().replace(/^"|"$/g, '')) || [];
      if (parts.length < 4) {
        errors++;
        continue;
      }

      const [title, brand, priceStr, sourceUrl, imageUrl] = parts;
      const price = parseFloat(priceStr) || 0;
      let priceTier = 'mid_range';
      if (price < 30) priceTier = 'budget';
      else if (price < 80) priceTier = 'mid_range';
      else if (price < 200) priceTier = 'premium';
      else priceTier = 'luxury';

      try {
        await base44.entities.ClothingItem.create({
          title: title || '',
          brand: brand || '',
          price,
          price_tier: priceTier,
          source_url: sourceUrl || '',
          image_url: imageUrl || '',
          category: 'tops',
          color: '',
          material: '',
          style_tags: [],
          description: '',
          likes_count: 0,
        });
        added++;
      } catch {
        errors++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['clothingItems'] });
    setBulkStatus('success');
    setBulkMessage(`Added ${added} product${added !== 1 ? 's' : ''}${errors > 0 ? `, ${errors} failed` : ''}.`);
    if (added > 0) setBulkText('');
    setTimeout(() => setBulkStatus(null), 5000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-3xl font-semibold mb-2">Admin</h1>
      <p className="text-muted-foreground text-sm mb-10">Add real products to your feed</p>

      {/* Migrate from localStorage */}
      {(() => {
        try {
          const local = JSON.parse(localStorage.getItem('vera_clothing_items') || '[]');
          if (local.length === 0) return null;
          return (
            <MigrateButton localItems={local} onDone={() => {
              localStorage.removeItem('vera_clothing_items');
              queryClient.invalidateQueries({ queryKey: ['clothingItems'] });
            }} />
          );
        } catch { return null; }
      })()}

      {/* Add Product Form */}
      <div className="border border-border rounded-2xl p-6 bg-card space-y-5 mb-10">
        <h2 className="font-medium text-foreground text-lg">Add Product</h2>
        <p className="text-sm text-muted-foreground -mt-3">
          Paste a product URL and click Auto-fill to grab the details automatically.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Product URL *</label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="https://www.zara.com/us/en/linen-blazer-p02345..."
                value={form.source_url}
                onChange={(e) => updateField('source_url', e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={fetchProductDetails}
                disabled={fetching}
                className="shrink-0 gap-2"
              >
                {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {fetching ? 'Fetching...' : 'Auto-fill'}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title *</label>
            <Input
              placeholder="Oversized Linen Blazer"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Brand</label>
            <Input
              placeholder="Zara"
              value={form.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price ($)</label>
            <Input
              type="number"
              placeholder="89.90"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Color</label>
            <Input
              placeholder="beige"
              value={form.color}
              onChange={(e) => updateField('color', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Material</label>
            <Input
              placeholder="linen"
              value={form.material}
              onChange={(e) => updateField('material', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Price Tier</label>
            <select
              value={form.price_tier}
              onChange={(e) => updateField('price_tier', e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {PRICE_TIERS.map(t => <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Image URL</label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Right-click product image → Copy Image Address"
                value={form.image_url}
                onChange={(e) => updateField('image_url', e.target.value)}
              />
              {form.image_url && (
                <div className="w-9 h-9 rounded-md border border-border overflow-hidden shrink-0">
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea
              placeholder="Short product description..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="mt-1 min-h-[60px]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Style Tags</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    form.style_tags.includes(tag)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleAdd} disabled={addStatus === 'loading'} className="gap-2 w-full">
          {addStatus === 'loading' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
          ) : (
            <><Plus className="w-4 h-4" /> Add Product</>
          )}
        </Button>

        {addStatus === 'success' && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" /> {addMessage}
          </div>
        )}
        {addStatus === 'error' && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" /> {addMessage}
          </div>
        )}
      </div>

      {/* Bulk Import */}
      <div className="border border-border rounded-2xl p-6 bg-card space-y-4 mb-10">
        <h2 className="font-medium text-foreground text-lg flex items-center gap-2">
          <Database className="w-4 h-4" /> Bulk Import
        </h2>
        <p className="text-sm text-muted-foreground -mt-2">
          Paste one product per line: <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">title, brand, price, product URL, image URL</code>
        </p>
        <Textarea
          placeholder={`Oversized Linen Blazer, Zara, 89.90, https://www.zara.com/..., https://static.zara.net/...\nCotton Midi Dress, H&M, 34.99, https://www2.hm.com/..., https://lp2.hm.com/...`}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="min-h-[120px] font-mono text-xs"
        />
        <Button onClick={handleBulkImport} disabled={bulkStatus === 'loading'} variant="outline" className="gap-2 w-full">
          {bulkStatus === 'loading' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
          ) : (
            <><Database className="w-4 h-4" /> Import Products</>
          )}
        </Button>
        {bulkStatus === 'success' && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" /> {bulkMessage}
          </div>
        )}
        {bulkStatus === 'error' && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" /> {bulkMessage}
          </div>
        )}
      </div>

      {/* Current Products */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-foreground text-lg">Current Products ({items.length})</h2>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <p className="text-muted-foreground text-sm">No products yet. Add your first one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:border-border transition-colors">
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.brand}{item.price ? ` · $${item.price}` : ''}{item.category ? ` · ${item.category}` : ''}
                  </p>
                </div>
                {item.source_url && (
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-2 text-muted-foreground hover:text-foreground">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => handleDelete(item.id)} className="shrink-0 p-2 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
