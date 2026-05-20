import React, { useState, useEffect, useRef } from 'react';
import { Wand2, Sparkles, Layout, FileText, ChevronRight, Loader2, ImageIcon, TrendingUp, Users, Clock, Zap } from 'lucide-react';
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
    componentName: 'VideoFlow_Orchestrator',
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
        status: 'draft',
        lastModified: Date.now()
      });
      sysLog(`Project generation complete: ${result.scenes?.length || 0} scenes initialized.`, 'info');
    } catch (error: any) {
      sysLog(`Generation fault: ${error.message}`, 'error');
      alert(`AI resolution failure: ${error.message || 'Check connection.'}`);
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
      pacing,
      lastModified: Date.now()
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* Design Controls Column */}
      <section className="lg:col-span-5 flex flex-col gap-6 h-full overflow-y-auto no-scrollbar pb-10">
        <div className="m3-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Sparkles className="w-6 h-6" />
             </div>
             <h3 className="font-bold text-xl text-on-surface">Creative Vision</h3>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-on-surface-variant flex items-center justify-between">
              <span>PROMPT</span>
              <span className="text-[10px] font-bold text-primary/60">CMD + ENTER</span>
            </label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your video idea in detail..."
              className="w-full h-40 bg-surface-variant/40 border border-outline-variant rounded-2xl p-4 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none custom-scrollbar text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <M3Field label="KEYWORDS" icon={<TrendingUp className="w-3.5 h-3.5" />}>
               <input 
                 type="text"
                 value={keywords}
                 onChange={(e) => setKeywords(e.target.value)}
                 placeholder="hook, viral..."
                 className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 m-0 text-on-surface"
               />
            </M3Field>

            <M3Field label="TONE" icon={<Layout className="w-3.5 h-3.5" />}>
              <select 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 m-0 text-on-surface appearance-none cursor-pointer"
              >
                <option value="engajador">Engaging</option>
                <option value="comedic">Comedic</option>
                <option value="serious">Dramatic</option>
                <option value="educational">Educational</option>
                <option value="hype">Hype</option>
                <option value="narrative">Storytelling</option>
              </select>
            </M3Field>

            <M3Field label="PACING" icon={<Zap className="w-3.5 h-3.5" />}>
              <select 
                value={pacing}
                onChange={(e) => setPacing(e.target.value as any)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 m-0 text-on-surface appearance-none cursor-pointer"
              >
                <option value="fast-paced">Fast-Paced</option>
                <option value="conversational">Conversational</option>
                <option value="slow-burn">Slow-Burn</option>
              </select>
            </M3Field>

            <M3Field label="AUDIENCE" icon={<Users className="w-3.5 h-3.5" />}>
              <input 
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Gamers, etc."
                className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 m-0 text-on-surface"
              />
            </M3Field>
          </div>

          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest hover:bg-primary/5 p-2 rounded-lg transition-colors w-full justify-center"
          >
            {showAdvanced ? '- Compression Mode' : '+ Expansion Matrix'}
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <M3Field label="LENGTH" icon={<Clock className="w-3.5 h-3.5" />}>
                  <select 
                    value={scriptLength}
                    onChange={(e) => setScriptLength(e.target.value as any)}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 m-0 text-on-surface appearance-none cursor-pointer"
                  >
                    <option value="short">Short (1-2 min)</option>
                    <option value="medium">Medium (5-8 min)</option>
                    <option value="long">Long (10-15 min)</option>
                  </select>
                </M3Field>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant">
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !idea.trim()}
                className="flex-1 m3-button-primary"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Wand2 className="w-5 h-5 mr-2" />}
                Generate Script
              </button>
              
              <button
                onClick={handleManualSave}
                className="m3-button-tonal shadow-none"
              >
                {isSaving ? 'Synchronized' : 'Save State'}
              </button>
            </div>

            <button
              onClick={handleRefine}
              disabled={isGenerating || isRefining || !project.script}
              className="w-full m3-button-outlined"
            >
              {isRefining ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
              Refine Logic
            </button>
          </div>
        </div>

        <div className="m3-card p-6 flex flex-col gap-4 flex-1">
          <div className="flex items-center gap-3 text-on-surface">
            <div className="p-2 bg-secondary/10 rounded-xl text-secondary">
               <Layout className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl">Scene Timeline</h3>
          </div>
          
          <div className="flex-1 space-y-4">
            {project.scenes.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-outline-variant rounded-3xl bg-surface-variant/10">
                <Layout className="w-12 h-12 mb-4 opacity-20 text-on-surface-variant" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">Awaiting Generation</p>
              </div>
            ) : (
              project.scenes.map((scene, idx) => (
                <M3SceneItem 
                  key={scene.id} 
                  scene={scene} 
                  idx={idx} 
                  draggedSceneId={draggedSceneId}
                  dropTargetId={dropTargetId}
                  dropPosition={dropPosition}
                  handleDragStart={handleDragStart}
                  handleDragOver={handleDragOver}
                  handleDrop={handleDrop}
                  handleDragEnd={handleDragEnd}
                  updateScene={updateScene}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Script Preview Column */}
      <section className="lg:col-span-7 m3-card flex flex-col h-full overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-variant/20">
          <div className="flex items-center gap-3 text-on-surface">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Main Narrative</h3>
          </div>
          {project.script && (
            <button 
              onClick={onNext}
              className="m3-button-tonal py-2 text-xs"
            >
              <span>Visual Lab</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-surface/30 prose prose-primary prose-sm max-w-none">
          {project.script ? (
            <ReactMarkdown>{project.script}</ReactMarkdown>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/40 text-center">
              <FileText className="w-24 h-24 mb-6 opacity-10" />
              <p className="text-base font-medium max-w-xs">Your AI-generated script will manifest here. Start by establishing a vision.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function M3Field({ label, icon, children }: { label: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-surface-variant/30 border border-outline-variant focus-within:border-primary transition-all">
       <label className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-1.5 leading-none">
         {icon}
         {label}
       </label>
       {children}
    </div>
  );
}

function M3SceneItem({ 
  scene, idx, draggedSceneId, dropTargetId, dropPosition, handleDragStart, handleDragOver, handleDrop, handleDragEnd, updateScene 
}: any) {
  return (
    <React.Fragment>
      <AnimatePresence>
        {dropTargetId === scene.id && dropPosition === 'before' && draggedSceneId !== scene.id && <M3DropIndicator />}
      </AnimatePresence>

      <div 
          draggable
          onDragStart={(e) => handleDragStart(e, scene.id)}
          onDragOver={(e) => handleDragOver(e, scene.id)}
          onDrop={(e) => { e.preventDefault(); handleDrop(scene.id); }}
          onDragEnd={handleDragEnd}
          className={`p-5 m3-card bg-surface-variant/20 border border-outline-variant hover:border-primary/30 transition-all cursor-move group relative overflow-hidden backdrop-blur-sm ${
              draggedSceneId === scene.id ? 'opacity-30 scale-95' : 'opacity-100'
          }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
              {idx + 1}
            </span>
            <span className="text-xs font-bold text-on-surface uppercase tracking-tight">Sequence Node</span>
          </div>
          {scene.imageUrl && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
               <ImageIcon className="w-3 h-3" />
               RENDERED
            </div>
          )}
        </div>

        <div className="space-y-4">
            <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50">Visual Context</label>
                <textarea 
                    value={scene.description}
                    onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 text-[13px] text-on-surface/80 italic resize-none custom-scrollbar p-0 leading-relaxed"
                    rows={2}
                />
            </div>
            <div className="space-y-1 pt-3 border-t border-outline-variant/30">
                <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50">Narrative Payload</label>
                <textarea 
                    value={scene.narrationText}
                    onChange={(e) => updateScene(scene.id, { narrationText: e.target.value })}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-on-surface resize-none custom-scrollbar p-0 leading-relaxed font-medium"
                    rows={3}
                />
            </div>
        </div>
      </div>

      <AnimatePresence>
        {dropTargetId === scene.id && dropPosition === 'after' && draggedSceneId !== scene.id && <M3DropIndicator />}
      </AnimatePresence>
    </React.Fragment>
  );
}

function M3DropIndicator() {
  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 16, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="w-full flex items-center justify-center"
    >
      <div className="w-full h-1 bg-primary/30 rounded-full animate-pulse mx-4" />
    </motion.div>
  );
}
