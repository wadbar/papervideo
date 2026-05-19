import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, ShieldCheck, Zap, Cpu, Trash2 } from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const clearAllHistory = useProjectStore(state => state.clearAllHistory);

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
      {/* Floating Status Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 flex items-center gap-4 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-black/90 transition-all group overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-blue-500/30"
      >
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <span className="text-[10px] font-mono font-bold tracking-tighter text-blue-400">PAPERCREEPER // NODE STATUS</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10" />
        <div className="flex items-center gap-4 text-[10px] font-mono text-white/40">
           <div className="flex items-center gap-1.5 group/stat">
             <Activity className="w-3 h-3 text-blue-500/60" />
             <span className="group-hover/stat:text-blue-400 transition-colors">8.4GB</span>
           </div>
           <div className="flex items-center gap-1.5 group/stat">
             <Cpu className="w-3 h-3 text-orange-500/60" />
             <span className="group-hover/stat:text-orange-400 transition-colors">12% CPU</span>
           </div>
           <div className="flex items-center gap-1.5 group/stat">
             <Zap className="w-3 h-3 text-green-500/60" />
             <span className="group-hover/stat:text-green-400 transition-colors">2.4ms</span>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-16 left-4 z-50 w-[400px] h-[500px] glass-ultra rounded-2xl overflow-hidden flex flex-col tech-bg shadow-2xl border-blue-500/20"
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Terminal className="w-3 h-3 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-blue-100">PaperCreeper Terminal</h3>
                  <p className="text-[8px] font-mono text-blue-500/60 uppercase">Runtime: Chromium Build // Stack: v120_STABLE</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[8px] font-mono text-green-500 font-bold uppercase tracking-widest">
                  GPU_ACCEL: ON
                </div>
                <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-mono text-blue-500 font-bold uppercase tracking-widest">
                  SW: CACHED
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors">
                  <Activity className="w-4 h-4 rotate-90" />
                </button>
              </div>
            </div>

            <div className="bg-black/40 p-4 border-b border-white/5 grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <div className="flex items-center justify-between text-[8px] font-mono text-white/40 uppercase">
                    <span>Task Orchestration</span>
                    <span>Active</span>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: ['20%', '80%', '40%', '90%', '60%'] }}
                      transition={{ duration: 10, repeat: Infinity }}
                      className="h-full bg-blue-500" 
                    />
                 </div>
               </div>
               <div className="space-y-2">
                 <div className="flex items-center justify-between text-[8px] font-mono text-white/40 uppercase">
                    <span>Buffer Allocation</span>
                    <span>Stable</span>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: ['60%', '65%', '62%', '68%', '64%'] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="h-full bg-orange-500" 
                    />
                 </div>
               </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar text-[10px] font-mono bg-black/20"
            >
              {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-white/10 italic gap-2 scale-90 grayscale opacity-50">
                  <Cpu className="w-8 h-8" />
                  <span>Awaiting system event broadcast...</span>
                </div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="group flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300 hover:bg-white/5 px-1 rounded transition-colors">
                  <span className="text-white/10 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  <span className={`shrink-0 font-bold ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'warn' ? 'text-yellow-400' : 
                    'text-blue-400'
                  }`}>
                    {log.type === 'error' ? '[!!]' : log.type === 'warn' ? '[!?]' : '[OK]'}
                  </span>
                  <span className="text-white/60 flex-1 leading-tight">{log.message}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-black/40 border-t border-white/5 flex items-center gap-3">
               <span className="text-blue-500 font-bold font-mono text-[10px]">$</span>
               <div className="flex-1 overflow-hidden">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2 h-4 bg-blue-500/40 inline-block align-middle"
                  />
                  <span className="text-[10px] font-mono text-white/20 ml-2 italic">Awaiting high-level command override...</span>
               </div>
            </div>

            <div className="px-4 py-2 bg-blue-900/10 flex items-center justify-between text-[8px] font-mono text-blue-400/40 uppercase tracking-widest border-t border-blue-500/10">
               <div className="flex items-center gap-4">
                 <span>PID: {Math.floor(Math.random() * 10000)}</span>
                 <button 
                  onClick={() => {
                    clearAllHistory();
                    setLogs([]);
                    sysLog('Log buffer and temporal history purged.', 'warn');
                  }}
                  className="flex items-center gap-1 hover:text-blue-200 transition-colors"
                 >
                   <Trash2 className="w-2.5 h-2.5" />
                   Purge Cache
                 </button>
               </div>
               <span>CORE_V9_RELEASE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
