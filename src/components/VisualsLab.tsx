import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Sparkles,
  Zap,
  Palette,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { VideoProject } from '../core/domain/types';
import { useKeyBindings } from '../core/hooks/useKeyBindings';

interface VisualsLabProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function VisualsLab({ project, onUpdate, onPrev, onNext }: VisualsLabProps) {
  const [thumbnailConcept, setThumbnailConcept] = useState('Cinematic');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(project.scenes[0]?.id || null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const styleDropdownRef = useRef<HTMLDivElement>(null);
  const { getAIProviderInstance } = useSettingsStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(event.target as Node)) {
        setIsStyleDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeScene = project.scenes.find(s => s.id === selectedSceneId);
  const activeIndex = project.scenes.findIndex(s => s.id === selectedSceneId);

  const imageStyle = activeScene?.imageStyle ?? 'Cinematic';
  const setImageStyle = (style: string) => {
    if (!activeScene) return;
    onUpdate({
      ...project,
      scenes: project.scenes.map(s => s.id === activeScene.id ? { ...s, imageStyle: style } : s)
    });
  };
  
  const videoDuration = activeScene?.videoDuration ?? 4;
  const setVideoDuration = (duration: number) => {
    if (!activeScene) return;
    onUpdate({
      ...project,
      scenes: project.scenes.map(s => s.id === activeScene.id ? { ...s, videoDuration: duration } : s)
    });
  };

  const motionIntensity = activeScene?.motionIntensity ?? 5;
  const setMotionIntensity = (intensity: number) => {
    if (!activeScene) return;
    onUpdate({
      ...project,
      scenes: project.scenes.map(s => s.id === activeScene.id ? { ...s, motionIntensity: intensity } : s)
    });
  };

  const motionType = activeScene?.motionType ?? 'Dynamic';
  const setMotionType = (type: string) => {
    if (!activeScene) return;
    onUpdate({
      ...project,
      scenes: project.scenes.map(s => s.id === activeScene.id ? { ...s, motionType: type } : s)
    });
  };

  const generateThumbnailVariations = async (sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene || isGenerating) return;

    setIsGenerating(sceneId + '_variations');
    try {
      const provider = getAIProviderInstance();
      const prompt = `${thumbnailConcept}. ${scene.description}`;
      const imageUrls = await provider.generateThumbnailVariations(prompt);
      onUpdate({
        ...project,
        scenes: project.scenes.map(s => s.id === sceneId ? { ...s, thumbnailVariations: imageUrls } : s)
      });
    } catch (error: any) {
      console.error('Thumbnail variation generation failed', error);
      alert(`Thumbnail Generation Failed: ${error.message}`);
    } finally {
      setIsGenerating(null);
    }
  };
  
  const selectThumbnail = (imageUrl: string) => {
      if (!activeScene) return;
      onUpdate({
        ...project,
        scenes: project.scenes.map(s => s.id === activeScene.id ? { ...s, imageUrl, thumbnailVariations: undefined } : s)
      });
  };

  const generateImage = async (sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene || isGenerating) return;

