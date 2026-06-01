import { useEffect, useRef, useState } from 'react';

/**
 * Simple pull-to-refresh hook.
 * Returns { isRefreshing, containerRef }
 * Attach containerRef to the scrollable container.
 * onRefresh: async function to call when triggered.
 */
export default function usePullToRefresh(onRefresh, threshold = 80) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current || window;

    const onTouchStart = (e) => {
      const scrollTop = containerRef.current
        ? containerRef.current.scrollTop
        : window.scrollY;
      if (scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (startY.current === null || isRefreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        setPullY(Math.min(dy, threshold * 1.5));
      }
    };

    const onTouchEnd = async () => {
      if (pullY >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullY(0);
        await onRefresh();
        setIsRefreshing(false);
      } else {
        setPullY(0);
      }
      startY.current = null;
    };

    const target = containerRef.current || window;
    target.addEventListener('touchstart', onTouchStart, { passive: true });
    target.addEventListener('touchmove', onTouchMove, { passive: true });
    target.addEventListener('touchend', onTouchEnd);

    return () => {
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, threshold, isRefreshing, pullY]);

  return { isRefreshing, pullY, containerRef };
}