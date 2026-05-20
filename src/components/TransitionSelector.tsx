import React from 'react';
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
import { motion } from 'motion/react';

interface TransitionSelectorProps {
  currentTransition: string;
  onSelect: (transition: string) => void;
  isSuggesting?: boolean;
  onSuggest?: () => void;
}

const TRANSITIONS = [
  { id: 'Cut', icon: Scissors, description: 'Instant cut between scenes' },
  { id: 'Fade Through Black', icon: Layers, description: 'Classic cinematic fade' },
  { id: 'Cross Dissolve', icon: Ghost, description: 'Smooth atmospheric blend' },
  { id: 'Zoom Blur', icon: Maximize, description: 'Dynamic movement punch' },
  { id: 'Glitch', icon: Cpu, description: 'Digital distortion effect' },
  { id: 'Slide', icon: Move, description: 'Directional push transition' },
  { id: 'Light Leak', icon: Zap, description: 'Organic lens flare overlap' },
  { id: 'Morph', icon: RotateCw, description: 'AI-driven seamless blend' }
];

export default function TransitionSelector({ currentTransition, onSelect, isSuggesting, onSuggest }: TransitionSelectorProps) {
  return (
    <div className="space-y-4">
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
          
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left group ${
                isSelected 
                  ? 'bg-primary/10 border-primary shadow-sm' 
                  : 'bg-surface border-outline-variant/30 hover:border-outline-variant hover:bg-surface-variant/30'
              }`}
            >
              <div className={`p-2 rounded-lg mb-2 transition-colors ${
                isSelected ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant group-hover:text-primary'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[11px] font-bold block ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                {t.id}
              </span>
              <span className="text-[9px] font-medium text-on-surface-variant opacity-60 leading-tight mt-0.5">
                {t.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
