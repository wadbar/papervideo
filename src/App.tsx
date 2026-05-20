import React, { useState } from 'react';
import { 
  X,
  Server,
  Cpu,
  Globe,
  Settings as SettingsIcon,
  Layout,
  Zap,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProjectStore } from './core/store/useProjectStore';
import { useSettingsStore } from './core/store/useSettingsStore';
import { useYoutubeStore } from './core/store/useYoutubeStore';
import { useTheme } from './core/contexts/ThemeContext';
import VideoStudio from './components/VideoStudio';
import YoutubeChannelManager from './components/YoutubeChannelManager';
import ObservabilityDashboard from './components/ObservabilityDashboard';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ErrorArmor from './components/ErrorArmor';
import SystemMonitor from './components/SystemMonitor';
import { sysLog } from './lib/sys';

export default function App() {
  const { 
    projects, 
    activeProjectId, 
    createNewProject, 
    deleteProject, 
    setActiveProjectId, 
    getActiveProject,
    updateProject
  } = useProjectStore();
  
  const { 
    providers, 
    updateProvider,
    systemSettings,
    updateSystemSettings
  } = useSettingsStore();

  const { theme, toggleTheme } = useTheme();
  const { channels, fetchChannels } = useYoutubeStore();

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<'dashboard' | 'studio' | 'observability'>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isYoutubeManagerOpen, setIsYoutubeManagerOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    fetchChannels();
    sysLog('PaperCreeper System active. All subsystems nominal.', 'info');
  }, []);

  const openYoutubeManager = (channelId?: string) => {
    setSelectedChannelId(channelId);
    setIsYoutubeManagerOpen(true);
  };

  const applySettings = () => {
    setIsSettingsOpen(false);
  };

  const handleCreateNewProject = () => {
    createNewProject();
    setView('studio');
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setView('studio');
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this project?')) {
      deleteProject(id);
      if (activeProjectId === id) {
        setView('dashboard');
      }
    }
  };

  const activeProject = getActiveProject();

  return (
    <div className={`flex h-screen w-full bg-background overflow-hidden relative ${systemSettings?.performanceMode ? 'performance-mode' : ''}`}>
      {/* M3 Background Layer */}
      <div className="absolute inset-0 bg-surface pointer-events-none opacity-50" />
      
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        view={view}
        setView={setView}
        projects={projects}
        activeProjectId={activeProjectId}
        channels={channels}
        onCreateProject={handleCreateNewProject}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
        onOpenYoutubeManager={openYoutubeManager}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isYoutubeManagerOpen={isYoutubeManagerOpen}
        selectedChannelId={selectedChannelId}
      />

      <main className={`flex-1 relative overflow-hidden flex flex-col transition-all duration-300 ${isSettingsOpen || isYoutubeManagerOpen ? 'blur-sm' : ''}`}>
        {/* Floating Theme Toggle (Light/Dark Control) */}
        <button 
          onClick={toggleTheme}
          className="fixed top-4 right-4 z-40 p-3 rounded-full bg-secondary-container text-on-secondary-container shadow-md hover:shadow-lg transition-all active:scale-95"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <ErrorArmor key="armor-dash">
              <Dashboard />
            </ErrorArmor>
          ) : activeProject ? (
            <ErrorArmor key="armor-studio">
              <VideoStudio 
                key="studio"
                project={activeProject} 
                onUpdate={updateProject}
                onBack={() => setView('dashboard')}
              />
            </ErrorArmor>
          ) : view === 'observability' ? (
            <ErrorArmor key="armor-obs">
              <ObservabilityDashboard key="observability" />
            </ErrorArmor>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Settings Modal (M3 Refactored) */}
      <AnimatePresence>
        {isYoutubeManagerOpen && (
          <YoutubeChannelManager 
            initialChannelId={selectedChannelId}
            onClose={() => setIsYoutubeManagerOpen(false)} 
          />
        )}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="w-full max-w-4xl max-h-[90vh] bg-surface shadow-2xl rounded-[3rem] overflow-hidden flex flex-col border border-outline-variant/30"
            >
              {/* Header */}
              <div className="px-10 py-8 border-b border-outline-variant/30 flex items-center justify-between bg-surface relative z-10">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-primary/10 rounded-[1.5rem] border border-primary/20 text-primary">
                    <SettingsIcon className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-3xl font-black tracking-tight text-on-surface uppercase">Master Configuration</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-40 italic">System Control Panel // Kernel_V9</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  className="w-14 h-14 flex items-center justify-center hover:bg-surface-variant rounded-full text-on-surface-variant transition-all active:scale-90"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              <div className="px-12 py-10 overflow-y-auto custom-scrollbar flex-1 space-y-16">
                {/* Providers Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
                      <Globe className="w-6 h-6 text-primary" />
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface">Cloud Intelligence</h4>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-6 p-6 bg-primary/5 rounded-[2.5rem] border-2 border-primary/20 shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/30">
                          <Cpu className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xl font-black text-on-surface tracking-tight">Gemini Pro</p>
                          <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-[0.1em]">Native Neural Node</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-[9px] font-black tracking-widest text-[#4ade80] bg-[#4ade80]/10 px-4 py-1.5 rounded-full border border-[#4ade80]/20">STABLE_UPLINK</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
                      <Server className="w-6 h-6 text-secondary" />
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface">Local Sub-Nodes</h4>
                    </div>
                    <div className="space-y-6">
                      {providers.filter(p => p.type !== 'gemini').map((provider, idx) => (
                        <div key={idx} className="flex flex-col gap-6 p-8 bg-surface-variant/10 rounded-[2.5rem] border border-outline-variant/30 hover:border-secondary transition-all group shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20">
                                <Server className="w-6 h-6" />
                              </div>
                              <p className="text-lg font-black text-on-surface uppercase tracking-tight">{provider.type}</p>
                            </div>
                            <span className="text-[10px] font-black text-secondary group-hover:animate-pulse uppercase tracking-[0.2em]">Ready For Link</span>
                          </div>
                          <div className="flex gap-3">
                            <input 
                              type="text" 
                              value={provider.endpoint || ''} 
                              onChange={(e) => updateProvider({ ...provider, endpoint: e.target.value })}
                              placeholder="Endpoint (e.g. http://localhost:11434)"
                              className="flex-1 bg-surface border border-outline-variant rounded-2xl px-6 py-4 text-sm font-bold text-on-surface focus:border-secondary focus:ring-4 focus:ring-secondary/10 focus:outline-none transition-all placeholder:opacity-30"
                            />
                            <button className="px-8 py-4 bg-secondary text-on-secondary rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all">LINK</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Efficiency & Preferences Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                   {/* Export Prefs */}
                   <div className="lg:col-span-2 bg-surface-variant/10 p-10 rounded-[3rem] border border-outline-variant/30 space-y-10">
                      <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
                        <Layout className="w-6 h-6 text-tertiary" />
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface">Export Protocol Preferences</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-4">
                           <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-40 ml-2">Render Resolution</label>
                           <select 
                             value={systemSettings?.defaultResolution || '1080p'}
                             onChange={(e) => updateSystemSettings({ defaultResolution: e.target.value as any })}
                             className="bg-surface border border-outline-variant rounded-[1.5rem] px-6 py-4 text-sm font-black text-on-surface focus:border-tertiary focus:outline-none appearance-none cursor-pointer shadow-sm"
                           >
                             <option value="720p">720p // HIGH DEFINITION</option>
                             <option value="1080p">1080p // FULL HIGH DEFINITION</option>
                             <option value="4k">4K // ULTRA HIGH DEFINITION</option>
                           </select>
                        </div>
                        <div className="flex flex-col gap-4">
                           <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-40 ml-2">Temporal Density</label>
                           <select 
                             value={systemSettings?.framerate || 30}
                             onChange={(e) => updateSystemSettings({ framerate: parseInt(e.target.value) as any })}
                             className="bg-surface border border-outline-variant rounded-[1.5rem] px-6 py-4 text-sm font-black text-on-surface focus:border-tertiary focus:outline-none appearance-none cursor-pointer shadow-sm"
                           >
                             <option value="24">24 FPS // CINEMATIC FLOW</option>
                             <option value="30">30 FPS // STANDARD SIGNAL</option>
                             <option value="60">60 FPS // ULTRA FLUID</option>
                           </select>
                        </div>
                      </div>
                   </div>

                   {/* Efficiency Mode */}
                   <div className="bg-primary shadow-2xl shadow-primary/20 p-10 rounded-[3rem] flex flex-col justify-between relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-on-primary),transparent)] opacity-10" />
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-on-primary/10 flex items-center justify-center text-on-primary border border-on-primary/20">
                            <Zap className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-on-primary">Efficiency</h4>
                        </div>
                        <div className="space-y-4">
                           <p className="text-xl font-black text-on-primary tracking-tight leading-tight">Master Resilience Engine</p>
                           <p className="text-xs text-on-primary/70 font-bold leading-relaxed">
                             Disables ambient visual iterations during active synthesis to prioritize hardware bandwidth for critical tasks.
                           </p>
                        </div>
                      </div>
                      <div className="relative z-10 mt-10">
                        <button 
                          onClick={() => updateSystemSettings({ performanceMode: !systemSettings.performanceMode })}
                          className={`w-full h-20 rounded-[2rem] transition-all flex items-center px-4 relative ${systemSettings.performanceMode ? 'bg-on-primary text-primary shadow-xl ring-4 ring-on-primary/20' : 'bg-on-primary/10 text-on-primary border-2 border-on-primary/30'}`}
                        >
                          <span className="flex-1 text-center font-black uppercase tracking-[0.3em] text-xs">
                             {systemSettings.performanceMode ? 'PROTOCOL_ARMED' : 'PROTOCOL_STANDBY'}
                          </span>
                          <div className={`w-12 h-12 rounded-[1.25rem] bg-current transition-all flex items-center justify-center ${systemSettings.performanceMode ? 'ml-auto' : 'ml-0 opacity-20'}`}>
                             {systemSettings.performanceMode ? <CheckCircle2 className="w-6 h-6 text-on-primary" /> : <Zap className="w-6 h-6" />}
                          </div>
                        </button>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="px-12 py-10 bg-surface flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-outline-variant/30">
                <div className="flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-40">System Core Revision</p>
                  <p className="text-xs font-black text-on-surface">BUILD_9.2.0_STABLE</p>
                </div>
                <button 
                  onClick={applySettings}
                  className="w-full sm:w-auto flex items-center justify-center gap-4 px-12 py-6 bg-primary text-on-primary rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all group"
                >
                  Confirm Global Settings
                  <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <Layout className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                  </motion.div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <KeyboardShortcutsModal />
      <SystemMonitor />
    </div>
  );
}
