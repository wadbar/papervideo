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
  Sparkles
} from 'lucide-react';

// ... (skipping some imports for brevity in TargetContent matching, but I will include them in ReplacementContent)
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
  const uploadStartTime = useRef<number>(0);
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
  }, []);

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

  const startExport = () => {
    if (!isReadyToExport) {
      alert("Please ensure script, visuals and audio are all ready before exporting.");
      return;
    }
    setIsExporting(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
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
      // In a real scenario, we'd use the actual exported video file.
      // Here we simulate a significant blob size to demonstrate the progress bar.
      const simulatedSize = 10 * 1024 * 1024; // 10MB
      const dummyContent = new Uint8Array(simulatedSize);
      const dummyBlob = new Blob([dummyContent], { type: 'video/mp4' });

      const metadata = {
        title: uploadTitle,
        description: uploadDescription,
        tags: uploadTags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        privacyStatus,
        categoryId
      };

      const videoId = await youtubeChannelService.uploadVideo(
        dummyBlob, 
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
    try {
      const provider = getAIProviderInstance();
      const seo = await provider.optimizeSEO({
        idea: project.idea,
        title: project.title,
        targetAudience: project.targetAudience,
        keywords: project.keywords
      });
      
      setUploadTitle(seo.titles[0]);
      setUploadDescription(seo.description);
      setUploadTags(seo.tags.join(', '));
    } catch (err: any) {
      console.error('SEO optimization failed', err);
      alert('SEO Optimization failed: ' + err.message);
    } finally {
      setIsOptimizingSEO(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-8 max-w-4xl mx-auto py-8">
      <header className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tight uppercase italic">Final Assembly</h2>
        <p className="text-[#8e9299]">Merging scripts, visuals, and audio into a high-definition final render.</p>
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
                     <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Rendering Engine Active</span>
                     <span className="text-[10px] text-[#8e9299] font-mono">
                       {progress < 25 ? 'Initializing timeline...' : 
                        progress < 50 ? 'Merging sequences and transitions...' : 
                        progress < 75 ? 'Synthesizing master audio track...' : 'Final encoding to VP9/H.264/AAC...'}
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
                            <span>Rendering Engine</span>
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
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1f2128] hover:bg-[#252832] rounded-xl transition-all text-sm font-bold border border-[#2a2d35]">
                        <Download className="w-4 h-4" />
                        <span>Download MP4</span>
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
                            <span>Auto-Optimize SEO</span>
                          </button>
                      </div>
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
                              src={URL.createObjectURL(thumbnailFile)} 
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
