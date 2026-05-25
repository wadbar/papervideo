import React, { useState } from 'react';
import { 
  ChevronRight, 
  RotateCw, 
  Zap, 
  Layers, 
  Maximize, 
  Ghost,
  Cpu,
  Move,
  Scissors
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransitionSelectorProps {
  currentTransition: string;
  onSelect: (transition: string) => void;
  isSuggesting?: boolean;
  onSuggest?: () => void;
}

const TRANSITIONS = [
  { id: 'Cut', icon: Scissors, description: 'Instant cut between scenes', gradient: 'from-blue-500 to-red-500' },
  { id: 'Fade Through Black', icon: Layers, description: 'Classic cinematic fade', gradient: 'from-slate-500 via-neutral-900 to-slate-400' },
  { id: 'Cross Dissolve', icon: Ghost, description: 'Smooth atmospheric blend', gradient: 'from-purple-500 to-pink-500' },
  { id: 'Zoom Blur', icon: Maximize, description: 'Dynamic movement punch', gradient: 'from-emerald-400 to-teal-600' },
  { id: 'Glitch', icon: Cpu, description: 'Digital distortion effect', gradient: 'from-rose-400 to-cyan-400' },
  { id: 'Slide', icon: Move, description: 'Directional push transition', gradient: 'from-orange-400 to-yellow-500' },
  { id: 'Light Leak', icon: Zap, description: 'Organic lens flare overlap', gradient: 'from-amber-200 via-orange-400 to-rose-500' },
  { id: 'Morph', icon: RotateCw, description: 'AI-driven seamless blend', gradient: 'from-fuchsia-400 to-violet-500' }
];

const PreviewFrameWrapper: React.FC<{ children: React.ReactNode; isHovered: boolean }> = ({ children, isHovered }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {children}
    </div>
  );
};

const EnhancedTransitionPreview: React.FC<{ type: string; isHovered: boolean }> = ({ type, isHovered }) => {
   const frameA = "bg-primary/20 border border-primary/30 text-primary";
   const frameB = "bg-secondary/20 border border-secondary/30 text-secondary";
   
   if (!isHovered) {
      return (
         <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-50 grayscale transition-all duration-500 group-hover:grayscale-0">
             <div className="w-1/3 h-1/2 bg-surface-variant rounded shadow-inner border border-outline-variant/30" />
             <div className="w-1/3 h-1/2 bg-surface-variant rounded shadow-inner border border-outline-variant/30" />
         </div>
      );
   }

   return (
      <PreviewFrameWrapper isHovered={isHovered}>
         {type === 'Cut' && (
             <div className="relative w-full h-full flex">
                 <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 1 }} className={`absolute inset-0 ${frameA}`} />
                 <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 1 }} className={`absolute inset-0 ${frameB}`} />
             </div>
         )}
         {type === 'Fade Through Black' && (
             <div className="relative w-full h-full">
                 <motion.div animate={{ opacity: [1, 0, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className={`absolute inset-0 ${frameA}`} />
                 <motion.div animate={{ opacity: [0, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className={`absolute inset-0 ${frameB}`} />
                 <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 bg-black" />
             </div>
         )}
         {type === 'Cross Dissolve' && (
             <div className="relative w-full h-full">
                 <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity }} className={`absolute inset-0 ${frameA}`} />
                 <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} className={`absolute inset-0 ${frameB}`} />
             </div>
         )}
         {type === 'Zoom Blur' && (
             <div className="relative w-full h-full perspective-1000">
                 <motion.div animate={{ scale: [1, 3], opacity: [1, 0], filter: ['blur(0px)', 'blur(10px)'] }} transition={{ duration: 1.2, repeat: Infinity }} className={`absolute inset-0 origin-center ${frameA}`} />
                 <motion.div animate={{ scale: [0.5, 1], opacity: [0, 1], filter: ['blur(10px)', 'blur(0px)'] }} transition={{ duration: 1.2, repeat: Infinity }} className={`absolute inset-0 origin-center ${frameB}`} />
             </div>
         )}
         {type === 'Slide' && (
             <div className="relative w-full h-full overflow-hidden">
                 <motion.div animate={{ x: ['0%', '-100%'] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }} className={`absolute inset-0 ${frameA}`} />
                 <motion.div animate={{ x: ['100%', '0%'] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }} className={`absolute inset-0 ${frameB}`} />
             </div>
         )}
         {type === 'Glitch' && (
             <div className="relative w-full h-full">
                 <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className={`absolute inset-0 ${frameA}`} />
                 <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className={`absolute inset-0 ${frameB}`} />
                 <motion.div animate={{ x: [-5, 5, -5, 0], skewX: [10, -10, 0], filter: ['hue-rotate(90deg)', 'hue-rotate(0deg)'] }} transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 1.3 }} className="absolute inset-0 mix-blend-overlay bg-rose-500/30" />
             </div>
         )}
         {type === 'Light Leak' && (
             <div className="relative w-full h-full">
                 <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity }} className={`absolute inset-0 ${frameA}`} />
                 <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} className={`absolute inset-0 ${frameB}`} />
                 <motion.div animate={{ x: ['-100%', '100%'], opacity: [0, 1, 0], scale: [1, 2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -inset-4 bg-orange-400/50 blur-2xl mix-blend-screen" />
             </div>
         )}
         {type === 'Morph' && (
             <div className="relative w-full h-full flex items-center justify-center">
                 <motion.div animate={{ borderRadius: ['0%', '50%', '0%'], scale: [1, 0.5, 1], rotate: [0, 90, 0] }} transition={{ duration: 2, repeat: Infinity }} className={`absolute inset-2 ${frameA} ${frameB}`} />
             </div>
         )}
      </PreviewFrameWrapper>
   );
};

