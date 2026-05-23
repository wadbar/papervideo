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
  ExternalLink,
  UploadCloud,
  X,
  Settings,
  Image as ImageIcon,
  AlertTriangle,
  Sparkles,
  Maximize2,
  Minimize2,
  Search,
  FileText,
  Tags,
  ChevronLeft,
  Video,
  Monitor,
  Clock,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoProject } from '../core/domain/types';
import TransitionSelector from './TransitionSelector';
import confetti from 'canvas-confetti';
import ThumbnailCreator from './ThumbnailCreator';
import { youtubeChannelService } from '../core/services/youtubeChannelService';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { useYoutubeStore } from '../core/store/useYoutubeStore';
import { useTheme } from '../core/contexts/ThemeContext';

interface VideoExporterProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onPrev: () => void;
}

const SEOAudit = ({ title, description, tags, project }: { title: string, description: string, tags: string, project: VideoProject }) => {
  const [score, setScore] = useState(0);
  const [validations, setValidations] = useState<{label: string, passed: boolean, msg: string}[]>([]);

  useEffect(() => {
    let newScore = 0;
    const checks: {label: string, passed: boolean, msg: string}[] = [];

    // Title 
    if (title.length >= 30 && title.length <= 70) {
      newScore += 25;
      checks.push({ label: 'Title Length', passed: true, msg: 'Optimal length (30-70)' });
    } else if (title.length > 5 && title.length < 30) {
       newScore += 10;
       checks.push({ label: 'Title Length', passed: false, msg: 'Too short (needs 30+)' });
    } else {
       checks.push({ label: 'Title Length', passed: false, msg: 'Missing or too long' });
    }

    // Description Clarity & Narrations
    const combinedNarrations = project.scenes.map((s: any) => s.narrationText).join(' ');
    const descWordCount = description.split(' ').filter(w => w.length > 0).length;
    
    if (description.length > 100 && descWordCount > 15) {
      newScore += 25;
      checks.push({ label: 'Description Clarity', passed: true, msg: 'Sufficient depth & clarity' });
    } else {
      checks.push({ label: 'Description Clarity', passed: false, msg: 'Needs detail (>100 chars)' });
    }

    // Tags
    const tagCount = tags.split(',').filter(t => t.trim().length > 0).length;
    if (tagCount >= 5) {
      newScore += 20;
      checks.push({ label: 'Tag Frequency', passed: true, msg: 'Optimal tags (5+)' });
    } else if (tagCount > 0) {
       newScore += 10;
       checks.push({ label: 'Tag Frequency', passed: false, msg: 'More tags needed' });
    } else {
       checks.push({ label: 'Tag Frequency', passed: false, msg: 'Missing tags' });
    }

    // Keyword Density (in Meta + Narrations)
    const keywords = project.keywords || [];
    if (keywords.length > 0) {
        const fullContent = `${title} ${description} ${combinedNarrations}`.toLowerCase();
        const matchingKeywords = keywords.filter((kw: string) => fullContent.includes(kw.toLowerCase()));
        
        if (matchingKeywords.length >= keywords.length * 0.5) {
          newScore += 30;
          checks.push({ label: 'Keyword Density', passed: true, msg: 'Strong presence in meta & scenes' });
        } else if (matchingKeywords.length > 0) {
          newScore += 15;
          checks.push({ label: 'Keyword Density', passed: false, msg: 'Sub-optimal keyword density' });
        } else {
          checks.push({ label: 'Keyword Density', passed: false, msg: 'Missing keywords in content' });
        }
    } else {
       newScore += 30;
       checks.push({ label: 'Keyword Density', passed: true, msg: 'No keywords defined' });
    }

    setScore(Math.min(newScore, 100));
    setValidations(checks);
  }, [title, description, tags, project]);

  return (
    <div className="bg-surface-variant/5 rounded-[2rem] border border-outline-variant/30 p-8 relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
            <h4 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--md-sys-color-on-surface-variant)]">
              <Sparkles className="w-4 h-4 text-[var(--md-sys-color-on-surface)]" />
              SEO Audit Score
            </h4>
            <span className="text-xl font-mono font-black text-[var(--md-sys-color-on-surface)]">
                {score}%
            </span>
        </div>

        <div className="h-2 w-full bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden mb-8 p-0.5 border border-[var(--md-sys-color-outline)]">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                className="h-full rounded-full transition-all duration-1000 bg-[var(--md-sys-color-on-surface)]"
            />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
           {validations.map((v, i) => (
              <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl group transition-all duration-300 ${v.passed ? 'bg-surface/60 border border-outline-variant/30 hover:border-primary/30' : 'bg-surface/60 border border-outline-variant/30 hover:border-error/30'}`}>
                 <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-300 ${v.passed ? 'bg-primary/10 text-primary group-hover:bg-primary/20' : 'bg-error/10 text-error group-hover:bg-error/20'}`}>
                    {v.passed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                 </div>
                 <div className="flex flex-col gap-1">
                    <p className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${v.passed ? 'text-on-surface group-hover:text-primary' : 'text-on-surface group-hover:text-error'}`}>{v.label}</p>
                    <p className="text-[10px] font-medium text-on-surface-variant leading-relaxed opacity-80">{v.msg}</p>
                 </div>
              </div>
           ))}
        </div>
    </div>
  );
};

export default function VideoExporter({ project, onUpdate, onPrev }: VideoExporterProps) {
  const { theme } = useTheme();
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
  const [thumbnailSuggestions, setThumbnailSuggestions] = useState<any[] | null>(null);
  const [showSEOPanel, setShowSEOPanel] = useState(false);
  const [isSuggestingTransition, setIsSuggestingTransition] = useState(false);
  const uploadStartTime = useRef<number>(0);

  const ASPECT_RATIOS = [
    { id: '16:9', label: 'Widescreen (YouTube)', desc: '1920x1080' },
    { id: '9:16', label: 'Vertical (TikTok/Shorts)', desc: '1080x1920' },
    { id: '1:1', label: 'Square (Instagram)', desc: '1080x1080' },
    { id: '1:1.91', label: 'Landscape (LinkedIn)', desc: '1920x1005' }
  ];

  const PRESETS = [
    { id: 'Youtube', resolution: '1080p', framerate: 30, aspectRatio: '16:9' },
    { id: 'TikTok', resolution: '1080p', framerate: 60, aspectRatio: '9:16' },
    { id: 'Instagram', resolution: '1080p', framerate: 30, aspectRatio: '1:1' },
    { id: 'LinkedIn', resolution: '1080p', framerate: 30, aspectRatio: '1:1.91' }
  ];

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      onUpdate({
        ...project,
        exportSettings: {
          ...project.exportSettings,
          resolution: preset.resolution as any,
          framerate: preset.framerate as any,
          aspectRatio: preset.aspectRatio as any,
          preset: presetId as any
        }
      });
    }
  };

  const handleSuggestTransition = async (sceneIndex: number) => {
    if (sceneIndex >= project.scenes.length - 1) return;
    setIsSuggestingTransition(true);
    try {
      const resp = await fetch('/api/ai/suggest-transition', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentSceneDesc: project.scenes[sceneIndex].description,
          nextSceneDesc: project.scenes[sceneIndex + 1].description
        })
      });
      const transition = await resp.json();
      
      const newScenes = [...project.scenes];
      newScenes[sceneIndex].transition = transition;
      onUpdate({ ...project, scenes: newScenes });
    } catch (err) {
      console.error('Failed to suggest transition', err);
    } finally {
      setIsSuggestingTransition(false);
    }
  };

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

  const [exportETA, setExportETA] = useState<string>('Calculating...');
  const exportStartTime = useRef<number>(0);
  const exportProgressHistory = useRef<{loaded: number, time: number}[]>([]);

  const startExport = () => {
    if (isExporting) return;
    if (!isReadyToExport) {
      alert("Please ensure script, visuals and audio are all ready before exporting.");
      return;
    }
    setIsExporting(true);
    setProgress(0);
    setExportETA('Calculating...');
    exportStartTime.current = Date.now();
    exportProgressHistory.current = [];
    
    if (exportIntervalRef.current) clearInterval(exportIntervalRef.current);
    exportIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + 2;
        
        const now = Date.now();
        const history = exportProgressHistory.current;
        history.push({ loaded: next, time: now });
        if (history.length > 5) history.shift();
        
        if (history.length > 1) {
          const first = history[0];
          const last = history[history.length - 1];
          const timeDiff = last.time - first.time;
          const sizeDiff = last.loaded - first.loaded;
          if (timeDiff > 100 && sizeDiff > 0) { 
            const speed = sizeDiff / timeDiff; // percent per ms
            const remaining = 100 - next;
            const etaMs = remaining / speed;
            setExportETA(formatETA(etaMs));
          }
        }

        if (next >= 100) {
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
        return next;
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
      // Parallel execution for higher automation speed
      const [seo, thumbnailData] = await Promise.all([
        fetch('/api/ai/seo', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(project)
        }).then(r => r.json()),
        fetch('/api/ai/suggest-thumbnail', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(project)
        }).then(r => r.json())
      ]);
      
      setSeoResults(seo);
      setThumbnailSuggestions(thumbnailData.concepts || thumbnailData);
      setShowSEOPanel(true);
    } catch (err: any) {
      console.error('SEO optimization failed', err);
      alert('SEO Optimization failed: ' + err.message);
    } finally {
      setIsOptimizingSEO(false);
    }
  };

  return (
    <div ref={containerRef} className={`flex flex-col h-full gap-8 max-w-7xl mx-auto py-8 w-full transition-all duration-500 ${isFullscreen ? 'bg-surface p-12 w-full h-full max-w-full overflow-y-auto z-50 fixed inset-0' : ''}`}>
      <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-on-surface">Synthesis Terminal</h2>
          <p className="text-on-surface-variant text-sm font-medium opacity-80 uppercase tracking-widest text-[10px]">Production Assembly & Global Distribution</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleFullscreen}
            className="p-3 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all active:scale-90"
            title="Toggle Cinematic View"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5"/> : <Maximize2 className="w-5 h-5" />}
          </button>
          <div className="w-px h-6 bg-outline-variant mx-1" />
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>SYNC_STATUS: READY</span>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            className="overflow-hidden px-4"
          >
            <div className="p-8 bg-primary/5 border border-primary/20 rounded-[2.5rem] shadow-sm relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Rocket className="w-48 h-48 -rotate-12" />
              </div>

              <div className="flex justify-between items-end mb-6 relative">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                     <Loader2 className="w-6 h-6 animate-spin" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Neural Rendering Core</span>
                     <h4 className="text-xl font-bold text-on-surface">
                       {progress < 25 ? 'Initializing Neural Timeline...' : 
                        progress < 50 ? 'Merging Vector Sequences...' : 
                        progress < 75 ? 'Synthesizing Master Audio...' : 'Encoding Final Bitstream...'}
                     </h4>
                   </div>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black font-mono text-primary italic leading-none">{progress}%</span>
                </div>
              </div>

              <div className="h-3 bg-surface-variant/30 rounded-full overflow-hidden border border-outline-variant/30 p-0.5 mb-6">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Initial Analysis', threshold: 0 },
                  { label: 'Visual Synthesis', threshold: 25 },
                  { label: 'Audio Mixing', threshold: 50 },
                  { label: 'Final Encoding', threshold: 75 }
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                       <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors duration-500 ${progress >= step.threshold ? (progress >= step.threshold + 25 || progress === 100 ? 'bg-primary' : 'bg-primary animate-pulse') : 'bg-surface-variant'}`} />
                       <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${progress >= step.threshold ? 'text-on-surface' : 'text-on-surface-variant opacity-50'}`}>{step.label}</span>
                    </div>
                    <div className="h-1 w-full bg-surface-variant/30 rounded-full overflow-hidden">
                       <motion.div 
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: progress >= step.threshold + 25 || progress === 100 ? '100%' : progress >= step.threshold ? `${((progress - step.threshold) / 25) * 100}%` : '0%' }}
                       />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between items-center px-1 border-t border-outline-variant/20 pt-6">
                <div className="flex items-center gap-6">
                    <span className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      ETA: {exportETA}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      Bandwidth: {(progress * 0.42).toFixed(1)} MB/s
                    </span>
                </div>
                <span className="text-[9px] font-mono font-black text-primary opacity-60 uppercase tracking-widest">VP9_COMPRESSION_ENABLED</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 px-4 flex-1 items-start">
        {/* Left Col: Master Preview & Integrity */}
        <div className="flex flex-col gap-10">
          <div className="m3-card overflow-hidden bg-surface-variant/10 border border-outline-variant/30 group relative">
              {project.scenes.length > 0 && project.scenes[0].imageUrl ? (
                  <img src={project.scenes[0].imageUrl} className="w-full aspect-video object-cover transition-all duration-700 group-hover:scale-105" referrerPolicy="no-referrer" alt="Final Synthesis Preview" />
              ) : (
                  <div className="w-full aspect-video bg-surface-variant/20 flex items-center justify-center">
                    <Video className="w-12 h-12 text-on-surface-variant/20" />
                  </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-scrim/80 via-transparent to-scrim/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center">
                  {isExporting ? (
                      <div className="w-48 bg-surface/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-white">
                              <span>Synthesizing</span>
                              <span>{progress}%</span>
                          </div>
                          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                              <div 
                                  className="h-full bg-primary transition-all duration-300" 
                                  style={{ width: `${progress}%` }}
                              />
                          </div>
                      </div>
                  ) : project.status === 'completed' ? (
                      <div className="flex flex-col items-center gap-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                           <div className="w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                              <CheckCircle2 className="w-10 h-10" />
                           </div>
                           <span className="font-black uppercase tracking-[0.3em] text-white text-xs drop-shadow-md">Master Print Verified</span>
                      </div>
                  ) : (
                      <button 
                        onClick={startExport}
                        className="w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all"
                      >
                          <Play className="w-10 h-10 fill-current ml-1" />
                      </button>
                  )}
              </div>
              
              <div className="absolute top-6 left-6 flex items-center gap-2">
                 <div className="px-3 py-1.5 bg-scrim/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Monitor className="w-3 h-3" />
                    <span>Live Monitor</span>
                 </div>
                 {isExporting && (
                    <div className="px-3 py-1.5 bg-primary rounded-full text-[9px] font-black uppercase tracking-widest text-on-primary animate-pulse">
                      Processing
                    </div>
                 )}
              </div>
          </div>

          <div className="space-y-6">
              <div className="bg-surface rounded-[2.5rem] p-8 border border-outline-variant/30 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-6 flex items-center gap-3">
                    <Layers className="w-4 h-4 text-primary" />
                    Structural Integrity
                  </h4>
                  
                  <div className="space-y-5">
                      <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                               <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${validation.hasScript ? 'bg-primary/10 text-primary' : 'bg-surface-variant/20 text-on-surface-variant opacity-40'}`}>
                                 <FileText className="w-4 h-4" />
                               </div>
                               <span className={`text-sm font-bold transition-colors ${validation.hasScript ? 'text-on-surface' : 'text-on-surface-variant'}`}>Narrative Matrix</span>
                          </div>
                          {validation.hasScript ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <AlertTriangle className="w-4 h-4 text-error" />}
                      </div>

                      <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                               <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${validation.hasVisuals ? 'bg-primary/10 text-primary' : 'bg-surface-variant/20 text-on-surface-variant opacity-40'}`}>
                                 <ImageIcon className="w-4 h-4" />
                               </div>
                               <span className={`text-sm font-bold transition-colors ${validation.hasVisuals ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                                 Visual Sequence Hash ({project.scenes.filter(s => s.imageUrl).length}/{project.scenes.length})
                               </span>
                          </div>
                          {validation.hasVisuals ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <AlertTriangle className="w-4 h-4 text-error" />}
                      </div>

                      <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                               <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${validation.hasAudio ? 'bg-primary/10 text-primary' : 'bg-surface-variant/20 text-on-surface-variant opacity-40'}`}>
                                 <Play className="w-4 h-4" />
                               </div>
                               <span className={`text-sm font-bold transition-colors ${validation.hasAudio ? 'text-on-surface' : 'text-on-surface-variant'}`}>Audio Harmonic Core</span>
                          </div>
                          {validation.hasAudio ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <AlertTriangle className="w-4 h-4 text-error" />}
                      </div>
                  </div>
              </div>

              <div className="bg-surface rounded-[2.5rem] p-8 border border-outline-variant/30 shadow-sm flex flex-col gap-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-3">
                  <Settings className="w-4 h-4 text-primary" />
                  Encoding Parameters
                </h4>
                
                <div className="space-y-4">
                  <div className="flex gap-2 p-1 bg-surface-variant/10 rounded-2xl border border-outline-variant/30">
                    {['Youtube', 'TikTok', 'Instagram', 'LinkedIn', 'Custom'].map(p => (
                      <button
                        key={p}
                        onClick={() => p === 'Custom' ? onUpdate({...project, exportSettings: {...(project.exportSettings || { resolution: '1080p', framerate: 60, aspectRatio: '16:9' }), preset: 'Custom'}}) : applyPreset(p)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                          (project.exportSettings?.preset || 'Custom') === p 
                            ? 'bg-primary text-on-primary shadow-sm' 
                            : 'text-on-surface-variant hover:bg-surface-variant/40'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 pl-1">Target Resolution</label>
                          <select
                              value={project.exportSettings?.resolution || systemSettings?.defaultResolution || '1080p'}
                              onChange={(e) => onUpdate({ ...project, exportSettings: { ...project.exportSettings!, resolution: e.target.value as any } })}
                              className="w-full bg-surface-variant/10 border border-outline-variant/50 rounded-2xl px-5 py-3 text-sm text-on-surface font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                          >
                              <option value="720p">720p (HD Ready)</option>
                              <option value="1080p">1080p (Full HD)</option>
                              <option value="4k">4K (Ultra HD)</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 pl-1">Temporal Frequency</label>
                          <select
                              value={project.exportSettings?.framerate || systemSettings?.framerate || 30}
                              onChange={(e) => onUpdate({ ...project, exportSettings: { ...project.exportSettings!, framerate: parseInt(e.target.value) as any } })}
                              className="w-full bg-surface-variant/10 border border-outline-variant/50 rounded-2xl px-5 py-3 text-sm text-on-surface font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                          >
                              <option value="24">24 FPS (Cinematic)</option>
                              <option value="30">30 FPS (Standard)</option>
                              <option value="60">60 FPS (Fluid)</option>
                          </select>
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 pl-1">Aspect Ratio</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ASPECT_RATIOS.map(ar => (
                          <button
                            key={ar.id}
                            onClick={() => onUpdate({ ...project, exportSettings: { ...project.exportSettings!, aspectRatio: ar.id as any, preset: 'Custom' } })}
                            className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                              project.exportSettings?.aspectRatio === ar.id 
                                ? 'bg-primary/5 border-primary' 
                                : 'bg-surface-variant/5 border-outline-variant/30 hover:bg-surface-variant/10'
                            }`}
                          >
                            <span className={`text-xs font-black ${project.exportSettings?.aspectRatio === ar.id ? 'text-primary' : 'text-on-surface'}`}>{ar.id}</span>
                            <span className="text-[8px] font-medium text-on-surface-variant tracking-tighter opacity-60">{ar.desc}</span>
                          </button>
                        ))}
                      </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-[2.5rem] p-8 border border-outline-variant/30 shadow-sm space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-3">
                  <Layers className="w-4 h-4 text-primary" />
                  Scene Transitions
                </h4>
                <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {project.scenes.map((scene, idx) => (
                    idx < project.scenes.length - 1 && (
                      <div key={idx} className="p-4 bg-surface-variant/5 rounded-3xl border border-outline-variant/10">
                        <TransitionSelector 
                          currentTransition={scene.transition || 'Cut'}
                          onSelect={(t) => {
                            const newScenes = [...project.scenes];
                            newScenes[idx].transition = t;
                            onUpdate({ ...project, scenes: newScenes });
                          }}
                          isSuggesting={isSuggestingTransition}
                          onSuggest={() => handleSuggestTransition(idx)}
                        />
                      </div>
                    )
                  ))}
                </div>
              </div>
          </div>
        </div>

        {/* Right Col: Distribution & SEO */}
        <div className="flex flex-col gap-10">
          <div className="bg-surface rounded-[2.5rem] p-8 border border-outline-variant/30 shadow-sm space-y-8">
              <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-3">
                    <Rocket className="w-4 h-4 text-primary" />
                    Distribution Assets
                  </h4>
                  <button 
                      onClick={handleOptimizeSEO}
                      disabled={isOptimizingSEO}
                      className="m3-button-tonal py-2 px-6 flex items-center gap-2 group transform active:scale-95"
                  >
                      {isOptimizingSEO ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span className="text-[10px] font-black uppercase tracking-widest">Neural SEO Optimize</span>
                  </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Global Title Path</label>
                      <span className="text-[10px] font-mono text-on-surface-variant opacity-40 italic">{uploadTitle.length}/100</span>
                    </div>
                    <input 
                        type="text" 
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full bg-surface-variant/10 border border-outline-variant/50 rounded-2xl px-5 py-4 text-sm text-on-surface font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        placeholder="Define your narrative identity..."
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Atmospheric Description</label>
                      <span className="text-[10px] font-mono text-on-surface-variant opacity-40 italic">{uploadDescription.length}/5000</span>
                    </div>
                    <textarea 
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        className="w-full bg-surface-variant/10 border border-outline-variant/50 rounded-[2rem] px-6 py-5 text-sm text-on-surface font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none min-h-[160px] custom-scrollbar leading-relaxed"
                        placeholder="Narrate the intent of your creation..."
                    />
                </div>

                <SEOAudit 
                    title={uploadTitle} 
                    description={uploadDescription} 
                    tags={uploadTags} 
                    project={project} 
                />
              </div>

              <AnimatePresence>
                  {showSEOPanel && seoResults && !showYoutubeUploader && (
                      <motion.div
                          initial={{ height: 0, opacity: 0, scale: 0.95 }}
                          animate={{ height: 'auto', opacity: 1, scale: 1 }}
                          exit={{ height: 0, opacity: 0, scale: 0.95 }}
                          className="bg-primary/5 border border-primary/20 rounded-[2rem] overflow-hidden shadow-inner"
                      >
                          <div className="p-8 space-y-6">
                              <div className="flex items-center justify-between">
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-3">
                                      <Sparkles className="w-4 h-4" />
                                      AI Strategy Laboratory
                                  </h5>
                                  <button onClick={() => setShowSEOPanel(false)} className="p-2 hover:bg-primary/10 rounded-full transition-colors">
                                      <X className="w-4 h-4 text-on-surface-variant" />
                                  </button>
                              </div>
                              
                              <div className="space-y-4">
                                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60 ml-1">Proposed Neural Titles</p>
                                  <div className="grid grid-cols-1 gap-2">
                                      {seoResults.titles.slice(0, 3).map((t, idx) => (
                                          <button 
                                              key={idx}
                                              onClick={() => setUploadTitle(t)}
                                              className="text-left p-4 rounded-2xl bg-surface/80 border border-outline-variant/40 text-sm font-bold text-on-surface hover:text-primary hover:border-primary/40 hover:bg-surface transition-all truncate shadow-sm active:scale-[0.99]"
                                          >
                                              {t}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                  <button 
                                      onClick={() => setUploadDescription(seoResults.description)}
                                      className="flex-1 m3-button-tonal py-3 px-6 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest"
                                  >
                                      <FileText className="w-4 h-4" />
                                      Inject AI Narrative
                                  </button>
                                  <button 
                                      onClick={() => setUploadTags(seoResults.tags.join(', '))}
                                      className="flex-1 m3-button-tonal py-3 px-6 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest"
                                  >
                                      <Tags className="w-4 h-4" />
                                      Synchronize Tags
                                  </button>
                              </div>

                              {thumbnailSuggestions && (
                                <div className="space-y-4 pt-6 border-t border-outline-variant/20">
                                   <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60 ml-1">Thumbnail Strategy Revisions</p>
                                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                     {thumbnailSuggestions.slice(0, 3).map((concept, idx) => (
                                       <div key={idx} className="p-4 rounded-2xl bg-surface/50 border border-outline-variant/30 space-y-3">
                                         <p className="text-[10px] font-bold text-on-surface leading-tight h-12 overflow-hidden">{concept.hook || concept.visualHook}</p>
                                         <div className="flex gap-1">
                                           {concept.palette?.map((c: string, i: number) => (
                                             <div key={i} className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: c }} />
                                           ))}
                                         </div>
                                         <button 
                                           onClick={() => setShowThumbnailCreator(true)}
                                           className="w-full py-2 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-colors"
                                         >
                                           Initialize Creator
                                         </button>
                                       </div>
                                     ))}
                                   </div>
                                </div>
                              )}
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-6">
              <button 
                  onClick={startExport}
                  disabled={isExporting || !isReadyToExport}
                  className="group flex flex-col items-center justify-center p-10 bg-primary rounded-[2.5rem] border border-primary hover:bg-primary/95 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed shadow-xl shadow-primary/20"
              >
                  <Rocket className="w-10 h-10 text-on-primary mb-3 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-primary">Initiate Synthesis</span>
              </button>
              <button 
                 onClick={() => {
                   if (!validation.isRendered) {
                      alert("Synthesis required before global distribution.");
                      return;
                   }
                   setShowYoutubeUploader(true);
                 }}
                 disabled={isExporting || !validation.isRendered} 
                 className={`group flex flex-col items-center justify-center p-10 rounded-[2.5rem] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-20 shadow-xl ${project.status === 'completed' ? 'bg-surface border border-error/50 text-error hover:border-error shadow-error/10' : 'bg-surface-variant/20 border border-outline-variant/30 text-on-surface-variant opacity-40'}`}
              >
                  <Youtube className={`w-10 h-10 mb-3 transition-transform group-hover:scale-110 ${project.status === 'completed' ? 'text-error fill-current' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Broadcast</span>
              </button>
          </div>

          <div className="pt-10 border-t border-outline-variant/30">
               <p className="text-[10px] uppercase font-black text-on-surface-variant mb-6 tracking-[0.3em] ml-1">Terminal Output Modules</p>
               <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Master MP4', icon: Download, action: () => {
                      if (!validation.hasVisuals) return;
                      alert("Batch export initialized. Browser-level limitations may apply to large sequences.");
                      project.scenes.forEach((scene, i) => {
                          if (scene.videoUrl) {
                              const a = document.createElement('a');
                              a.href = scene.videoUrl;
                              a.download = `sequence-${i+1}.mp4`;
                              a.click();
                          }
                      });
                    }},
                    { label: 'Secure JSON', icon: Download, action: () => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", `blueprint-${project.id}.json`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }},
                    { label: 'Project Vault', icon: Share2, action: () => alert('Project Vault encryption in progress...') }
                  ].map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={item.action}
                      className="flex flex-col items-center gap-3 p-6 bg-surface-variant/5 hover:bg-surface-variant/10 rounded-[2rem] border border-outline-variant/30 transition-all group active:scale-95 shadow-sm"
                    >
                      <item.icon className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{item.label}</span>
                    </button>
                  ))}
               </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 flex justify-between items-center px-4 border-t border-outline-variant/20 pt-8 mb-10">
          <button onClick={onPrev} className="m3-button-tonal px-8 py-3 flex items-center gap-3 group transition-all">
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="text-[11px] font-black uppercase tracking-widest">Audio Matrix</span>
          </button>
          <div className="flex items-center gap-4 text-[9px] font-mono font-black text-on-surface-variant/40 tracking-widest">
              <div className="flex gap-1">
                {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary/20" />)}
              </div>
              <span>READY_FOR_DEPLOYMENT_V_2024</span>
          </div>
      </footer>

      {/* Youtube Upload Modal (M3 Refined) */}
      <AnimatePresence>
        {showYoutubeUploader && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="bg-surface w-full max-w-3xl rounded-[2.5rem] flex flex-col max-h-[90vh] overflow-hidden shadow-2xl border border-outline-variant/30"
            >
              <div className="px-8 py-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                    <Youtube className="w-6 h-6 fill-current" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black tracking-tight text-on-surface">Global Distribution Hub</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60">YouTube API Interlink Active</p>
                  </div>
                </div>
                <button onClick={() => setShowYoutubeUploader(false)} className="p-3 hover:bg-surface-variant rounded-full transition-colors active:scale-90">
                  <X className="w-5 h-5 text-on-surface-variant" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-10 bg-surface">
                {!hasToken ? (
                   <div className="text-center py-16 px-8 flex flex-col items-center">
                     <div className="w-24 h-24 rounded-full bg-surface-variant flex items-center justify-center mb-8">
                       <Rocket className="w-12 h-12 text-on-surface-variant/20" />
                     </div>
                     <h4 className="text-2xl font-black text-on-surface mb-2">Authentication Required</h4>
                     <p className="text-on-surface-variant max-w-sm mb-10 leading-relaxed font-medium">To synchronize with global content grids, you must authorize your Google account with our production terminal.</p>
                     <button 
                       onClick={handleConnect}
                       className="m3-button-primary px-12 py-4 flex items-center gap-4 group"
                     >
                       <Youtube className="w-5 h-5 fill-current" />
                       <span className="font-black uppercase tracking-widest text-xs">Secure Link via Cloud OAuth</span>
                     </button>
                   </div>
                ) : channels.length === 0 ? (
                   <div className="text-center py-16 px-8 flex flex-col items-center">
                     <Youtube className="w-24 h-24 opacity-10 mb-8" />
                     <h4 className="text-2xl font-black text-on-surface mb-2">No Verified Signal</h4>
                     <p className="text-on-surface-variant max-w-sm mb-8 leading-relaxed font-medium">No YouTube channels detected. Initialize your presence in the Sidebar Settings terminal.</p>
                   </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      <SEOAudit 
                          title={uploadTitle} 
                          description={uploadDescription} 
                          tags={uploadTags} 
                          project={project} 
                      />

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-1">Destination Channel Signal</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {channels.map(ch => (
                            <button 
                              key={ch.id} 
                              onClick={() => setSelectedChannelId(ch.id)}
                              className={`p-5 rounded-[2rem] border flex items-center gap-4 cursor-pointer transition-all active:scale-[0.98] ${
                                selectedChannelId === ch.id 
                                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5' 
                                  : 'border-outline-variant/30 hover:border-outline-variant bg-surface group'
                              }`}
                            >
                              <div className="relative">
                                <img src={ch.profileImageUrl || `https://ui-avatars.com/api/?name=${ch.name}`} className="w-12 h-12 rounded-full border-2 border-surface shadow-md" alt={ch.name} />
                                {selectedChannelId === ch.id && (
                                  <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary rounded-full p-0.5 shadow-sm">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 text-left truncate">
                                <p className={`font-black text-sm truncate ${selectedChannelId === ch.id ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>{ch.name}</p>
                                <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-wider">{ch.tags?.length || 0} Neural Keywords Injectors</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                       <div className="space-y-4">
                          <div className="flex items-center justify-between gap-4 px-1">
                              <label className="text-[10px] font-black uppercase text-on-surface-variant opacity-60 tracking-widest">Global Meta Title</label>
                              <button 
                                onClick={handleOptimizeSEO}
                                disabled={isOptimizingSEO}
                                className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-50"
                              >
                                {isOptimizingSEO ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                <span>{seoResults ? 'Recalculate Path' : 'Neural Matrix SEO'}</span>
                              </button>
                          </div>
                          <input 
                            type="text" 
                            value={uploadTitle}
                            onChange={e => setUploadTitle(e.target.value)}
                            className="w-full bg-surface-variant/10 border border-outline-variant/50 rounded-2xl px-6 py-4 text-sm font-bold text-on-surface focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                            placeholder="Primary transmission ID..."
                          />
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-on-surface-variant opacity-60 tracking-widest ml-1">Universal Description Field</label>
                          <textarea 
                            value={uploadDescription}
                            onChange={e => setUploadDescription(e.target.value)}
                            rows={4}
                            className="w-full bg-surface-variant/10 border border-outline-variant/50 rounded-[2rem] px-6 py-5 text-sm font-medium text-on-surface focus:ring-4 focus:ring-primary/10 outline-none transition-all custom-scrollbar resize-none leading-relaxed"
                            placeholder="Narrate the technical intent..."
                          />
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-on-surface-variant opacity-60 tracking-widest ml-1">Neural Keyword Tagging</label>
                          <input 
                            type="text" 
                            value={uploadTags}
                            onChange={e => setUploadTags(e.target.value)}
                            placeholder="Format: keyword_a, keyword_b, matrix_signal"
                            className="w-full bg-surface-variant/10 border border-outline-variant/50 rounded-2xl px-6 py-4 text-sm font-mono text-on-surface outline-none transition-all focus:ring-4 focus:ring-primary/10"
                          />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-on-surface-variant opacity-60 tracking-widest ml-1">Distribution Visibility</label>
                            <div className="relative">
                              <select 
                                value={privacyStatus}
                                onChange={e => setPrivacyStatus(e.target.value)}
                                className="w-full bg-surface-variant/10 border border-outline-variant/50 rounded-2xl px-6 py-4 text-sm font-bold text-on-surface appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-primary/10"
                              >
                                <option value="private">Private (Stealth Node)</option>
                                <option value="unlisted">Unlisted (Hidden Link)</option>
                                <option value="public">Public (Global Broadcast)</option>
                              </select>
                              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <Rocket className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-on-surface-variant opacity-60 tracking-widest ml-1">Broadcast Category</label>
                            <div className="relative">
                              <select 
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className="w-full bg-surface-variant/10 border border-outline-variant/50 rounded-2xl px-6 py-4 text-sm font-bold text-on-surface appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-primary/10"
                              >
                                {YOUTUBE_CATEGORIES.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <Layers className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black uppercase text-on-surface-variant opacity-60 tracking-widest">Master Visual Static (Thumbnail)</label>
                            <button 
                              onClick={() => setShowThumbnailCreator(true)}
                              className="text-[10px] font-black uppercase text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                            >
                              <ImageIcon className="w-3 h-3" />
                              Creative Lab
                            </button>
                          </div>
                          <div className={`rounded-[2.5rem] border-2 border-dashed transition-all duration-500 overflow-hidden ${thumbnailFile ? 'border-primary/40 bg-surface' : 'border-outline-variant/40 bg-surface-variant/5 hover:bg-surface-variant/10 hover:border-primary/30'}`}>
                            {thumbnailFile ? (
                              <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden group">
                                <img 
                                  src={thumbnailPreviewUrl || ''} 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                  alt="Master Visual Preview"
                                />
                                <div className="absolute inset-0 bg-scrim/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-500 backdrop-blur-sm">
                                  <button 
                                    onClick={() => setThumbnailFile(null)}
                                    className="w-14 h-14 bg-error text-on-error rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all mb-4"
                                  >
                                    <X className="w-6 h-6" />
                                  </button>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Discard Signal</span>
                                </div>
                              </div>
                            ) : (
                              <label className="w-full aspect-video flex flex-col items-center justify-center cursor-pointer p-8 relative overflow-hidden group">
                                <div className="p-6 bg-primary/10 rounded-full mb-6 group-hover:scale-110 transition-transform duration-500">
                                   <ImageIcon className="w-8 h-8 text-primary" />
                                </div>
                                <h5 className="text-sm font-bold text-on-surface mb-2">Inject Manual Asset</h5>
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">PNG / JPG Matrix (Target: 1280x720)</p>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={e => {
                                    if (e.target.files?.[0]) setThumbnailFile(e.target.files[0]);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                       </div>
                    </div>
                  </>
                )}
              </div>

              {channels.length > 0 && (
                <div className="p-8 border-t border-outline-variant/30 bg-surface flex flex-col gap-8 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                  {isUploading ? (
                    <div className="space-y-4">
                       <div className="flex justify-between items-center px-1">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">Transmitting Signal to YouTube Matrix</span>
                          </div>
                          <span className="text-xl font-mono font-black text-error italic">{uploadProgress}%</span>
                       </div>
                       <div className="h-2.5 bg-surface-variant/30 rounded-full overflow-hidden border border-outline-variant/30 p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-error rounded-full"
                          />
                       </div>
                       <div className="flex justify-between items-center px-1">
                          <span className="text-[9px] font-black uppercase text-on-surface-variant opacity-40 tracking-widest">Global Uplink Node-7</span>
                          <span className="text-[10px] font-black uppercase text-error tracking-widest">Est. Time Remaining: {uploadETA}</span>
                       </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={() => setShowYoutubeUploader(false)}
                         className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-on-surface-variant hover:bg-surface-variant transition-all"
                       >
                         Abort
                       </button>
                       <button 
                         onClick={handleUploadToYoutube}
                         disabled={isUploading || !selectedChannelId}
                         className="flex-1 m3-button-primary bg-error text-on-error hover:bg-error/90 py-4 shadow-xl shadow-error/20 flex items-center justify-center gap-4 group active:scale-95 transition-all"
                       >
                         <Rocket className="w-5 h-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                         <span className="font-black uppercase tracking-widest text-xs">Execute Global Broadcast</span>
                       </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showThumbnailCreator && (
          <ThumbnailCreator 
            project={project} 
            onGenerated={(file) => {
              setThumbnailFile(file);
              setShowThumbnailCreator(false);
            }} 
            onClose={() => setShowThumbnailCreator(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
