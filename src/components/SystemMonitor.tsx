import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, ShieldCheck, Zap, Cpu, Trash2, X, AlertCircle, Signal, CheckCircle2, ChevronUp, Layers, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LogType, sysLog } from '../lib/sys';
import { useProjectStore } from '../core/store/useProjectStore';

interface LogEntry {
  id: string;
  message: string;
  type: LogType;
  timestamp: number;
}

export default function SystemMonitor() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [memoryStats, setMemoryStats] = useState({ used: 0, limit: 0, critical: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const clearAllHistory = useProjectStore(state => state.clearAllHistory);

  useEffect(() => {
    const handleVramPressure = (e: any) => {
      setMemoryStats(prev => ({ ...prev, critical: true }));
      setTimeout(() => setMemoryStats(prev => ({ ...prev, critical: false })), 2000);
    };
    window.addEventListener('vram-pressure-critical', handleVramPressure);

    const updateMem = () => {
        const memory = (performance as any).memory;
        if (memory) {
            setMemoryStats(prev => ({
                ...prev,
                used: memory.usedJSHeapSize,
                limit: memory.jsHeapSizeLimit || memory.totalJSHeapSize
            }));
        }
    };
    const interval = setInterval(updateMem, 2000);
    updateMem();

    return () => {
        window.removeEventListener('vram-pressure-critical', handleVramPressure);
        clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleLog = (e: any) => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        message: e.detail.message,
        type: e.detail.type,
        timestamp: Date.now()
      };
      setLogs(prev => [...prev.slice(-49), newLog]);
    };

    window.addEventListener('sys_log', handleLog);
    return () => window.removeEventListener('sys_log', handleLog);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <>
      {/* Floating Status Bar - MD3 FAB Style */}
      <motion.div 
        layout
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-6 bg-surface border border-outline-variant/30 px-6 py-3.5 rounded-[2rem] cursor-pointer hover:bg-surface-variant transition-all group shadow-xl active:scale-95 select-none"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_12px_var(--color-primary)]" />
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface opacity-80">Telemetry Uplink</span>
        </div>
        
        <div className="h-4 w-px bg-outline-variant/40" />
        
        <div className="flex items-center gap-6 text-[10px] font-mono font-black tracking-tight text-on-surface-variant">
           <div className={`flex items-center gap-2 group/stat transition-colors ${memoryStats.critical ? 'text-error animate-pulse' : ''}`}>
             <Layers className={`w-3.5 h-3.5 ${memoryStats.critical ? 'text-error' : 'text-primary opacity-60'}`} />
             <span>
                 {memoryStats.limit > 0
                     ? `${Math.round(memoryStats.used/1024/1024)}MB / ${Math.round(memoryStats.limit/1024/1024)}MB` 
                     : 'MEM_OK'}
             </span>
             {memoryStats.critical && <span className="ml-1 text-[8px] tracking-widest text-error">PURGED</span>}
           </div>
           <div className="flex items-center gap-2 group/stat">
             <Cpu className="w-3.5 h-3.5 text-secondary opacity-60" />
             <span>12%</span>
           </div>
           <div className="flex items-center gap-2 group/stat">
             <Zap className="w-3.5 h-3.5 text-tertiary opacity-60" />
             <span>2.4ms</span>
           </div>
           <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 left-6 z-50 w-[440px] h-[600px] bg-surface rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-outline-variant/30"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                  <Terminal className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">Master Control</h3>
                  <p className="text-[9px] font-black tracking-[0.1em] text-on-surface-variant opacity-40">PAPERCREEPER_V120_STABLE</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-surface-variant rounded-full transition-all active:scale-90">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            {/* Performance Strips */}
            <div className="bg-surface-variant/10 p-2 space-y-px">
               <div className="flex items-center gap-2 px-6 py-3">
                  <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant w-24">Neural Load</span>
                  <div className="flex-1 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                     <motion.div 
                        animate={{ width: ['20%', '80%', '40%', '90%', '60%'] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="h-full bg-primary" 
                     />
                  </div>
               </div>
               <div className="flex items-center gap-2 px-6 py-3">
                  <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant w-24">IO Bandwidth</span>
                  <div className="flex-1 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                     <motion.div 
                        animate={{ width: ['60%', '65%', '62%', '68%', '64%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="h-full bg-secondary" 
                     />
                  </div>
               </div>
            </div>

            {/* Logs Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar text-[11px] font-mono bg-surface-variant/5 selection:bg-primary selection:text-on-primary"
            >
              {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/10 gap-6 opacity-30 select-none">
                  <Signal className="w-16 h-16 animate-pulse" />
                  <div className="text-center space-y-1">
                    <p className="font-black uppercase tracking-[0.3em]">Neural Silence</p>
                    <p className="text-[8px] font-black uppercase tracking-widest">Awaiting system handshake...</p>
                  </div>
                </div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="group flex gap-3 animate-in fade-in slide-in-from-left-4 duration-500 hover:bg-surface-variant/20 p-2 rounded-xl transition-all border border-transparent hover:border-outline-variant/20">
                  <span className="text-on-surface-variant opacity-20 shrink-0 select-none font-black font-sans text-[9px] mt-0.5 tracking-tighter">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}]</span>
                  <span className={`shrink-0 font-black uppercase tracking-widest text-[9px] mt-0.5 ${
                    log.type === 'error' ? 'text-error' : 
                    log.type === 'warn' ? 'text-tertiary' : 
                    'text-primary'
                  }`}>
                    {log.type === 'error' ? 'ERR' : log.type === 'warn' ? 'WRN' : 'SYS'}
                  </span>
                  <span className="text-on-surface font-black tracking-tight flex-1 leading-relaxed opacity-80 group-hover:opacity-100">{log.message}</span>
                </div>
              ))}
            </div>

            {/* Input Overlay Placeholder */}
            <div className="px-8 py-5 bg-surface-variant/10 border-t border-outline-variant/30 flex items-center gap-4">
               <span className="text-primary font-black text-sm select-none">›</span>
               <div className="flex-1 overflow-hidden flex items-center">
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-1.5 h-5 bg-primary/40"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-20 ml-4">Terminal Input Intercepted by Neural Guard</span>
               </div>
               <Command className="w-4 h-4 text-on-surface-variant opacity-20" />
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 bg-surface flex items-center justify-between border-t border-outline-variant/30">
               <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-tertiary rounded-full shadow-[0_0_8px_var(--color-tertiary)]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">PID_4812</span>
                 </div>
                 <button 
                  onClick={() => {
                     const event = new Event('vram-pressure-critical');
                     window.dispatchEvent(event);
                     sysLog('All memory buffers cleared.', 'warn');
                  }}
                  className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-on-surface-variant hover:text-error transition-all active:scale-95"
                 >
                   <Layers className="w-3.5 h-3.5" />
                   <span>Emergency Cache Purge</span>
                 </button>
                 <button 
                  onClick={() => {
                    clearAllHistory();
                    setLogs([]);
                    sysLog('Log buffer and temporal history purged.', 'warn');
                  }}
                  className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-on-surface-variant hover:text-error transition-all active:scale-95"
                 >
                   <Trash2 className="w-3.5 h-3.5" />
                   <span>Clear Buffer</span>
                 </button>
               </div>
               <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">MASTER_V9_CORE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
