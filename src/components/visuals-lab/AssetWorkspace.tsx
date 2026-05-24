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
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { useVisualsLab } from '../../core/contexts/VisualsLabContext';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { useProjectStore } from '../../core/store/useProjectStore';
import { sysLog } from '../../lib/sys';
import { PostProcessingEffects, getFilterString, getVignetteStyle, COLOR_GRADES, TRANSITIONS } from '../../lib/visualUtils';
import VideoPreview from './VideoPreview';
import TransitionSelector from '../TransitionSelector';

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
  const [activeSceneThumbTransitionIdx, setActiveSceneThumbTransitionIdx] = useState<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
  const [dropIndicatorPos, setDropIndicatorPos] = useState<'before' | 'after' | null>(null);
  const [isAnalyzingMetadata, setIsAnalyzingMetadata] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [visualVariations, setVisualVariations] = useState<string[]>([]);
  const [isSuggestingTransition, setIsSuggestingTransition] = useState(false);
  const [isRefiningVision, setIsRefiningVision] = useState(false);
  const [autoPlayPreview, setAutoPlayPreview] = useState(true);
  const [splitView, setSplitView] = useState(false);
  const [globalApply, setGlobalApply] = useState(false);
  
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
      setActiveSceneThumbTransitionIdx(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeScene) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-on-surface-variant bg-surface rounded-[2rem] border border-outline-variant/30 shadow-sm transition-colors duration-300">
        <div className="w-20 h-20 rounded-full bg-surface-variant/20 flex items-center justify-center mb-6">
          <Zap className="w-10 h-10 opacity-30" />
        </div>
        <h3 className="text-xl font-bold text-on-surface mb-2">Neural Node Staging</h3>
        <p className="max-w-[280px] text-center text-sm font-medium opacity-60">Select a scene from the sequence to begin visual synthesis.</p>
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

  useEffect(() => {
    setVisualVariations([]);
  }, [activeScene?.id]);

  const updateActiveScene = (updates: Partial<typeof activeScene>) => {
    createSnapshot(project.id); // Guard state before mutation
    onUpdate({
      ...project,
      scenes: project.scenes.map(s => s.id === activeScene.id ? { ...s, ...updates } : s)
    });
  };

  const updatePostProcessing = (updates: Partial<PostProcessingEffects>) => {
    const newEffects = { ...(activeScene.postProcessing || {}), ...updates };
    
    createSnapshot(project.id);
    if (globalApply) {
        onUpdate({
            ...project,
            scenes: project.scenes.map(s => ({
                ...s,
                postProcessing: { ...(s.postProcessing || {}), ...updates }
            }))
        });
        sysLog('Global Post-Processing Matrix Applied to Sequence', 'info');
    } else {
        updateActiveScene({ postProcessing: newEffects });
    }
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
          activeScene.motionIntensity || 5,
          activeScene.motionEasing || 'Linear',
          activeScene.motionType || 'Pan'
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

  const generateVariations = async () => {
    if (isGeneratingVariations) return;
    setIsGeneratingVariations(true);
    setVisualVariations([]);
    try {
        const provider = getAIProviderInstance();
        const variations = await provider.generateVisualVariations(
            activeScene.description,
            activeScene.narrationText || '',
            project.idea
        );
        setVisualVariations(variations);
    } catch (e: any) {
        alert(`Failed to generate variations: ${e.message}`);
    } finally {
        setIsGeneratingVariations(false);
    }
  };

  const autoSuggestTransition = async (currentIdx: number) => {
    if (currentIdx >= project.scenes.length - 1 || isSuggestingTransition) return;
    setIsSuggestingTransition(true);
    try {
        const provider = getAIProviderInstance();
        const suggestion = await provider.suggestTransition(
            project.scenes[currentIdx].description,
            project.scenes[currentIdx + 1].description
        );
        createSnapshot(project.id);
        const newScenes = [...project.scenes];
        newScenes[currentIdx] = { ...newScenes[currentIdx], transition: suggestion };
        onUpdate({ ...project, scenes: newScenes });
    } catch (e: any) {
        alert(`Failed to suggest transition: ${e.message}`);
    } finally {
        setIsSuggestingTransition(false);
    }
  };

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

  const analyzeMetadata = async () => {
    if (isAnalyzingMetadata) return;
    setIsAnalyzingMetadata(true);
    try {
      const provider = getAIProviderInstance();
      const result = await provider.analyzeSceneMetadata(
        activeScene.description,
        activeScene.narrationText || ''
      );
      updateActiveScene({ metadataSuggestions: result.suggestions });
    } catch (e: any) {
        alert(`Analysis failed: ${e.message}`);
    } finally {
        setIsAnalyzingMetadata(false);
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

  const autoGenerateMissingVisuals = async () => {
    if (isGenerating) return;
    setIsGenerating('auto_generating_missing');
    sysLog('Auto-filling missing vision visuals...', 'info');
    try {
        const provider = getAIProviderInstance();
        const directive = await provider.analyzeVisualConsistency(project);
        
        const newScenes = [...project.scenes];
        let updated = false;

        for (let i = 0; i < newScenes.length; i++) {
            const s = newScenes[i];
            if (!s.imageUrl) {
                sysLog(`Auto-generating visual for scene ${s.id.slice(0, 8)}`, 'info');
                const style = s.imageStyle ?? 'Cinematic';
                const prompt = style !== 'None' ? `Style: ${style}. ${directive}. ${s.description}` : `${directive}. ${s.description}`;
                try {
                    const imageUrl = await provider.generateImage(prompt);
                    newScenes[i] = { ...s, imageUrl };
                    updated = true;
                } catch (err: any) {
                    sysLog(`Failed to auto-generate for scene ${s.id.slice(0, 8)}: ${err.message}`, 'error');
                }
            }
        }

        if (updated) {
            onUpdate({ ...project, scenes: newScenes });
            sysLog('Auto-generation of missing visuals complete.', 'info');
        } else {
            alert('No missing visuals found or all generations failed.');
        }

    } catch (e: any) {
        alert(`Auto Generation Failed: ${e.message}`);
    } finally {
        setIsGenerating(null);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface rounded-[2rem] border border-outline-variant/50 relative shadow-sm transition-colors duration-300">
      <AnimatePresence mode="wait">
        <motion.div 
          layout
          key={activeScene.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col h-full absolute inset-0"
        >
          {/* Header Controls */}
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-variant/10 border-b border-outline-variant/30 z-10">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-on-surface leading-tight">Visual Node</h4>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-mono opacity-60">UUID: {activeScene.id.slice(0, 8)}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
                {history[project.id]?.length > 0 && (
                    <button 
                        onClick={handleUndo}
                        className="p-2.5 bg-surface-variant/20 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        title="Restore previous state"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                )}
                <button 
                    onClick={autoGenerateMissingVisuals}
                    disabled={!!isGenerating}
                    className="m3-button-tonal py-2 px-4 flex items-center gap-2"
                    title="Generate all missing visuals"
                >
                    {isGenerating === 'auto_generating_missing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    <span className="text-sm font-bold">Auto Fill</span>
                </button>
                <button 
                    onClick={applyGlobalStyle}
                    disabled={!!isGenerating}
                    className="m3-button-tonal py-2 px-4 flex items-center gap-2"
                    title="Enforce visual consistency"
                >
                    {isGenerating === 'global_analysis' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span className="text-sm font-bold">Project Sync</span>
                </button>
                
                <div className="h-8 w-px bg-outline-variant mx-1 opacity-50" />
                
                <div className="relative" ref={styleDropdownRef}>
                    <button
                        onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                        className="bg-secondary-container/30 text-on-secondary-container py-2 px-4 rounded-xl flex items-center gap-2 hover:bg-secondary-container/50 transition-colors text-sm font-bold"
                    >
                        <Palette className="w-4 h-4" />
                        <span>{STYLES.find(s => s.id === activeScene.imageStyle)?.label || 'Cinematic'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isStyleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isStyleDropdownOpen && (
                          <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-2xl shadow-2xl z-[100] border border-outline-variant overflow-hidden"
                          >
                              <div className="p-2 grid grid-cols-1 gap-1">
                                {STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => { updateActiveScene({ imageStyle: style.id }); setIsStyleDropdownOpen(false); }}
                                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${activeScene.imageStyle === style.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface'}`}
                                    >
                                        <span className="text-xl">{style.icon}</span>
                                        <div className="flex flex-col">
                                          <span className="text-sm font-bold">{style.label}</span>
                                          <span className="text-[10px] opacity-60 line-clamp-1">{style.desc}</span>
                                        </div>
                                    </button>
                                ))}
                              </div>
                          </motion.div>
                      )}
                    </AnimatePresence>
                </div>
                
                <button 
                  onClick={generateImage} 
                  disabled={!!isGenerating} 
                  className="m3-button-primary py-2 px-6 flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                    {isGenerating === activeScene.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span className="text-sm font-bold uppercase tracking-widest leading-none pt-0.5">Generate</span>
                </button>
            </div>
          </div>

          <div className="flex-1 p-6 md:p-10 flex flex-col gap-10 overflow-y-auto custom-scrollbar bg-surface/50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Inputs Column */}
                <div className="space-y-8">
                    {/* Visual Concept Block */}
                    <div className="bg-surface-variant/10 rounded-3xl p-6 border border-outline-variant/30 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pl-1">
                                Visual Architecture
                            </label>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={generateVariations}
                                    disabled={isGeneratingVariations}
                                    className="text-[11px] font-bold text-primary flex items-center gap-1.5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    {isGeneratingVariations ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>}
                                    Variations
                                </button>
                                <button 
                                    onClick={expandDescription}
                                    disabled={isRefining}
                                    className="text-[11px] font-bold text-tertiary flex items-center gap-1.5 hover:bg-tertiary/10 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    {isRefining ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                    Refine Logic
                                </button>
                            </div>
                        </div>
                        <textarea 
                            value={activeScene.description}
                            onChange={(e) => {
                                const text = e.target.value;
                                const desc = text.toLowerCase();
                                const extractedTags: string[] = [];
                                
                                if (desc.includes('portrait') || desc.includes('face')) extractedTags.push('Portrait');
                                if (desc.includes('landscape') || desc.includes('mountain') || desc.includes('nature') || desc.includes('ocean')) extractedTags.push('Landscape');
                                if (desc.includes('interior') && desc.includes('cinematic')) extractedTags.push('Cinematic Interior');
                                else if (desc.includes('interior') || desc.includes('room') || desc.includes('inside')) extractedTags.push('Interior');
                                if (desc.includes('close-up') || desc.includes('macro') || desc.includes('close up')) extractedTags.push('Close-up');
                                if (desc.includes('wide') || desc.includes('panorama') || desc.includes('establishing')) extractedTags.push('Wide Angle');
                                if (desc.includes('neon') || desc.includes('cyberpunk') || desc.includes('sci-fi')) extractedTags.push('Cyberpunk');
                                if (desc.includes('dark') || desc.includes('shadow') || desc.includes('night')) extractedTags.push('Dark/Night');

                                updateActiveScene({ description: text, tags: extractedTags });
                            }}
                            className="w-full h-40 bg-surface/40 border border-outline-variant/50 rounded-2xl p-4 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none leading-relaxed transition-all"
                            placeholder="Describe the visual essence..."
                        />
                        <div className="space-y-2 mt-2">
                            <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest pl-1">Classifier Keywords</label>
                            <input 
                                type="text"
                                value={activeScene.metadataSuggestions || ''}
                                onChange={(e) => updateActiveScene({ metadataSuggestions: e.target.value })}
                                placeholder="Comma-separated keywords (e.g. cinematic, aerial, cyberpunk)"
                                className="w-full bg-surface/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-xs font-bold text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-on-surface-variant/30"
                            />
                        </div>
                        {activeScene.tags && activeScene.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 p-2 bg-surface/20 rounded-xl">
                                {activeScene.tags.map(tag => (
                                    <span key={tag} className="text-[9px] font-black uppercase text-secondary tracking-widest bg-secondary/10 px-2 py-1 rounded-full border border-secondary/20">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        <AnimatePresence>
                          {visualVariations.length > 0 && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-3 mt-4"
                              >
                                  <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-widest pl-1">Generated Variations</span>
                                  {visualVariations.map((v, i) => (
                                      <button 
                                          key={i}
                                          onClick={() => { updateActiveScene({ description: v }); setVisualVariations([]); }}
                                          className="w-full text-left p-4 bg-surface/60 border border-outline-variant/30 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all text-sm leading-relaxed text-on-surface-variant group"
                                      >
                                          <div className="flex items-center justify-between mb-2">
                                              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Option {i+1}</span>
                                              <span className="text-[9px] font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity">USE DATA</span>
                                          </div>
                                          {v}
                                      </button>
                                  ))}
                              </motion.div>
                          )}
                        </AnimatePresence>
                    </div>

                    {/* Metadata Suggestions Block */}
                    <div className="bg-surface-variant/5 rounded-3xl p-6 border border-outline-variant/20">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pl-1">
                                Metadata Analysis
                            </label>
                            <button 
                                onClick={analyzeMetadata}
                                disabled={isAnalyzingMetadata}
                                className="text-[11px] font-bold text-secondary-container hover:bg-secondary-container/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                            >
                                {isAnalyzingMetadata ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sliders className="w-3 h-3"/>}
                                Analyze
                            </button>
                        </div>
                        <div className="p-4 bg-surface/30 rounded-2xl italic text-sm text-on-surface-variant leading-relaxed opacity-80">
                            "{activeScene.narrationText || 'No narration bound to this node.'}"
                        </div>
                        
                        <AnimatePresence>
                          {activeScene.metadataSuggestions && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4 p-4 bg-secondary-container/10 border border-secondary-container/20 rounded-2xl"
                              >
                                  <p className="text-[10px] font-black text-secondary-container uppercase tracking-widest mb-2">AI Node Suggestion</p>
                                  <p className="text-sm font-medium text-on-secondary-container/80 whitespace-pre-wrap leading-relaxed">{activeScene.metadataSuggestions}</p>
                              </motion.div>
                          )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Preview & Effects Column */}
                <div className="space-y-8">
                    {/* Visual Stage */}
                    <div className="relative group rounded-3xl overflow-hidden bg-black aspect-video shadow-2xl border border-outline-variant/30">
                        {activeScene.videoUrl ? (
                            <VideoPreview url={activeScene.videoUrl} poster={activeScene.imageUrl} effects={activeScene.postProcessing} autoPlay={autoPlayPreview} splitView={splitView} />
                        ) : activeScene.imageUrl ? (
                            <div className="w-full h-full relative overflow-hidden group">
                                {splitView ? (
                                    <div className="flex w-full h-full relative">
                                        <div className="w-1/2 h-full overflow-hidden border-r-2 border-primary relative z-20">
                                            <img 
                                                src={activeScene.imageUrl} 
                                                className="w-[200%] max-w-none h-full object-cover" 
                                                referrerPolicy="no-referrer" 
                                                style={{ filter: 'none', objectPosition: 'left center' }}
                                            />
                                            <div className="absolute bottom-4 left-4 bg-black/60 px-2 py-1 rounded text-[10px] font-bold text-white tracking-widest">RAW</div>
                                        </div>
                                        <div className="w-1/2 h-full overflow-hidden relative">
                                            <img 
                                                src={activeScene.imageUrl} 
                                                className="w-[200%] max-w-none h-full object-cover -ml-[100%]" 
                                                referrerPolicy="no-referrer" 
                                                style={{ ...getPreviewFilter(), objectPosition: 'right center' }}
                                            />
                                            {activeScene.postProcessing?.grain && activeScene.postProcessing.grain > 0 && (
                                                <div 
                                                    className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] mix-blend-overlay"
                                                    style={{ 
                                                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                                        opacity: activeScene.postProcessing.grain * 0.15 
                                                    }}
                                                />
                                            )}
                                            {activeScene.postProcessing?.vignette && activeScene.postProcessing.vignette > 0 && (
                                                <div 
                                                    className="absolute inset-0 pointer-events-none transition-all duration-500"
                                                    style={getVignetteStyle(activeScene.postProcessing.vignette)}
                                                />
                                            )}
                                            <div className="absolute bottom-4 right-4 bg-primary/80 px-2 py-1 rounded text-[10px] font-bold text-white tracking-widest">PROCESSED</div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <img 
                                            src={activeScene.imageUrl} 
                                            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" 
                                            referrerPolicy="no-referrer" 
                                            style={getPreviewFilter()}
                                        />
                                        {/* Overlay Effects */}
                                        {activeScene.postProcessing?.grain && activeScene.postProcessing.grain > 0 && (
                                            <div 
                                                className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] mix-blend-overlay"
                                                style={{ 
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                                    opacity: activeScene.postProcessing.grain * 0.15 
                                                }}
                                            />
                                        )}
                                        {activeScene.postProcessing?.vignette && activeScene.postProcessing.vignette > 0 && (
                                            <div 
                                                className="absolute inset-0 pointer-events-none transition-all duration-500"
                                                style={getVignetteStyle(activeScene.postProcessing.vignette)}
                                            />
                                        )}
                                    </>
                                )}
                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <button className="p-3 bg-surface/80 backdrop-blur-md rounded-2xl text-on-surface hover:bg-surface transition-colors shadow-lg">
                                        <Maximize2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-surface-variant/5 flex flex-col items-center justify-center text-outline text-on-surface-variant/30">
                                <ImageIcon className="w-20 h-20 mb-4 opacity-10" />
                                <span className="text-xs font-black uppercase tracking-[0.4em]">Node Waiting for Data</span>
                            </div>
                        )}
                        
                        <AnimatePresence>
                          {isGenerating === activeScene.id || isGenerating?.includes('video') ? (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-surface/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-10 text-center"
                              >
                                  <div className="relative w-24 h-24 flex items-center justify-center">
                                      <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0 rounded-full border-4 border-primary/10 border-t-primary"
                                      />
                                      <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                                  </div>
                                  <h3 className="mt-8 text-xl font-bold text-on-surface">Synthesizing Visual Nodes</h3>
                                  <p className="mt-2 text-sm text-on-surface-variant font-medium opacity-60 uppercase tracking-widest">Optimizing AI Weights</p>
                              </motion.div>
                          ) : null}
                        </AnimatePresence>
                    </div>

                    {/* Post-Processing Panel */}
                    <div className="bg-surface-variant/5 rounded-[2.5rem] p-8 border border-outline-variant/20 relative group overflow-hidden transition-colors hover:bg-surface-variant/10">
                        <div className="flex items-center justify-between mb-10">
                            <label className="text-xs font-black text-on-surface uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  <Sliders className="w-4 h-4" />
                                </div>
                                Effect Matrix
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input type="checkbox" checked={splitView} onChange={(e) => setSplitView(e.target.checked)} className="peer sr-only" />
                                        <div className="w-8 h-4 bg-surface-variant/50 rounded-full peer-checked:bg-primary transition-colors border border-outline-variant/30"></div>
                                        <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-on-surface-variant rounded-full peer-checked:translate-x-4 peer-checked:bg-on-primary transition-transform shadow-sm"></div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">Split-View</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input type="checkbox" checked={globalApply} onChange={(e) => setGlobalApply(e.target.checked)} className="peer sr-only" />
                                        <div className="w-8 h-4 bg-surface-variant/50 rounded-full peer-checked:bg-primary transition-colors border border-outline-variant/30"></div>
                                        <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-on-surface-variant rounded-full peer-checked:translate-x-4 peer-checked:bg-on-primary transition-transform shadow-sm"></div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">Global Apply</span>
                                </label>
                                <button 
                                    onClick={() => {
                                        if (globalApply) {
                                            const updates = { brightness: 100, contrast: 100, saturation: 100, vignette: 0, colorGrade: 'Original', temperature: 50, grain: 0, chromaticAberration: 0, blurFx: 0 };
                                            onUpdate({
                                                ...project,
                                                scenes: project.scenes.map(s => ({
                                                    ...s,
                                                    motionIntensity: 5,
                                                    postProcessing: { ...(s.postProcessing || {}), ...updates }
                                                }))
                                            });
                                        } else {
                                            updateActiveScene({ motionIntensity: 5, postProcessing: { brightness: 100, contrast: 100, saturation: 100, vignette: 0, colorGrade: 'Original', temperature: 50, grain: 0, chromaticAberration: 0, blurFx: 0 } })
                                        }
                                    }}
                                    className="text-[10px] font-black text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest bg-surface/40 px-4 py-2 rounded-full border border-outline-variant/30"
                                >
                                    Reset Effects
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-4 mb-8">
                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest pl-1">Quick Style Setup</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Cinematic', brightness: 90, contrast: 110, grain: 20 },
                                    { label: 'Vintage', brightness: 105, contrast: 90, grain: 40 },
                                    { label: 'Moody Noir', brightness: 80, contrast: 120, grain: 30 },
                                    { label: 'Bright & Airy', brightness: 110, contrast: 95, grain: 0 },
                                ].map(style => (
                                    <button
                                        key={style.label}
                                        onClick={() => {
                                             if (globalApply) {
                                                onUpdate({
                                                    ...project,
                                                    scenes: project.scenes.map(s => ({
                                                        ...s,
                                                        postProcessing: { ...(s.postProcessing || {}), brightness: style.brightness, contrast: style.contrast, grain: style.grain }
                                                    }))
                                                });
                                            } else {
                                                updateActiveScene({ postProcessing: { ...(activeScene.postProcessing || {}), brightness: style.brightness, contrast: style.contrast, grain: style.grain } })
                                            }
                                        }}
                                        className="text-[10px] font-bold tracking-widest px-4 py-2 rounded-xl text-on-surface hover:bg-surface-variant bg-surface/50 border border-outline-variant/30 transition-colors uppercase"
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {/* Color Grade - Full Width Row */}
                            <div className="md:col-span-2 space-y-3 pb-4 border-b border-outline-variant/30">
                                <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest pl-1 flex items-center justify-between">
                                    <span>LUT Gradient Processor</span>
                                    <span className="text-primary font-mono bg-primary/5 px-2 py-0.5 rounded italic">{activeScene.postProcessing?.colorGrade || 'Original'}</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {COLOR_GRADES.slice(0, 8).map(grade => (
                                    <button 
                                      key={grade.name}
                                      onClick={() => updatePostProcessing({ colorGrade: grade.name })}
                                      className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${activeScene.postProcessing?.colorGrade === grade.name ? 'm3-button-primary border-primary' : 'bg-surface/50 border-outline-variant/50 hover:bg-surface-variant/30 text-on-surface-variant'}`}
                                    >
                                      {grade.name}
                                    </button>
                                  ))}
                                </div>
                            </div>

                            {/* Sliders UI - Responsive Grid */}
                            <EffectSlider 
                              label="Luminance" 
                              value={activeScene.postProcessing?.brightness ?? 100} 
                              min={50} max={150} 
                              onChange={(v: number) => updatePostProcessing({ brightness: v })} 
                            />
                            <EffectSlider 
                              label="Dynamic Range" 
                              value={activeScene.postProcessing?.contrast ?? 100} 
                              min={50} max={150} 
                              onChange={(v: number) => updatePostProcessing({ contrast: v })} 
                            />
                            <EffectSlider 
                              label="Chroma" 
                              value={activeScene.postProcessing?.saturation ?? 100} 
                              min={0} max={200} 
                              onChange={(v: number) => updatePostProcessing({ saturation: v })} 
                            />
                            <EffectSlider 
                              label="Kelvin Shift" 
                              value={activeScene.postProcessing?.temperature ?? 50} 
                              min={0} max={100} 
                              onChange={(v: number) => updatePostProcessing({ temperature: v })}
                              isTemp
                            />
                            <EffectSlider 
                              label="Vignette" 
                              value={activeScene.postProcessing?.vignette ?? 0} 
                              min={0} max={1} step={0.1}
                              onChange={(v: number) => updatePostProcessing({ vignette: v })} 
                            />
                            <EffectSlider 
                              label="Grain Density" 
                              value={activeScene.postProcessing?.grain ?? 0} 
                              min={0} max={1} step={0.1}
                              onChange={(v: number) => updatePostProcessing({ grain: v })} 
                            />
                            <EffectSlider 
                                label="Chromatic Aberration" 
                                value={activeScene.postProcessing?.chromaticAberration ?? 0} 
                                min={0} max={1} step={0.1}
                                onChange={(v: number) => updatePostProcessing({ chromaticAberration: v })} 
                            />
                            <EffectSlider 
                                label="Bokéh Blur" 
                                value={activeScene.postProcessing?.blurFx ?? 0} 
                                min={0} max={10} step={0.5}
                                onChange={(v: number) => updatePostProcessing({ blurFx: v })} 
                            />
                        </div>
                    </div>

                    {/* Quick Motion Controls - Card Layout */}
                    <div className="bg-primary-container/10 p-8 rounded-[2.5rem] border border-primary/20 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6">
                        <div className="space-y-4 xl:col-span-2">
                            <label className="text-[10px] font-black text-on-primary-container uppercase tracking-widest pl-1">Kinetic Profile</label>
                            <select 
                                value={activeScene.motionType || 'Dynamic'}
                                onChange={(e) => updateActiveScene({ motionType: e.target.value })}
                                className="w-full bg-surface/50 border border-primary/20 rounded-2xl px-4 py-3 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                            >
                                {['Dynamic', 'Orbit', 'Zoom In', 'Pan Left', 'Slow Pan', 'Static'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-4 xl:col-span-5">
                                <TransitionSelector
                                    currentTransition={activeScene.transition || 'Cut'}
                                    onSelect={(t) => updateActiveScene({ transition: t })}
                                    isSuggesting={isSuggestingTransition}
                                    onSuggest={() => autoSuggestTransition(project.scenes.findIndex(s => s.id === activeScene.id))}
                                />
                        </div>
                        <div className="space-y-2 xl:col-span-2">
                            <EffectSlider 
                                label="Motion Intensity" 
                                value={activeScene.motionIntensity || 5} 
                                min={1} max={10} 
                                onChange={(v: number) => updateActiveScene({ motionIntensity: v })} 
                            />
                            <div className="flex justify-between gap-2 mt-2">
                                <button onClick={() => updateActiveScene({ motionIntensity: 3 })} className="flex-1 py-1 rounded-full bg-surface-variant/30 hover:bg-surface-variant text-[9px] font-bold uppercase text-on-surface-variant transition-colors border border-outline-variant/30">Smooth</button>
                                <button onClick={() => updateActiveScene({ motionIntensity: 7 })} className="flex-1 py-1 rounded-full bg-surface-variant/30 hover:bg-surface-variant text-[9px] font-bold uppercase text-on-surface-variant transition-colors border border-outline-variant/30">Fast</button>
                                <button onClick={() => updateActiveScene({ motionIntensity: 10 })} className="flex-1 py-1 rounded-full bg-surface-variant/30 hover:bg-surface-variant text-[9px] font-bold uppercase text-on-surface-variant transition-colors border border-outline-variant/30">Intense</button>
                            </div>
                        </div>
                        <div className="space-y-4 xl:col-span-2">
                            <label className="text-[10px] font-black text-on-primary-container uppercase tracking-widest pl-1">Easing</label>
                            <div className="relative">
                              <select 
                                  value={activeScene.motionEasing || 'Linear'}
                                  onChange={(e) => updateActiveScene({ motionEasing: e.target.value })}
                                  className="w-full bg-surface/50 border border-primary/20 rounded-2xl px-4 py-3 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                              >
                                  {['Linear', 'Ease-In', 'Ease-Out', 'Ease-In-Out'].map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                        </div>
                        <div className="space-y-4 xl:col-span-1">
                            <label className="text-[10px] font-black text-on-primary-container uppercase tracking-widest pl-1">Duration (s)</label>
                            <input 
                                type="number"
                                min="1"
                                max="60"
                                value={activeScene.videoDuration || 4}
                                onChange={(e) => updateActiveScene({ videoDuration: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-full bg-surface/50 border border-primary/20 rounded-2xl px-4 py-2.5 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                        <div className="md:col-span-2 xl:col-span-12 pt-4 flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input type="checkbox" checked={autoPlayPreview} onChange={(e) => setAutoPlayPreview(e.target.checked)} className="peer sr-only" />
                                    <div className="w-10 h-6 bg-surface-variant/50 rounded-full peer-checked:bg-primary transition-colors border border-outline-variant/30"></div>
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-on-surface-variant rounded-full peer-checked:translate-x-4 peer-checked:bg-on-primary transition-transform shadow-sm"></div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">Auto-Play Preview</span>
                            </label>
                            <button 
                                onClick={generateVideo}
                                disabled={!!isGenerating || !activeScene.imageUrl}
                                className="m3-button-primary py-3 px-8 flex items-center gap-3 shadow-lg shadow-primary/20"
                            >
                                {isGenerating?.includes('video') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                                <span className="font-bold text-sm tracking-widest uppercase">Synthesize Motion</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline Strip - Advanced Node View */}
            <div className="mt-auto pt-8 border-t border-outline-variant/30">
                <div className="flex items-center justify-between mb-6 px-2">
                    <div className="flex items-center gap-4">
                        <h5 className="text-xs font-black uppercase text-on-surface-variant tracking-[0.3em]">Temporal Node Sequence</h5>
                        <div className="flex gap-1.5 grayscale opacity-30">
                          {[...Array(4)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-on-surface" />)}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-[9px] text-on-surface-variant font-black tracking-widest">SYNC_OK</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-secondary-container" />
                            <span className="text-[9px] text-on-surface-variant font-black tracking-widest">DRAFTING</span>
                        </div>
                    </div>
                </div>
                <Reorder.Group axis="x" values={project.scenes} onReorder={(newScenes) => onUpdate({ ...project, scenes: newScenes })} className="flex gap-4 overflow-x-auto pb-8 custom-scrollbar items-center px-4 -mx-4">
                    {project.scenes.map((s, idx) => {
                        const isActive = activeScene.id === s.id;
                        
                        return (
                            <Reorder.Item value={s} key={s.id} className="flex items-center gap-4 relative">
                                {idx > 0 && (
                                    <div className="flex flex-col items-center gap-2 min-w-[50px] relative" ref={activeTimelineTransitionIdx === idx ? timelineTransitionRef : null}>
                                        <button 
                                            onClick={() => setActiveTimelineTransitionIdx(activeTimelineTransitionIdx === idx ? null : idx)}
                                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
                                                activeTimelineTransitionIdx === idx 
                                                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/30 z-50' 
                                                    : 'bg-surface-variant/20 border border-outline-variant/30 text-on-surface-variant hover:border-primary/50 hover:bg-primary/10'
                                            }`}
                                        >
                                            <ArrowRightLeft className="w-4 h-4" />
                                            <AnimatePresence>
                                            {activeTimelineTransitionIdx !== idx && (
                                              <motion.div 
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="absolute -top-8 left-1/2 -translate-x-1/2 p-2 bg-surface border border-outline-variant rounded-xl hidden group-hover:block"
                                              >
                                                <span className="text-[8px] font-bold text-primary font-mono whitespace-nowrap uppercase tracking-widest">{s.transition || 'Cut'}</span>
                                              </motion.div>
                                            )}
                                            </AnimatePresence>
                                        </button>

                                        <AnimatePresence>
                                            {activeTimelineTransitionIdx === idx && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 w-48 bg-surface rounded-3xl shadow-2xl z-[100] border border-outline-variant overflow-hidden"
                                                >
                                                    <div className="p-4 border-b border-outline-variant/30 bg-surface-variant/10">
                                                        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Junction Node {idx}</span>
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 grid grid-cols-1 gap-1">
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
                                                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${s.transition === t.label ? 'bg-primary/10 text-primary' : 'hover:bg-surface-variant/50 text-on-surface-variant'}`}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold">{t.label}</span>
                                                                    <span className="text-[8px] opacity-40 font-mono italic">{t.icon}</span>
                                                                </div>
                                                                {s.transition === t.label && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                                
                                <div>
                                    <button
                                        onClick={() => setSelectedSceneId(s.id)}
                                        className={`flex-shrink-0 w-44 aspect-video rounded-3xl border-2 transition-all duration-300 relative overflow-hidden group/thumb cursor-grab active:cursor-grabbing ${
                                            isActive 
                                              ? 'border-primary scale-110 shadow-2xl shadow-primary/20 z-10' 
                                              : 'border-outline-variant/30 opacity-60 hover:opacity-100 hover:scale-105 saturate-0 hover:saturate-100'
                                        }`}
                                    >
                                        {s.imageUrl ? (
                                            <img src={s.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="w-full h-full bg-surface-variant/10 flex items-center justify-center">
                                              <span className="text-[10px] font-black text-on-surface-variant/40 tracking-widest uppercase">Node_{idx + 1}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none">
                                          <p className="text-[8px] font-bold text-white uppercase tracking-widest truncate">{s.description}</p>
                                        </div>
                                        <div className="absolute top-2 left-2 bg-surface/80 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-on-surface shadow-sm border border-outline-variant/30 group-hover/thumb:bg-primary group-hover/thumb:text-on-primary transition-colors pointer-events-none">
                                            N_{idx + 1}
                                        </div>
                                        {s.videoUrl && (
                                            <div className="absolute top-2 right-2 p-1.5 bg-primary rounded-lg shadow-lg pointer-events-none">
                                                <Video className="w-3 h-3 text-on-primary" />
                                            </div>
                                        )}
                                    </button>

                                    {isActive && idx > 0 && (
                                        <div className="absolute -bottom-4 right-0 z-40 scale-90 translate-y-2">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveSceneThumbTransitionIdx(activeSceneThumbTransitionIdx === idx ? null : idx);
                                                }}
                                                className="m3-button-tonal py-1.5 px-3 rounded-full flex items-center gap-2 shadow-xl"
                                            >
                                                <span className="text-[9px] font-black tracking-widest">{s.transition || 'Cut'}</span>
                                                <ArrowRightLeft className="w-3 h-3" />
                                            </button>

                                            <AnimatePresence>
                                                {activeSceneThumbTransitionIdx === idx && (
                                                    <motion.div 
                                                        onClick={(e) => e.stopPropagation()}
                                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                        className="absolute bottom-full right-0 mb-4 w-44 bg-surface rounded-[2rem] shadow-2xl z-[100] border border-outline-variant overflow-hidden"
                                                    >
                                                        <div className="p-4 border-b border-outline-variant/30 bg-surface-variant/10 text-center">
                                                            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Morph Node</span>
                                                        </div>
                                                        <div className="max-h-52 overflow-y-auto custom-scrollbar p-2 grid grid-cols-1 gap-1">
                                                            {TRANSITIONS.map(t => (
                                                                <button
                                                                    key={t.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const newScenes = project.scenes.map((scene, i) => 
                                                                            i === idx ? { ...scene, transition: t.label } : scene
                                                                        );
                                                                        onUpdate({ ...project, scenes: newScenes });
                                                                        setActiveSceneThumbTransitionIdx(null);
                                                                    }}
                                                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between ${s.transition === t.label ? 'bg-primary/10 text-primary' : 'hover:bg-surface-variant/50 text-on-surface-variant'}`}
                                                                >
                                                                    <span className="text-[11px] font-black">{t.label}</span>
                                                                    {s.transition === t.label && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function EffectSlider({ label, value, min, max, step = 1, onChange, isTemp = false }: any) {
  return (
    <div className="space-y-3 group/slider">
        <label className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest flex items-center justify-between transition-colors group-hover/slider:text-on-surface">
            <span>{label}</span>
            <span className="text-primary font-mono bg-primary/5 px-2 py-0.5 rounded italic">{value}{label.includes('%') || label === 'Luminance' || label === 'Dynamic Range' || label === 'Chroma' ? '%' : ''}</span>
        </label>
        <div className="relative flex items-center h-6">
          {isTemp ? (
            <div className="absolute inset-y-2 left-0 right-0 rounded-full bg-gradient-to-r from-blue-500 via-gray-300 to-orange-500 opacity-30 group-hover/slider:opacity-60 transition-opacity" />
          ) : (
            <div className="absolute inset-y-2 left-0 right-0 rounded-full bg-outline-variant/20 overflow-hidden">
               <motion.div 
                 className="h-full bg-primary/40"
                 animate={{ width: `${((value - min) / (max - min)) * 100}%` }}
               />
            </div>
          )}
          <input 
              type="range" min={min} max={max} step={step}
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="w-full relative z-10 accent-primary h-1 bg-transparent appearance-none cursor-pointer"
          />
        </div>
    </div>
  );
}
