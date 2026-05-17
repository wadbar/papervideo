import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Lightbulb, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  Send,
  Wand2,
  Save,
  CheckCircle2,
  Download,
  Keyboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoProject, Scene } from '../core/domain/types';
import Orchestrator from './Orchestrator';
import VisualsLab from './VisualsLab';
import AudioBooth from './AudioBooth';
import VideoExporter from './VideoExporter';
import { useKeyBindings } from '../core/hooks/useKeyBindings';

interface VideoStudioProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onBack: () => void;
}

export default function VideoStudio({ project, onUpdate, onBack }: VideoStudioProps) {
  const [activeStep, setActiveStep] = useState<'orchestrator' | 'visuals' | 'audio' | 'export'>('orchestrator');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date(project.createdAt));

  useEffect(() => {
    setLastSaved(new Date());
  }, [project]);

  const steps = [
    { id: 'orchestrator', label: 'Script', icon: FileText },
    { id: 'visuals', label: 'Visuals', icon: ImageIcon },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'export', label: 'Factory', icon: Video },
  ] as const;

  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

  useKeyBindings({
    'Ctrl+s': () => {
      // It auto-saves, just show a flash feedback or update the "last saved" manually if we had one
      console.log('Saved');
    },
    'ArrowRight': () => {
       if (currentStepIndex < steps.length - 1) setActiveStep(steps[currentStepIndex + 1].id);
    },
    'ArrowLeft': () => {
       if (currentStepIndex > 0) setActiveStep(steps[currentStepIndex - 1].id);
    },
    'Escape': onBack
  });

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <header className="h-16 border-b border-[#2a2d35] bg-[#151619] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-[#1f2128] rounded-lg transition-colors text-[#8e9299] hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-4 w-[1px] bg-[#2a2d35]" />
          <h2 className="font-bold truncate max-w-[200px]">{project.title}</h2>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-blue-900/30 text-blue-400">
            {activeStep}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-[#8e9299] flex flex-col items-end mr-4">
            <span className="font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500"/> Auto-saved</span>
            <span className="text-[10px] opacity-70">Just now</span>
          </div>

          <button 
            onClick={() => setShowShortcuts(true)}
            className="flex flex-col items-center justify-center p-2 text-[#8e9299] hover:text-white transition-colors"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", `project-${project.id}.json`);
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            className="flex items-center gap-2 px-4 py-1.5 text-sm bg-[#1f2128] hover:bg-[#2a2d35] border border-[#2a2d35] rounded-lg transition-colors font-medium cursor-pointer shadow-lg active:scale-95"
            title="Download JSON Backup"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </header>

      {/* Step Progress */}
      <div className="bg-[#0e0e10] border-b border-[#2a2d35] px-8 py-4 flex items-center justify-center gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;
          const isCompleted = idx < currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 transition-all ${
                  isActive ? 'text-blue-400 scale-105' : 
                  isCompleted ? 'text-green-400' : 'text-[#4e515a]'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isActive ? 'border-blue-400 bg-blue-400/10' : 
                  isCompleted ? 'border-green-400 bg-green-400/10' : 'border-[#2a2d35]'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">{step.label}</span>
              </button>
              {idx < steps.length - 1 && (
                <div className={`h-[2px] w-12 rounded-full transition-colors ${
                  idx < currentStepIndex ? 'bg-green-400/50' : 'bg-[#2a2d35]'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-8"
          >
            <div className="max-w-7xl mx-auto h-full">
              {activeStep === 'orchestrator' && (
                <Orchestrator 
                  project={project} 
                  onUpdate={onUpdate} 
                  onNext={() => setActiveStep('visuals')}
                />
              )}
              {activeStep === 'visuals' && (
                <VisualsLab 
                  project={project} 
                  onUpdate={onUpdate} 
                  onPrev={() => setActiveStep('orchestrator')}
                  onNext={() => setActiveStep('audio')}
                />
              )}
              {activeStep === 'audio' && (
                <AudioBooth 
                  project={project} 
                  onUpdate={onUpdate} 
                  onPrev={() => setActiveStep('visuals')}
                  onNext={() => setActiveStep('export')}
                />
              )}
              {activeStep === 'export' && (
                <VideoExporter 
                  project={project} 
                  onUpdate={onUpdate} 
                  onPrev={() => setActiveStep('audio')}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="hardware-card w-full max-w-md bg-[#0a0a0b] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-[#2a2d35] bg-[#1f2128]">
                <h3 className="font-bold uppercase tracking-widest text-center text-blue-400 flex flex-col items-center gap-2">
                  <Keyboard className="w-6 h-6" />
                  Keyboard Shortcuts
                </h3>
              </div>
              <div className="p-6 space-y-4">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#8e9299]">Next Step</span>
                   <kbd className="bg-[#1f2128] font-mono px-2 py-1 rounded text-xs border border-[#2a2d35]">Right Arrow</kbd>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#8e9299]">Previous Step</span>
                   <kbd className="bg-[#1f2128] font-mono px-2 py-1 rounded text-xs border border-[#2a2d35]">Left Arrow</kbd>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#8e9299]">Save / Sync</span>
                   <kbd className="bg-[#1f2128] font-mono px-2 py-1 rounded text-xs border border-[#2a2d35]">Ctrl + S</kbd>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-[#8e9299]">Exit Project</span>
                   <kbd className="bg-[#1f2128] font-mono px-2 py-1 rounded text-xs border border-[#2a2d35]">Escape</kbd>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
