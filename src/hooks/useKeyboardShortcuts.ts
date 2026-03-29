import { useEffect, useState, useCallback, useRef } from 'react';

interface ExtraHandlers {
  onToggleSound?: () => void;
  onCycleMode?: () => void;
}

export function useKeyboardShortcuts(extras?: ExtraHandlers) {
  const [showHelp, setShowHelp] = useState(false);
  const extrasRef = useRef(extras);
  extrasRef.current = extras;

  const toggleHelp = useCallback(() => setShowHelp(p => !p), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 'Escape') { closeHelp(); return; }
      if (isInput) return;
      if (e.key === '?') { e.preventDefault(); toggleHelp(); }
      if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) { extrasRef.current?.onToggleSound?.(); }
      if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) { extrasRef.current?.onCycleMode?.(); }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleHelp, closeHelp]);

  return { showHelp, closeHelp, toggleHelp };
}
