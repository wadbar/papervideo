import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Mic, 
  Volume2, 
  Play, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ListMusic,
  AlertTriangle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { VideoProject } from '../core/domain/types';

interface AudioBoothProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function AudioBooth({ project, onUpdate, onPrev, onNext }: AudioBoothProps) {
  const [isGenerating, setIsGenerating] = useState<'narration' | 'music' | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [activeVoice, setActiveVoice] = useState('Zephyr');
  const [musicPrompt, setMusicPrompt] = useState(project.audio?.musicPrompt || 'Epic cinematic orchestral score with light acoustic guitar');
  const [isCloning, setIsCloning] = useState(false);
  const [showCloneConfirm, setShowCloneConfirm] = useState(false);
  const [pendingVoiceFile, setPendingVoiceFile] = useState<File | null>(null);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [volume, setVolume] = useState(project.audio?.narrationVolume ?? 1);
  const [musicVolume, setMusicVolume] = useState(project.audio?.musicVolume ?? 0.5);
  const [autoDucking, setAutoDucking] = useState(project.audio?.autoDucking ?? true);
  const [speechSpeed, setSpeechSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [mixAudio, setMixAudio] = useState<{ narration: HTMLAudioElement | null, music: HTMLAudioElement | null }>({ narration: null, music: null });

  const { getAIProviderInstance, clonedVoices, addClonedVoice } = useSettingsStore();

  const handleVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newVoiceName.trim()) {
      alert("Please enter a name for the cloned voice before uploading.");
      e.target.value = '';
      return;
    }

