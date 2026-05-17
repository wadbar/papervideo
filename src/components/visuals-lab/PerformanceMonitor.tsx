import React, { useState, useEffect } from 'react';
import { Activity, Terminal, Shield, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVisualsLab } from '../../core/contexts/VisualsLabContext';

export default function PerformanceMonitor() {
  const { project, activeScene } = useVisualsLab();
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<{ id: string, msg: string, type: 'info' | 'warn' | 'error', time: string }[]>([]);

  useEffect(() => {
    // Escuta eventos customizados de log (uma forma de blindagem e monitoramento)
    const handleLog = (e: any) => {
        setLogs(prev => [{
            id: crypto.randomUUID(),
            msg: e.detail.message,
            type: e.detail.type || 'info',
            time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 50));
    };

    window.addEventListener('sys_log', handleLog);
    return () => window.removeEventListener('sys_log', handleLog);
  }, []);

  const stats = [
    { label: 'Asset Density', value: `${((project.scenes.filter(s => s.imageUrl).length / project.scenes.length) * 100).toFixed(0)}%`, icon: Zap },
    { label: 'Runtime Safety', value: 'OPTIMIZED', icon: Shield },
    { label: 'IO Latency', value: '< 24ms', icon: Activity }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 h-96 bg-[#0d0d0f]/95 backdrop-blur-xl border border-[#2a2d35] rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden shadow-blue-500/10"
          >
            <div className="p-4 border-b border-[#2a2d35] bg-[#1a1b1e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8e9299]">Cortex Monitor V9</span>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 border-b border-[#2a2d35]">
              {stats.map(s => (
                <div key={s.label} className="p-3 border-r border-[#2a2d35] flex flex-col items-center">
                  <s.icon className="w-3 h-3 text-[#4e515a] mb-1" />
                  <span className="text-[8px] text-[#4e515a] uppercase font-bold text-center leading-tight mb-1">{s.label}</span>
                  <span className="text-[10px] font-mono font-bold text-blue-400">{s.value}</span>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar font-mono">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                       <Activity className="w-8 h-8 mb-2" />
                       <span className="text-[10px] uppercase font-bold tracking-tighter">System Idle - Awaiting Ops</span>
                    </div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="text-[9px] leading-tight flex gap-2">
                            <span className="text-[#4e515a] flex-shrink-0">[{log.time}]</span>
                            <span className={
                                log.type === 'error' ? 'text-red-500' : 
                                log.type === 'warn' ? 'text-yellow-500' : 
                                'text-blue-400'
                            }>
                                {log.type === 'error' ? 'ERR_' : log.type === 'warn' ? 'WRN_' : 'SYS_'}
                                {log.msg}
                            </span>
                        </div>
                    ))
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
            isOpen ? 'bg-blue-600 text-white rotate-90' : 'bg-[#1f2128] border border-[#2a2d35] text-blue-400 hover:border-blue-500/50'
        }`}
      >
        <Terminal className="w-5 h-5" />
      </button>
    </div>
  );
}
