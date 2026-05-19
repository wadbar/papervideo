import React, { useState, useEffect, useRef } from 'react';
import { Wand2, Sparkles, Layout, FileText, ChevronRight, Loader2, ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { sysLog } from '../lib/sys';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { VideoProject } from '../core/domain/types';
import { useKeyBindings } from '../core/hooks/useKeyBindings';
import { useDraggableList } from '../core/hooks/useDraggableList';

interface OrchestratorProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onNext: () => void;
}

export default function Orchestrator({ project, onUpdate, onNext }: OrchestratorProps) {
  const [idea, setIdea] = useState(project.idea);
  const [tone, setTone] = useState(project.tone || 'engajador');
  const [targetAudience, setTargetAudience] = useState(project.targetAudience || 'geral');
  const [scriptLength, setScriptLength] = useState<'short' | 'medium' | 'long'>(project.scriptLength || 'medium');
  const [pacing, setPacing] = useState<'fast-paced' | 'conversational' | 'slow-burn'>(project.pacing || 'conversational');
  const [keywords, setKeywords] = useState(project.keywords?.join(', ') || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { getAIProviderInstance } = useSettingsStore();

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
    componentName: 'PaperCreeper_Orchestrator',
    onReorder: (newScenes) => {
      sysLog(`Executing positional shift: ${newScenes.length} scenes reorganized.`, 'info');
      onUpdate({
        ...project,
        scenes: newScenes
      });
    }
  });

  const handleRefine = async () => {
    if (!project.script || isGenerating || isRefining) return;
    setIsRefining(true);
    sysLog('Initializing script refinement process...', 'info');

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const aiProvider = getAIProviderInstance();
      const refinedScript = await aiProvider.refineScript(
        project.script,
        "Improve content, flow, and professional tone.",
        abortControllerRef.current.signal
      );
      onUpdate({ ...project, script: refinedScript });
      sysLog('Script refinement completed successfully.', 'info');
    } catch (error: any) {
      sysLog(`Refinement Fault: ${error.message}`, 'error');
      alert(`Refinement failed: ${error.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim() || isGenerating) return;
    setIsGenerating(true);
    sysLog('Orchestrating script generation sequence...', 'info');

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const aiProvider = getAIProviderInstance();
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      const result = await aiProvider.generateScript(
        idea, 
        targetAudience, 
        tone, 
        scriptLength, 
        keywordList, 
        pacing,
        abortControllerRef.current.signal
      );
      onUpdate({
        ...project,
        idea,
        tone,
        targetAudience,
        keywords: keywordList,
        scriptLength,
        pacing,
        script: result.script,
        scenes: (result.scenes || []).map((s: any) => ({
          id: crypto.randomUUID(),
          ...s
        })),
        status: 'draft'
      });
      sysLog(`Project generation complete: ${result.scenes?.length || 0} scenes initialized.`, 'info');
    } catch (error: any) {
      sysLog(`Generation fault: ${error.message}`, 'error');
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        alert('API Key Error: Please go to the AI Studio Settings > Secrets panel and select a valid Google Cloud API Key with billing enabled.');
      } else {
        alert(`AI resolution failure: ${error.message || 'Check connection.'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSave = () => {
    const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    onUpdate({ 
      ...project, 
      idea, 
      tone, 
      targetAudience, 
      keywords: keywordList, 
      scriptLength, 
      pacing 
    });
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  };

  const updateScene = (id: string, updates: Partial<typeof project.scenes[0]>) => {
      onUpdate({
          ...project,
          scenes: project.scenes.map(s => s.id === id ? { ...s, ...updates } : s)
      });
  };

  useKeyBindings({
    'Cmd+Enter': handleGenerate,
    'Ctrl+Enter': handleGenerate
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left Pane: Idea & Prompting */}
      <section className="flex flex-col gap-6">
        <div className="hardware-card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-widest text-sm">The Vision</h3>
          </div>
          
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your video idea in detail... What is it about? What's the vibe? (Press Cmd+Enter to generate)"
            className="w-full h-32 bg-[#0a0a0b] border border-[#2a2d35] rounded-xl p-4 text-white placeholder-[#4e515a] focus:outline-none focus:border-blue-500 transition-colors resize-none custom-scrollbar"
          />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-[#4e515a] uppercase tracking-widest">Specific Keywords</label>
              <input 
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="hook, resolution..."
                className="bg-[#0a0a0b] border border-[#2a2d35] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-[#4e515a] uppercase tracking-widest">Video Tone</label>
              <select 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-[#0a0a0b] border border-[#2a2d35] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="engajador">Engaging (Default)</option>
                <option value="comedic">Comedic / Funny</option>
                <option value="serious">Serious / Dramatic</option>
                <option value="educational">Educational / How-to</option>
                <option value="hype">High Energy / Hype</option>
                <option value="narrative">Storytelling / Narrative</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-[#4e515a] uppercase tracking-widest">Pacing</label>
              <select 
                value={pacing}
                onChange={(e) => setPacing(e.target.value as any)}
                className="bg-[#0a0a0b] border border-[#2a2d35] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="fast-paced">Fast-Paced</option>
                <option value="conversational">Conversational</option>
                <option value="slow-burn">Slow-Burn</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-[#4e515a] uppercase tracking-widest">Target Audience</label>
              <input 
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Gamers, Techies, Kids"
                className="bg-[#0a0a0b] border border-[#2a2d35] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#2a2d35]">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
            >
              {showAdvanced ? '- Hide Advanced Controls' : '+ Show Advanced Controls'}
            </button>
          </div>

          {showAdvanced && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="grid grid-cols-2 gap-4 overflow-hidden"
            >
              <div className="flex flex-col gap-2 col-span-2">
                <label className="text-[10px] font-bold text-[#4e515a] uppercase tracking-widest">Script Length</label>
                <select 
                  value={scriptLength}
                  onChange={(e) => setScriptLength(e.target.value as any)}
                  className="bg-[#0a0a0b] border border-[#2a2d35] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="short">Short (1-2 min)</option>
                  <option value="medium">Medium (5-8 min)</option>
                  <option value="long">Long (10-15 min)</option>
                </select>
              </div>
            </motion.div>
          )}
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !idea.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-[#2a2d35] disabled:text-[#4e515a] text-white py-3 rounded-xl transition-all font-bold"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              <span>AI Magic Script</span>
            </button>
            
            <button
              onClick={handleRefine}
              disabled={isGenerating || isRefining || !project.script}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1f2128] border border-[#2a2d35] hover:border-blue-500 disabled:opacity-50 text-white py-3 rounded-xl transition-all font-bold"
            >
              {isRefining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>Refine Script</span>
            </button>

            <button
              onClick={handleManualSave}
              className="px-4 py-3 bg-[#1f2128] border border-[#2a2d35] hover:bg-[#252832] rounded-xl transition-colors text-sm font-medium"
            >
              {isSaving ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        <div className="hardware-card p-6 flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#8e9299]">
            <Layout className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-widest text-sm">Scene Breakdown</h3>
          </div>
          
          <div 
            className="flex-1 overflow-y-auto custom-scrollbar space-y-4 relative"
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
            {project.scenes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#4e515a] py-20 border-2 border-dashed border-[#2a2d35] rounded-2xl bg-[#0a0a0b]/20">
                <Layout className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#8e9299]">Awaiting Decomposition</p>
                <p className="text-[10px] mt-2 opacity-40 text-center px-8">Narrative nodes will synchronize here once the AI Magic Script is compiled.</p>
              </div>
            ) : (
              project.scenes.map((scene, idx) => (
                <React.Fragment key={scene.id}>
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

                  <div 
                      draggable
                      onDragStart={(e) => {
                        (e.currentTarget as HTMLElement).classList.add('is-dragging');
                        handleDragStart(e, scene.id);
                      }}
                      onDragOver={(e) => handleDragOver(e, scene.id)}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(scene.id);
                      }}
                      onDragEnd={(e) => {
                        (e.currentTarget as HTMLElement).classList.remove('is-dragging');
                        handleDragEnd();
                      }}
                      className={`p-4 bg-[#1f2128] border rounded-xl cursor-move transition-all duration-300 relative group overflow-hidden ${
                          draggedSceneId === scene.id 
                            ? 'is-dragging' 
                            : 'opacity-100 border-[#2a2d35] hover:border-[#383c47]'
                      } ${
                          dropTargetId === scene.id && draggedSceneId !== scene.id
                            ? `bg-blue-500/10 border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.15)] ${dropPosition === 'before' ? 'border-t-blue-400 border-t-2' : dropPosition === 'after' ? 'border-b-blue-400 border-b-2' : ''}`
                            : ''
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Scene {idx + 1}</span>
                        {draggedSceneId === scene.id && (
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400/40 animate-pulse">Relocating Node...</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#4e515a] uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Industrial Sequence Hub
                      </div>
                    </div>
                    <div className={`space-y-3 transition-opacity duration-300 ${draggedSceneId === scene.id ? 'opacity-0' : 'opacity-100'}`}>
                        <div>
                            <label className="text-[9px] uppercase tracking-widest font-bold text-[#8e9299] flex items-center justify-between">
                              <span>Visual Description</span>
                              {scene.imageUrl && <span className="text-green-500 text-[8px] font-mono flex items-center gap-1"><ImageIcon className="w-2.5 h-2.5" /> Rendered</span>}
                            </label>
                            <textarea 
                                value={scene.description}
                                onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                                className="w-full bg-transparent border-b border-[#2a2d35] focus:border-blue-500 outline-none text-xs text-white italic resize-none custom-scrollbar pb-1 mt-1"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] uppercase tracking-widest font-bold text-[#8e9299]">Narration Text</label>
                            <textarea 
                                value={scene.narrationText}
                                onChange={(e) => updateScene(scene.id, { narrationText: e.target.value })}
                                className="w-full bg-transparent border-b border-[#2a2d35] focus:border-blue-500 outline-none text-sm text-white resize-none custom-scrollbar pb-1 mt-1"
                                rows={3}
                            />
                        </div>
                    </div>
                    
                    {/* Drag Handle Overlay */}
                    <div className="absolute top-1 right-1 opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none">
                      <Layout className="w-4 h-4" />
                    </div>
                  </div>

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
              ))
            )}
          </div>
        </div>
      </section>

      {/* Right Pane: Generated Script Preview */}
      <section className="hardware-card flex flex-col overflow-hidden">
        <div className="p-6 border-b border-[#2a2d35] flex items-center justify-between bg-[#1f2128]">
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-widest text-sm">Main Script</h3>
          </div>
          {project.script && (
            <button 
              onClick={onNext}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-bold uppercase tracking-widest transition-colors"
            >
              <span>Visuals Lab</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#0d0d0f] prose prose-invert prose-sm max-w-none">
          {project.script ? (
            <ReactMarkdown>{project.script}</ReactMarkdown>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#4e515a] text-center">
              <FileText className="w-16 h-16 mb-4 opacity-10" />
              <p>Your AI-generated script will appear here.<br/>Start by describing your idea on the left.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
