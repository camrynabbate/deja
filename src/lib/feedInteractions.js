export const MAX_FEED_PAGES = 8;
export const PULL_TO_REFRESH_THRESHOLD = 72;

export function getNextFeedPageParam(lastPage, allPages) {
  if (!lastPage?.length || allPages.length >= MAX_FEED_PAGES) return undefined;
  return allPages.length;
}

export function getPullGesture({
  startX,
  startY,
  currentX,
  currentY,
  scrollTop,
  threshold = PULL_TO_REFRESH_THRESHOLD,
}) {
  const deltaX = currentX - startX;
  const deltaY = currentY - startY;
  const isDownwardVerticalPull = deltaY > 6 && deltaY > Math.abs(deltaX);

  if (scrollTop > 0 || !isDownwardVerticalPull) {
    return { shouldPreventDefault: false, pullDistance: 0, isPulling: false };
  }

  return {
    shouldPreventDefault: true,
    pullDistance: Math.min(deltaY * 0.5, threshold * 1.5),
    isPulling: deltaY > threshold,
  };
}
