import { useEffect } from 'react';

export function useKeyBindings(bindings: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const activeEl = document.activeElement;
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') {
          // Allow Ctrl/Cmd + Enter even in textareas
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
             if (bindings['Cmd+Enter']) {
                 e.preventDefault();
                 bindings['Cmd+Enter']();
             }
          }
          return;
      }

      for (const [keyCombination, callback] of Object.entries(bindings)) {
        const keys = keyCombination.split('+');
        const isOpt = keys.includes('Opt') || keys.includes('Alt');
        const isCtrl = keys.includes('Ctrl') || keys.includes('Cmd');
        const isShift = keys.includes('Shift');
        const mainKey = keys[keys.length - 1];

        if (
          e.key.toLowerCase() === mainKey.toLowerCase() &&
          (isOpt === e.altKey) &&
          (isCtrl === (e.ctrlKey || e.metaKey)) &&
          (isShift === e.shiftKey)
        ) {
          e.preventDefault();
          callback();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bindings]);
}
