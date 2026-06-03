import { useEffect } from 'react';

/**
 * Warns the user before closing/refreshing the tab when `isDirty` is true.
 * (useBlocker requires a data router; we use beforeunload instead)
 */
export function useUnsavedGuard(isDirty) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}