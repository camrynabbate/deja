export const MAX_RECENTLY_VIEWED = 10;
export const RECENTLY_VIEWED_VERSION = 1;

export function recentlyViewedKey(uid) {
  return `deja_recently_viewed_v${RECENTLY_VIEWED_VERSION}:${uid}`;
}

export function updateRecentlyViewed(items, item) {
  return [item, ...items.filter((existing) => existing.id !== item.id)]
    .slice(0, MAX_RECENTLY_VIEWED);
}

export function loadRecentlyViewed(storage, uid) {
  if (!uid) return [];
  try {
    const value = JSON.parse(storage.getItem(recentlyViewedKey(uid)) || '[]');
    return Array.isArray(value) ? value.slice(0, MAX_RECENTLY_VIEWED) : [];
  } catch {
    return [];
  }
}

export function saveRecentlyViewed(storage, uid, items) {
  if (!uid) return;
  try {
    storage.setItem(recentlyViewedKey(uid), JSON.stringify(items));
  } catch {
    // Browsers can disable or exhaust local storage. Recent items are optional.
  }
}
