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
  Sparkles
} from 'lucide-react';
import { useSettingsStore } from '../core/store/useSettingsStore';

interface ThumbnailCreatorProps {
  initialTitle: string;
  onSave: (blob: Blob) => void;
  onClose: () => void;
}

export default function ThumbnailCreator({ initialTitle, onSave, onClose }: ThumbnailCreatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState('');
  const [bgColor, setBgColor] = useState('#1a1a2e');
  const [textColor, setTextColor] = useState('#ffffff');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [layout, setLayout] = useState<'centered' | 'left' | 'split'>('centered');
  const [fontSize, setFontSize] = useState(60);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [variations, setVariations] = useState<any[]>([]);
  const { getAIProviderInstance } = useSettingsStore();

  const colors = [
    '#1a1a2e', '#0f172a', '#1e1b4b', '#450a0a', '#14532d', 
    '#312e81', '#1e293b', '#000000', '#f43f5e', '#8b5cf6'
  ];

  const textColors = ['#ffffff', '#f8fafc', '#e2e8f0', '#fbbf24', '#f472b6'];

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
        // Draw background image with overlay
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
        
        // Add semi-transparent overlay
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        renderText(ctx, canvas);
      };
    } else {
      // Background effects if no image
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      renderText(ctx, canvas);
    }
  };

  const renderText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Styling
    ctx.fillStyle = textColor;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    ctx.textAlign = layout === 'centered' ? 'center' : 'left';
    
    const margin = 80;
    const x = layout === 'centered' ? canvas.width / 2 : margin;
    let y = canvas.height / 2;

    // Accent line/rect
    ctx.fillStyle = accentColor;
    if (layout === 'split') {
       ctx.fillRect(0, 0, canvas.width / 3, canvas.height);
       ctx.fillStyle = textColor;
    }

    // Title
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    const titleLines = wrapText(ctx, title.toUpperCase(), canvas.width - (margin * 2));
    
    y -= (titleLines.length * fontSize) / 2;

    titleLines.forEach((line, i) => {
      // Draw accent bar behind first line maybe?
      if (i === 0 && layout !== 'split') {
        const metrics = ctx.measureText(line);
        ctx.fillStyle = accentColor;
        const rectX = layout === 'centered' ? x - metrics.width/2 - 10 : x - 10;
        ctx.fillRect(rectX, y - fontSize + 10, metrics.width + 20, fontSize);
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, x, y);
      y += fontSize + 10;
    });

    // Subtitle
    if (subtitle) {
      ctx.font = `500 ${fontSize * 0.4}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(subtitle, x, y + 20);
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
      const prompt = `Based on the video title: "${title}", suggest 3 visually striking thumbnail configurations for YouTube.
      Respond only with a JSON array of 3 objects, each having:
      { "title": string, "subtitle": string, "bgColor": hex, "textColor": hex, "accentColor": hex, "layout": "centered"|"left"|"split" }`;

      const response = await (provider as any).fetchAuth('/generate', { prompt, responseType: 'json' });
      setVariations(response.content);
    } catch (err) {
      console.error('Failed to generate variations', err);
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
      if (blob) onSave(blob);
    }, 'image/jpeg', 0.9);
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="hardware-card w-full max-w-5xl bg-[#0a0a0b] overflow-hidden flex flex-col h-[90vh]"
      >
        <div className="p-4 border-b border-[#2a2d35] flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Layout className="w-5 h-5 text-blue-400" />
             <h3 className="font-bold uppercase tracking-widest text-sm">Thumbnail Creator</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1f2128] rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Preview Area */}
          <div className="flex-1 bg-[#050505] p-8 flex items-center justify-center overflow-hidden">
             <div className="relative shadow-2xl shadow-blue-500/10 border border-[#2a2d35] rounded-xl overflow-hidden bg-black">
                <canvas 
                  ref={canvasRef}
                  width={1280}
                  height={720}
                  className="w-full h-auto max-w-full rounded-lg"
                  style={{ aspectRatio: '16/9' }}
                />
             </div>
          </div>

          {/* Sidebar Controls */}
          <div className="w-full lg:w-80 border-l border-[#2a2d35] bg-[#0e0e10] p-6 space-y-6 overflow-y-auto custom-scrollbar">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8e9299] mb-3">AI Suggestions</label>
              <button 
                onClick={generateAIVariations}
                disabled={isGeneratingVariations}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 font-bold text-[10px] uppercase tracking-widest hover:bg-blue-500/20 transition-all disabled:opacity-50"
              >
                {isGeneratingVariations ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Generate 3 Variations</span>
              </button>
              
              {variations.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                   {variations.map((v, i) => (
                     <button 
                      key={i}
                      onClick={() => applyVariation(v)}
                      className="aspect-video rounded border border-[#2a2d35] p-1 overflow-hidden hover:border-blue-500 transition-all bg-[#0d0d0f]"
                     >
                        <div className="w-full h-full rounded" style={{ backgroundColor: v.bgColor }}></div>
                     </button>
                   ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8e9299] mb-3">Text Content</label>
              <div className="space-y-3">
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4e515a]" />
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full bg-[#151619] border border-[#2a2d35] rounded-lg pl-10 pr-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <input 
                  type="text" 
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Subtitle (Optional)"
                  className="w-full bg-[#151619] border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8e9299] mb-3">Layout & Size</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                 {(['centered', 'left', 'split'] as const).map(l => (
                   <button 
                    key={l}
                    onClick={() => setLayout(l)}
                    className={`p-2 rounded border uppercase text-[9px] font-bold transition-all ${layout === l ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-[#2a2d35] text-[#4e515a] hover:border-[#4e515a]'}`}
                   >
                     {l}
                   </button>
                 ))}
              </div>
              <input 
                type="range" 
                min="30" max="120" 
                value={fontSize} 
                onChange={e => setFontSize(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8e9299] mb-3">Colors</label>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setBgColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${bgColor === c ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#8e9299]" />
                  <span className="text-xs text-[#8e9299]">Accent</span>
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-8 h-8 rounded bg-transparent border-none cursor-pointer" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[#8e9299] mb-3">Background Image</label>
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#2a2d35] rounded-xl cursor-pointer hover:border-[#4e515a] transition-all bg-[#151619]">
                <ImageIcon className="w-5 h-5 text-[#8e9299]" />
                <span className="text-xs font-bold text-[#8e9299]">Upload background</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              {bgImage && (
                <button 
                  onClick={() => setBgImage(null)}
                  className="mt-2 text-[10px] text-red-400 hover:underline"
                >
                  Remove background
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#2a2d35] flex justify-end gap-3 bg-[#0e0e10]">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-[#8e9299] hover:text-white transition-colors">Cancel</button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95"
          >
            <Download className="w-4 h-4" />
            Apply to Thumbnail
          </button>
        </div>
      </motion.div>
    </div>
  );
}
