import React, { useRef, useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  RefreshCw, 
  Loader2,
  Sparkles,
  Zap,
  Palette,
  ChevronDown,
  Wind,
  Maximize2,
  Undo2,
  Sun,
  Contrast as ContrastIcon,
  Sliders,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVisualsLab } from '../../core/contexts/VisualsLabContext';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { useProjectStore } from '../../core/store/useProjectStore';
import { sysLog } from '../../lib/sys';

import { PostProcessingEffects, getFilterString, getVignetteStyle, COLOR_GRADES, TRANSITIONS } from '../../lib/visualUtils';

import VideoPreview from './VideoPreview';

export default function AssetWorkspace() {
  const { 
    project, 
    activeScene, 
    selectedSceneId, 
    setSelectedSceneId,
    isGenerating, 
    setIsGenerating, 
    onUpdate 
  } = useVisualsLab();
  
  const { getAIProviderInstance } = useSettingsStore();
  const { createSnapshot, restoreLastSnapshot, history } = useProjectStore();
  const [isRefining, setIsRefining] = useState(false);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [isMotionDropdownOpen, setIsMotionDropdownOpen] = useState(false);
  const [isTransitionDropdownOpen, setIsTransitionDropdownOpen] = useState(false);
  const [activeTimelineTransitionIdx, setActiveTimelineTransitionIdx] = useState<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
  const [dropIndicatorPos, setDropIndicatorPos] = useState<'before' | 'after' | null>(null);
  
  const styleDropdownRef = useRef<HTMLDivElement>(null);
  const motionDropdownRef = useRef<HTMLDivElement>(null);
  const transitionDropdownRef = useRef<HTMLDivElement>(null);
  const timelineTransitionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target as Node)) setIsStyleDropdownOpen(false);
      if (motionDropdownRef.current && !motionDropdownRef.current.contains(event.target as Node)) setIsMotionDropdownOpen(false);
      if (transitionDropdownRef.current && !transitionDropdownRef.current.contains(event.target as Node)) setIsTransitionDropdownOpen(false);
      if (timelineTransitionRef.current && !timelineTransitionRef.current.contains(event.target as Node)) setActiveTimelineTransitionIdx(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeScene) {
    return (
      <div className="lg:col-span-3 hardware-card flex flex-col items-center justify-center text-[#4e515a] bg-[#0d0d0f]">
        <Zap className="w-12 h-12 mb-4 opacity-10" />
        <p>Select a scene from the left to start generating assets.</p>
      </div>
    );
  }

  const STYLES = [
    { id: 'Cinematic', label: 'Cinematic', desc: 'Dramatic lighting, professional film look', icon: '🎬' },
    { id: 'Anime', label: 'Anime', desc: 'Vibrant colors, hand-drawn aesthetic', icon: '🎨' },
    { id: 'Photorealistic', label: 'Photorealistic', desc: 'Extreme detail, natural lighting', icon: '📷' },
    { id: '3D Render', label: '3D Render', desc: 'Octane render, volumetric lighting', icon: '🎮' },
    { id: 'Cyberpunk', label: 'Cyberpunk', desc: 'Neon lights, futuristic rainy city', icon: '🌃' },
    { id: 'Oil Painting', label: 'Oil Painting', desc: 'Rich textures, visible brushstrokes', icon: '🖌️' },
    { id: 'Sketch', label: 'Sketch', desc: 'Pencil drawing, artistic study', icon: '✏️' },
    { id: 'None', label: 'Original', desc: 'No specific style constraints', icon: '✨' },
  ];

  const updateActiveScene = (updates: Partial<typeof activeScene>) => {
    createSnapshot(project.id); // Guard state before mutation
    onUpdate({
      ...project,
      scenes: project.scenes.map(s => s.id === activeScene.id ? { ...s, ...updates } : s)
    });
  };

  const updatePostProcessing = (updates: Partial<PostProcessingEffects>) => {
    updateActiveScene({
      postProcessing: {
        ...(activeScene.postProcessing || {}),
        ...updates
      }
    });
  };

  const getPreviewFilter = () => {
    return { filter: getFilterString(activeScene.postProcessing) };
  };

  const handleUndo = () => {
    restoreLastSnapshot(project.id);
    sysLog('Temporal Restoration: Snapshot reloaded.', 'warn');
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
    sysLog(`Drag Start: Scene ${idx}`, 'info');
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null) return;
    
    // Determine if we are on the left or right half of the element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isBefore = x < rect.width / 2;
    
    setDropTargetIdx(idx);
    setDropIndicatorPos(isBefore ? 'before' : 'after');
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null) return;

    let finalIdx = targetIdx;
    if (dropIndicatorPos === 'after') finalIdx += 1;
    
    // Adjust if dragging from before target
    if (draggedIdx < finalIdx) finalIdx -= 1;
    
    if (draggedIdx !== finalIdx) {
      const newScenes = [...project.scenes];
      const [moved] = newScenes.splice(draggedIdx, 1);
      newScenes.splice(finalIdx, 0, moved);
      onUpdate({ ...project, scenes: newScenes });
      sysLog(`Reorder Committed: ${draggedIdx} -> ${finalIdx}`, 'info');
    }

    setDraggedIdx(null);
    setDropTargetIdx(null);
    setDropIndicatorPos(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDropTargetIdx(null);
    setDropIndicatorPos(null);
  };

  const generateImage = async () => {
    if (isGenerating) return;
    setIsGenerating(activeScene.id);
    sysLog(`Init Image Synth: ${activeScene.id.slice(0, 8)}`, 'info');
    try {
      const provider = getAIProviderInstance();
      const style = activeScene.imageStyle ?? 'Cinematic';
      const prompt = style !== 'None' ? `Style: ${style}. ${activeScene.description}` : activeScene.description;
      const imageUrl = await provider.generateImage(prompt);
      updateActiveScene({ imageUrl });
      sysLog(`Asset Synced: Image OK for ${activeScene.id.slice(0, 8)}`, 'info');
    } catch (e: any) {
        sysLog(`Synth Critical: ${e.message}`, 'error');
        alert(`Generation Failed: ${e.message}`);
    } finally {
        setIsGenerating(null);
    }
  };

  const generateVideo = async () => {
    if (isGenerating || !activeScene.imageUrl) return;
    setIsGenerating(activeScene.id + '_video');
    sysLog(`Init Video Motion: ${activeScene.id.slice(0, 8)} [Intensity: ${activeScene.motionIntensity || 5}]`, 'info');
    try {
      const provider = getAIProviderInstance();
      const videoUrl = await provider.generateVideo(
          activeScene.description, 
          activeScene.imageUrl, 
          activeScene.videoDuration || 4, 
          activeScene.motionIntensity || 5
      );
      updateActiveScene({ videoUrl });
      sysLog(`Asset Synced: Video OK for ${activeScene.id.slice(0, 8)}`, 'info');
    } catch (e: any) {
        sysLog(`Motion Critical: ${e.message}`, 'error');
        alert(`Video Generation Failed: ${e.message}`);
    } finally {
        setIsGenerating(null);
    }
  };

                {/* Removed unused refinePrompt */}

  const expandDescription = async () => {
    if (isRefining) return;
    setIsRefining(true);
    try {
      const provider = getAIProviderInstance();
      const expanded = await provider.expandVisualDescription(
        activeScene.description,
        activeScene.narrationText || '',
        project.idea,
        activeScene.imageStyle || 'Cinematic'
      );
      updateActiveScene({ description: expanded });
    } catch (e: any) {
        alert(`Expansion failed: ${e.message}`);
    } finally {
        setIsRefining(false);
    }
  };

  const applyGlobalStyle = async () => {
    if (isGenerating) return;
    setIsGenerating('global_analysis');
    try {
        const provider = getAIProviderInstance();
        const directive = await provider.analyzeVisualConsistency(project);
        // Apply this directive to all scenes without image
        const newScenes = project.scenes.map(s => {
            if (!s.imageUrl) {
                return { ...s, description: `${directive}. ${s.description}` };
            }
            return s;
        });
        onUpdate({ ...project, scenes: newScenes });
        alert("Global Visual Directive Applied to all drafting scenes!");
    } catch (e: any) {
        alert(`Global Analysis Failed: ${e.message}`);
    } finally {
        setIsGenerating(null);
    }
  };

  return (
    <div className="lg:col-span-3 hardware-card flex flex-col overflow-hidden bg-[#0d0d0f] relative">
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeScene.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col h-full absolute inset-0"
        >
          {/* Header Controls */}
          <div className="p-6 border-b border-[#2a2d35] flex items-center justify-between bg-[#151619] z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h4 className="font-bold">Scene Processor</h4>
                    <p className="text-[10px] text-[#8e9299] uppercase tracking-widest font-mono">ID: {activeScene.id.slice(0, 8)}</p>
                </div>
            </div>
            <div className="flex gap-2 items-center">
                {history[project.id]?.length > 0 && (
                    <button 
                        onClick={handleUndo}
                        className="p-2 bg-[#1f2128] border border-[#2a2d35] rounded-lg text-[#8e9299] hover:text-white hover:border-orange-500/50 transition-all"
                        title="Restore previous state (Snapshot)"
                    >
                        <Undo2 className="w-3.5 h-3.5" />
                    </button>
                )}
                <button 
                    onClick={applyGlobalStyle}
                    disabled={!!isGenerating}
                    className="px-3 py-2 bg-[#1f2128] border border-blue-500/30 rounded-lg text-blue-400 text-xs font-bold flex items-center gap-2 hover:bg-[#252832] transition-all"
                    title="Analyze whole project for visual consistency"
                >
                    {isGenerating === 'global_analysis' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    Global Sync
                </button>
                <div className="h-6 w-px bg-[#2a2d35] mx-1" />
                <div className="relative" ref={styleDropdownRef}>
                    <button
                        onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                        className="bg-[#1f2128] border border-[#2a2d35] hover:border-blue-500/50 hover:bg-[#252832] rounded-lg px-3 py-2 text-xs flex items-center gap-2 transition-all font-medium text-gray-300"
                    >
                        <Palette className="w-3.5 h-3.5 text-blue-400" />
                        <span>{STYLES.find(s => s.id === activeScene.imageStyle)?.label || 'Cinematic'}</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    {isStyleDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-[#1f2128] border border-[#2a2d35] rounded-xl shadow-2xl z-50 overflow-hidden">
                            {STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => { updateActiveScene({ imageStyle: style.id }); setIsStyleDropdownOpen(false); }}
                                    className="w-full text-left p-3 hover:bg-[#252832] flex items-center gap-3 text-xs"
                                >
                                    <span>{style.icon}</span>
                                    <span>{style.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={expandDescription} disabled={isRefining} className="px-4 py-2 bg-[#1f2128] border border-[#2a2d35] rounded-lg text-purple-400 text-sm font-bold flex items-center gap-2">
                    {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Refine Visuals
                </button>
                <button onClick={generateImage} disabled={!!isGenerating} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all text-white">
                    {isGenerating === activeScene.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gen Image'}
                </button>
            </div>
          </div>

          {/* Quick Scene Params Row */}
          <div className="px-6 py-4 flex items-center justify-between gap-4 bg-[#1a1b1e] border-b border-[#2a2d35]">
              <div className="flex items-center gap-6">
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#4e515a] uppercase tracking-widest">Motion Profile</label>
                    <select 
                        value={activeScene.motionType || 'Dynamic'}
                        onChange={(e) => updateActiveScene({ motionType: e.target.value })}
                        className="bg-[#0d0d0f] border border-[#2a2d35] rounded px-2 py-1 text-[10px] text-blue-400 font-mono outline-none focus:border-blue-500"
                    >
                        {['Dynamic', 'Orbit', 'Zoom In', 'Pan Left', 'Slow Pan', 'Static'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#4e515a] uppercase tracking-widest">Transition</label>
                    <div className="relative" ref={transitionDropdownRef}>
                        <button
                            onClick={() => setIsTransitionDropdownOpen(!isTransitionDropdownOpen)}
                            className="bg-[#0d0d0f] border border-[#2a2d35] rounded px-2 py-[2.5px] text-[10px] text-blue-400 font-mono outline-none focus:border-blue-500 flex items-center gap-2 min-w-[80px]"
                        >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>{activeScene.transition || 'Cut'}</span>
                        </button>
                        {isTransitionDropdownOpen && (
                            <div className="absolute left-0 top-full mt-2 w-32 bg-[#1f2128] border border-[#2a2d35] rounded-lg shadow-2xl z-50 overflow-hidden">
                                {TRANSITIONS.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => { updateActiveScene({ transition: t.label }); setIsTransitionDropdownOpen(false); }}
                                        className={`w-full text-left px-3 py-2 hover:bg-[#252832] text-[10px] transition-colors flex items-center justify-between ${activeScene.transition === t.label ? 'text-blue-400 bg-blue-400/5' : 'text-gray-300'}`}
                                    >
                                        <span>{t.label}</span>
                                        <span className="text-[8px] opacity-30 font-mono">{t.icon}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#4e515a] uppercase tracking-widest">Intensity</label>
                    <input 
                        type="range" min="1" max="10" 
                        value={activeScene.motionIntensity || 5}
                        onChange={(e) => updateActiveScene({ motionIntensity: parseInt(e.target.value) })}
                        className="w-24 accent-blue-500"
                    />
                </div>
              </div>
              <button 
                onClick={generateVideo}
                disabled={!!isGenerating || !activeScene.imageUrl}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1f2128] border border-[#2a2d35] hover:border-blue-500/50 rounded-lg text-xs font-bold text-gray-300 transition-all disabled:opacity-30"
              >
                  {isGenerating?.includes('video') ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                  <span>Gen Video</span>
              </button>
          </div>

          <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs Column */}
                <div className="space-y-4">
                    <div className="p-4 bg-[#151619] border border-[#2a2d35] rounded-xl relative group">
                        <label className="text-[10px] font-bold text-[#4e515a] uppercase mb-2 block tracking-widest flex items-center justify-between">
                            <span>Visual Concept</span>
                            <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">AI-POWERED_REFINEMENT_ACTIVE</span>
                        </label>
                        <textarea 
                            value={activeScene.description}
                            onChange={(e) => updateActiveScene({ description: e.target.value })}
                            className="w-full h-32 bg-black/40 border border-[#2a2d35] rounded-lg p-3 text-sm focus:border-blue-400 outline-none resize-none font-medium text-gray-400 leading-relaxed italic"
                        />
                    </div>
                    <div className="p-4 bg-[#0d0d0f] border border-[#2a2d35] rounded-xl">
                        <label className="text-[10px] font-bold text-[#4e515a] uppercase mb-2 block tracking-widest">Narration Match</label>
                        <p className="text-xs text-[#8e9299] leading-relaxed line-clamp-4">"{activeScene.narrationText || 'No narration for this scene.'}"</p>
                    </div>

                    <div className="p-4 bg-[#151619] border border-[#2a2d35] rounded-xl space-y-4">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-[#4e515a] uppercase block tracking-widest flex items-center gap-2">
                                <Sliders className="w-3 h-3 text-blue-400" />
                                Post-Processing Module
                            </label>
                            <button 
                                onClick={() => updateActiveScene({ postProcessing: { brightness: 100, contrast: 100, saturation: 100, vignette: 0, colorGrade: 'Original', temperature: 50, grain: 0, chromaticAberration: 0 } })}
                                className="text-[9px] font-bold text-[#4e515a] hover:text-blue-400 transition-colors uppercase tracking-tighter"
                            >
                                [Reset_Nodes]
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                            <div className="space-y-1.5 col-span-2 pb-2 border-b border-[#2a2d35]/30">
                                <label className="text-[9px] font-bold text-[#4e515a] uppercase flex items-center justify-between">
                                    <span>Color Grading LUT</span>
                                    <span className="text-blue-400 font-mono text-[8px]">{activeScene.postProcessing?.colorGrade || 'Original'}</span>
                                </label>
                                <select 
                                    value={activeScene.postProcessing?.colorGrade || 'Original'}
                                    onChange={(e) => updatePostProcessing({ colorGrade: e.target.value })}
                                    className="w-full bg-[#0d0d0f] border border-[#2a2d35] rounded-lg px-3 py-2.5 text-[10px] text-gray-300 outline-none focus:border-blue-500 transition-all font-mono"
                                >
                                    {COLOR_GRADES.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-[#4e515a] uppercase flex items-center justify-between">
                                    <span>Brightness</span>
                                    <span className="text-blue-400 font-mono">{activeScene.postProcessing?.brightness || 100}%</span>
                                </label>
                                <input 
                                    type="range" min="50" max="150" 
                                    value={activeScene.postProcessing?.brightness || 100}
                                    onChange={(e) => updatePostProcessing({ brightness: parseInt(e.target.value) })}
                                    className="w-full accent-blue-500 h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-[#4e515a] uppercase flex items-center justify-between">
                                    <span>Contrast</span>
                                    <span className="text-blue-400 font-mono">{activeScene.postProcessing?.contrast || 100}%</span>
                                </label>
                                <input 
                                    type="range" min="50" max="150" 
                                    value={activeScene.postProcessing?.contrast || 100}
                                    onChange={(e) => updatePostProcessing({ contrast: parseInt(e.target.value) })}
                                    className="w-full accent-blue-500 h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-[#4e515a] uppercase flex items-center justify-between">
                                    <span>Saturation</span>
                                    <span className="text-blue-400 font-mono">{activeScene.postProcessing?.saturation || 100}%</span>
                                </label>
                                <input 
                                    type="range" min="0" max="200" 
                                    value={activeScene.postProcessing?.saturation || 100}
                                    onChange={(e) => updatePostProcessing({ saturation: parseInt(e.target.value) })}
                                    className="w-full accent-blue-500 h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-[#4e515a] uppercase flex items-center justify-between">
                                    <span>Temperature</span>
                                    <span className="text-blue-400 font-mono">{activeScene.postProcessing?.temperature || 50}</span>
                                </label>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={activeScene.postProcessing?.temperature ?? 50}
                                    onChange={(e) => updatePostProcessing({ temperature: parseInt(e.target.value) })}
                                    className="w-full h-1 bg-gradient-to-r from-blue-500 via-gray-400 to-orange-500 rounded-full appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-[#4e515a] uppercase flex items-center justify-between">
                                    <span>Vignette FX</span>
                                    <span className="text-blue-400 font-mono">{(activeScene.postProcessing?.vignette || 0).toFixed(1)}</span>
                                </label>
                                <input 
                                    type="range" min="0" max="1" step="0.1"
                                    value={activeScene.postProcessing?.vignette || 0}
                                    onChange={(e) => updatePostProcessing({ vignette: parseFloat(e.target.value) })}
                                    className="w-full accent-blue-500 h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-[#4e515a] uppercase flex items-center justify-between">
                                    <span>Film Grain</span>
                                    <span className="text-blue-400 font-mono">{(activeScene.postProcessing?.grain || 0).toFixed(1)}</span>
                                </label>
                                <input 
                                    type="range" min="0" max="1" step="0.1"
                                    value={activeScene.postProcessing?.grain || 0}
                                    onChange={(e) => updatePostProcessing({ grain: parseFloat(e.target.value) })}
                                    className="w-full accent-gray-400 h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1.5 col-span-2 pt-2 border-t border-[#2a2d35]/30">
                                <label className="text-[9px] font-bold text-[#4e515a] uppercase flex items-center justify-between">
                                    <span>Chromatic Aberration</span>
                                    <span className="text-blue-400 font-mono">{(activeScene.postProcessing?.chromaticAberration || 0).toFixed(1)}</span>
                                </label>
                                <input 
                                    type="range" min="0" max="1" step="0.1"
                                    value={activeScene.postProcessing?.chromaticAberration || 0}
                                    onChange={(e) => updatePostProcessing({ chromaticAberration: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="flex flex-col gap-4">
                    <div className="relative group">
                        {activeScene.videoUrl ? (
                            <VideoPreview url={activeScene.videoUrl} poster={activeScene.imageUrl} effects={activeScene.postProcessing} />
                        ) : activeScene.imageUrl ? (
                            <div className="aspect-video bg-[#050506] rounded-xl border-2 border-[#1f2128] overflow-hidden relative group shadow-2xl">
                                <img 
                                    src={activeScene.imageUrl} 
                                    className="w-full h-full object-cover transition-all duration-500" 
                                    referrerPolicy="no-referrer" 
                                    style={getPreviewFilter()}
                                />
                                {/* Grain Overlay on Static */}
                                {activeScene.postProcessing?.grain && activeScene.postProcessing.grain > 0 && (
                                    <div 
                                        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] mix-blend-overlay"
                                        style={{ 
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                            opacity: activeScene.postProcessing.grain * 0.15 
                                        }}
                                    />
                                )}
                                {/* Vignette on Image */}
                                {activeScene.postProcessing?.vignette && activeScene.postProcessing.vignette > 0 && (
                                    <div 
                                        className="absolute inset-0 pointer-events-none transition-all duration-500"
                                        style={getVignetteStyle(activeScene.postProcessing.vignette)}
                                    />
                                )}
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <button className="p-2 bg-black/60 rounded-lg hover:bg-black/90 text-white">
                                        <Maximize2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video bg-[#050506] rounded-xl border-2 border-[#1f2128] overflow-hidden relative group shadow-2xl flex flex-col items-center justify-center text-[#2a2d35]">
                                <ImageIcon className="w-12 h-12 mb-2 opacity-10" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Awaiting Generation</span>
                            </div>
                        )}
                        {isGenerating === activeScene.id || isGenerating?.includes('video') ? (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="relative w-16 h-16 flex items-center justify-center"
                                >
                                    <svg className="w-full h-full">
                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-[#1f2128]" />
                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-blue-500" strokeDasharray={175} strokeDashoffset={100} />
                                    </svg>
                                    <Sparkles className="absolute w-6 h-6 text-blue-400 animate-pulse" />
                                </motion.div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mt-4 animate-pulse">Synthesis in Progress</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Timeline Strip */}
            <div className="mt-auto border-t border-[#2a2d35] pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="text-[10px] uppercase font-bold text-[#4e515a] tracking-widest">Project Timeline Overview</h5>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-[8px] text-[#4e515a] font-bold">READY</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-[8px] text-[#4e515a] font-bold">GEN_VIDEO</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar items-center px-2">
                    {project.scenes.map((s, idx) => {
                        const isDragging = draggedIdx === idx;
                        const isDropTarget = dropTargetIdx === idx;
                        
                        return (
                            <React.Fragment key={s.id}>
                                {/* Drop Indicator BEFORE */}
                                {isDropTarget && dropIndicatorPos === 'before' && draggedIdx !== idx && draggedIdx !== idx - 1 && (
                                    <div className="w-1 h-20 bg-blue-500 rounded-full animate-pulse mx-1 flex-shrink-0" />
                                )}

                                {/* Transition Indicator BEFORE scene (except first) */}
                                {idx > 0 && !(isDropTarget && dropIndicatorPos === 'before') && (
                                    <div className="flex flex-col items-center gap-1 min-w-[40px] relative" ref={activeTimelineTransitionIdx === idx ? timelineTransitionRef : null}>
                                        <button 
                                            onClick={() => setActiveTimelineTransitionIdx(activeTimelineTransitionIdx === idx ? null : idx)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center group/trans relative transition-all ${
                                                activeTimelineTransitionIdx === idx 
                                                    ? 'bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                                                    : 'bg-[#151619] border border-[#2a2d35] hover:border-blue-500/50'
                                            }`}
                                        >
                                            <ArrowRightLeft className={`w-3 h-3 ${activeTimelineTransitionIdx === idx ? 'text-white' : 'text-[#4e515a] group-hover/trans:text-blue-400'}`} />
                                            
                                            {!activeTimelineTransitionIdx && (
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/trans:opacity-100 transition-opacity bg-black/90 px-1.5 py-0.5 rounded text-[8px] font-mono text-blue-400 border border-blue-500/30 whitespace-nowrap z-30">
                                                    {s.transition || 'Cut'}
                                                </div>
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {activeTimelineTransitionIdx === idx && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-36 bg-[#1f2128] border border-blue-500/30 rounded-xl shadow-2xl z-[100] overflow-hidden"
                                                >
                                                    <div className="p-2 border-b border-[#2a2d35] bg-[#151619]">
                                                        <span className="text-[8px] font-bold text-[#4e515a] uppercase tracking-widest pl-1">Junction Node {idx}</span>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                        {TRANSITIONS.map(t => (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => {
                                                                    const newScenes = project.scenes.map((scene, i) => 
                                                                        i === idx ? { ...scene, transition: t.label } : scene
                                                                    );
                                                                    onUpdate({ ...project, scenes: newScenes });
                                                                    setActiveTimelineTransitionIdx(null);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 hover:bg-blue-600/10 flex items-center justify-between group/item transition-colors ${s.transition === t.label ? 'bg-blue-600/5' : ''}`}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className={`text-[10px] font-bold ${s.transition === t.label ? 'text-blue-400' : 'text-gray-300 group-hover/item:text-white'}`}>{t.label}</span>
                                                                    <span className="text-[7px] text-[#4e515a] font-mono">{t.icon}</span>
                                                                </div>
                                                                {s.transition === t.label && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                                
                                <button
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDrop={(e) => handleDrop(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => setSelectedSceneId(s.id)}
                                    className={`flex-shrink-0 w-36 aspect-video rounded-lg border-2 transition-all relative overflow-hidden group cursor-grab active:cursor-grabbing ${
                                        activeScene.id === s.id ? 'border-blue-500 scale-105 shadow-xl shadow-blue-900/20' : 'border-[#1f2128] opacity-50 hover:opacity-100'
                                    } ${isDragging ? 'opacity-20 scale-95 grayscale' : ''}`}
                                >
                                    {s.imageUrl ? (
                                        <img src={s.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-[#0d0d0f] flex items-center justify-center text-[10px] font-bold text-[#1f2128]">S{idx + 1}</div>
                                    )}
                                    <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-white backdrop-blur-md z-10 pointer-events-none">
                                        {idx + 1}
                                    </div>
                                    {s.videoUrl && (
                                        <div className="absolute top-2 right-2 z-10 pointer-events-none">
                                            <Video className="w-3 h-3 text-blue-400" />
                                        </div>
                                    )}
                                    {activeScene.id === s.id && idx > 0 && (
                                        <div className="absolute bottom-2 right-2 z-20" onClick={(e) => e.stopPropagation()}>
                                            <select 
                                                value={s.transition || 'Cut'}
                                                onChange={(e) => {
                                                    const newScenes = project.scenes.map((scene, i) => 
                                                        i === idx ? { ...scene, transition: e.target.value } : scene
                                                    );
                                                    onUpdate({ ...project, scenes: newScenes });
                                                }}
                                                className="bg-[#151619]/90 text-blue-400 text-[9px] font-bold uppercase py-0.5 px-1 rounded outline-none border border-[#2a2d35] hover:border-blue-500/50 backdrop-blur-md cursor-pointer"
                                            >
                                                {TRANSITIONS.map(t => (
                                                    <option key={t.id} value={t.label}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {/* Drag Handle Indicator */}
                                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors pointer-events-none" />
                                </button>

                                {/* Drop Indicator AFTER */}
                                {isDropTarget && dropIndicatorPos === 'after' && draggedIdx !== idx && draggedIdx !== idx + 1 && (
                                    <div className="w-1 h-20 bg-blue-500 rounded-full animate-pulse mx-1 flex-shrink-0" />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
