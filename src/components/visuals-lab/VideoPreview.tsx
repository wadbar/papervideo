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
}

export default function VideoPreview({ url, poster, effects }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showDirect, setShowDirect] = useState(false); // Before/After toggle

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
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
      className="relative aspect-video w-full bg-black rounded-xl overflow-hidden group shadow-2xl border-2 border-[#1f2128]"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        className="w-full h-full object-cover transition-all duration-500 ease-in-out"
        style={{ filter: showDirect ? 'none' : getFilterString(effects) }}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        loop={isLooping}
        muted={isMuted}
        playsInline
      />

      {/* Grain Overlay */}
      {!showDirect && effects?.grain && effects.grain > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] mix-blend-overlay"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: effects.grain * 0.15 
          }}
        />
      )}

      {/* Vignette Overlay */}
      {effects?.vignette && effects.vignette > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-500 ease-in-out z-10"
          style={showDirect ? {} : getVignetteStyle(effects.vignette)}
        />
      )}

      <AnimatePresence>
        {(showControls || !isPlaying) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex flex-col justify-end p-4 transition-all"
          >
            {/* Center Play Button Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={togglePlay}
                        className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center backdrop-blur-sm shadow-2xl"
                    >
                        <Play className="w-8 h-8 fill-current" />
                    </motion.button>
                </div>
            )}

            {/* Custom Control Bar */}
            <div className="space-y-3">
                {/* Progress Bar */}
                <div className="relative group/progress h-1.5 w-full bg-white/20 rounded-full cursor-pointer overflow-hidden">
                    <div 
                        className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={progress}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        </button>
                        
                        <div className="flex items-center gap-2 group/volume">
                            <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-blue-400 transition-colors">
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="h-4 w-px bg-white/20" />

                        <button 
                            onClick={() => setIsLooping(!isLooping)} 
                            className={`transition-colors ${isLooping ? 'text-blue-400' : 'text-white hover:text-blue-400'}`}
                            title="Toggle Loop"
                        >
                            <Repeat className="w-4 h-4" />
                        </button>
                        
                        <button 
                            onMouseDown={() => setShowDirect(true)} 
                            onMouseUp={() => setShowDirect(false)}
                            onMouseLeave={() => setShowDirect(false)}
                            className={`transition-colors ${showDirect ? 'text-orange-400' : 'text-white hover:text-orange-400'}`}
                            title="Hold to see original (Before/After)"
                        >
                            <div className="text-[9px] font-bold border border-current px-1 rounded">B/A</div>
                        </button>
                        
                        <a 
                            href={url} 
                            download="scene-video.mp4" 
                            className="text-white hover:text-blue-400 transition-colors"
                            title="Download Clip"
                        >
                            <Download className="w-4 h-4" />
                        </a>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-mono text-white/60 font-bold uppercase tracking-widest bg-black/40 px-2 py-1 rounded">
                            {progress.toFixed(0)}% SYNTH_READY
                        </div>
                        <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors">
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top HUD */}
      <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded border border-white/10">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[8px] font-bold text-white uppercase tracking-tighter">HD Preview</span>
        </div>
      </div>
    </div>
  );
}
