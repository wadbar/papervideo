import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type, 
  Image as ImageIcon, 
  Palette, 
  Download, 
  X, 
  RefreshCw, 
  Layers,
  ChevronRight,
  ChevronLeft,
  Layout,
  Sparkles,
  Zap,
  Box,
  AlignCenter,
  AlignLeft,
  Columns,
  Signal
} from 'lucide-react';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { VideoProject } from '../core/domain/types';

interface ThumbnailCreatorProps {
  project: VideoProject;
  onGenerated: (file: File) => void;
  onClose: () => void;
}

export default function ThumbnailCreator({ project, onGenerated, onClose }: ThumbnailCreatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState(project.title);
  const [subtitle, setSubtitle] = useState('');
  const [bgColor, setBgColor] = useState('#0f172a');
  const [textColor, setTextColor] = useState('#ffffff');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [layout, setLayout] = useState<'centered' | 'left' | 'split'>('centered');
  const [fontSize, setFontSize] = useState(60);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [variations, setVariations] = useState<any[]>([]);
  const { getAIProviderInstance } = useSettingsStore();

  const colors = [
    '#0f172a', '#1e1b4b', '#450a0a', '#14532d', 
    '#312e81', '#1e293b', '#000000', '#f43f5e', '#8b5cf6', '#d946ef'
  ];

  useEffect(() => {
    drawThumbnail();
  }, [title, subtitle, bgColor, textColor, accentColor, bgImage, layout, fontSize]);

  const drawThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset and Fill Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (bgImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = bgImage;
      img.onload = () => {
        const aspect = img.width / img.height;
        const targetAspect = canvas.width / canvas.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        
        if (aspect > targetAspect) {
          drawWidth = canvas.height * aspect;
        } else {
          drawHeight = canvas.width / aspect;
        }

        ctx.drawImage(img, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderText(ctx, canvas);
      };
    } else {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      gradient.addColorStop(0, 'rgba(255,255,255,0.05)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      renderText(ctx, canvas);
    }
  };

  const renderText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = textColor;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 25;
    ctx.textAlign = layout === 'centered' ? 'center' : 'left';
    
    const margin = 100;
    const x = layout === 'centered' ? canvas.width / 2 : margin;
    let y = canvas.height / 2;

    if (layout === 'split') {
       ctx.fillStyle = accentColor;
       ctx.shadowBlur = 0;
       ctx.fillRect(0, 0, canvas.width / 2.5, canvas.height);
       ctx.fillStyle = textColor;
       ctx.shadowBlur = 25;
    }

    ctx.font = `black ${fontSize}px "Inter", sans-serif`;
    const titleLines = wrapText(ctx, title.toUpperCase(), canvas.width - (margin * 2));
    y -= (titleLines.length * fontSize) / 2;

    titleLines.forEach((line, i) => {
      ctx.fillText(line, x, y);
      y += fontSize + 15;
    });

    if (subtitle) {
      ctx.font = `bold ${fontSize * 0.4}px "Inter", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(subtitle.toUpperCase(), x, y + 10);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
  };

  const generateAIVariations = async () => {
    setIsGeneratingVariations(true);
    try {
      const provider = getAIProviderInstance();
      const response = await provider.suggestThumbnail(project);
      setVariations(response);
    } catch (err) {
      console.error('Variation protocol failure', err);
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const applyVariation = (v: any) => {
    setTitle(v.title);
    setSubtitle(v.subtitle || '');
    setBgColor(v.bgColor);
    setTextColor(v.textColor);
    setAccentColor(v.accentColor);
    setLayout(v.layout);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
        onGenerated(file);
      }
    }, 'image/jpeg', 1.0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setBgImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-md">
      <motion.div 
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        className="bg-surface w-full max-w-6xl h-[92vh] flex flex-col rounded-[3rem] overflow-hidden shadow-2xl border border-outline-variant/30"
      >
        <div className="px-10 py-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface shadow-sm z-10">
          <div className="flex items-center gap-5">
             <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center border border-primary/20 shadow-sm transition-transform hover:rotate-12">
                <Box className="w-6 h-6" />
             </div>
             <div className="flex flex-col">
                <h3 className="text-2xl font-black tracking-tight text-on-surface">Creative Matrix</h3>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60">Visual ID Protocol v1.0</p>
             </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-surface-variant rounded-full transition-all active:scale-90">
             <X className="w-6 h-6 text-on-surface-variant" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Preview Area */}
          <div className="flex-1 bg-surface-variant/5 p-12 flex flex-col items-center justify-center relative overflow-hidden group">
             {/* Decorative Background */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary),transparent)] opacity-[0.02] pointer-events-none" />
             
             <div className="relative w-full max-w-4xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-4 border-outline-variant/20 rounded-[2.5rem] overflow-hidden bg-black transition-all duration-700 group-hover:scale-[1.01] group-hover:shadow-[0_60px_120px_-20px_rgba(0,0,0,0.6)]">
                <canvas 
                  ref={canvasRef}
                  width={1280}
                  height={720}
                  className="w-full h-auto max-w-full"
                  style={{ aspectRatio: '16/9' }}
                />
             </div>
             <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-30 flex items-center gap-3">
                <Signal className="w-3 h-3" />
                Live Broadcast Output Master - 4K 1:1 Matrix Mapping
             </p>
          </div>

          {/* Sidebar Controls */}
          <div className="w-full lg:w-[420px] border-l border-outline-variant/30 bg-surface p-10 space-y-10 overflow-y-auto custom-scrollbar shadow-inner relative z-20">
            <section className="space-y-6">
              <div className="flex items-center gap-3 ml-1">
                 <Zap className="w-4 h-4 text-primary" />
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Neural Suggestion Generator</label>
              </div>
              <button 
                onClick={generateAIVariations}
                disabled={isGeneratingVariations}
                className="w-full flex items-center justify-center gap-4 py-5 bg-primary/5 border border-primary/20 rounded-[1.5rem] text-primary font-black text-[11px] uppercase tracking-widest hover:bg-primary/10 transition-all disabled:opacity-50 active:scale-95 shadow-sm"
              >
                {isGeneratingVariations ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 transition-transform group-hover:scale-110" />}
                <span>Initiate AI Synthesis</span>
              </button>
              
              <AnimatePresence>
                {variations.length > 0 && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="grid grid-cols-3 gap-4"
                  >
                     {variations.map((v, i) => (
                       <button 
                        key={i}
                        onClick={() => applyVariation(v)}
                        className="aspect-video rounded-2xl border-2 border-outline-variant/20 p-1.5 overflow-hidden hover:border-primary transition-all bg-surface-variant/20 hover:scale-105 active:scale-95 shadow-md"
                       >
                          <div className="w-full h-full rounded-xl shadow-inner border border-white/5" style={{ backgroundColor: v.bgColor }}></div>
                       </button>
                     ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 ml-1">
                 <Type className="w-4 h-4 text-on-surface-variant" />
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Semantic Interface Layer</label>
              </div>
              <div className="space-y-4">
                <div className="relative group">
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Primary Vector Heading"
                    className="w-full bg-surface-variant/10 border border-outline-variant/30 rounded-2xl px-6 py-4 text-sm font-black text-on-surface focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:opacity-20"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <input 
                  type="text" 
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Secondary Context Descriptor"
                  className="w-full bg-surface-variant/10 border border-outline-variant/30 rounded-2xl px-6 py-4 text-sm font-bold text-on-surface-variant focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:opacity-20"
                />
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 ml-1">
                 <Layout className="w-4 h-4 text-on-surface-variant" />
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Spatial Geometry & Scaling</label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                 {(['centered', 'left', 'split'] as const).map(l => (
                   <button 
                    key={l}
                    onClick={() => setLayout(l)}
                    className={`flex flex-col items-center justify-center gap-3 py-5 rounded-[1.5rem] border-2 transition-all active:scale-95 ${layout === l ? 'border-primary bg-primary text-on-primary shadow-lg shadow-primary/20' : 'border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60 hover:bg-surface-variant/20'}`}
                   >
                     {l === 'centered' && <AlignCenter className="w-5 h-5" />}
                     {l === 'left' && <AlignLeft className="w-5 h-5" />}
                     {l === 'split' && <Columns className="w-5 h-5" />}
                     <span className="text-[9px] font-black uppercase tracking-widest">{l}</span>
                   </button>
                 ))}
              </div>
              <div className="space-y-4 pt-4">
                 <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
                    <span>Alpha Size</span>
                    <span>{fontSize}px</span>
                 </div>
                 <input 
                    type="range" 
                    min="30" max="150" 
                    value={fontSize} 
                    onChange={e => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-primary h-2 bg-surface-variant/30 rounded-full"
                 />
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 ml-1">
                 <Palette className="w-4 h-4 text-on-surface-variant" />
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Chromatic Spectrum Array</label>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-5 gap-3">
                  {colors.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setBgColor(c)}
                      className={`aspect-square rounded-full border-4 transition-all hover:scale-125 hover:shadow-lg ${bgColor === c ? 'border-primary scale-110' : 'border-white/10'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-surface-variant/20 p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between group h-20">
                      <div className="flex flex-col gap-1">
                         <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">Accent Vector</span>
                         <span className="text-[10px] font-mono font-bold text-on-surface transition-colors group-hover:text-primary">{accentColor.toUpperCase()}</span>
                      </div>
                      <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer p-0 overflow-hidden" />
                   </div>
                   <div className="bg-surface-variant/20 p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between group h-20">
                      <div className="flex flex-col gap-1">
                         <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">Neural Ink</span>
                         <span className="text-[10px] font-mono font-bold text-on-surface transition-colors group-hover:text-primary">{textColor.toUpperCase()}</span>
                      </div>
                      <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer p-0 overflow-hidden" />
                   </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 ml-1">
                 <Layers className="w-4 h-4 text-on-surface-variant" />
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Environmental mapping</label>
              </div>
              
              {!bgImage ? (
                <label className="flex flex-col items-center justify-center gap-4 p-10 border-4 border-dashed border-outline-variant/20 rounded-[2.5rem] cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <ImageIcon className="w-12 h-12 text-on-surface-variant/20 transition-transform duration-500 group-hover:scale-110 group-hover:text-primary/40" />
                  <div className="text-center space-y-1 relative z-10">
                    <span className="block text-[11px] font-black uppercase tracking-widest text-on-surface">Inject Background</span>
                    <span className="block text-[9px] font-bold text-on-surface-variant opacity-40">PNG, JPG or RAW Buffer (1920x1080)</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="relative group rounded-[2rem] overflow-hidden border-2 border-primary shadow-xl">
                    <img src={bgImage} className="w-full aspect-video object-cover opacity-50 transition-opacity group-hover:opacity-70" alt="Background map" />
                    <div className="absolute inset-0 bg-scrim/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4">
                       <button 
                        onClick={() => setBgImage(null)}
                        className="px-6 py-3 bg-error text-on-error rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95"
                       >
                         Eject Map
                       </button>
                    </div>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="px-10 py-10 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-10 bg-surface shadow-2xl relative z-30">
          <div className="flex items-center gap-4 opacity-40 hidden sm:flex">
             <Signal className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Master Protocol Ready</span>
          </div>
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <button 
              onClick={onClose} 
              className="flex-1 sm:flex-initial px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-surface transition-colors active:scale-95"
            >
              Abort Protocol
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-4 px-12 py-5 bg-primary text-on-primary rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(var(--color-primary-rgb),0.3)] hover:scale-105 active:scale-95 transition-all text-[11px]"
            >
              <Download className="w-5 h-5" />
              <span>Engage Deployment</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
