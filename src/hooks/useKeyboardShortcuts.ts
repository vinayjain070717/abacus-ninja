import { useEffect, useState, useCallback } from 'react';

export function useKeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);

  const toggleHelp = useCallback(() => setShowHelp(p => !p), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape') { closeHelp(); return; }
      if (isInput) return;
      if (e.key === '?') { e.preventDefault(); toggleHelp(); }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleHelp, closeHelp]);

  return { showHelp, closeHelp, toggleHelp };
}
