import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  Layers, 
  GripVertical, 
  CheckSquare, 
  Square,
  Sliders,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { useVisualsLab } from '../../core/contexts/VisualsLabContext';
import { sysLog } from '../../lib/sys';

export default function SceneSidebar() {
  const { project, selectedSceneId, setSelectedSceneId, onUpdate } = useVisualsLab();
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedBulkIds, setSelectedBulkIds] = useState<string[]>([]);
  
  // Bulk motion parameters
  const [bulkIntensity, setBulkIntensity] = useState<number>(5);
  const [bulkEasing, setBulkEasing] = useState<string>('Linear');

  const handleToggleSelectAll = () => {
    if (selectedBulkIds.length === project.scenes.length) {
      setSelectedBulkIds([]);
    } else {
      setSelectedBulkIds(project.scenes.map(s => s.id));
    }
  };

  const handleToggleSelectScene = (sceneId: string) => {
    setSelectedBulkIds(prev => 
      prev.includes(sceneId) 
        ? prev.filter(id => id !== sceneId) 
        : [...prev, sceneId]
    );
  };

  const handleBulkApply = () => {
    if (selectedBulkIds.length === 0) {
      sysLog('Bulk operation cancelled: No scene nodes selected.', 'warn');
      return;
    }

    const updatedScenes = project.scenes.map(scene => {
      if (selectedBulkIds.includes(scene.id)) {
        return {
          ...scene,
          motionIntensity: bulkIntensity,
          motionEasing: bulkEasing
        };
      }
      return scene;
    });

    onUpdate({
      ...project,
      scenes: updatedScenes
    });

    sysLog(`Bulk applied [Intensity: ${bulkIntensity}, Easing: ${bulkEasing}] to ${selectedBulkIds.length} scene nodes.`, 'info');
    setBulkMode(false);
    setSelectedBulkIds([]);
  };

  return (
    <motion.aside layout className="h-full flex flex-col overflow-hidden bg-surface-variant/10 rounded-3xl border border-outline-variant/50">
      {/* Storyline Header */}
      <div className="p-5 border-b border-outline-variant bg-surface-variant/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Storyline</h3>
        </div>
        
        <button
          onClick={() => {
            setBulkMode(!bulkMode);
            setSelectedBulkIds([]);
          }}
          className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
            bulkMode 
              ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20' 
              : 'border-outline-variant hover:bg-surface-variant/30 text-on-surface-variant'
          }`}
          title="Bulk edit motion parameters"
          id="btn-bulk-mode-toggle"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Bulk</span>
        </button>
      </div>

      {/* Bulk Processing Toolbox Panel */}
      <AnimatePresence>
        {bulkMode && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-outline-variant/50 bg-primary/5"
            id="panel-bulk-controls"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-black text-on-surface-variant">
                <span>Bulk motion attributes</span>
                <button 
                  onClick={handleToggleSelectAll}
                  className="text-primary hover:underline hover:scale-105 active:scale-95 transition-transform"
                >
                  {selectedBulkIds.length === project.scenes.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Intensity Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-on-surface">
                  <span className="opacity-70">Motion Intensity:</span>
                  <span className="font-mono text-primary text-[11px]">{bulkIntensity}</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={bulkIntensity}
                  onChange={(e) => setBulkIntensity(parseInt(e.target.value))}
                  className="w-full h-1 bg-surface-variant/50 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Easing Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-on-surface opacity-70 block">Interpolation Curve:</label>
                <select 
                  value={bulkEasing}
                  onChange={(e) => setBulkEasing(e.target.value)}
                  className="w-full px-3 py-2 bg-surface/90 border border-outline-variant rounded-xl text-xs font-medium text-on-surface outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="Linear">Linear</option>
                  <option value="Ease In">Ease In</option>
                  <option value="Ease Out">Ease Out</option>
                  <option value="Ease In Out">Ease In Out</option>
                  <option value="Bounce">Bounce</option>
                </select>
              </div>

              <button
                onClick={handleBulkApply}
                disabled={selectedBulkIds.length === 0}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-on-primary text-[10px] font-black uppercase tracking-widest shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Apply to {selectedBulkIds.length} Nodes</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Storyline Scene List Nodes */}
      <Reorder.Group 
        axis="y" 
        values={project.scenes} 
        onReorder={(newScenes) => onUpdate({ ...project, scenes: newScenes })}
        className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 relative"
      >
        <AnimatePresence>
          {project.scenes.map((scene, idx) => {
            const isSelectedForBulk = selectedBulkIds.includes(scene.id);
            const isHighlightedActive = selectedSceneId === scene.id;

            return (
              <Reorder.Item
                value={scene}
                key={scene.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="relative rounded-2xl"
              >
                {/* Checkbox trigger overlay when bulkMode is activated */}
                <div className="relative group">
                  <div className={`w-full rounded-2xl transition-all duration-300 border relative overflow-hidden flex items-stretch ${
                    isHighlightedActive && !bulkMode
                      ? 'bg-secondary-container text-on-secondary-container border-secondary shadow-sm scale-[1.02]' 
                      : isSelectedForBulk && bulkMode
                      ? 'bg-primary/5 text-on-surface border-primary shadow-sm'
                      : 'border-outline-variant bg-surface-variant/5 hover:bg-surface-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}>
                    
                    {/* Bulk select check column */}
                    {bulkMode && (
                      <button 
                        onClick={() => handleToggleSelectScene(scene.id)}
                        className="p-4 pr-2 border-r border-outline-variant/30 flex items-center justify-center text-primary transition-colors hover:bg-primary/5"
                        id={`chk-bulk-${scene.id}`}
                      >
                        {isSelectedForBulk ? (
                          <CheckSquare className="w-5 h-5 text-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-on-surface-variant/40 hover:text-primary transition-colors" />
                        )}
                      </button>
                    )}

                    {/* Standard details block */}
                    <button
                      onClick={() => !bulkMode && setSelectedSceneId(scene.id)}
                      className="flex-1 text-left p-4 pointer-events-auto"
                      disabled={bulkMode}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black tracking-widest uppercase ${
                          isHighlightedActive && !bulkMode ? 'text-on-secondary-container' : 'text-primary'
                        }`}>
                          Node {idx + 1}
                        </span>
                        
                        <div className="flex gap-1.5 items-center">
                          {scene.imageUrl && (
                            <ImageIcon className={`w-3.5 h-3.5 ${isHighlightedActive && !bulkMode ? 'text-on-secondary-container' : 'text-secondary'}`} />
                          )}
                          {scene.videoUrl && (
                            <Video className={`w-3.5 h-3.5 ${isHighlightedActive && !bulkMode ? 'text-on-secondary-container' : 'text-primary'}`} />
                          )}
                          {!bulkMode && (
                            <div className="ml-2 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100">
                              <GripVertical className="w-4 h-4 text-on-surface-variant" />
                            </div>
                          )}
                        </div>
                      </div>

                      <p className={`text-xs font-semibold line-clamp-2 leading-relaxed ${
                        isHighlightedActive && !bulkMode ? 'text-on-secondary-container' : 'text-on-surface-variant'
                      }`}>
                        {scene.description.split('.')[0]}
                      </p>

                      {/* Attribute tag badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {scene.motionIntensity && (
                          <span className="px-1.5 py-0.5 rounded bg-surface/80 border border-outline-variant/30 text-[8px] font-mono font-bold tracking-tight uppercase text-on-surface-variant">
                            Motion: {scene.motionIntensity}
                          </span>
                        )}
                        {scene.motionEasing && (
                          <span className="px-1.5 py-0.5 rounded bg-surface/80 border border-outline-variant/30 text-[8px] font-mono font-bold tracking-tight uppercase text-on-surface-variant">
                            Curve: {scene.motionEasing}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>
    </motion.aside>
  );
}
