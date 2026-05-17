import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, X } from 'lucide-react';

export default function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Shift', '?'], desc: 'Show this menu' },
    { keys: ['Cmd', 'Enter'], desc: 'Generate Script / Visuals' },
    { keys: ['ArrowDown'], desc: 'Next Scene (Visuals)' },
    { keys: ['ArrowUp'], desc: 'Previous Scene (Visuals)' },
    { keys: ['Esc'], desc: 'Close modals / Fullscreen' }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="hardware-card w-full max-w-md bg-[#0a0a0b] flex flex-col overflow-hidden shadow-2xl shadow-blue-900/20"
        >
          <div className="p-4 border-b border-[#2a2d35] flex items-center justify-between bg-[#1f2128]">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold uppercase tracking-widest text-sm text-white">Keyboard Shortcuts</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-[#2a2d35] rounded-full transition-colors text-[#8e9299] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-6 flex flex-col gap-4">
            {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-[#8e9299]">{s.desc}</span>
                    <div className="flex gap-1">
                        {s.keys.map((k, j) => (
                            <kbd key={j} className="px-2 py-1 bg-[#1f2128] border border-[#2a2d35] rounded text-xs font-mono text-white shadow-sm">
                                {k}
                            </kbd>
                        ))}
                    </div>
                </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
