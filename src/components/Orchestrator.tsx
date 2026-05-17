import React, { useState } from 'react';
import { Wand2, Sparkles, Layout, FileText, ChevronRight, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { VideoProject } from '../core/domain/types';
import { useKeyBindings } from '../core/hooks/useKeyBindings';

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
  
  const { getAIProviderInstance } = useSettingsStore();

  const handleRefine = async () => {
    if (!project.script || isGenerating || isRefining) return;
    setIsRefining(true);
    try {
      const aiProvider = getAIProviderInstance();
      const refinedScript = await aiProvider.refineScript(
        project.script,
        "Improve content, flow, and professional tone."
      );
      onUpdate({ ...project, script: refinedScript });
    } catch (error: any) {
      console.error('Refinement failed', error);
      alert(`Refinement failed: ${error.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const aiProvider = getAIProviderInstance();
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      const result = await aiProvider.generateScript(
        idea, 
        targetAudience, 
        tone, 
        scriptLength, 
        keywordList, 
        pacing
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
    } catch (error: any) {
      console.error('Generation failed', error);
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        alert('API Key Error: Please go to the AI Studio Settings > Secrets panel and select a valid Google Cloud API Key with billing enabled.');
      } else {
        alert(`AI Engine error: ${error.message || 'Check connection.'}`);
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
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {project.scenes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#4e515a! opacity-40">
                <Layout className="w-12 h-12 mb-2" />
                <p className="text-sm">Generate a script to see individual scenes</p>
              </div>
            ) : (
              project.scenes.map((scene, idx) => (
                <div key={scene.id} className="p-4 bg-[#1f2128] border border-[#2a2d35] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Scene {idx + 1}</span>
                  </div>
                  <p className="text-xs text-[#8e9299] line-clamp-2 italic mb-2">"{scene.description}"</p>
                  <p className="text-sm line-clamp-1">{scene.narrationText}</p>
                </div>
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
            <h3 className="font-bold uppercase tracking-widest text-sm">Master Script</h3>
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
