import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video, 
  CheckCircle2,
  Download,
  Keyboard,
  ArrowRight,
  ArrowLeft,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoProject } from '../core/domain/types';
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
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(project.scenes[0]?.id || null);
  const [timelineZoom, setTimelineZoom] = useState<number>(1.0);

  useEffect(() => {
    setLastSaved(new Date());
  }, [project]);

  const steps = [
    { id: 'orchestrator', label: 'Script', icon: FileText },
    { id: 'visuals', label: 'Visuals', icon: ImageIcon },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'export', label: 'Export', icon: Video },
  ] as const;

  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

  useKeyBindings({
    'Ctrl+s': () => {
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
    <div className="flex flex-col h-full bg-background transition-colors duration-300">
       {/* Top Navigation */}
       <header className="h-16 flex items-center justify-between px-6 bg-surface border-b border-outline-variant flex-shrink-0 z-10 w-full">
        <div className="flex items-center gap-4 w-1/4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-surface-variant rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h2 className="font-bold text-on-surface truncate max-w-[200px] leading-tight">{project.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">
                {activeStep}
              </span>
              <div className="w-1 h-1 rounded-full bg-outline-variant" />
              <span className="text-[10px] text-on-surface-variant font-medium">Last saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-4">
            <div className="flex flex-col gap-1 w-full relative group">
                <div className="flex justify-between items-center text-[10px] uppercase font-black text-on-surface-variant tracking-widest absolute -top-5 w-full">
                    <span>0:00</span>
                    <div className="flex items-center gap-1.5 bg-surface/85 px-2 py-0.5 rounded-lg border border-outline-variant/30 select-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomOut className="w-3 h-3 cursor-pointer text-primary hover:scale-125 transition-transform" onClick={() => setTimelineZoom(prev => Math.max(0.5, prev - 0.25))} />
                      <input 
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={timelineZoom}
                        onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-surface-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
                        title="Zoom Timeline"
                      />
                      <ZoomIn className="w-3 h-3 cursor-pointer text-primary hover:scale-125 transition-transform" onClick={() => setTimelineZoom(prev => Math.min(3.0, prev + 0.25))} />
                      <span className="font-mono text-[8px] tracking-tight">{Math.round(timelineZoom * 100)}%</span>
                    </div>
                    <span>Total Length: {project.scenes.reduce((acc, s) => acc + (s.videoDuration || 4), 0)}s</span>
                </div>
                <div className="w-full overflow-x-auto no-scrollbar py-1">
                  <div 
                    style={{ width: `${timelineZoom * 100}%`, minWidth: '100%' }}
                    className="h-2 bg-surface-variant/30 rounded-full flex overflow-hidden transition-all duration-300"
                  >
                      {project.scenes.map((s, i) => {
                          const totalDuration = project.scenes.reduce((acc, cur) => acc + (cur.videoDuration || 4), 0) || 1;
                          const duration = s.videoDuration || 4;
                          const percentage = (duration / totalDuration) * 100;
                          const isSelected = selectedSceneId === s.id;
                          return (
                              <div 
                                  key={s.id} 
                                  style={{ width: `${percentage}%` }}
                                  className={`h-full border-r border-background/50 relative group/timeline cursor-pointer transition-all ${activeStep === 'visuals' && isSelected ? 'bg-primary shadow-[0_0_12px_rgba(var(--primary),0.8)]' : activeStep === 'visuals' ? 'bg-primary/40 hover:bg-primary/60' : 'bg-primary/40'}`}
                                  onClick={() => {
                                      if (activeStep === 'visuals') setSelectedSceneId(s.id);
                                  }}
                              >
                                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 opacity-0 group-hover/timeline:opacity-100 transition-opacity pointer-events-none flex flex-col items-center">
                                      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-xl p-1 w-32">
                                          {s.imageUrl ? (
                                              <img src={s.imageUrl} className="w-full aspect-video object-cover rounded-lg" alt="Thumbnail" referrerPolicy="no-referrer" />
                                          ) : (
                                              <div className="w-full aspect-video bg-surface-variant rounded-lg flex items-center justify-center text-[8px] text-on-surface-variant">No Image</div>
                                          )}
                                          <div className="text-[10px] text-center font-bold font-mono mt-1 pt-1 border-t border-outline-variant/30 text-on-surface">{duration}s</div>
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 w-1/4 justify-end">
          <button 
            onClick={() => setShowShortcuts(true)}
            className="p-3 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
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
            className="m3-button-tonal scale-90"
          >
            <Download className="w-4 h-4 mr-2" />
            <span>JSON Backup</span>
          </button>
        </div>
      </header>

      {/* Material Progress Rails */}
      <div className="bg-surface border-b border-outline-variant px-8 py-3 flex items-center justify-center gap-1 overflow-x-auto no-scrollbar">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;
          const isCompleted = idx < currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setActiveStep(step.id)}
                className={`relative flex flex-col items-center gap-1.5 px-6 py-2 transition-all min-w-[100px] group`}
              >
                <div className={`w-14 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-secondary-container text-on-secondary-container' : 
                  'bg-transparent text-on-surface-variant group-hover:bg-surface-variant/40'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-secondary" /> : <Icon className="w-5 h-5" />}
                  {isActive && (
                    <motion.div 
                      layoutId="active-step-indicator"
                      className="absolute inset-0 bg-secondary-container rounded-full -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
                <span className={`text-[11px] font-bold tracking-wide transition-colors ${
                  isActive ? 'text-on-surface' : 'text-on-surface-variant'
                }`}>
                  {step.label}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div className="w-8 h-px bg-outline-variant" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full overflow-y-auto custom-scrollbar p-4 lg:p-6"
          >
            <div className="max-w-7xl mx-auto min-h-full">
               <div className="m3-card bg-surface/40 shadow-none border border-outline-variant min-h-[calc(100vh-250px)]">
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
                     selectedSceneId={selectedSceneId}
                     setSelectedSceneId={setSelectedSceneId}
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
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Help / Shortcuts Dialog (M3) */}
      <AnimatePresence>
        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="m3-card w-full max-w-sm bg-surface overflow-hidden flex flex-col p-8 rounded-3xl"
            >
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="p-4 bg-primary-container text-on-primary-container rounded-2xl">
                  <Keyboard className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-2xl text-on-surface">Shortcuts</h3>
              </div>
              
              <div className="space-y-4 px-2">
                 <ShortcutItem label="Next Step" kbd="Right Arrow" />
                 <ShortcutItem label="Previous Step" kbd="Left Arrow" />
                 <ShortcutItem label="Save Project" kbd="Ctrl + S" />
                 <ShortcutItem label="Exit Back" kbd="Escape" />
              </div>

              <button 
                onClick={() => setShowShortcuts(false)}
                className="m3-button-primary mt-10 w-full"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShortcutItem({ label, kbd }: { label: string, kbd: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-outline-variant last:border-0 text-sm">
      <span className="text-on-surface-variant font-medium">{label}</span>
      <kbd className="bg-surface-variant font-mono px-3 py-1 rounded-lg text-xs text-on-surface-variant border border-outline-variant shadow-sm">{kbd}</kbd>
    </div>
  );
}
