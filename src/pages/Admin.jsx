import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle, Sparkles, Database } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const SEED_ITEMS = [
  { title: 'Oversized Linen Blazer', brand: 'Zara', category: 'outerwear', price: 89.90, price_tier: 'premium', color: 'beige', material: 'linen', style_tags: ['minimalist', 'classic'], description: 'Relaxed-fit linen blazer with patch pockets and a single-button closure.', image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80' },
  { title: 'Ribbed Knit Tank', brand: 'COS', category: 'tops', price: 35, price_tier: 'mid_range', color: 'white', material: 'cotton', style_tags: ['minimalist', 'casual'], description: 'Slim-fit ribbed tank top in organic cotton.', image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80' },
  { title: 'Wide Leg Trousers', brand: 'Arket', category: 'bottoms', price: 79, price_tier: 'mid_range', color: 'charcoal', material: 'wool blend', style_tags: ['minimalist', 'elegant'], description: 'High-waisted wide-leg trousers with pressed creases.', image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80' },
  { title: 'Satin Midi Skirt', brand: 'Mango', category: 'bottoms', price: 49.99, price_tier: 'mid_range', color: 'champagne', material: 'satin', style_tags: ['elegant', 'romantic'], description: 'Bias-cut satin midi skirt with elastic waistband.', image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0uj86?w=600&q=80' },
  { title: 'Chunky Platform Boots', brand: 'ASOS', category: 'shoes', price: 65, price_tier: 'mid_range', color: 'black', material: 'faux leather', style_tags: ['edgy', 'streetwear'], description: 'Lace-up platform boots with chunky sole.', image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80' },
  { title: 'Cashmere Crew Sweater', brand: 'Uniqlo', category: 'tops', price: 99.90, price_tier: 'premium', color: 'camel', material: 'cashmere', style_tags: ['classic', 'cozy'], description: 'Lightweight cashmere crew neck sweater.', image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80' },
  { title: 'Pleated Maxi Dress', brand: 'H&M', category: 'dresses', price: 39.99, price_tier: 'mid_range', color: 'sage green', material: 'polyester', style_tags: ['bohemian', 'romantic'], description: 'Flowy pleated maxi dress with adjustable straps.', image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80' },
  { title: 'Leather Crossbody Bag', brand: 'Massimo Dutti', category: 'bags', price: 149, price_tier: 'premium', color: 'tan', material: 'leather', style_tags: ['classic', 'elegant'], description: 'Structured crossbody bag in full-grain leather with gold hardware.', image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80' },
  { title: 'Cropped Denim Jacket', brand: 'Topshop', category: 'outerwear', price: 55, price_tier: 'mid_range', color: 'light wash', material: 'denim', style_tags: ['casual', 'trendy'], description: 'Classic cropped denim jacket with button closure.', image_url: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&q=80' },
  { title: 'Strappy Heeled Sandals', brand: '& Other Stories', category: 'shoes', price: 129, price_tier: 'premium', color: 'black', material: 'leather', style_tags: ['elegant', 'minimalist'], description: 'Barely-there strappy sandals with a slim heel.', image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80' },
  { title: 'Oversized Graphic Tee', brand: 'Weekday', category: 'tops', price: 25, price_tier: 'budget', color: 'black', material: 'cotton', style_tags: ['streetwear', 'casual'], description: 'Boxy-fit graphic print T-shirt in organic cotton.', image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80' },
  { title: 'Wool Blend Coat', brand: 'COS', category: 'outerwear', price: 190, price_tier: 'premium', color: 'navy', material: 'wool blend', style_tags: ['classic', 'elegant'], description: 'Tailored single-breasted coat with notch lapels.', image_url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80' },
  { title: 'Floral Wrap Dress', brand: 'Reformation', category: 'dresses', price: 218, price_tier: 'luxury', color: 'multi', material: 'viscose', style_tags: ['romantic', 'bohemian'], description: 'Feminine wrap dress in a vintage-inspired floral print.', image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80' },
  { title: 'Canvas Tote Bag', brand: 'Monki', category: 'bags', price: 19.99, price_tier: 'budget', color: 'natural', material: 'canvas', style_tags: ['casual', 'minimalist'], description: 'Large canvas tote bag with interior pocket.', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80' },
  { title: 'High-Rise Straight Jeans', brand: 'Mango', category: 'bottoms', price: 59.99, price_tier: 'mid_range', color: 'medium wash', material: 'denim', style_tags: ['classic', 'casual'], description: 'High-rise straight-leg jeans with raw hem.', image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80' },
  { title: 'Silk Camisole', brand: '& Other Stories', category: 'tops', price: 69, price_tier: 'mid_range', color: 'blush', material: 'silk', style_tags: ['romantic', 'elegant'], description: 'Delicate silk camisole with lace trim.', image_url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&q=80' },
  { title: 'Quilted Chain Bag', brand: 'NA-KD', category: 'bags', price: 45, price_tier: 'mid_range', color: 'black', material: 'faux leather', style_tags: ['trendy', 'elegant'], description: 'Quilted shoulder bag with chain strap detail.', image_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80' },
  { title: 'Knit Midi Dress', brand: 'H&M', category: 'dresses', price: 34.99, price_tier: 'mid_range', color: 'chocolate', material: 'knit', style_tags: ['cozy', 'minimalist'], description: 'Body-skimming ribbed knit midi dress.', image_url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600&q=80' },
  { title: 'Chunky Gold Hoops', brand: 'Mango', category: 'accessories', price: 22.99, price_tier: 'budget', color: 'gold', material: 'metal', style_tags: ['trendy', 'elegant'], description: 'Thick gold-tone hoop earrings.', image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80' },
  { title: 'Puffer Vest', brand: 'Uniqlo', category: 'outerwear', price: 49.90, price_tier: 'mid_range', color: 'olive', material: 'nylon', style_tags: ['sporty', 'casual'], description: 'Ultra-light down puffer vest with zip closure.', image_url: 'https://images.unsplash.com/photo-1544923246-77307dd270b5?w=600&q=80' },
  { title: 'Linen Shirt Dress', brand: 'Arket', category: 'dresses', price: 99, price_tier: 'premium', color: 'white', material: 'linen', style_tags: ['minimalist', 'classic'], description: 'Relaxed linen shirt dress with tie waist.', image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80' },
  { title: 'Leather Belt', brand: 'Massimo Dutti', category: 'accessories', price: 59, price_tier: 'mid_range', color: 'brown', material: 'leather', style_tags: ['classic', 'elegant'], description: 'Full-grain leather belt with brushed gold buckle.', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80' },
  { title: 'Running Sneakers', brand: 'ASOS', category: 'shoes', price: 42, price_tier: 'mid_range', color: 'white', material: 'mesh', style_tags: ['sporty', 'casual'], description: 'Lightweight mesh running sneakers with cushioned sole.', image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' },
  { title: 'Velvet Blazer', brand: 'River Island', category: 'outerwear', price: 85, price_tier: 'premium', color: 'burgundy', material: 'velvet', style_tags: ['edgy', 'elegant'], description: 'Fitted velvet blazer with satin lining.', image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80' },
  { title: 'Cargo Pants', brand: 'Weekday', category: 'bottoms', price: 45, price_tier: 'mid_range', color: 'khaki', material: 'cotton', style_tags: ['streetwear', 'casual'], description: 'Relaxed-fit cargo pants with side pockets.', image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80' },
  { title: 'Silk Scarf', brand: 'COS', category: 'accessories', price: 39, price_tier: 'mid_range', color: 'terracotta', material: 'silk', style_tags: ['classic', 'elegant'], description: 'Printed silk scarf in abstract motif.', image_url: 'https://images.unsplash.com/photo-1601924921557-45e8ffb0f4a3?w=600&q=80' },
  { title: 'Bodycon Mini Dress', brand: 'NA-KD', category: 'dresses', price: 32, price_tier: 'mid_range', color: 'black', material: 'jersey', style_tags: ['trendy', 'edgy'], description: 'Figure-hugging mini dress with ruched detailing.', image_url: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&q=80' },
  { title: 'Woven Basket Bag', brand: 'Mango', category: 'bags', price: 35.99, price_tier: 'mid_range', color: 'natural', material: 'straw', style_tags: ['bohemian', 'casual'], description: 'Hand-woven basket bag with leather handles.', image_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80' },
  { title: 'Ribbed Turtleneck', brand: 'Uniqlo', category: 'tops', price: 29.90, price_tier: 'budget', color: 'cream', material: 'merino wool', style_tags: ['cozy', 'classic'], description: 'Fine-gauge merino wool ribbed turtleneck.', image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80' },
  { title: 'Leopard Print Midi Skirt', brand: 'Topshop', category: 'bottoms', price: 48, price_tier: 'mid_range', color: 'leopard', material: 'viscose', style_tags: ['trendy', 'edgy'], description: 'Satin leopard print midi skirt with side slit.', image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0uj86?w=600&q=80' },
];

export default function Admin() {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const handleSeedData = async () => {
    setStatus('loading');
    setMessage('');

    try {
      // Clear existing items
      const existing = await base44.entities.ClothingItem.list('-created_date', 500);
      for (const item of existing) {
        await base44.entities.ClothingItem.delete(item.id);
      }

      // Add seed items
      for (const item of SEED_ITEMS) {
        await base44.entities.ClothingItem.create({ ...item, likes_count: 0 });
      }

      queryClient.invalidateQueries({ queryKey: ['clothingItems'] });
      setStatus('success');
      setMessage(`Loaded ${SEED_ITEMS.length} items into the feed!`);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-2">Admin</h1>
      <p className="text-muted-foreground text-sm mb-10">Manage product data</p>

      <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
        <div>
          <h2 className="font-medium text-foreground">Load Sample Products</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Populates the feed with {SEED_ITEMS.length} curated fashion items. This will replace any existing items.
          </p>
        </div>

        <Button
          onClick={handleSeedData}
          disabled={status === 'loading'}
          className="gap-2 w-full"
        >
          {status === 'loading' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Loading items...</>
          ) : (
            <><Database className="w-4 h-4" /> Load Sample Data</>
          )}
        </Button>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            {message}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
