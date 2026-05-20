import React from 'react';
import { Image as ImageIcon, Video, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVisualsLab } from '../../core/contexts/VisualsLabContext';
import { useDraggableList } from '../../core/hooks/useDraggableList';

export default function SceneSidebar() {
  const { project, selectedSceneId, setSelectedSceneId, onUpdate } = useVisualsLab();
  
  const {
    draggedItemId: draggedSceneId,
    dropTargetId,
    dropPosition,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    resetDragState,
    setDropTargetId,
    setDropPosition
  } = useDraggableList({
    items: project.scenes,
    idField: 'id',
    componentName: 'SceneSidebar',
    onReorder: (newScenes) => {
      onUpdate({
        ...project,
        scenes: newScenes
      });
    }
  });

  return (
    <aside className="h-full flex flex-col overflow-hidden bg-surface-variant/10 rounded-3xl border border-outline-variant/50">
      <div className="p-5 border-b border-outline-variant bg-surface-variant/20 flex items-center gap-3">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Storyline</h3>
      </div>
      <div 
        className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 relative"
        onDragOver={(e) => {
          e.preventDefault();
          if (e.target === e.currentTarget) {
            setDropTargetId(null);
            setDropPosition(null);
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDropTargetId(null);
            setDropPosition(null);
          }
        }}
        onDrop={(e) => {
          if (e.target === e.currentTarget) {
            handleDrop(null);
          }
        }}
      >
        {project.scenes.map((scene, idx) => (
          <React.Fragment key={scene.id}>
            <AnimatePresence>
              {dropTargetId === scene.id && dropPosition === 'before' && draggedSceneId !== scene.id && <M3SceneDropIndicator />}
            </AnimatePresence>

            <button
              draggable
              onDragStart={(e) => {
                (e.currentTarget as HTMLElement).classList.add('is-dragging');
                handleDragStart(e, scene.id);
              }}
              onDragOver={(e) => handleDragOver(e, scene.id)}
              onDrop={(e) => { e.stopPropagation(); handleDrop(scene.id); }}
              onDragEnd={(e) => {
                (e.currentTarget as HTMLElement).classList.remove('is-dragging');
                resetDragState();
              }}
              onClick={() => setSelectedSceneId(scene.id)}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border relative group overflow-hidden ${
                selectedSceneId === scene.id 
                  ? 'bg-secondary-container text-on-secondary-container border-secondary shadow-sm' 
                  : 'border-outline-variant bg-surface-variant/5 hover:bg-surface-variant/30 text-on-surface-variant hover:text-on-surface'
              } ${draggedSceneId === scene.id ? 'opacity-30 scale-95' : 'opacity-100'}`}
            >
              <div className={`flex items-center justify-between mb-2 transition-opacity ${draggedSceneId === scene.id ? 'opacity-0' : 'opacity-100'}`}>
                <span className={`text-[10px] font-bold tracking-widest uppercase ${selectedSceneId === scene.id ? 'text-on-secondary-container' : 'text-primary'}`}>
                   Node {idx + 1}
                </span>
                <div className="flex gap-1.5">
                  {scene.imageUrl && <ImageIcon className="w-3.5 h-3.5 text-secondary" />}
                  {scene.videoUrl && <Video className="w-3.5 h-3.5 text-primary" />}
                </div>
              </div>
              <p className={`text-xs font-medium line-clamp-2 transition-opacity ${draggedSceneId === scene.id ? 'opacity-0' : 'opacity-100'} ${selectedSceneId === scene.id ? 'text-on-secondary-container' : 'text-on-surface-variant'}`}>
                {scene.description.split('.')[0]}
              </p>
              
              {draggedSceneId === scene.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/30 animate-pulse">Relocating</span>
                </div>
              )}
            </button>

            <AnimatePresence>
              {dropTargetId === scene.id && dropPosition === 'after' && draggedSceneId !== scene.id && <M3SceneDropIndicator />}
            </AnimatePresence>
          </React.Fragment>
        ))}
      </div>
    </aside>
  );
}

function M3SceneDropIndicator() {
  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 12, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="w-full flex items-center justify-center"
    >
      <div className="w-full h-1 bg-primary/40 rounded-full animate-pulse mx-4 shadow-[0_0_8px_rgba(var(--primary),0.2)]" />
    </motion.div>
  );
}
