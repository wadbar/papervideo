import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
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
}

export default function VisualsLab({ project, onUpdate, onPrev, onNext }: VisualsLabProps) {
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(project.scenes[0]?.id || null);
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
      <div className="flex flex-col h-full gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Visuals Lab</h2>
            <p className="text-[#8e9299] text-sm">Bring your scenes to life with AI images and video.</p>
          </div>
          <div className="flex gap-2">
              <button onClick={onPrev} className="px-4 py-2 bg-[#1f2128] hover:bg-[#252832] rounded-lg transition-colors flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Script</span>
              </button>
              <button onClick={onNext} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 text-white">
                  <span>Audio</span>
                  <ChevronRight className="w-4 h-4" />
              </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
          <SceneSidebar />
          <AssetWorkspace />
        </div>
      </div>
      <PerformanceMonitor />
    </VisualsLabProvider>
  );
}
