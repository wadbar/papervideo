import React, { createContext, useContext, ReactNode } from 'react';
import { VideoProject, Scene } from '../domain/types';

interface VisualsLabContextType {
  project: VideoProject;
  activeScene: Scene | undefined;
  activeIndex: number;
  selectedSceneId: string | null;
  setSelectedSceneId: (id: string | null) => void;
  isGenerating: string | null;
  setIsGenerating: (id: string | null) => void;
  onUpdate: (project: VideoProject) => void;
}

const VisualsLabContext = createContext<VisualsLabContextType | undefined>(undefined);

export function VisualsLabProvider({ 
  children, 
  project, 
  onUpdate,
  selectedSceneId,
  setSelectedSceneId,
  isGenerating,
  setIsGenerating
}: VisualsLabContextType & { children: ReactNode }) {
  const activeScene = project.scenes.find(s => s.id === selectedSceneId);
  const activeIndex = project.scenes.findIndex(s => s.id === selectedSceneId);

  return (
    <VisualsLabContext.Provider value={{ 
      project, 
      activeScene, 
      activeIndex, 
      selectedSceneId, 
      setSelectedSceneId, 
      isGenerating, 
      setIsGenerating, 
      onUpdate 
    }}>
      {children}
    </VisualsLabContext.Provider>
  );
}

export function useVisualsLab() {
  const context = useContext(VisualsLabContext);
  if (context === undefined) {
    throw new Error('useVisualsLab must be used within a VisualsLabProvider');
  }
  return context;
}
