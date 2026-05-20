import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, X, Command, MoveUp, MoveDown, CornerDownLeft } from 'lucide-react';

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
    { keys: ['Shift', '?'], desc: 'Global Help Protocol' },
    { keys: ['Cmd', 'Enter'], desc: 'Execute Neural Cycle' },
    { keys: ['ArrowDown'], desc: 'Vector Forward' },
    { keys: ['ArrowUp'], desc: 'Vector Backward' },
    { keys: ['Esc'], desc: 'Abort Active Sequence' }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-md">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-surface w-full max-w-lg flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl border border-outline-variant/30"
        >
          <div className="px-8 py-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                <Keyboard className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-black tracking-tight text-on-surface">System Shortcuts</h3>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60">Input Vector Mapping</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-surface-variant rounded-full transition-all active:scale-90">
              <X className="w-6 h-6 text-on-surface-variant" />
            </button>
          </div>
          
          <div className="p-10 flex flex-col gap-6 relative">
            <div className="absolute inset-0 bg-primary/2 pointer-events-none" />
            
            {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between group">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-sm font-black text-on-surface group-hover:text-primary transition-colors">{s.desc}</span>
                       <span className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">Protocol_{String(i+1).padStart(2, '0')}</span>
                    </div>
                    <div className="flex gap-2">
                        {s.keys.map((k, j) => (
                            <kbd key={j} className="min-w-[40px] px-3 py-2 bg-surface-variant/30 border border-outline-variant/40 rounded-xl text-xs font-black font-mono text-on-surface shadow-sm flex items-center justify-center transition-all group-hover:border-primary/40 group-hover:scale-110">
                                {k === 'Cmd' ? <Command className="w-3.5 h-3.5" /> : 
                                 k === 'ArrowDown' ? <MoveDown className="w-3.5 h-3.5" /> :
                                 k === 'ArrowUp' ? <MoveUp className="w-3.5 h-3.5" /> : 
                                 k === 'Enter' ? <CornerDownLeft className="w-3.5 h-3.5" /> :
                                 k}
                            </kbd>
                        ))}
                    </div>
                </div>
            ))}
          </div>

          <div className="px-10 py-8 bg-surface-variant/10 border-t border-outline-variant/20 flex items-center justify-center">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40">Press ESC to disengage menu</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