export default function TransitionSelector({ currentTransition, onSelect, isSuggesting, onSuggest }: TransitionSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div id="transition-selector-panel" className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h4 className="text-xs font-black text-on-surface uppercase tracking-widest">Scene Transition</h4>
          <p className="text-[10px] text-on-surface-variant font-medium opacity-60">Visual flow between segments</p>
        </div>
        
        {onSuggest && (
          <button 
            onClick={onSuggest}
            disabled={isSuggesting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20 hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <ChevronRight className={`w-3.5 h-3.5 text-primary ${isSuggesting ? 'animate-spin' : ''}`} />
            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">AI Suggest</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TRANSITIONS.map((t) => {
          const Icon = t.icon;
          const isSelected = currentTransition === t.id;
          const isHovered = hoveredId === t.id;
          
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left group overflow-hidden relative ${
                isSelected 
                  ? 'bg-primary/5 border-primary shadow-sm ring-2 ring-primary/50 ring-offset-2 ring-offset-background' 
                  : 'bg-surface border-outline-variant/30 hover:border-outline-variant hover:bg-surface-variant/30'
              }`}
            >
              <div className="w-full h-16 rounded-lg mb-3 relative overflow-hidden flex items-center justify-center border border-outline-variant/20 bg-surface-variant/10 group-hover:bg-surface-variant/30 transition-colors">
                 <div className={`absolute inset-0 bg-gradient-to-tr ${t.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                 
                 <EnhancedTransitionPreview type={t.id} isHovered={isHovered} />

                 <div className={`relative z-10 p-1.5 rounded-lg backdrop-blur-md shadow-sm border transition-colors ${
                  isSelected ? 'bg-primary text-on-primary border-primary/50' : 'bg-surface/90 border-outline-variant/30 text-on-surface-variant group-hover:text-primary group-hover:border-primary/50'
                 }`}>
                   <Icon className="w-4 h-4" />
                 </div>
              </div>
              <span className={`text-xs font-black block mt-1 ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                {t.id}
              </span>
              <span className="text-[10px] font-medium text-on-surface-variant opacity-75 leading-snug mt-1 line-clamp-2">
                {t.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
