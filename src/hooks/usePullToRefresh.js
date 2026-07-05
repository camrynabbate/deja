import { useEffect, useRef, useState } from 'react';
import {
  getPullGesture,
  PULL_TO_REFRESH_THRESHOLD,
} from '@/lib/feedInteractions';

export default function usePullToRefresh(onRefresh, scrollRoot) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startPoint = useRef(null);
  const shouldRefresh = useRef(false);
  const refreshHandler = useRef(onRefresh);

  useEffect(() => {
    refreshHandler.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!scrollRoot) return undefined;

    const el = scrollRoot;
    const isWindow = el === window;
    const getScrollTop = () => isWindow ? window.scrollY : el.scrollTop;

    const onTouchStart = (e) => {
      if (getScrollTop() > 0 || e.touches.length !== 1) return;
      const touch = e.touches[0];
      startPoint.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchMove = (e) => {
      if (!startPoint.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const gesture = getPullGesture({
        startX: startPoint.current.x,
        startY: startPoint.current.y,
        currentX: touch.clientX,
        currentY: touch.clientY,
        scrollTop: getScrollTop(),
        threshold: PULL_TO_REFRESH_THRESHOLD,
      });

      if (gesture.shouldPreventDefault) {
        e.preventDefault();
      }
      shouldRefresh.current = gesture.isPulling;
      setPullDistance(gesture.pullDistance);
      setIsPulling(gesture.isPulling);
    };

    const resetGesture = (refresh) => {
      if (refresh && shouldRefresh.current) refreshHandler.current();
      startPoint.current = null;
      shouldRefresh.current = false;
      setPullDistance(0);
      setIsPulling(false);
    };

    const onTouchEnd = () => resetGesture(true);
    const onTouchCancel = () => resetGesture(false);

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [scrollRoot]);

  return { pullDistance, isPulling };
}
