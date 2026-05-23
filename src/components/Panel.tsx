import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Server, Folder, File, Search, X, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { monitoringService } from '../lib/MonitoringService';

function SystemResourceWidget() {
  const [data, setData] = useState<{time: number, cpu: number, memory: number}[]>([]);

  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      setData(prev => {
        const cpu = Math.random() * 100;
        const memory = Math.random() * 80 + 20;
        monitoringService.logMetric(cpu, memory);
        
        const newData = [...prev, { time: tick++, cpu, memory }];
        if (newData.length > 20) newData.shift();
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-64 w-full m3-card p-6">
      <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] mb-4">Real-time Resource Usage</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" opacity={0.5} />
          <XAxis dataKey="time" hide />
          <YAxis stroke="var(--md-sys-color-on-surface-variant)" />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--md-sys-color-surface-container)', border: '1px solid var(--md-sys-color-outline)', borderRadius: '1rem', color: 'var(--md-sys-color-on-surface)' }}
          />
          <Line type="monotone" dataKey="cpu" stroke="var(--md-sys-color-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="memory" stroke="var(--md-sys-color-secondary)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function FileManagerSection() {
  const [search, setSearch] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [platform, setPlatform] = useState('gba');
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedRom, setSelectedRom] = useState('');
  const [sortField, setSortField] = useState<'name' | 'type'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  
  const files = ['System_Config.yaml', 'Network_Logs.txt', 'Docker_Compose.yml', 'Engine_Manifest.json', 'Security_Keys.pem', 'Dataset_Archive.zip', 'game_x.gba', 'super_game.nes', 'ubuntu.iso'];
  const filtered = files.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  const sortedFiles = [...filtered].sort((a, b) => {
    if (sortField === 'name') {
       return sortAsc ? a.localeCompare(b) : b.localeCompare(a);
    } else {
       const typeA = a.split('.').pop() || '';
       const typeB = b.split('.').pop() || '';
       return sortAsc ? typeA.localeCompare(typeB) : typeB.localeCompare(typeA);
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fileSearchHistory');
      if (saved) setHistory(JSON.parse(saved));
    } catch(e) {}
  }, []);

  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 5);
    setHistory(newHistory);
    try {
      localStorage.setItem('fileSearchHistory', JSON.stringify(newHistory));
    } catch(e) {}
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('fileSearchHistory');
    } catch(e) {}
  };

  const platformValidation: Record<string, string[]> = {
    'gba': ['.gba', '.gbc'],
    'nes': ['.nes'],
    'x86': ['.iso', '.img']
  };

  const platformLabels: Record<string, string> = {
    'gba': 'GameBoy Advance (GBA)',
    'nes': 'Nintendo (NES)',
    'x86': 'PC (x86)'
  };

  const getRomError = () => {
    if (!selectedRom) return '';
    const validExts = platformValidation[platform];
    const hasValidExt = validExts?.some(ext => selectedRom.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      return `Invalid ROM extension for architecture ${platform}. Expected: ${validExts?.join(', ')}`;
    }
    return '';
  };

  const romError = getRomError();

  return (
    <div className="flex flex-col gap-6">
      {/* File Search */}
      <div className="flex flex-col gap-2">
        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
           <input 
             type="text" 
             placeholder="Search files..."
             value={search}
             onChange={e => setSearch(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && saveToHistory(search)}
             className="m3-input pl-12"
           />
        </div>
        {history.length > 0 && (
          <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] px-2">
            <div className="flex gap-2 items-center flex-wrap">
              <span className="font-medium">Recent:</span>
              {history.map((h, i) => (
                <button 
                  key={i} 
                  onClick={() => { setSearch(h); }} 
                  className="m3-button-tonal !py-1 !px-3 text-xs"
                >
                  {h}
                </button>
              ))}
            </div>
            <button onClick={clearHistory} className="m3-button-text !px-3 !py-1 text-xs hover:!bg-[var(--md-sys-color-error-container)] hover:!text-[var(--md-sys-color-on-error-container)]">Clear</button>
          </div>
        )}
      </div>

      {/* ROM Creator via framer-motion */}
      <div className="m3-card flex flex-col gap-4">
        <h3 className="font-bold text-[var(--md-sys-color-on-surface)]">ROM Creator</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <motion.button 
              id="platform-select"
              key={`platform-btn-${platform}`}
              initial={{ opacity: 0.8, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSelectOpen(!isSelectOpen)}
              className="m3-button-tonal w-full h-full flex justify-between items-center"
            >
              <span className="truncate">{platformLabels[platform]}</span>
              <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isSelectOpen ? 'rotate-180' : ''}`} />
            </motion.button>
            
            <AnimatePresence>
              {isSelectOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] rounded-3xl shadow-lg z-20 overflow-hidden flex flex-col"
                >
                  {Object.entries(platformLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setPlatform(key); setIsSelectOpen(false); }}
                      className={`text-left px-4 py-3 hover:bg-[var(--md-sys-color-surface-variant)] transition-colors ${platform === key ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold' : 'text-[var(--md-sys-color-on-surface)]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <input 
            type="text"
            placeholder="Select a ROM below..."
            readOnly
            value={selectedRom}
            className="m3-input opacity-70"
          />
        </div>
        <div className="flex justify-end relative group">
          <button 
            disabled={!selectedRom || !!romError}
            className="m3-button-filled"
          >
            Create Image
          </button>
          {romError && (
             <div className="absolute bottom-full right-0 mb-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all bg-[var(--md-sys-color-error-container)] border border-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error-container)] text-xs p-2 rounded-3xl shadow-lg w-48 text-center z-10">
               {romError}
             </div>
          )}
        </div>
      </div>

      {/* Files List Header */}
      <div className="flex items-center gap-4 px-4 text-sm font-bold text-[var(--md-sys-color-on-surface)] border-b border-[var(--md-sys-color-outline)] pb-2">
        <button className="m3-button-text flex items-center gap-2 flex-1 !px-3 !py-2" onClick={() => { setSortField('name'); setSortAsc(f => !f); }}>
          File Name
          <ChevronDown className={`w-4 h-4 transition-transform ${sortField === 'name' && !sortAsc ? 'rotate-180' : ''} ${sortField !== 'name' ? 'opacity-0' : ''}`} />
        </button>
        <button className="m3-button-text flex items-center gap-2 !px-3 !py-2" onClick={() => { setSortField('type'); setSortAsc(f => !f); }}>
          Type
          <ChevronDown className={`w-4 h-4 transition-transform ${sortField === 'type' && !sortAsc ? 'rotate-180' : ''} ${sortField !== 'type' ? 'opacity-0' : ''}`} />
        </button>
      </div>

      {/* Files List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 mt-2 space-y-0 gap-4">
         {sortedFiles.map(file => {
           const matchIndex = file.toLowerCase().indexOf(search.toLowerCase());
           const beforeMatch = file.slice(0, matchIndex);
           const matchText = file.slice(matchIndex, matchIndex + search.length);
           const afterMatch = file.slice(matchIndex + search.length);

           return (
             <div key={file} onClick={() => setSelectedRom(file)} className={`flex items-center gap-3 p-4 rounded-3xl border transition-colors cursor-pointer ${selectedRom === file ? 'bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)]' : 'bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-variant)]'}`}>
               <File className={`w-6 h-6 flex-shrink-0 ${selectedRom === file ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`} />
               <span className="text-[var(--md-sys-color-on-surface)] text-sm font-medium truncate flex-1">
                 {search ? (
                   <>
                     {beforeMatch}<span className="bg-[var(--md-sys-color-primary)]/30 text-[var(--md-sys-color-primary)]">{matchText}</span>{afterMatch}
                   </>
                 ) : (
                   file
                 )}
               </span>
               {platformValidation[platform]?.some(ext => file.toLowerCase().endsWith(ext)) && (
                 <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] px-2 py-1 rounded-full flex-shrink-0">
                   Compatible
                 </span>
               )}
             </div>
           );
         })}
      </div>
    </div>
  );
}

export default function Panel() {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'files'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<{id: string, message: string, type: string}[]>([]);
  
  useEffect(() => {
    const handleSysLog = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { id, message, type } = customEvent.detail;
      if (type === 'warn' && (message.includes('CPU') || message.includes('RAM'))) {
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
      }
    };
    window.addEventListener('sys_log', handleSysLog);
    return () => window.removeEventListener('sys_log', handleSysLog);
  }, []);

  useEffect(() => {
    let current = localStorage.getItem('theme');
    if (!current) {
      current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    setTheme(current);
    document.documentElement.setAttribute('data-theme', current);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  return (
    <div className="p-6 md:p-8 overflow-y-auto w-full h-full bg-[var(--md-sys-color-surface)]">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row justify-between items-center bg-[var(--md-sys-color-surface-container)] p-6 rounded-3xl border border-[var(--md-sys-color-outline)] gap-4">
           <div className="flex items-center gap-6">
             <h1 className="text-3xl font-black text-[var(--md-sys-color-on-surface)]">System Panels</h1>
             <div className="flex items-center bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] p-1 rounded-3xl">
               <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'm3-button-filled' : 'm3-button-text'}>Dashboard</button>
               <button onClick={() => setActiveTab('files')} className={activeTab === 'files' ? 'm3-button-filled' : 'm3-button-text'}>File Manager</button>
             </div>
           </div>
           
           <div className="flex gap-4">
             <button onClick={() => setIsModalOpen(true)} className="m3-button-tonal">
               Open Modal
             </button>
             <button onClick={toggleTheme} className="m3-button-filled">
               Toggle Theme ({theme})
             </button>
           </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div 
               key="dashboard-tab"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
               className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="m3-card flex flex-col gap-6">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-[var(--md-sys-color-primary)]/10 rounded-3xl">
                     <Server className="w-8 h-8 text-[var(--md-sys-color-primary)]" />
                   </div>
                   <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Server Node Alpha</h2>
                </div>
                <SystemResourceWidget />
              </div>
              
              <div className="m3-card flex flex-col gap-6">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-[var(--md-sys-color-secondary)]/10 rounded-3xl">
                     <Activity className="w-8 h-8 text-[var(--md-sys-color-secondary)]" />
                   </div>
                   <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Telemetry Stream</h2>
                </div>
                <div className="flex-1 bg-[var(--md-sys-color-surface-container-high)] rounded-3xl border border-[var(--md-sys-color-outline)] p-6">
                   <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm font-medium leading-relaxed">Telemetry metrics indicate system operating at optimal capacity. Bandwidth overhead is within acceptable thresholds.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
               key="files-tab"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
               className="m3-card flex flex-col gap-6"
            >
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-[var(--md-sys-color-primary)]/10 rounded-3xl">
                   <Folder className="w-8 h-8 text-[var(--md-sys-color-primary)]" />
                 </div>
                 <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">File System Explorer</h2>
               </div>
               <FileManagerSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
             <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsModalOpen(false)}
             />
               <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative m3-card max-w-md w-full shadow-2xl flex flex-col gap-4"
             >
               <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">System Alert</h2>
                 <button onClick={() => setIsModalOpen(false)} className="m3-button-tonal !p-2 !min-w-0 !rounded-full">
                   <X className="w-5 h-5 text-[var(--md-sys-color-on-surface-variant)]" />
                 </button>
               </div>
               <p className="text-[var(--md-sys-color-on-surface-variant)]">This is a smoothly animated modal element conforming to Material Design 3 and utilizing Framer Motion transitions.</p>
               <div className="flex justify-end gap-3 mt-4">
                 <button onClick={() => setIsModalOpen(false)} className="m3-button-text">Dismiss</button>
                 <button onClick={() => setIsModalOpen(false)} className="m3-button-filled">Acknowledge</button>
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] px-6 py-4 rounded-3xl border border-[var(--md-sys-color-error)] shadow-lg flex items-center justify-between gap-6 max-w-sm pointer-events-auto"
            >
              <div className="flex flex-col gap-1">
                <strong className="font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Resource Threshold Exceeded
                </strong>
                <span className="text-sm opacity-90 leading-tight">{toast.message}</span>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
                className="m3-button-tonal !p-2 !min-w-0 !rounded-full bg-transparent hover:!bg-[var(--md-sys-color-error)]/20 text-[var(--md-sys-color-on-error-container)] flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
