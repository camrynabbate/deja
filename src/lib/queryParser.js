// Client-side query parser — no API calls.
// Splits a fashion query like "brown wallet" into { colors: ['brown'], item_type: 'wallet' }
// so Algolia can use a strict color filter instead of competing keyword matches.

const STANDARD_COLORS = new Set([
  'black', 'white', 'cream', 'ivory', 'beige', 'tan', 'taupe', 'nude', 'camel',
  'brown', 'chocolate', 'mocha', 'espresso', 'khaki',
  'navy', 'blue', 'denim', 'cobalt', 'teal', 'turquoise',
  'red', 'burgundy', 'wine', 'maroon', 'crimson',
  'pink', 'rose', 'blush', 'mauve', 'fuchsia', 'magenta', 'coral',
  'green', 'sage', 'olive', 'forest', 'mint', 'emerald',
  'yellow', 'mustard', 'gold', 'butter',
  'orange', 'rust', 'terracotta', 'peach',
  'purple', 'lavender', 'lilac', 'plum',
  'grey', 'gray', 'charcoal', 'silver',
  'multicolor', 'multi',
]);

const STOPWORDS = new Set(['a', 'an', 'the', 'with', 'and', 'or', 'in', 'of', 'for']);

export function parseFashionQuery(query) {
  const raw = String(query || '').trim();
  if (!raw) return { item_type: '', colors: [], modifiers: [], rawQuery: raw };

  const words = raw.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const colors = [];
  const remaining = [];
  for (const w of words) {
    if (STANDARD_COLORS.has(w)) colors.push(w);
    else if (!STOPWORDS.has(w)) remaining.push(w);
  }
  return {
    item_type: remaining.join(' ').trim(),
    colors,
    modifiers: [],
    rawQuery: raw,
  };
}
