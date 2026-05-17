import React from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';
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
    <aside className="lg:col-span-1 hardware-card flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[#2a2d35] bg-[#1f2128]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#8e9299]">Storyline Scenes</h3>
      </div>
      <div 
        className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 relative"
        onDragOver={(e) => {
          e.preventDefault();
          // Clear drop highlights if hovering over the container background
          if (e.target === e.currentTarget) {
            setDropTargetId(null);
            setDropPosition(null);
          }
        }}
        onDragLeave={(e) => {
          // Only clear if we actually left the container, not just moved into a child
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
            {/* Insertion Indicator BEFORE */}
            <AnimatePresence>
              {dropTargetId === scene.id && dropPosition === 'before' && draggedSceneId !== scene.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, scaleX: 0.8 }}
                  animate={{ height: 10, opacity: 1, scaleX: 1 }}
                  exit={{ height: 0, opacity: 0, scaleX: 0.8 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                    opacity: { duration: 0.15 }
                  }}
                  className="w-full relative z-30 flex items-center justify-center my-1.5 group"
                >
                  <div className="absolute inset-x-0 h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                  <div className="absolute left-0 w-2 h-2 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  <div className="absolute right-0 w-2 h-2 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  <motion.div 
                    animate={{ width: ['0%', '100%'], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    className="absolute h-[6px] bg-blue-400/20 blur-sm rounded-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              draggable
              onDragStart={(e) => {
                (e.currentTarget as HTMLElement).classList.add('is-dragging');
                handleDragStart(e, scene.id);
              }}
              onDragOver={(e) => handleDragOver(e, scene.id)}
              onDrop={(e) => {
                e.stopPropagation();
                handleDrop(scene.id);
              }}
              onDragEnd={(e) => {
                (e.currentTarget as HTMLElement).classList.remove('is-dragging');
                resetDragState();
              }}
              onClick={() => setSelectedSceneId(scene.id)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-300 border relative group overflow-hidden ${
                selectedSceneId === scene.id 
                  ? 'bg-[#1f2128] border-blue-500/50 shadow-lg shadow-blue-500/10' 
                  : 'border-transparent hover:bg-[#1a1b1e] hover:border-[#2a2d35]'
              } ${
                draggedSceneId === scene.id 
                  ? 'is-dragging' 
                  : 'opacity-100'
              } ${
                dropTargetId === scene.id && draggedSceneId !== scene.id 
                  ? 'bg-blue-500/5 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                  : ''
              }`}
            >
              <div className={`flex items-center justify-between mb-1 transition-opacity ${draggedSceneId === scene.id ? 'opacity-0' : 'opacity-100'}`}>
                <span className="text-[10px] font-bold text-blue-400 tracking-tighter uppercase">Scene {idx + 1}</span>
                <div className="flex gap-1">
                  {scene.imageUrl && <ImageIcon className="w-3 h-3 text-green-400" />}
                  {scene.videoUrl && <Video className="w-3 h-3 text-blue-400" />}
                </div>
              </div>
              <p className={`text-xs text-white line-clamp-2 truncate transition-opacity ${draggedSceneId === scene.id ? 'opacity-0' : 'opacity-100'}`}>{scene.description.split('.')[0]}</p>
              
              {draggedSceneId === scene.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400/40">Relocating...</span>
                </div>
              )}
              
              {/* Drag Handle Accent */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="grid grid-cols-2 gap-0.5 opacity-20">
                    {[...Array(6)].map((_, i) => <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />)}
                 </div>
              </div>
            </button>

            {/* Insertion Indicator AFTER */}
            <AnimatePresence>
              {dropTargetId === scene.id && dropPosition === 'after' && draggedSceneId !== scene.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, scaleX: 0.8 }}
                  animate={{ height: 10, opacity: 1, scaleX: 1 }}
                  exit={{ height: 0, opacity: 0, scaleX: 0.8 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                    opacity: { duration: 0.15 }
                  }}
                  className="w-full relative z-30 flex items-center justify-center my-1.5 group"
                >
                  <div className="absolute inset-x-0 h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                  <div className="absolute left-0 w-2 h-2 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  <div className="absolute right-0 w-2 h-2 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  <motion.div 
                    animate={{ width: ['0%', '100%'], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    className="absolute h-[6px] bg-blue-400/20 blur-sm rounded-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </React.Fragment>
        ))}
      </div>
    </aside>
  );
}
