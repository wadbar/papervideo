import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Repeat, 
  Download,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { PostProcessingEffects, getFilterString, getVignetteStyle } from '../../lib/visualUtils';

interface VideoPreviewProps {
  url: string;
  poster?: string;
  effects?: PostProcessingEffects;
  autoPlay?: boolean;
  splitView?: boolean;
}

export default function VideoPreview({ url, poster, effects, autoPlay = false, splitView = false }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rawVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useEffect(() => {
    if (autoPlay && videoRef.current) {
        setIsPlaying(true);
        videoRef.current.play().catch(e => console.log('Autoplay prevented', e));
        if (rawVideoRef.current) {
            rawVideoRef.current.play().catch(e => console.log('Autoplay prevented', e));
        }
    }
  }, [url, autoPlay]);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showDirect, setShowDirect] = useState(false); // Before/After toggle

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (rawVideoRef.current) rawVideoRef.current.pause();
      } else {
        videoRef.current.play();
        if (rawVideoRef.current) rawVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      const time = (val / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      if (rawVideoRef.current) rawVideoRef.current.currentTime = time;
      setProgress(val);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div 
      className="relative aspect-video w-full bg-black rounded-[2rem] overflow-hidden group shadow-2xl border border-outline-variant/30"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {splitView ? (
        <div className="flex w-full h-full relative cursor-pointer" onClick={togglePlay}>
            <div className="w-1/2 h-full overflow-hidden border-r-2 border-primary relative z-20">
                <video
                    ref={rawVideoRef}
                    src={url}
                    poster={poster}
                    className="w-[200%] max-w-none h-full object-cover pointer-events-none"
                    style={{ filter: 'none', objectPosition: 'left center' }}
                    loop={isLooping}
                    muted={isMuted}
                    playsInline
                />
                <div className="absolute bottom-6 left-6 bg-black/60 px-3 py-1.5 rounded-lg text-[10px] font-black text-white tracking-widest scale-75 origin-bottom-left transition-transform group-hover:scale-100">RAW</div>
            </div>
            <div className="w-1/2 h-full overflow-hidden relative">
                <video
                    ref={videoRef}
                    src={url}
                    poster={poster}
                    className="w-[200%] max-w-none h-full object-cover -ml-[100%] pointer-events-none"
                    style={{ filter: showDirect ? 'none' : getFilterString(effects), objectPosition: 'right center' }}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    loop={isLooping}
                    muted={isMuted}
                    playsInline
                />
                {!showDirect && effects?.grain && effects.grain > 0 && (
                    <div 
                        className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] mix-blend-overlay"
                        style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                            opacity: effects.grain * 0.15 
                        }}
                    />
                )}
                {!showDirect && effects?.vignette && effects.vignette > 0 && (
                    <div 
                        className="absolute inset-0 pointer-events-none transition-all duration-500 ease-in-out z-10"
                        style={getVignetteStyle(effects.vignette)}
                    />
                )}
                <div className="absolute bottom-6 right-6 bg-primary/80 px-3 py-1.5 rounded-lg text-[10px] font-black text-white tracking-widest scale-75 origin-bottom-right transition-transform group-hover:scale-100">PROCESSED</div>
            </div>
        </div>
      ) : (
        <>
            <video
              ref={videoRef}
              src={url}
              poster={poster}
              className="w-full h-full object-cover transition-all duration-700 ease-in-out"
              style={{ filter: showDirect ? 'none' : getFilterString(effects) }}
              onTimeUpdate={handleTimeUpdate}
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              loop={isLooping}
              muted={isMuted}
              playsInline
            />

            {/* FX Overlays */}
            {!showDirect && (
              <>
                  {effects?.grain && effects.grain > 0 && (
                      <div 
                          className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] mix-blend-overlay"
                          style={{ 
                              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                              opacity: effects.grain * 0.15 
                          }}
                      />
                  )}
                  {effects?.vignette && effects.vignette > 0 && (
                      <div 
                          className="absolute inset-0 pointer-events-none transition-all duration-500 ease-in-out z-10"
                          style={getVignetteStyle(effects.vignette)}
                      />
                  )}
              </>
            )}
        </>
      )}

      <AnimatePresence>
        {(showControls || !isPlaying) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 transition-all z-20"
          >
            {/* Play/Pause Large Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={togglePlay}
                        className="w-20 h-20 rounded-3xl bg-primary text-on-primary flex items-center justify-center shadow-2xl shadow-primary/20"
                    >
                        <Play className="w-10 h-10 fill-current" />
                    </motion.button>
                </div>
            )}

            {/* Glass Control Bar */}
            <div className="bg-surface/5 backdrop-blur-xl rounded-3xl p-4 border border-white/10 space-y-4">
                {/* Progress Node */}
                <div className="relative group/progress h-1.5 w-full bg-white/10 rounded-full cursor-pointer overflow-hidden transition-all hover:h-2">
                    <motion.div 
                        className="absolute top-0 left-0 h-full bg-primary"
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    />
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={progress}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                        </button>
                        
                        <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-primary transition-colors">
                            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>

                        <div className="h-4 w-px bg-white/10 mx-1" />

                        <button 
                            onClick={() => setIsLooping(!isLooping)} 
                            className={`transition-colors p-2 rounded-xl ${isLooping ? 'bg-primary/20 text-primary' : 'text-white hover:text-primary'}`}
                            title="Toggle Loop"
                        >
                            <Repeat className="w-4 h-4" />
                        </button>
                        
                        <button 
                            onMouseDown={() => setShowDirect(true)} 
                            onMouseUp={() => setShowDirect(false)}
                            onMouseLeave={() => setShowDirect(false)}
                            className={`transition-all px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${showDirect ? 'm3-button-primary scale-95' : 'text-white border-white/20 hover:border-white/40'}`}
                            title="Compare original vision"
                        >
                            Compare
                        </button>
                        
                        <a 
                            href={url} 
                            download="neural-sequence.mp4" 
                            className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                            title="Export Node"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </a>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end opacity-60">
                            <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Temporal Delta</span>
                            <span className="text-[10px] font-mono text-white italic">{progress.toFixed(1)}%</span>
                        </div>
                        <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Telemetry */}
      <div className="absolute top-6 left-6 flex gap-3 pointer-events-none z-30">
        <div className="px-3 py-1.5 bg-background/20 backdrop-blur-md rounded-full border border-white/5 flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] opacity-80">Synth Feed_4K</span>
        </div>
        {isLooping && (
            <div className="px-3 py-1.5 bg-primary/10 backdrop-blur-md rounded-full border border-primary/20 flex items-center gap-2">
                <Repeat className="w-2.5 h-2.5 text-primary" />
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Recursive</span>
            </div>
        )}
      </div>
    </div>
  );
}
