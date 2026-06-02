import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Blocks navigation when `isDirty` is true.
 * Shows a confirm dialog before leaving.
 */
export function useUnsavedGuard(isDirty) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Also handle browser back / tab close
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Auto-confirm via dialog when blocker fires
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const ok = window.confirm('Vous avez des modifications non enregistrées. Quitter sans sauvegarder ?');
      if (ok) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
}