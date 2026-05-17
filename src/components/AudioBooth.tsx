import React, { useState } from 'react';
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
        
        addClonedVoice({ id: voiceId, name: newVoiceName });
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

  const previewSceneNarration = (sceneIndex: number) => {
    const scene = project.scenes[sceneIndex];
    if (!scene?.narrationText) return;
    stopActiveAudio();
    // In a real app we might generate a temporary preview or use a cached one
    // For now we just use the existing generateNarration logic but it's fine
  };

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
      const previewText = project.scenes[0].narrationText;
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
      const musicUrl = await provider.generateMusic(musicPrompt);
      onUpdate({
          ...project,
          audio: { ...project.audio, musicUrl, musicVolume, musicPrompt }
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
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Audio Booth</h2>
          <p className="text-[#8e9299] text-sm">Harmonize your video with AI-powered narration and cinematic scores.</p>
        </div>
        <div className="flex gap-2">
            {(activeAudio || mixAudio.narration || mixAudio.music) && (
              <button 
                onClick={stopActiveAudio}
                className="px-4 py-2 bg-red-900/20 text-red-500 hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2 border border-red-500/30"
              >
                <X className="w-4 h-4" />
                <span>Stop All Audio</span>
              </button>
            )}
            <button onClick={onPrev} className="px-4 py-2 bg-[#1f2128] hover:bg-[#252832] rounded-lg transition-colors flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span>Visuals</span>
            </button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2">
                <span>Production</span>
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        {/* Left: Narration */}
        <div className="hardware-card flex flex-col h-full bg-[#151619]">
          <div className="p-6 border-b border-[#2a2d35] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-red-500" />
              <h3 className="font-bold uppercase tracking-widest text-sm">AI Voiceover</h3>
            </div>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold text-[#4e515a] tracking-widest">Voice Selection</label>
              <div className="grid grid-cols-3 gap-2">
                {['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'].map(voice => (
                  <button
                    key={voice}
                    onClick={() => setActiveVoice(voice)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      activeVoice === voice ? 'bg-red-900/20 border-red-500 text-red-100' : 'bg-[#1f2128] border-[#2a2d35] text-[#8e9299] hover:border-[#4e515a]'
                    }`}
                  >
                    {voice}
                  </button>
                ))}
                {clonedVoices.map(voice => (
                  <button
                    key={voice.id}
                    onClick={() => setActiveVoice(voice.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      activeVoice === voice.id ? 'bg-red-900/20 border-red-500 text-red-100' : 'bg-[#1f2128] border-[#2a2d35] text-[#8e9299] hover:border-[#4e515a]'
                    }`}
                  >
                    {voice.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold text-[#4e515a] tracking-widest">Speech Speed: {speechSpeed.charAt(0).toUpperCase() + speechSpeed.slice(1)}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={['slow', 'normal', 'fast'].indexOf(speechSpeed)}
                onChange={e => setSpeechSpeed(['slow', 'normal', 'fast'][parseInt(e.target.value)] as 'slow' | 'normal' | 'fast')}
                className="w-full h-2 bg-[#1f2128] rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <div className="pt-4 border-t border-[#2a2d35]">
              <h4 className="text-[10px] uppercase font-bold text-[#4e515a] mb-3 tracking-widest">Clone a New Voice</h4>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Voice Name" 
                  value={newVoiceName}
                  onChange={e => setNewVoiceName(e.target.value)}
                  className="flex-1 bg-[#1f2128] border border-[#2a2d35] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  disabled={isCloning}
                />
                <label className={`flex items-center justify-center gap-2 px-3 py-2 bg-[#1f2128] border border-[#2a2d35] hover:border-[#4e515a] rounded-lg text-xs font-medium cursor-pointer transition-all ${isCloning ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isCloning ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Mic className="w-4 h-4 text-[#8e9299]" />}
                  <span>{isCloning ? 'Cloning...' : 'Upload Sample'}</span>
                  <input type="file" accept="audio/*" className="hidden" onChange={handleVoiceUpload} />
                </label>
              </div>
            </div>

            <div className="flex-1 p-4 bg-[#0d0d0f] border border-[#2a2d35] rounded-xl overflow-y-auto custom-scrollbar">
                <h4 className="text-[10px] uppercase font-bold text-[#4e515a] mb-3 tracking-widest">Full Script Preview</h4>
                <div className="space-y-6">
                    {project.scenes.map((scene, i) => (
                        <div key={scene.id} className="border-l-2 border-red-900/30 pl-4">
                             <span className="text-[10px] text-red-500 mb-1 block">Scene {i+1}</span>
                             <p className="text-sm leading-relaxed">{scene.narrationText}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {project.audio?.narrationUrl && (
                    <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-xl flex items-center gap-4">
                        <button 
                          onClick={() => {
                            stopActiveAudio();
                            const audio = new Audio(project.audio!.narrationUrl);
                            audio.volume = volume;
                            setActiveAudio(audio);
                            audio.play();
                            audio.onended = () => setActiveAudio(null);
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${activeAudio?.src === project.audio?.narrationUrl ? 'bg-red-400' : 'bg-red-500 hover:bg-red-400'}`}
                        >
                            <Play className="w-5 h-5 text-white" />
                        </button>
                        <div className="flex-1">
                            <p className="text-xs font-bold">Narration Ready</p>
                            <div className="h-1 bg-red-900/30 rounded-full mt-2 w-full">
                                <div className="h-1 bg-red-500 rounded-full w-[100%]" />
                            </div>
                        </div>
                        <Volume2 className="w-4 h-4 text-red-500" />
                    </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={previewNarration}
                    disabled={!!isGenerating || isPreviewing || project.scenes.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-[#1f2128] hover:bg-[#2a2d35] border border-[#2a2d35] disabled:opacity-50 text-white py-2 rounded-xl transition-all text-xs font-bold"
                  >
                    {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Play className="w-4 h-4 text-red-500" />}
                    <span>Preview Scene 1 Narration</span>
                  </button>

                  <button 
                    onClick={generateNarration}
                    disabled={!!isGenerating || isPreviewing || project.scenes.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-3 rounded-xl transition-all font-bold shadow-lg shadow-red-900/20"
                  >
                    {isGenerating === 'narration' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                    <span>Synthesize Full Narration</span>
                  </button>
                </div>
            </div>
          </div>
        </div>

        {/* Right: Music */}
        <div className="hardware-card flex flex-col h-full bg-[#151619]">
          <div className="p-6 border-b border-[#2a2d35] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold uppercase tracking-widest text-sm">Music Generator</h3>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold text-[#4e515a] tracking-widest">Description / Prompt</label>
              <textarea 
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                className="w-full h-24 bg-[#0a0a0b] border border-[#2a2d35] rounded-xl p-4 text-sm text-white placeholder-[#4e515a] focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Ex: Epic cinematic orchestral score with light acoustic guitar..."
              />
              <div className="flex flex-wrap gap-2">
                {['Cinematic', 'Lofi', 'Orchestral', 'Synthwave', 'Epic', 'Acoustic', 'Horror', 'Cyberpunk', 'Zen', 'Jazz'].map(style => (
                    <button 
                        key={style}
                        onClick={() => {
                          const separator = musicPrompt ? ', ' : '';
                          setMusicPrompt(prev => prev + `${separator}${style}`);
                        }}
                        className="px-2 py-1 bg-[#1f2128] border border-[#2a2d35] rounded text-[10px] text-[#8e9299] hover:text-white transition-colors"
                    >
                        + {style}
                    </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#2a2d35] rounded-2xl bg-[#0d0d0f]">
                {project.audio?.musicUrl ? (
                    <>
                        <div className="w-20 h-20 rounded-full border-4 border-blue-500/30 flex items-center justify-center mb-4 relative">
                            <button 
                                onClick={previewMusic}
                                className="absolute inset-2 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-10"
                            >
                                <Play className="w-8 h-8 text-white ml-1" />
                            </button>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 border-t-4 border-blue-500 rounded-full"
                            />
                        </div>
                        <h4 className="font-bold mb-1">Theme Computed</h4>
                        <p className="text-xs text-[#8e9299]">30s Original composition ready</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-[#1f2128] flex items-center justify-center mb-4">
                            <ListMusic className="w-8 h-8 text-[#4e515a]" />
                        </div>
                        <p className="text-sm text-[#8e9299]">Define your style and hit compose</p>
                    </>
                )}
            </div>

            <button 
              onClick={generateMusic}
              disabled={!!isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl transition-all font-bold shadow-lg shadow-blue-900/20"
            >
              {isGenerating === 'music' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>Generate Audio Theme</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audio Mixer */}
      <div className="hardware-card p-6 bg-[#151619]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-green-500" />
            <h3 className="font-bold uppercase tracking-widest text-sm">Audio Mixer</h3>
          </div>
          
          <button 
            onClick={previewFullMix}
            disabled={!project.audio?.narrationUrl || !project.audio?.musicUrl}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-full transition-all text-xs font-bold flex items-center gap-2 shadow-lg shadow-green-900/20"
          >
            <Play className="w-3 h-3" />
            <span>Test Final Mix</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-[#4e515a] tracking-widest">Narration Volume</span>
              <span className="text-xs text-[#8e9299]">{Math.round(volume * 100)}%</span>
            </div>
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
              className="w-full h-2 bg-[#1f2128] rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-[#4e515a] tracking-widest">Background Music Volume</span>
              <span className="text-xs text-[#8e9299]">{Math.round(musicVolume * 100)}%</span>
            </div>
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
              className="w-full h-2 bg-[#1f2128] rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCloneConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#151619] border border-[#2a2d35] rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Voice Cloning Consent</h3>
                  <p className="text-xs text-[#8e9299]">Confirmation required for synthesis</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-sm text-[#8e9299] leading-relaxed">
                  By proceeding, you confirm that you have the right to clone this voice and that it will be used in accordance with our terms of service. This process creates a digital replica of the provided audio sample.
                </p>
                <div className="p-3 bg-[#0d0d0f] border border-[#2a2d35] rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-[#4e515a] mb-1">Target Voice</p>
                  <p className="text-sm font-bold text-white">{newVoiceName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    setShowCloneConfirm(false);
                    setPendingVoiceFile(null);
                  }}
                  className="px-4 py-3 bg-[#1f2128] hover:bg-[#2a2d35] rounded-xl text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeCloning}
                  className="px-4 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold text-white transition-colors shadow-lg shadow-red-900/20"
                >
                  Authorize & Clone
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
