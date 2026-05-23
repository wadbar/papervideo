import React, { useState, useEffect } from 'react';
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

  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('m3-sidebar-state');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [view, setView] = useState<'dashboard' | 'studio' | 'observability'>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isYoutubeManagerOpen, setIsYoutubeManagerOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchChannels();
    sysLog('System Initialized', 'info');
  }, []);

  useEffect(() => {
    localStorage.setItem('m3-sidebar-state', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!systemSettings?.autoSync) return;

    const interval = setInterval(async () => {
      const activeProj = getActiveProject();
      if (!activeProj) return;

      try {
        const response = await fetch('/api/project/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: activeProj.id, scenesCount: activeProj?.scenes?.length || 0 })
        });
        const result = await response.json();
        if (result?.status === 'reconciled') {
          sysLog(`Sync Complete: ${activeProj.title}`, 'info');
        }
      } catch (err: any) {
        console.warn('Sync failed:', err.message);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [systemSettings?.autoSync, activeProjectId, projects]);

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
    if (confirm('Permanently delete project?')) {
      deleteProject(id);
      if (activeProjectId === id) {
        setView('dashboard');
      }
    }
  };

  const activeProject = getActiveProject();

  return (
    <div className={`flex h-screen w-full bg-[var(--md-sys-color-background)] overflow-hidden relative ${systemSettings?.performanceMode ? 'performance-mode' : ''}`}>
      <div className="absolute inset-0 bg-[var(--md-sys-color-surface)] pointer-events-none opacity-50" />
      
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
        <button 
          onClick={toggleTheme}
          className="fixed top-4 right-4 z-40 p-3 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] m3-elevation-2 hover:m3-elevation-3 transition-shadow"
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

      <AnimatePresence>
        {isYoutubeManagerOpen && (
          <YoutubeChannelManager 
            initialChannelId={selectedChannelId}
            onClose={() => setIsYoutubeManagerOpen(false)} 
          />
        )}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] bg-[var(--md-sys-color-surface)] shadow-2xl rounded-3xl overflow-hidden flex flex-col border border-[var(--md-sys-color-outline)]"
            >
              <div className="px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface)] relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--md-sys-color-primary-container)] rounded-full text-[var(--md-sys-color-on-primary-container)]">
                    <SettingsIcon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">Settings</h3>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Configuration Panel</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)} 
                  className="p-3 hover:bg-[var(--md-sys-color-surface-variant)] rounded-full text-[var(--md-sys-color-on-surface-variant)] transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-[var(--md-sys-color-surface-container)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="m3-card flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b border-[var(--md-sys-color-outline-variant)] pb-3">
                      <Globe className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                      <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Cloud Providers</h4>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)]">
                      <div className="w-12 h-12 rounded-xl bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-[var(--md-sys-color-on-surface)]">Gemini Pro</p>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] uppercase">Native Integration</p>
                      </div>
                    </div>
                  </div>

                  <div className="m3-card flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b border-[var(--md-sys-color-outline-variant)] pb-3">
                      <Server className="w-5 h-5 text-[var(--md-sys-color-secondary)]" />
                      <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Local Nodes</h4>
                    </div>
                    <div className="space-y-4">
                      {providers.filter(p => p.type !== 'gemini').map((provider, idx) => (
                        <div key={idx} className="flex flex-col gap-3 p-4 bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)]">
                          <div className="flex items-center gap-3">
                            <Server className="w-5 h-5 text-[var(--md-sys-color-secondary)]" />
                            <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] uppercase">{provider.type}</p>
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={provider.endpoint || ''} 
                              onChange={(e) => updateProvider({ ...provider, endpoint: e.target.value })}
                              placeholder="Endpoint URL"
                              className="m3-input flex-1"
                            />
                            <button className="m3-button-tonal">Link</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="m3-card flex flex-col gap-4">
                      <div className="flex items-center gap-3 border-b border-[var(--md-sys-color-outline-variant)] pb-3">
                        <Layout className="w-5 h-5 text-[var(--md-sys-color-tertiary)]" />
                        <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Export Defaults</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                           <label className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase ml-2">Resolution</label>
                           <select 
                             value={systemSettings?.defaultResolution || '1080p'}
                             onChange={(e) => updateSystemSettings({ defaultResolution: e.target.value as any })}
                             className="m3-input appearance-none bg-[var(--md-sys-color-surface)]"
                           >
                             <option value="720p">720p</option>
                             <option value="1080p">1080p</option>
                             <option value="4k">4K</option>
                           </select>
                        </div>
                        <div className="flex flex-col gap-2">
                           <label className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase ml-2">Framerate</label>
                           <select 
                             value={systemSettings?.framerate || 30}
                             onChange={(e) => updateSystemSettings({ framerate: parseInt(e.target.value) as any })}
                             className="m3-input appearance-none bg-[var(--md-sys-color-surface)]"
                           >
                             <option value="24">24 FPS</option>
                             <option value="30">30 FPS</option>
                             <option value="60">60 FPS</option>
                           </select>
                        </div>
                      </div>
                   </div>

                   <div className="m3-card flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                          <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Efficiency Mode</h4>
                        </div>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                          Disables ambient animations to prioritize hardware bandwidth for critical tasks.
                        </p>
                      </div>
                      <div className="mt-6">
                        <button 
                          onClick={() => updateSystemSettings({ performanceMode: !systemSettings.performanceMode })}
                          className={`w-full py-3 px-4 rounded-3xl transition-colors flex items-center justify-center gap-3 font-bold ${systemSettings.performanceMode ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]' : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]'}`}
                        >
                           {systemSettings.performanceMode ? 'Arm Protocol' : 'Standby'}
                           {systemSettings.performanceMode && <CheckCircle2 className="w-5 h-5 text-[var(--md-sys-color-on-primary)]" />}
                        </button>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-[var(--md-sys-color-surface)] flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--md-sys-color-outline-variant)]">
                <div className="flex flex-col">
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Version</p>
                  <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">BUILD_9.2.0_STABLE</p>
                </div>
                <button 
                  onClick={applySettings}
                  className="m3-button-filled w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  Confirm Settings
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