    setIsGenerating(sceneId);
    try {
      const provider = getAIProviderInstance();
      const stylePrompt = imageStyle !== 'None' ? `Style: ${imageStyle}. ${scene.description}` : scene.description;
      const imageUrl = await provider.generateImage(stylePrompt);
      onUpdate({
        ...project,
        scenes: project.scenes.map(s => s.id === sceneId ? { ...s, imageUrl } : s)
      });
    } catch (error: any) {
      console.error('Image generation failed', error);
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        alert('API Key Error: Please go to the AI Studio Settings > Secrets panel and select a valid Google Cloud API Key with billing enabled.');
      } else {
        alert(`Image Generation Failed: ${error.message}`);
      }
    } finally {
      setIsGenerating(null);
    }
  };

  const generateVideo = async (sceneId: string) => {
    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene || !scene.imageUrl || isGenerating) {
        if (!scene?.imageUrl) alert('Generate an image first to use as a base for your video!');
        return;
    }

    setIsGenerating(sceneId + '_video');
    try {
      const provider = getAIProviderInstance();
      const videoPrompt = `${motionType} motion: ${scene.description}`;
      const videoUrl = await provider.generateVideo(videoPrompt, scene.imageUrl, videoDuration, motionIntensity);
      onUpdate({
        ...project,
        scenes: project.scenes.map(s => s.id === sceneId ? { ...s, videoUrl } : s)
      });
    } catch (error: any) {
        console.error('Video generation failed', error);
        if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
          alert('API Key Error: Please go to the AI Studio Settings > Secrets panel and select a valid Google Cloud API Key with billing enabled.');
        } else {
          alert(`Video Generation Failed: ${error.message}`);
        }
    } finally {
        setIsGenerating(null);
    }
  };

  const refineActiveScene = async () => {
    if (!activeScene || isRefining) return;
    setIsRefining(true);
    
    console.log(`[${new Date().toISOString()}] [VisualsLab] Iniciando refinação para cena: ${activeScene.id}`);
    
    try {
      const provider = getAIProviderInstance();
      // Enhance context for better image quality
      const contextAwarePrompt = `Act as an expert Art Director. Refine the following scene description into a highly detailed, professional text-to-image prompt.
      
      Focus on:
      - Lighting & Atmospheric Effects (e.g., golden hour, rim lighting, atmospheric fog).
      - Composition (e.g., rule of thirds, dramatic framing, wide angle, close-up).
      - Artistic Details (e.g., texture, color palette, sharpness, photographic quality).
      
      Style: ${imageStyle}
      Scene Narration: ${activeScene.narrationText || 'No narration provided'}
      Original Description to transform: ${activeScene.description}
      
      Output ONLY the refined prompt, do not include introductory text.`;

      const refined = await provider.refinePrompt(contextAwarePrompt, imageStyle);
      
      console.log(`[${new Date().toISOString()}] [VisualsLab] Cena ${activeScene.id} refinada com sucesso.`);
      
      onUpdate({
        ...project,
        scenes: project.scenes.map(s => s.id === activeScene.id ? { ...s, description: refined } : s)
      });
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] [VisualsLab] ERRO: Falha na refinação da cena ${activeScene.id}:`, error);
      alert(`Refinement failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsRefining(false);
    }
  };

  useKeyBindings({
    'ArrowDown': () => {
       if (activeIndex < project.scenes.length - 1) setSelectedSceneId(project.scenes[activeIndex + 1].id);
    },
    'ArrowUp': () => {
       if (activeIndex > 0) setSelectedSceneId(project.scenes[activeIndex - 1].id);
    },
    'Cmd+Enter': () => {
       if (activeScene) {
         if (!activeScene.imageUrl) generateImage(activeScene.id);
         else generateVideo(activeScene.id);
       }
    }
  });

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visuals Lab</h2>
          <p className="text-[#8e9299] text-sm">Bring your scenes to life with AI images and video.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={onPrev} className="px-4 py-2 bg-[#1f2128] hover:bg-[#252832] rounded-lg transition-colors flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span>Script</span>
            </button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2">
                <span>Audio</span>
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Scene List */}
        <aside className="lg:col-span-1 hardware-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#2a2d35] bg-[#1f2128]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#8e9299]">Storyline Scenes</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {project.scenes.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => setSelectedSceneId(scene.id)}
                className={`w-full text-left p-3 rounded-lg transition-all border ${
                  selectedSceneId === scene.id 
                    ? 'bg-[#1f2128] border-blue-500/50 shadow-lg shadow-blue-500/10' 
                    : 'border-transparent hover:bg-[#1a1b1e] hover:border-[#2a2d35]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-blue-400 tracking-tighter uppercase">Scene {idx + 1}</span>
                  <div className="flex gap-1">
                    {scene.imageUrl && <ImageIcon className="w-3 h-3 text-green-400" />}
                    {scene.videoUrl && <Video className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>
                <p className="text-xs text-white line-clamp-2 truncate">{scene.description.split('.')[0]}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Workspace */}
        <div className="lg:col-span-3 hardware-card flex flex-col overflow-hidden bg-[#0d0d0f] relative">
          <AnimatePresence mode="wait">
          {activeScene ? (
            <motion.div 
              key={activeScene.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full absolute inset-0"
            >
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
                    <div className="relative" ref={styleDropdownRef}>
                        <button
                            onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                            className="bg-[#1f2128] border border-[#2a2d35] hover:border-blue-500/50 hover:bg-[#252832] rounded-lg px-3 py-2 text-xs flex items-center gap-2 transition-all font-medium text-gray-300"
                        >
                            <Palette className="w-3.5 h-3.5 text-blue-400" />
                            <span>{imageStyle === 'None' ? 'No Style' : imageStyle}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isStyleDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isStyleDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-[#1f2128] border border-[#2a2d35] rounded-xl shadow-2xl overflow-hidden z-50 origin-top-right backdrop-blur-xl"
                                >
                                    <div className="p-1.5 flex flex-col gap-0.5">
                                        {[
                                            { id: 'None', label: 'No Style' },
                                            { id: 'Cinematic', label: 'Cinematic' },
                                            { id: 'Anime', label: 'Anime' },
                                            { id: 'Cyberpunk', label: 'Cyberpunk' },
                                            { id: 'Oil Painting', label: 'Oil Painting' },
                                            { id: '3D Render', label: '3D Render' },
                                            { id: 'Photorealistic', label: 'Photorealistic' },
                                        ].map(style => (
                                            <button
                                                key={style.id}
                                                onClick={() => {
                                                    setImageStyle(style.id);
                                                    setIsStyleDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between group ${
                                                    imageStyle === style.id 
                                                    ? 'bg-blue-500/10 text-blue-400' 
                                                    : 'text-gray-400 hover:bg-[#252832] hover:text-gray-200'
                                                }`}
                                            >
                                                <span>{style.label}</span>
                                                {imageStyle === style.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    <input
                        type="text"
                        value={thumbnailConcept}
                        onChange={(e) => setThumbnailConcept(e.target.value)}
                        placeholder="e.g. 'Viral YouTube Thumbnail, High Contrast'"
                        className="bg-[#1f2128] border border-[#2a2d35] rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none w-48"
                    />

                    <button 
                        onClick={refineActiveScene}
                        disabled={isRefining}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1f2128] border border-[#2a2d35] hover:border-purple-500/50 hover:bg-[#252832] disabled:opacity-50 rounded-lg transition-all font-medium text-sm text-purple-400 group"
                        title="Enhance Prompt using AI"
                    >
                        {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform" />}
                        <span>AI Refine</span>
                    </button>

                    <button 
                        onClick={() => generateImage(activeScene.id)}
                        disabled={!!isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-all font-medium text-sm"
                    >
                        {isGenerating === activeScene.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        <span>{activeScene.imageUrl ? 'Re-gen Image' : 'Gen Image'}</span>
                    </button>
                    <button 
                        onClick={() => generateThumbnailVariations(activeScene.id)}
                        disabled={!!isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1f2128] border border-[#2a2d35] hover:border-purple-500/50 hover:bg-[#252832] disabled:opacity-50 rounded-lg transition-all font-medium text-sm group"
                        title="AI Suggestions"
                    >
                        {isGenerating === activeScene.id + '_variations' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />}
                        <span>Suggest</span>
                    </button>
                    <button 
                        onClick={() => generateVideo(activeScene.id)}
                        disabled={!!isGenerating || !activeScene.imageUrl}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1f2128] border border-[#2a2d35] hover:border-blue-500/50 hover:bg-[#252832] disabled:opacity-50 rounded-lg transition-all font-medium text-sm group"
                    >
                        {isGenerating === activeScene.id + '_video' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />}
                        <span>AI Video Gen</span>
                    </button>
                </div>
              </div>

              <div className="px-6 py-4 border-b border-[#2a2d35] bg-[#151619]/50 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex flex-col gap-1 min-w-[120px]">
                          <label className="text-[10px] font-bold text-[#4e515a] uppercase tracking-widest">Motion Type</label>
                          <select 
                              value={motionType}
                              onChange={(e) => setMotionType(e.target.value)}
                              className="bg-[#1f2128] border border-[#2a2d35] rounded px-2 py-1 text-[10px] text-blue-400 font-mono focus:border-blue-500 outline-none"
                          >
                              <option value="Dynamic">Dynamic</option>
                              <option value="Pan Left-to-Right">Pan L-R</option>
                              <option value="Zoom In">Zoom In</option>
                              <option value="Tilt Down">Tilt Down</option>
                              <option value="Flowing Water">Flowing</option>
                              <option value="Time-lapse">Static/Time-lapse</option>
                          </select>
                      </div>
                      <div className="flex flex-col gap-1 w-[120px]">
                          <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-[#4e515a] uppercase tracking-widest">Duration</label>
                              <div className="flex items-center gap-1">
                                  <input 
                                      type="number" 
                                      min="2" 
                                      max="10" 
                                      value={videoDuration}
                                      onChange={(e) => setVideoDuration(parseInt(e.target.value) || 2)}
                                      className="w-10 bg-[#1f2128] border border-[#2a2d35] rounded px-1 py-0.5 text-[10px] text-blue-400 font-mono focus:border-blue-500 outline-none"
                                  />
                                  <span className="text-[10px] font-mono text-[#4e515a]">s</span>
                              </div>
                          </div>
                          <input 
                              type="range" 
                              min="2" 
                              max="10" 
                              value={videoDuration}
                              onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                              className="w-full accent-blue-500 h-1 bg-[#1f2128] rounded-full appearance-none cursor-pointer"
                          />
                      </div>
                      <div className="flex flex-col gap-1 w-[120px]">
                          <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-[#4e515a] uppercase tracking-widest">Intensity</label>
                              <span className="text-[10px] font-mono text-blue-400">{motionIntensity}</span>
                          </div>
                          <input 
                              type="range" 
                              min="1" 
                              max="10" 
                              value={motionIntensity}
                              onChange={(e) => setMotionIntensity(parseInt(e.target.value))}
                              className="w-full accent-blue-500 h-1 bg-[#1f2128] rounded-full appearance-none cursor-pointer"
                          />
                      </div>
                  </div>
                  
                  <button 
                      onClick={() => generateVideo(activeScene.id)}
                      disabled={!!isGenerating || !activeScene.imageUrl}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-all font-medium text-sm text-white"
                  >
                      {isGenerating === activeScene.id + '_video' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                      <span>Generate Video Clip</span>
                  </button>
              </div>

              <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="p-4 bg-[#151619] border border-[#2a2d35] rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="text-[10px] uppercase font-bold text-[#4e515a] tracking-widest">Visual Prompt</h5>
                                <button 
                                    onClick={refineActiveScene}
                                    disabled={isRefining}
                                    className="px-3 py-1.5 flex items-center gap-1.5 bg-[#1f2128] border border-[#2a2d35] hover:border-purple-500/50 rounded-md text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-purple-900/20"
                                >
                                    {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    Auto-Refine
                                </button>
                            </div>
                            <div className="relative">
                                <textarea 
                                    value={activeScene.description}
                                    onChange={(e) => onUpdate({
                                        ...project,
                                        scenes: project.scenes.map(s => s.id === activeScene.id ? { ...s, description: e.target.value } : s)
                                    })}
                                    disabled={isRefining}
                                    className={`w-full h-32 bg-[#0d0d0f] border ${isRefining ? 'border-purple-500 animate-pulse' : 'border-[#2a2d35]'} rounded-lg p-3 text-sm text-[#8e9299] focus:outline-none focus:border-blue-500 transition-colors resize-none italic`}
                                    placeholder="Describe the visual scene..."
                                />
                                {isRefining && (
                                    <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-purple-900/10 backdrop-blur-[1px]">
                                        <div className="flex items-center gap-2 text-purple-400 bg-[#151619] px-4 py-2 rounded-full border border-purple-500/30">
                                            <Sparkles className="w-4 h-4 animate-pulse" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Enhancing Prompt...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-[#151619] border border-[#2a2d35] rounded-xl">
                            <h5 className="text-[10px] uppercase font-bold text-[#4e515a] mb-2 tracking-widest">Narration Overlay</h5>
                            <p className="text-sm leading-relaxed">
                                {activeScene.narrationText}
                            </p>
                        </div>
                     </div>

                      <div className="aspect-video bg-[#151619] rounded-xl overflow-hidden border border-[#2a2d35] relative flex items-center justify-center group">
                        {activeScene.videoUrl ? (
                            <motion.video 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                src={activeScene.videoUrl} 
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                            />
                        ) : activeScene.imageUrl ? (
                            <motion.img 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                src={activeScene.imageUrl} 
                                alt="Generated Scene" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                           <div className="text-center p-8 opacity-20">
                               <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                               <p className="text-sm">Press Cmd+Enter to Gen Image</p>
                           </div>
                        )}
                        
                        {(isGenerating === activeScene.id || isGenerating === activeScene.id + '_video') && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest text-blue-400 animate-pulse">Rendering...</p>
                                <p className="text-xs text-[#8e9299] mt-2">Connecting to AI Factory</p>
                            </div>
                        )}
                        
                        {activeScene.thumbnailVariations && activeScene.thumbnailVariations.length > 0 && !activeScene.videoUrl && (
                            <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto p-2 bg-black/50 backdrop-blur-md rounded-lg">
                                {activeScene.thumbnailVariations.map((url, i) => (
                                    <button key={i} onClick={() => selectThumbnail(url)} className="flex-shrink-0 w-20 h-12 rounded overflow-hidden border-2 border-transparent hover:border-blue-500">
                                        <img src={url} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                     </div>
                </div>

                {/* Strip Preview */}
                <div className="mt-auto pt-4 border-t border-[#2a2d35]">
                    <h5 className="text-[10px] uppercase font-bold text-[#4e515a] mb-3 tracking-widest">Master Timeline Asset Preview</h5>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        {project.scenes.map((s, i) => (
                            <div 
                                key={s.id} 
                                onClick={() => setSelectedSceneId(s.id)}
                                className={`w-32 flex-shrink-0 aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:-translate-y-1 ${
                                    selectedSceneId === s.id ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/20' : 'border-[#2a2d35] opacity-60 hover:opacity-100 hover:border-[#4e515a]'
                                }`}
                            >
                                {s.imageUrl ? (
                                    <img src={s.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-full h-full bg-[#1f2128] flex items-center justify-center text-[10px] font-bold text-[#4e515a]">S{i+1}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-[#4e515a]"
            >
                <Zap className="w-12 h-12 mb-4 opacity-10" />
                <p>Select a scene from the left to start generating assets.</p>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