    setPendingVoiceFile(file);
    setShowCloneConfirm(true);
    e.target.value = '';
  };

  const executeCloning = async () => {
    if (!pendingVoiceFile) return;
    const file = pendingVoiceFile;
    setShowCloneConfirm(false);
    setPendingVoiceFile(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setIsCloning(true);
      try {
        const provider = getAIProviderInstance();
        const base64Data = base64.split(',')[1] || base64;
        const voiceId = await provider.cloneVoice(newVoiceName, base64Data);
        
        addClonedVoice({ id: voiceId, name: newVoiceName, provider: 'ElevenLabs' });
        setActiveVoice(voiceId);
        setNewVoiceName('');
      } catch (err) {
        console.error("Failed to clone voice", err);
        alert("Failed to clone voice.");
      } finally {
        setIsCloning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateNarration = async () => {
    setIsGenerating('narration');
    try {
      const provider = getAIProviderInstance();
      const fullText = project.scenes.map(s => s.narrationText).join(". ");
      const narrationUrl = await provider.generateNarration(fullText, activeVoice, volume, speechSpeed);
      
      if (narrationUrl) {
        onUpdate({
           ...project,
           audio: { ...project.audio, narrationUrl, narrationVolume: volume, speechSpeed }
        });
      }
    } catch (error: any) {
      console.error('Narration failed', error);
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        alert('API Key Error: Please go to the AI Studio Settings > Secrets panel and select a valid Google Cloud API Key with billing enabled.');
      } else {
        alert(`Narration Failed: ${error.message}`);
      }
    } finally {
      setIsGenerating(null);
    }
  };

  const previewSceneNarration = async (sceneIndex: number) => {
    const scene = project.scenes[sceneIndex];
    if (!scene?.narrationText) return;
    stopActiveAudio();
    setIsPreviewing(true);
    try {
      const provider = getAIProviderInstance();
      const narrationUrl = await provider.generateNarration(scene.narrationText, activeVoice, volume, speechSpeed);
      
      if (narrationUrl) {
        const audio = new Audio(narrationUrl);
        audio.volume = Math.min(volume, 1);
        setActiveAudio(audio);
        audio.play();
        audio.onended = () => setActiveAudio(null);
      }
    } catch (error: any) {
      console.error('Scene preview failed', error);
      alert(`Preview Failed: ${error.message}`);
    } finally {
      setIsPreviewing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (activeAudio) activeAudio.pause();
      if (mixAudio.narration) mixAudio.narration.pause();
      if (mixAudio.music) mixAudio.music.pause();
    };
  }, [activeAudio, mixAudio]);

  const stopActiveAudio = () => {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      setActiveAudio(null);
    }
    if (mixAudio.narration) {
      mixAudio.narration.pause();
      mixAudio.narration.currentTime = 0;
    }
    if (mixAudio.music) {
      mixAudio.music.pause();
      mixAudio.music.currentTime = 0;
    }
    setMixAudio({ narration: null, music: null });
  };

  const previewNarration = async () => {
    if (project.scenes.length === 0) return;
    stopActiveAudio();
    setIsPreviewing(true);
    try {
      const provider = getAIProviderInstance();
      const previewText = project.scenes[0].narrationText || "";
      const narrationUrl = await provider.generateNarration(previewText, activeVoice, volume);
      
      if (narrationUrl) {
        const audio = new Audio(narrationUrl);
        audio.volume = Math.min(volume, 1);
        setActiveAudio(audio);
        audio.play();
        audio.onended = () => setActiveAudio(null);
      }
    } catch (error: any) {
      console.error('Preview failed', error);
      alert(`Preview Failed: ${error.message}`);
    } finally {
      setIsPreviewing(false);
    }
  };

  const generateMusic = async () => {
    if (!musicPrompt.trim()) return;
    setIsGenerating('music');
    try {
      const provider = getAIProviderInstance();
      const musicVariations = await provider.generateMusicVariations(musicPrompt);
      onUpdate({
          ...project,
          audio: { ...project.audio, musicVariations, musicUrl: undefined, musicVolume, musicPrompt }
      });
    } catch (error: any) {
      console.error('Music generation failed', error);
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        alert('API Key Error: Please go to the AI Studio Settings > Secrets panel and select a valid Google Cloud API Key with billing enabled.');
      } else {
        alert(`Music Generation Failed: ${error.message}`);
      }
    } finally {
      setIsGenerating(null);
    }
  };

  const previewTrack = (url: string) => {
    stopActiveAudio();
    const audio = new Audio(url);
    audio.volume = Math.min(musicVolume, 1);
    setActiveAudio(audio);
    audio.play();
    audio.onended = () => setActiveAudio(null);
  };

  const selectMusic = (url: string) => {
    onUpdate({
        ...project,
        audio: { ...project.audio, musicUrl: url, musicVariations: undefined, musicVolume, musicPrompt }
    });
    stopActiveAudio();
  };

  const previewMusic = () => {
    if (!project.audio?.musicUrl) return;
    stopActiveAudio();
    const audio = new Audio(project.audio.musicUrl);
    audio.volume = Math.min(musicVolume, 1);
    setActiveAudio(audio);
    audio.play();
    audio.onended = () => setActiveAudio(null);
  };

  const previewFullMix = () => {
    if (!project.audio?.narrationUrl || !project.audio?.musicUrl) {
      alert("Please generate both narration and music before testing the mix.");
      return;
    }
    stopActiveAudio();
    
    const narrationAudio = new Audio(project.audio.narrationUrl);
    const musicAudio = new Audio(project.audio.musicUrl);
    
    narrationAudio.volume = Math.min(volume, 1);
    musicAudio.volume = Math.min(musicVolume, 1);
    musicAudio.loop = true;

    setMixAudio({ narration: narrationAudio, music: musicAudio });
    
    narrationAudio.play();
    musicAudio.play();

    narrationAudio.onended = () => {
      musicAudio.pause();
      setMixAudio({ narration: null, music: null });
    };
  };

  return (
    <div className="flex flex-col h-full gap-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">Audio Studio</h2>
          <p className="text-on-surface-variant text-sm font-medium opacity-80">Harmonize your vision with AI-powered neural narration and cinematic scoring.</p>
        </div>
        <div className="flex items-center gap-3">
            {(activeAudio || mixAudio.narration || mixAudio.music) && (
              <button 
                onClick={stopActiveAudio}
                className="px-6 py-2.5 bg-error/10 text-error hover:bg-error/20 rounded-full transition-all flex items-center gap-2 border border-error/20 text-xs font-bold uppercase tracking-widest"
              >
                <X className="w-4 h-4" />
                <span>Silence All</span>
              </button>
            )}
            <div className="flex items-center bg-surface-variant/20 rounded-full p-1.5 border border-outline-variant/30">
                <button onClick={onPrev} className="px-5 py-2 hover:bg-surface-variant/40 rounded-full transition-all flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                    <ChevronLeft className="w-4 h-4" />
                    <span>Visuals</span>
                </button>
                <div className="w-px h-6 bg-outline-variant mx-1" />
                <button onClick={onNext} className="m3-button-primary py-2 px-6 flex items-center gap-2 shadow-lg shadow-primary/20">
                    <span className="text-xs font-black uppercase tracking-widest">Production</span>
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1 min-h-0">
        {/* Left: Narration */}
        <div className="bg-surface rounded-[2.5rem] border border-outline-variant/40 flex flex-col h-full overflow-hidden shadow-sm transition-colors duration-300">
          <div className="px-8 py-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-variant/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-black uppercase tracking-[0.2em] text-xs text-on-surface">Neural Narrator</h3>
            </div>
          </div>
          
          <div className="p-8 flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar bg-surface/50">
            <div className="space-y-4">
              <label className="text-[10px] uppercase font-black text-on-surface-variant tracking-[0.3em] pl-1">Voice Profile Identity</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'].map(voice => (
                  <button
                    key={voice}
                    onClick={() => setActiveVoice(voice)}
                    className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                      activeVoice === voice ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20' : 'bg-surface/50 border-outline-variant/50 text-on-surface-variant hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    {voice}
                  </button>
                ))}
                {clonedVoices.map(voice => (
                  <div key={voice.id} className="flex flex-row items-center gap-2">
                      <button
                        onClick={() => setActiveVoice(voice.id)}
                        className={`flex-1 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                          activeVoice === voice.id ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20' : 'bg-surface/50 border-outline-variant/50 text-on-surface-variant hover:border-primary/50 hover:bg-primary/5'
                        }`}
                      >
                        {voice.name}
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const provider = getAIProviderInstance();
                          try {
                              const previewUrl = await provider.generateNarration("This is a preview of my voice.", voice.id, 1, 'normal');
                              if (previewUrl) {
                                  const audio = new Audio(previewUrl);
                                  audio.play();
                              }
                          } catch (err: any) {
                              alert(`Preview failed: ${err.message}`);
                          }
                        }}
                        className="p-3 bg-surface border border-outline-variant/30 rounded-2xl text-on-surface hover:text-primary hover:border-primary transition-colors focus:outline-none"
                        title="Preview voice"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between pl-1">
                <label className="text-[10px] uppercase font-black text-on-surface-variant tracking-[0.3em]">Temporal Cadence</label>
                <span className="text-[10px] font-mono font-bold text-primary italic uppercase">{speechSpeed}</span>
              </div>
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="1"
                  value={['slow', 'normal', 'fast'].indexOf(speechSpeed)}
                  onChange={e => setSpeechSpeed(['slow', 'normal', 'fast'][parseInt(e.target.value)] as 'slow' | 'normal' | 'fast')}
                  className="w-full h-1.5 bg-surface-variant/30 rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            <div className="pt-8 border-t border-outline-variant/30">
              <h4 className="text-[10px] uppercase font-black text-on-surface-variant mb-4 tracking-[0.3em] pl-1">Genetic Voice Cloning</h4>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Identity Name" 
                  value={newVoiceName}
                  onChange={e => setNewVoiceName(e.target.value)}
                  className="flex-1 bg-surface-variant/10 border border-outline-variant/50 rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  disabled={isCloning}
                />
                <label className={`flex items-center justify-center gap-3 px-6 py-3 bg-surface/50 border border-outline-variant/40 hover:border-primary/50 rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-sm ${isCloning ? 'opacity-50 pointer-events-none' : 'hover:shadow-md'}`}>
                  {isCloning ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Mic className="w-4 h-4 text-primary" />}
                  <span className="uppercase tracking-widest">{isCloning ? 'Clonning' : 'Sample'}</span>
                  <input type="file" accept="audio/*" className="hidden" onChange={handleVoiceUpload} />
                </label>
              </div>
            </div>

            <div className="pt-8 border-t border-outline-variant/30">
                <h4 className="text-[10px] uppercase font-black text-on-surface-variant mb-4 tracking-[0.3em] pl-1">Neural DSP Matrix</h4>
                <div className="flex flex-wrap gap-3">
                    {['De-noise', 'Studio EQ', 'Auto Ducking'].map((effect, idx) => (
                      <label key={effect} className="flex items-center gap-3 cursor-pointer bg-surface/40 border border-outline-variant/40 px-4 py-2.5 rounded-2xl hover:bg-surface-variant/5 transition-all text-on-surface select-none">
                        <div className="relative flex items-center">
                          <input type="checkbox" className="w-4 h-4 accent-primary rounded cursor-pointer" defaultChecked={idx === 2} />
                        </div>
                        <span className="text-[10px] uppercase font-black tracking-widest">{effect}</span>
                      </label>
                    ))}
                </div>
            </div>

            <div className="flex-1 p-6 bg-surface-variant/5 border border-outline-variant/20 rounded-[2rem] overflow-y-auto custom-scrollbar flex flex-col gap-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] uppercase font-black text-on-surface-variant tracking-[0.3em]">Sequential Transcript</h4>
                  <div className="flex gap-1">
                    {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary/30" />)}
                  </div>
                </div>
                <div className="space-y-8">
                    {project.scenes.map((scene, i) => (
                        <div key={scene.id} className="relative pl-6 group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/10 rounded-full group-hover:bg-primary/30 transition-colors" />
                            <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Node {i+1}</span>
                                  <div className="w-1 h-1 rounded-full bg-outline-variant" />
                                  <span className="text-[9px] font-mono text-on-surface-variant/50">T+{(i*5).toString().padStart(2, '0')}s</span>
                               </div>
                               <button 
                                 onClick={() => previewSceneNarration(i)}
                                 disabled={isPreviewing}
                                 className="opacity-0 group-hover:opacity-100 transition-all p-2 bg-primary/10 hover:bg-primary hover:text-on-primary rounded-xl text-primary flex items-center gap-2 transform translate-x-2 group-hover:translate-x-0"
                               >
                                 {isPreviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Play className="w-3.5 h-3.5 fill-current" />}
                                 <span className="text-[10px] font-black uppercase tracking-widest pr-1">Listen</span>
                               </button>
                            </div>
                            <p className="text-sm leading-relaxed text-on-surface/80 font-medium">{scene.narrationText}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-6 pt-4">
                {project.audio?.narrationUrl && (
                    <div className="p-5 bg-primary/5 border border-primary/20 rounded-[2rem] flex items-center gap-5 shadow-inner">
                        <button 
                          onClick={() => {
                            stopActiveAudio();
                            const audio = new Audio(project.audio!.narrationUrl);
                            audio.volume = volume;
                            setActiveAudio(audio);
                            audio.play();
                            audio.onended = () => setActiveAudio(null);
                          }}
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${activeAudio?.src === project.audio?.narrationUrl ? 'bg-primary text-on-primary scale-95' : 'bg-surface text-primary border border-primary/20 hover:bg-primary/10'}`}
                        >
                            <Play className={`w-6 h-6 ${activeAudio?.src === project.audio?.narrationUrl ? 'fill-current' : ''}`} />
                        </button>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Master Narration Computed</p>
                              <span className="text-[10px] font-mono font-bold text-on-surface-variant italic">100% SECURE</span>
                            </div>
                            <div className="h-1.5 bg-primary/10 rounded-full w-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  className="h-full bg-primary" 
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                <button 
                  onClick={generateNarration}
                  disabled={!!isGenerating || isPreviewing || project.scenes.length === 0}
                  className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary py-4 rounded-[2rem] transition-all font-black text-sm uppercase tracking-[0.3em] shadow-xl shadow-primary/20 active:scale-[0.98]"
                >
                  {isGenerating === 'narration' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  <span>Synthesize Full Arc</span>
                </button>
            </div>
          </div>
        </div>

        {/* Right: Music */}
        <div className="bg-surface rounded-[2.5rem] border border-outline-variant/40 flex flex-col h-full overflow-hidden shadow-sm transition-colors duration-300">
          <div className="px-8 py-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-variant/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                <Music className="w-5 h-5" />
              </div>
              <h3 className="font-black uppercase tracking-[0.2em] text-xs text-on-surface">Neural Scoring Engine</h3>
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar bg-surface/50">
            <div className="space-y-4">
              <label className="text-[10px] uppercase font-black text-on-surface-variant tracking-[0.3em] pl-1">Vibe Synthesis Parameters</label>
              <textarea 
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                className="w-full h-28 bg-surface-variant/10 border border-outline-variant/50 rounded-[2rem] p-5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all resize-none leading-relaxed font-medium"
                placeholder="Describe the sonic atmosphere..."
              />
              <div className="flex gap-2 p-1 overflow-x-auto custom-scrollbar no-scrollbar items-center">
                {['Cinematic', 'Lofi', 'Epic', 'Cyberpunk', 'Zen', 'Jazz'].map(style => (
                    <button 
                        key={style}
                        onClick={() => setMusicPrompt(prev => prev + (prev ? ', ' : '') + style)}
                        className="flex-shrink-0 px-4 py-2 bg-surface border border-outline-variant/40 rounded-full text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-secondary hover:border-secondary transition-all"
                    >
                        + {style}
                    </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col p-8 border-2 border-dashed border-outline-variant/30 rounded-[3rem] bg-surface-variant/5 min-h-[300px] relative transition-all hover:bg-surface-variant/10">
                {project.audio?.musicVariations && project.audio.musicVariations.length > 0 && !project.audio?.musicUrl ? (
                    <div className="w-full flex-1 flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Genetic Variations Computed</h4>
                          <ListMusic className="w-4 h-4 opacity-30" />
                        </div>
                        <div className="flex flex-col gap-4 w-full">
                            {project.audio.musicVariations.map((url, i) => (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  key={i} 
                                  className="group flex items-center gap-5 bg-surface p-4 rounded-[2rem] border border-outline-variant/40 w-full hover:shadow-lg transition-all hover:bg-surface"
                                >
                                    <button 
                                        onClick={() => previewTrack(url)}
                                        className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-all flex-shrink-0 shadow-inner"
                                    >
                                        <Play className="w-6 h-6 fill-current" />
                                    </button>
                                    <div className="flex-1 text-left">
                                        <h5 className="font-black text-sm text-on-surface leading-tight">Neural Track {i + 1}</h5>
                                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-mono mt-1 opacity-60">BITRATE_640KBPS</p>
                                    </div>
                                    <button
                                        onClick={() => selectMusic(url)}
                                        className="m3-button-tonal py-2 px-6 flex items-center gap-2 transform active:scale-95"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">Bind</span>
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : project.audio?.musicUrl ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-28 h-28 rounded-full bg-secondary/5 flex items-center justify-center mb-8 relative group" style={{ background: 'transparent' }}>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 border-[3px] border-secondary/20 border-t-secondary rounded-full"
                            />
                            <button 
                                onClick={previewMusic}
                                className="w-20 h-20 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-xl shadow-secondary/20 hover:scale-110 active:scale-95 transition-all z-10"
                            >
                                <Play className="w-10 h-10 fill-current ml-1" />
                            </button>
                        </div>
                        <h4 className="text-xl font-bold text-on-surface leading-tight">Sonic Theorem Bound</h4>
                        <p className="text-sm font-medium text-on-surface-variant opacity-60 mt-2 uppercase tracking-widest">Original Scoring Computed</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-surface-variant/10 flex items-center justify-center mb-6 border border-outline-variant/30">
                            <ListMusic className="w-8 h-8 text-on-surface-variant opacity-30" />
                        </div>
                        <h4 className="text-lg font-bold text-on-surface opacity-30">Sonic Void</h4>
                        <p className="text-sm font-medium text-on-surface-variant opacity-30 mt-2 uppercase tracking-widest">Neural weights waiting for prompt</p>
                    </div>
                )}
            </div>

            <button 
              onClick={generateMusic}
              disabled={!!isGenerating}
              className="w-full flex items-center justify-center gap-3 m3-button-primary bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-on-secondary py-4 rounded-[2rem] transition-all font-black text-sm uppercase tracking-[0.3em] shadow-xl shadow-secondary/20 active:scale-[0.98]"
            >
              {isGenerating === 'music' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>Synthesize Score</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audio Mixer */}
      <div className="bg-surface rounded-[3rem] p-10 border border-outline-variant/40 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="font-black uppercase tracking-[0.3em] text-xs text-on-surface">Neural Master Mix</h3>
          </div>
          
          <button 
            onClick={previewFullMix}
            disabled={!project.audio?.narrationUrl || !project.audio?.musicUrl}
            className="m3-button-tonal py-3 px-10 flex items-center gap-3 shadow-md hover:shadow-lg active:scale-95 transition-all text-sm font-black uppercase tracking-[0.2em]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Conduct Full Audit</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] uppercase font-black text-on-surface-variant tracking-[0.3em]">Narration Delta</span>
              <span className="text-[10px] font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded italic">{Math.round(volume * 100)}%</span>
            </div>
            <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={volume}
                  onChange={e => {
                    const vol = parseFloat(e.target.value);
                    setVolume(vol);
                    onUpdate({ ...project, audio: { ...project.audio, narrationVolume: vol } });
                  }}
                  className="w-full h-1.5 bg-surface-variant/30 rounded-full appearance-none cursor-pointer accent-primary"
                />
            </div>
            <div className="flex justify-between text-[8px] font-black text-on-surface-variant opacity-30 mt-2 px-2 uppercase tracking-widest">
                <span>0_DB</span>
                <span>HEADROOM_SYNC</span>
                <span>+6_DB</span>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] uppercase font-black text-on-surface-variant tracking-[0.3em]">Atmospheric Score</span>
              <span className="text-[10px] font-mono font-bold text-secondary bg-secondary/5 px-2 py-0.5 rounded italic">{Math.round(musicVolume * 100)}%</span>
            </div>
            <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={musicVolume}
                  onChange={e => {
                    const vol = parseFloat(e.target.value);
                    setMusicVolume(vol);
                    onUpdate({ ...project, audio: { ...project.audio, musicVolume: vol } });
                  }}
                  className="w-full h-1.5 bg-surface-variant/30 rounded-full appearance-none cursor-pointer accent-secondary"
                />
            </div>
            <div className="flex justify-between text-[8px] font-black text-on-surface-variant opacity-30 mt-2 px-2 uppercase tracking-widest">
                <span>MUTED</span>
                <span>AMBIENT_SYNC</span>
                <span>OVERDRIVE</span>
            </div>
            <div className="mt-6 flex flex-row items-center justify-between bg-surface-variant/10 border border-outline-variant/30 rounded-2xl p-4 transition-all">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-widest">Auto-Ducking</span>
                    <span className="text-[10px] text-on-surface-variant max-w-[200px]">Lowers music volume automatically when narration is present.</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                        <input 
                            type="checkbox" 
                            checked={autoDucking} 
                            onChange={(e) => {
                                const val = e.target.checked;
                                setAutoDucking(val);
                                onUpdate({ ...project, audio: { ...project.audio, autoDucking: val } });
                            }} 
                            className="peer sr-only" 
                        />
                        <div className="w-10 h-6 bg-surface-variant/50 rounded-full peer-checked:bg-secondary transition-colors border border-outline-variant/30"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-on-surface-variant rounded-full peer-checked:translate-x-4 peer-checked:bg-background transition-transform shadow-[0_2px_4px_rgba(0,0,0,0.2)]"></div>
                    </div>
                </label>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCloneConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-scrim/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg m3-card p-10 overflow-hidden relative"
            >
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 rounded-[2rem] bg-error/10 flex items-center justify-center text-error shadow-inner">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-on-surface leading-tight">Biometric Authorization</h3>
                  <p className="text-xs font-black uppercase text-on-surface-variant tracking-widest mt-1 opacity-60">Legal Compliance Filter</p>
                </div>
              </div>

              <div className="space-y-6 mb-10">
                <p className="text-sm font-medium text-on-surface-variant leading-relaxed opacity-80">
                  Genetic voice reconstruction requires explicit authorization. By proceeding, you certify project ownership and legal usage rights for the target identity.
                </p>
                <div className="p-5 bg-surface-variant/10 border border-outline-variant/40 rounded-[2rem]">
                  <p className="text-[10px] uppercase font-black text-on-surface-variant mb-1 tracking-widest">Subject Identity</p>
                  <p className="text-lg font-bold text-on-surface">{newVoiceName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setShowCloneConfirm(false);
                    setPendingVoiceFile(null);
                  }}
                  className="px-6 py-4 bg-surface-variant/20 hover:bg-surface-variant/40 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all"
                >
                  Terminate
                </button>
                <button 
                  onClick={executeCloning}
                  className="m3-button-primary bg-error text-on-error hover:bg-error/90 py-4 px-6 shadow-xl shadow-error/20 font-black text-sm uppercase tracking-[0.2em]"
                >
                  Auth & Replicate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
