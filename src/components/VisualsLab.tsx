import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoProject } from '../core/domain/types';
import { useKeyBindings } from '../core/hooks/useKeyBindings';
import { VisualsLabProvider } from '../core/contexts/VisualsLabContext';
import SceneSidebar from './visuals-lab/SceneSidebar';
import AssetWorkspace from './visuals-lab/AssetWorkspace';
import PerformanceMonitor from './visuals-lab/PerformanceMonitor';

interface VisualsLabProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onPrev: () => void;
  onNext: () => void;
  selectedSceneId: string | null;
  setSelectedSceneId: (id: string | null) => void;
}

export default function VisualsLab({ project, onUpdate, onPrev, onNext, selectedSceneId, setSelectedSceneId }: VisualsLabProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const activeIndex = project.scenes.findIndex(s => s.id === selectedSceneId);

  useKeyBindings({
    'ArrowDown': () => {
       if (activeIndex < project.scenes.length - 1) setSelectedSceneId(project.scenes[activeIndex + 1].id);
    },
    'ArrowUp': () => {
       if (activeIndex > 0) setSelectedSceneId(project.scenes[activeIndex - 1].id);
    }
  });

  return (
    <VisualsLabProvider 
      project={project} 
      onUpdate={onUpdate} 
      selectedSceneId={selectedSceneId} 
      setSelectedSceneId={setSelectedSceneId}
      isGenerating={isGenerating}
      setIsGenerating={setIsGenerating}
      activeIndex={activeIndex}
      activeScene={project.scenes.find(s => s.id === selectedSceneId)}
    >
      <div className="flex flex-col h-full gap-6 transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-outline-variant/30">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <Palette className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-2xl font-bold tracking-tight text-on-surface">Visuals Lab</h2>
                <p className="text-on-surface-variant text-sm font-medium">Manifest high-performance visual nodes using optimized AI weights.</p>
             </div>
          </div>
          <div className="flex gap-2">
              <button 
                onClick={onPrev} 
                className="m3-button-tonal py-2 px-4 flex items-center gap-2"
              >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Script</span>
              </button>
              <button 
                onClick={onNext} 
                className="m3-button-primary py-2 px-6 flex items-center gap-2"
              >
                  <span>Audio</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
              </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
          <div className="lg:col-span-3 h-full overflow-hidden">
            <SceneSidebar />
          </div>
          <div className="lg:col-span-9 h-full overflow-hidden">
            <AssetWorkspace />
          </div>
        </div>
      </div>
      <PerformanceMonitor />
    </VisualsLabProvider>
  );
}
