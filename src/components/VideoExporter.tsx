import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Share2, 
  Youtube, 
  Rocket, 
  CheckCircle2, 
  Loader2, 
  Play,
  Layers,
  ArrowBigRightDash,
  ExternalLink,
  UploadCloud,
  X,
  Settings,
  Image as ImageIcon,
  Clock,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Maximize2,
  Minimize2,
  Search,
  FileText,
  Tags,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoProject } from '../core/domain/types';
import confetti from 'canvas-confetti';
import ThumbnailCreator from './ThumbnailCreator';
import { youtubeChannelService } from '../core/services/youtubeChannelService';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { useYoutubeStore } from '../core/store/useYoutubeStore';

interface VideoExporterProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onPrev: () => void;
}

export default function VideoExporter({ project, onUpdate, onPrev }: VideoExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Youtube Upload State
  const [showYoutubeUploader, setShowYoutubeUploader] = useState(false);
  const [showThumbnailCreator, setShowThumbnailCreator] = useState(false);
  const { channels, fetchChannels } = useYoutubeStore();
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState(project.title);
  const [uploadDescription, setUploadDescription] = useState(project.idea || '');
  const [uploadTags, setUploadTags] = useState<string>('');
  const [isOptimizingSEO, setIsOptimizingSEO] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState<string>('private');
  const [categoryId, setCategoryId] = useState<string>('22'); // People & Blogs
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadETA, setUploadETA] = useState<string>('');
  const [seoResults, setSeoResults] = useState<{ titles: string[], description: string, tags: string[] } | null>(null);
  const [showSEOPanel, setShowSEOPanel] = useState(false);
  const [seoScore, setSeoScore] = useState(0);
  const uploadStartTime = useRef<number>(0);

  const calculateSEOScore = () => {
      let score = 0;
      // Title logic
      if (uploadTitle.length > 5 && uploadTitle.length < 30) score += 10;
      else if (uploadTitle.length >= 30 && uploadTitle.length <= 70) score += 25;
      
      // Description logic
      if (uploadDescription.length > 100) score += 25;
      
      // Tags logic
      const tagCount = uploadTags.split(',').filter(t => t.trim().length > 0).length;
      if (tagCount > 0 && tagCount < 5) score += 10;
      else if (tagCount >= 5) score += 20;

      // Keywords match
      if (project.keywords) {
          const matchingKeywords = project.keywords.filter(kw => 
              uploadTitle.toLowerCase().includes(kw.toLowerCase()) || 
              uploadDescription.toLowerCase().includes(kw.toLowerCase())
          );
          if (matchingKeywords.length > 0) score += 30;
      }
      
      setSeoScore(Math.min(score, 100));
  };

  useEffect(() => {
     calculateSEOScore();
  }, [uploadTitle, uploadDescription, uploadTags]);
  const uploadProgressHistory = useRef<{loaded: number, time: number}[]>([]);

  const YOUTUBE_CATEGORIES = [
    { id: '1', name: 'Film & Animation' },
    { id: '2', name: 'Autos & Vehicles' },
    { id: '10', name: 'Music' },
    { id: '15', name: 'Pets & Animals' },
    { id: '17', name: 'Sports' },
    { id: '19', name: 'Travel & Events' },
    { id: '20', name: 'Gaming' },
    { id: '22', name: 'People & Blogs' },
    { id: '23', name: 'Comedy' },
    { id: '24', name: 'Entertainment' },
    { id: '25', name: 'News & Politics' },
    { id: '26', name: 'Howto & Style' },
    { id: '27', name: 'Education' },
    { id: '28', name: 'Science & Technology' },
  ];

  const { systemSettings, getAIProviderInstance } = useSettingsStore();
  const [hasToken, setHasToken] = useState(false);

  // Validation Logic
  const validation = {
    hasScript: !!project.script && project.script.length > 50,
    hasVisuals: project.scenes.length > 0 && project.scenes.every(s => !!s.imageUrl),
    hasAudio: !!project.audio?.narrationUrl && !!project.audio?.musicUrl,
    isRendered: project.status === 'completed'
  };

  const isReadyToExport = validation.hasScript && validation.hasVisuals && validation.hasAudio;

  useEffect(() => {
    fetchChannels();
    youtubeChannelService.hasToken().then(setHasToken);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleConnect = async () => {
    try {
      await youtubeChannelService.login();
      setHasToken(true);
      await fetchChannels();
    } catch (err: any) {
      alert("Erro ao conectar: " + err.message);
    }
  };

  useEffect(() => {
    if (channels.length > 0) {
      if (!selectedChannelId) setSelectedChannelId(channels[0].id);
      const ch = channels.find(c => c.id === (selectedChannelId || channels[0].id));
      if (ch && !uploadTags) setUploadTags(ch.tags?.join(', ') || '');
    }
  }, [channels, selectedChannelId]);

  const exportIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (thumbnailFile) {
      const url = URL.createObjectURL(thumbnailFile);
      setThumbnailPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setThumbnailPreviewUrl(null);
  }, [thumbnailFile]);

  useEffect(() => {
    return () => {
      if (exportIntervalRef.current) clearInterval(exportIntervalRef.current);
    };
  }, []);

  const startExport = () => {
    if (isExporting) return;
    if (!isReadyToExport) {
      alert("Please ensure script, visuals and audio are all ready before exporting.");
      return;
    }
    setIsExporting(true);
    setProgress(0);
    
    if (exportIntervalRef.current) clearInterval(exportIntervalRef.current);
    exportIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (exportIntervalRef.current) clearInterval(exportIntervalRef.current);
          setIsExporting(false);
          onUpdate({ ...project, status: 'completed' });
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#ef4444', '#ffffff']
          });
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const formatETA = (ms: number) => {
    if (ms <= 0) return 'Few seconds...';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    
    return parts.join(' ');
  };

  const handleUploadToYoutube = async () => {
    if (!selectedChannelId) return alert("Selecione um canal");
    if (project.status !== 'completed') return alert("Exporte o vídeo antes de publicar");

    setIsUploading(true);
    setUploadProgress(0);
    setUploadETA('Calculating...');
    uploadStartTime.current = Date.now();
    uploadProgressHistory.current = [];

    try {
      let finalBlob = new Blob([], { type: 'video/mp4' });

      // Gather real bytes from the generated videos in the project
      // To avoid huge memory spikes, we'll stream/fetch the first available video as our upload target
      const videoScenes = project.scenes.filter(s => s.videoUrl);
      if (videoScenes.length > 0 && videoScenes[0].videoUrl) {
         try {
            const resp = await fetch(videoScenes[0].videoUrl);
            if (resp.ok) {
              finalBlob = await resp.blob();
            }
         } catch (err) {
            console.error("Failed to fetch real video for upload, falling back to minimal payload", err);
         }
      }

      // If no valid video was generated yet, we throw an error instead of mocking
      if (finalBlob.size === 0) {
         throw new Error("No real video data found in the project. Please ensure scenes have generated videos.");
      }

      const metadata = {
        title: uploadTitle,
        description: uploadDescription,
        tags: uploadTags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        privacyStatus,
        categoryId
      };

      const videoId = await youtubeChannelService.uploadVideo(
        finalBlob, 
        metadata,
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setUploadProgress(percent);

          const now = Date.now();
          const history = uploadProgressHistory.current;
          history.push({ loaded: progress.loaded, time: now });

          if (history.length > 5) history.shift();

          if (history.length > 1) {
            const first = history[0];
            const last = history[history.length - 1];
            
            const timeDiff = last.time - first.time;
            const sizeDiff = last.loaded - first.loaded;
            
            if (timeDiff > 1000) { 
              const speed = sizeDiff / timeDiff; // bytes per ms
              const remaining = progress.total - progress.loaded;
              const etaMs = remaining / speed;
              setUploadETA(formatETA(etaMs));
            }
          }
        }
      );
      
      if (thumbnailFile) {
        await youtubeChannelService.setThumbnail(videoId, thumbnailFile);
      }

      alert(`Vídeo publicado com sucesso! ID: ${videoId}\nNota: Como este é um ambiente de desenvolvimento, enviamos um arquivo de demonstração.`);
      setShowYoutubeUploader(false);
    } catch (error: any) {
      console.error('YouTube upload failed', error);
      alert(`Erro no upload: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadETA('');
    }
  };

  const handleOptimizeSEO = async () => {
    if (isOptimizingSEO) return;
    setIsOptimizingSEO(true);
    setShowSEOPanel(false);
    try {
      const provider = getAIProviderInstance();
      const seo = await provider.optimizeSEO({
        idea: project.idea,
        title: project.title,
        targetAudience: project.targetAudience,
        keywords: project.keywords
      });
      
      setSeoResults(seo);
      setShowSEOPanel(true);
      
      // Auto-apply if it's the first time and we have a preferred one (optional logic)
      // For now, let the user choose.
    } catch (err: any) {
      console.error('SEO optimization failed', err);
      alert('SEO Optimization failed: ' + err.message);
    } finally {
      setIsOptimizingSEO(false);
    }
  };

  return (
    <div ref={containerRef} className={`flex flex-col h-full gap-8 max-w-4xl mx-auto py-8 transition-all ${isFullscreen ? 'bg-[#0a0a0b] p-12 w-full h-full max-w-full overflow-y-auto z-50 fixed inset-0' : ''}`}>
      <header className="relative text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tight uppercase italic">Final Assembly</h2>
        <p className="text-[#8e9299]">Merging scripts, visuals, and audio into a high-definition final render.</p>
        <button 
          onClick={toggleFullscreen}
          className="absolute right-0 top-0 p-2 text-[#8e9299] hover:text-white hover:bg-[#1f2128] rounded-xl transition-all"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5"/> : <Maximize2 className="w-5 h-5" />}
        </button>
      </header>

      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ height: 0, opacity: 0, scale: 0.95 }}
            animate={{ height: 'auto', opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.95 }}
            className="overflow-hidden"
          >
            <div className="p-6 hardware-card border-blue-500/30 bg-blue-500/5 mb-2">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                     <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Rendering Module Active</span>
                     <span className="text-[10px] text-[#8e9299] font-mono">
                       {progress < 25 ? 'Initializing timeline...' : 
                        progress < 50 ? 'Merging sequences and transitions...' : 
                        progress < 75 ? 'Synthesizing main audio track...' : 'Final encoding to VP9/H.264/AAC...'}
                     </span>
                   </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-display text-blue-500 italic">{progress}%</span>
                </div>
              </div>
              <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-1">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                />
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-[9px] text-[#4e515a] font-bold uppercase tracking-[0.2em]">Core Processing Node: Beta-7</span>
                <div className="flex gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1 h-3 rounded-sm transition-colors duration-300 ${i < (progress / 12.5) ? 'bg-blue-500' : 'bg-[#1f2128]'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="hardware-card aspect-video relative overflow-hidden group">
            {project.scenes.length > 0 && project.scenes[0].imageUrl ? (
                <img src={project.scenes[0].imageUrl} className="w-full h-full object-cover blur-[2px]" referrerPolicy="no-referrer" />
            ) : (
                <div className="w-full h-full bg-[#1f2128]" />
            )}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                {isExporting ? (
                    <div className="w-48">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                            <span>Rendering Module</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-300" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : project.status === 'completed' ? (
                    <div className="text-center animate-bounce-subtle">
                         <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                         <span className="font-bold uppercase tracking-widest text-sm">Render Success</span>
                    </div>
                ) : (
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-full group-hover:scale-110 transition-transform cursor-pointer" onClick={startExport}>
                        <Play className="w-12 h-12 text-white ml-1" />
                    </div>
                )}
            </div>
            {isExporting && (
                <div className="absolute top-4 left-4 p-2 bg-black/60 backdrop-blur-sm rounded text-[10px] font-mono border border-white/10">
                   {progress < 25 ? 'INIT_TIMELINE' : 
                    progress < 50 ? 'MERGING_SEQUENCES' : 
                    progress < 75 ? 'SYSTHESIZING_AUDIO' : 'ENCODING_VP9'}
                </div>
            )}
        </div>

        <div className="flex flex-col gap-6">
            <div className="space-y-4">
                {/* Validation Checklist */}
                <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#4e515a] mb-2">Export Readiness</p>
                    
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                             <CheckCircle2 className={`w-3 h-3 ${validation.hasScript ? 'text-green-500' : 'text-[#4e515a]'}`} />
                             <span className={validation.hasScript ? 'text-white' : 'text-[#8e9299]'}>Narrative Script</span>
                        </div>
                        {!validation.hasScript && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                             <CheckCircle2 className={`w-3 h-3 ${validation.hasVisuals ? 'text-green-500' : 'text-[#4e515a]'}`} />
                             <span className={validation.hasVisuals ? 'text-white' : 'text-[#8e9299]'}>Visual Sequences ({project.scenes.filter(s => s.imageUrl).length}/{project.scenes.length})</span>
                        </div>
                        {!validation.hasVisuals && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                             <CheckCircle2 className={`w-3 h-3 ${validation.hasAudio ? 'text-green-500' : 'text-[#4e515a]'}`} />
                             <span className={validation.hasAudio ? 'text-white' : 'text-[#8e9299]'}>Audio (Narration & Music)</span>
                        </div>
                        {!validation.hasAudio && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                    </div>
                </div>

                {/* Video Metadata Section */}
                <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4e515a]">Video Metadata</p>
                        <button 
                            onClick={handleOptimizeSEO}
                            disabled={isOptimizingSEO}
                            className="text-[9px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 px-2 py-0.5 bg-blue-400/10 rounded-full border border-blue-400/20 disabled:opacity-50"
                        >
                            {isOptimizingSEO ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                            <span>AI Optimize</span>
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#8e9299] uppercase">Title</label>
                        <input 
                            type="text" 
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            className="w-full bg-[#151619] border border-[#2a2d35] rounded-lg px-3 py-2 text-xs text-white focus:border-red-500/50 outline-none transition-all"
                            placeholder="Video Title..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#8e9299] uppercase">Description</label>
                        <textarea 
                            value={uploadDescription}
                            onChange={(e) => setUploadDescription(e.target.value)}
                            className="w-full bg-[#151619] border border-[#2a2d35] rounded-lg px-3 py-2 text-xs text-white focus:border-red-500/50 outline-none transition-all resize-none min-h-[80px] custom-scrollbar"
                            placeholder="Video Description..."
                        />
                    </div>

                    {/* SEO Health Monitor */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[8px] font-bold text-[#4e515a] uppercase tracking-[0.2em]">SEO Health Index</span>
                            <span className={`text-[10px] font-mono font-bold ${seoScore > 80 ? 'text-green-500' : seoScore > 50 ? 'text-blue-500' : 'text-yellow-500'}`}>
                                {seoScore}%
                            </span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${seoScore}%` }}
                                className={`h-full transition-all duration-1000 ${seoScore > 80 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : seoScore > 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                            />
                        </div>
                    </div>

                    {/* Main View SEO Suggestions */}
                    <AnimatePresence>
                        {showSEOPanel && seoResults && !showYoutubeUploader && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-blue-500/5 border border-blue-500/20 rounded-lg overflow-hidden"
                            >
                                <div className="p-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-[9px] font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                                            <Sparkles className="w-2.5 h-2.5" />
                                            SEO Suggestions
                                        </h5>
                                        <button onClick={() => setShowSEOPanel(false)} className="text-[#4e515a] hover:text-white transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-bold text-[#4e515a] uppercase">Suggested Titles</p>
                                        <div className="grid grid-cols-1 gap-1">
                                            {seoResults.titles.slice(0, 2).map((t, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => setUploadTitle(t)}
                                                    className="text-left p-1.5 rounded bg-black/40 border border-white/5 text-[10px] text-gray-400 hover:text-white hover:border-blue-500/30 transition-all truncate"
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setUploadDescription(seoResults.description)}
                                            className="flex-1 flex items-center justify-center gap-1.5 p-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 hover:bg-blue-500/20 transition-all"
                                        >
                                            <FileText className="w-2.5 h-2.5" />
                                            Apply AI Description
                                        </button>
                                        <button 
                                            onClick={() => setUploadTags(seoResults.tags.join(', '))}
                                            className="flex-1 flex items-center justify-center gap-1.5 p-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 hover:bg-blue-500/20 transition-all"
                                        >
                                            <Tags className="w-2.5 h-2.5" />
                                            Apply AI Tags
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-green-900/20 flex items-center justify-center">
                        <Layers className="text-green-500 w-6 h-6" />
                   </div>
                   <div>
                       <h4 className="font-bold">Project Integrity</h4>
                       <p className="text-xs text-[#8e9299]">{project.scenes.length} Scenes / {project.audio?.narrationUrl ? '1 Narration' : 'No Narration'} / {project.audio?.musicUrl ? '1 Music' : 'No Music'}</p>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-blue-900/20 flex items-center justify-center">
                        <Settings className="text-blue-500 w-6 h-6" />
                   </div>
                   <div>
                       <h4 className="font-bold">Export Specs</h4>
                       <div className="flex gap-2 mt-1">
                           <select
                               value={project.exportSettings?.resolution || systemSettings?.defaultResolution || '1080p'}
                               onChange={(e) => onUpdate({ ...project, exportSettings: { resolution: e.target.value as any, framerate: project.exportSettings?.framerate || systemSettings?.framerate || 30 } })}
                               className="bg-[#1f2128] border border-[#2a2d35] rounded px-2 py-1 text-xs focus:border-blue-500 outline-none"
                           >
                               <option value="720p">720p</option>
                               <option value="1080p">1080p</option>
                               <option value="4k">4k</option>
                           </select>
                           <select
                               value={project.exportSettings?.framerate || systemSettings?.framerate || 30}
                               onChange={(e) => onUpdate({ ...project, exportSettings: { resolution: project.exportSettings?.resolution || systemSettings?.defaultResolution || '1080p', framerate: parseInt(e.target.value) as any } })}
                               className="bg-[#1f2128] border border-[#2a2d35] rounded px-2 py-1 text-xs focus:border-blue-500 outline-none"
                           >
                               <option value="30">30 fps</option>
                               <option value="60">60 fps</option>
                               <option value="24">24 fps</option>
                           </select>
                       </div>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={startExport}
                    disabled={isExporting || !isReadyToExport}
                    className="flex flex-col items-center justify-center p-6 hardware-card border-blue-500/30 hover:border-blue-500 bg-blue-500/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                >
                    <Rocket className={`w-8 h-8 ${isReadyToExport ? 'text-blue-400' : 'text-gray-500'} mb-2`} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${isReadyToExport ? 'text-blue-400' : 'text-gray-500'}`}>Final Render</span>
                </button>
                <button 
                   onClick={() => {
                     if (!validation.isRendered) {
                        alert("You must render the video fully before uploading to YouTube.");
                        return;
                     }
                     setShowYoutubeUploader(true);
                   }}
                   disabled={isExporting || !validation.isRendered} 
                   className={`flex flex-col items-center justify-center p-6 hardware-card transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 ${project.status === 'completed' ? 'border-red-500/50 hover:border-red-500 bg-red-500/5' : 'border-[#2a2d35]'}`}
                >
                    <Youtube className={`w-8 h-8 ${project.status === 'completed' ? 'text-red-500' : 'text-[#4e515a]'} mb-2`} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${project.status === 'completed' ? 'text-red-400' : 'text-[#4e515a]'}`}>Direct Upload</span>
                </button>
            </div>

            <div className="mt-4 pt-6 border-t border-[#2a2d35]">
                 <p className="text-[10px] uppercase font-bold text-[#4e515a] mb-4 tracking-widest">Post-Production Actions</p>
                 <div className="flex gap-4">
                    <button 
                         className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1f2128] hover:bg-[#252832] rounded-xl transition-all text-sm font-bold border border-[#2a2d35]"
                         title="Soon: Combine all clips into a single MP4"
                         onClick={() => {
                            if (!validation.hasVisuals) return;
                            alert("Single MP4 combination requires a backend encoding service. For now, we will download individual clips.");
                            project.scenes.forEach((scene, i) => {
                                if (scene.videoUrl) {
                                    const a = document.createElement('a');
                                    a.href = scene.videoUrl;
                                    a.download = `scene-${i+1}.mp4`;
                                    a.click();
                                }
                            });
                         }}
                    >
                        <Download className="w-4 h-4" />
                        <span>Download MP4(s)</span>
                    </button>
                    <button 
                         className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1f2128] hover:bg-[#252832] rounded-xl transition-all text-sm font-bold border border-[#2a2d35]"
                         onClick={() => {
                              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
                              const downloadAnchorNode = document.createElement('a');
                              downloadAnchorNode.setAttribute("href", dataStr);
                              downloadAnchorNode.setAttribute("download", `project-${project.id}.json`);
                              document.body.appendChild(downloadAnchorNode);
                              downloadAnchorNode.click();
                              downloadAnchorNode.remove();
                         }}
                    >
                        <Download className="w-4 h-4" />
                        <span>Backup JSON</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1f2128] hover:bg-[#252832] rounded-xl transition-all text-sm font-bold border border-[#2a2d35]">
                        <Share2 className="w-4 h-4" />
                        <span>Social Share</span>
                    </button>
                 </div>
            </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center text-[#4e515a]">
          <button onClick={onPrev} className="text-xs flex items-center gap-1 hover:text-white transition-colors">
              <ArrowBigRightDash className="w-4 h-4 rotate-180" />
              Adjust Audio Specs
          </button>
          <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              FACTORY_READY_NODE_0
          </div>
      </div>

      {/* Youtube Upload Modal */}
      <AnimatePresence>
        {showYoutubeUploader && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="hardware-card w-full max-w-2xl bg-[#0a0a0b] flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-[#2a2d35] flex items-center justify-between bg-[#1f2128]">
                <div className="flex items-center gap-3">
                  <Youtube className="w-6 h-6 text-red-500" />
                  <h3 className="font-bold uppercase tracking-widest">Publicar no YouTube</h3>
                </div>
                <button onClick={() => setShowYoutubeUploader(false)} className="p-2 hover:bg-[#2a2d35] rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                {!hasToken ? (
                   <div className="text-center p-8 space-y-4">
                     <Youtube className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-20" />
                     <h4 className="font-bold">Login Necessário</h4>
                     <p className="text-sm text-[#8e9299]">É necessário autorizar o acesso ao YouTube para realizar o envio direto.</p>
                     <button 
                       onClick={handleConnect}
                       className="bg-[#1f2128] hover:bg-[#2a2d35] border border-[#2a2d35] px-6 py-3 rounded-xl font-bold transition-all"
                     >
                       Conectar com Google
                     </button>
                   </div>
                ) : channels.length === 0 ? (
                   <div className="text-center p-8">
                     <Youtube className="w-16 h-16 opacity-20 mx-auto mb-4" />
                     <h4 className="font-bold mb-2">Nenhum canal configurado</h4>
                     <p className="text-sm text-[#8e9299]">Vá em "Canais do YouTube" no menu lateral para adicionar o seu perfil.</p>
                   </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[#151619] border border-[#2a2d35] rounded-2xl">
                          <div className="flex items-center gap-4">
                              <div className="relative w-12 h-12 flex items-center justify-center">
                                  <svg className="w-full h-full -rotate-90">
                                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[#1f2128]" />
                                      <motion.circle 
                                          cx="24" cy="24" r="20" 
                                          stroke="currentColor" strokeWidth="4" 
                                          fill="transparent" 
                                          strokeDasharray={125.6}
                                          initial={{ strokeDashoffset: 125.6 }}
                                          animate={{ strokeDashoffset: 125.6 - (125.6 * seoScore) / 100 }}
                                          className={seoScore > 80 ? 'text-green-500' : seoScore > 50 ? 'text-yellow-500' : 'text-red-500'} 
                                      />
                                  </svg>
                                  <span className={`absolute text-xs font-bold ${seoScore > 80 ? 'text-green-500' : seoScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>{seoScore}</span>
                              </div>
                              <div>
                                  <h4 className="text-sm font-bold uppercase tracking-widest leading-none">SEO Visibility Score</h4>
                                  <p className="text-[10px] text-[#8e9299] mt-1 font-mono uppercase">AI_ALGORITHM_READY: {seoScore > 75 ? 'TRUE' : 'FALSE'}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <span className="text-[8px] font-bold uppercase text-[#4e515a] tracking-widest block mb-1">Reach Potential</span>
                              <div className="flex gap-1 justify-end">
                                  {[...Array(5)].map((_, i) => (
                                      <div key={i} className={`w-2 h-1.5 rounded-sm ${i < (seoScore / 20) ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-[#2a2d35]'}`} />
                                  ))}
                              </div>
                          </div>
                      </div>

                      <label className="block text-xs font-bold uppercase text-[#8e9299]">Canal de Destino</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {channels.map(ch => (
                          <div 
                            key={ch.id} 
                            onClick={() => setSelectedChannelId(ch.id)}
                            className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                              selectedChannelId === ch.id ? 'border-red-500 bg-red-900/10' : 'border-[#2a2d35] hover:border-gray-500 bg-[#1f2128]'
                            }`}
                          >
                            <img src={ch.profileImageUrl || `https://ui-avatars.com/api/?name=${ch.name}`} className="w-10 h-10 rounded-full" />
                            <div className="flex-1 truncate">
                              <p className="font-bold text-sm truncate">{ch.name}</p>
                              <p className="text-xs text-[#8e9299] truncate">{ch.tags?.length} tags automáticas</p>
                            </div>
                            {selectedChannelId === ch.id && <CheckCircle2 className="w-5 h-5 text-red-500" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-4 mb-2">
                          <label className="block text-xs font-bold uppercase text-[#8e9299]">Título do Vídeo</label>
                          <button 
                            onClick={handleOptimizeSEO}
                            disabled={isOptimizingSEO}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 px-3 py-1 bg-blue-400/10 rounded-full border border-blue-400/20 disabled:opacity-50"
                          >
                            {isOptimizingSEO ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            <span>{seoResults ? 'Regenerate SEO' : 'Auto-Optimize SEO'}</span>
                          </button>
                      </div>

                      {/* SEO Suggestions Panel */}
                      <AnimatePresence>
                        {showSEOPanel && seoResults && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-6 bg-blue-500/5 border border-blue-500/20 rounded-xl overflow-hidden"
                          >
                            <div className="p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                  <Sparkles className="w-3 h-3" />
                                  AI SEO Laboratory
                                </h5>
                                <button onClick={() => setShowSEOPanel(false)} className="text-gray-500 hover:text-white">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="space-y-2">
                                <p className="text-[9px] font-bold text-[#4e515a] uppercase tracking-wider">Suggested Titles</p>
                                <div className="space-y-1.5">
                                  {seoResults.titles.map((t, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setUploadTitle(t);
                                        // Optional: mark as selected
                                      }}
                                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                                        uploadTitle === t 
                                          ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                                          : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/10 hover:text-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${uploadTitle === t ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-[#4e515a]'}`} />
                                        {t}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => setUploadDescription(seoResults.description)}
                                  className="flex items-center gap-2 p-2.5 rounded-lg border border-white/5 bg-black/20 hover:border-blue-500/30 transition-all group"
                                >
                                  <div className="p-1.5 rounded bg-gray-900 group-hover:bg-blue-500/20 transition-colors">
                                    <FileText className="w-3 h-3 text-gray-500 group-hover:text-blue-400" />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[8px] font-bold uppercase text-[#4e515a]">Description</p>
                                    <p className="text-[10px] text-gray-400 font-bold group-hover:text-blue-400">Apply AI Meta</p>
                                  </div>
                                </button>
                                <button
                                  onClick={() => setUploadTags(seoResults.tags.join(', '))}
                                  className="flex items-center gap-2 p-2.5 rounded-lg border border-white/5 bg-black/20 hover:border-blue-500/30 transition-all group"
                                >
                                  <div className="p-1.5 rounded bg-gray-900 group-hover:bg-blue-500/20 transition-colors">
                                    <Tags className="w-3 h-3 text-gray-500 group-hover:text-blue-400" />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[8px] font-bold uppercase text-[#4e515a]">Tags</p>
                                    <p className="text-[10px] text-gray-400 font-bold group-hover:text-blue-400">Apply AI Keywords</p>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <input 
                        type="text" 
                        value={uploadTitle}
                        onChange={e => setUploadTitle(e.target.value)}
                        className="w-full bg-[#151619] border border-[#2a2d35] rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-[#8e9299] mb-2">Descrição</label>
                      <textarea 
                        value={uploadDescription}
                        onChange={e => setUploadDescription(e.target.value)}
                        rows={4}
                        className="w-full bg-[#151619] border border-[#2a2d35] rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-none custom-scrollbar resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-[#8e9299] mb-2">Tags (separadas por vírgula)</label>
                      <input 
                        type="text" 
                        value={uploadTags}
                        onChange={e => setUploadTags(e.target.value)}
                        placeholder="ex: tecnologia, vídeo, tutorial"
                        className="w-full bg-[#151619] border border-[#2a2d35] rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#8e9299] mb-2">Privacidade</label>
                        <select 
                          value={privacyStatus}
                          onChange={e => setPrivacyStatus(e.target.value)}
                          className="w-full bg-[#151619] border border-[#2a2d35] rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-none appearance-none"
                        >
                          <option value="private">Privado</option>
                          <option value="unlisted">Não Listado</option>
                          <option value="public">Público</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#8e9299] mb-2">Categoria</label>
                        <select 
                          value={categoryId}
                          onChange={e => setCategoryId(e.target.value)}
                          className="w-full bg-[#151619] border border-[#2a2d35] rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:outline-none appearance-none"
                        >
                          {YOUTUBE_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold uppercase text-[#8e9299]">Thumbnail Personalizada (Opcional)</label>
                        <button 
                          onClick={() => setShowThumbnailCreator(true)}
                          className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" />
                          Criar Thumbnail
                        </button>
                      </div>
                      <div className="hardware-card border-dashed p-4 flex flex-col items-center justify-center gap-3 bg-[#151619]/50">
                        {thumbnailFile ? (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                            <img 
                              src={thumbnailPreviewUrl || ''} 
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <button 
                                onClick={() => setThumbnailFile(null)}
                                className="p-2 bg-red-500 rounded-full text-white shadow-xl"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-[#4e515a]" />
                            <p className="text-[10px] text-[#8e9299]">PNG ou JPG, recomendado 1280x720</p>
                            <label className="px-4 py-2 bg-[#1f2128] hover:bg-[#2a2d35] rounded-lg text-xs font-bold cursor-pointer transition-colors border border-[#2a2d35]">
                              Selecionar Imagem
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={e => {
                                  if (e.target.files?.[0]) setThumbnailFile(e.target.files[0]);
                                }}
                              />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {channels.length > 0 && (
                <div className="p-6 border-t border-[#2a2d35] bg-[#1f2128] flex flex-col gap-4">
                  {isUploading && (
                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                            <span>Transmitting Bits to YouTube</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-blue-400">
                               <Clock className="w-3 h-3" />
                               {uploadETA}
                            </span>
                            <span className="text-white">{uploadProgress}%</span>
                          </div>
                       </div>
                       <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-gradient-to-r from-red-600 to-red-400" 
                          />
                       </div>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button 
                      onClick={handleUploadToYoutube}
                      disabled={isUploading || !uploadTitle}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 w-full md:w-auto"
                    >
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                      <span>{isUploading ? 'Enviando...' : 'Enviar para o YouTube'}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showThumbnailCreator && (
          <ThumbnailCreator 
            initialTitle={uploadTitle}
            onClose={() => setShowThumbnailCreator(false)}
            onSave={(blob) => {
              const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
              setThumbnailFile(file);
              setShowThumbnailCreator(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
