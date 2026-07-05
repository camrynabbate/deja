const OPPOSITE_ACTION = {
  like: 'dislike',
  dislike: 'like',
};

export function preferencePayload(item, action) {
  return {
    item_id: item.id,
    action,
    style_tags: item.style_tags || [],
    category: item.category || '',
    price_tier: item.price_tier || '',
    title: item.title || '',
    brand: item.brand || '',
    image_url: item.image_url || '',
    price: item.price ?? null,
    color: item.color || '',
    source_url: item.source_url || '',
  };
}

export function preferenceChange(preferences, item, action) {
  const matching = preferences.filter(
    (preference) => preference.item_id === item.id && preference.action === action,
  );
  const oppositeAction = OPPOSITE_ACTION[action];
  const opposing = oppositeAction
    ? preferences.filter(
      (preference) => preference.item_id === item.id && preference.action === oppositeAction,
    )
    : [];

  return {
    adding: matching.length === 0,
    remove: matching.length > 0 ? [...matching, ...opposing] : opposing,
    payload: preferencePayload(item, action),
  };
}

export function applyOptimisticPreferenceChange(preferences, change, optimisticId) {
  const removeIds = new Set(change.remove.map((preference) => preference.id));
  const next = preferences.filter((preference) => !removeIds.has(preference.id));

  if (!change.adding) return next;
  return [
    {
      ...change.payload,
      id: optimisticId,
      created_date: new Date().toISOString(),
    },
    ...next,
  ];
}
