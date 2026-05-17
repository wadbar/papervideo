import React, { useState } from 'react';
import { 
  X,
  Server,
  Cpu,
  Globe,
  Settings as SettingsIcon,
  Layout,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProjectStore } from './core/store/useProjectStore';
import { useSettingsStore } from './core/store/useSettingsStore';
import { useYoutubeStore } from './core/store/useYoutubeStore';
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
    <div className={`flex h-screen w-full bg-[#0a0a0b] overflow-hidden tech-grid relative ${systemSettings?.performanceMode ? 'performance-mode' : ''}`}>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
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

      {/* Settings Modal */}
      <AnimatePresence>
        {isYoutubeManagerOpen && (
          <YoutubeChannelManager 
            initialChannelId={selectedChannelId}
            onClose={() => setIsYoutubeManagerOpen(false)} 
          />
        )}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="hardware-card w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-[#2a2d35] flex items-center justify-between bg-[#1f2128]">
                <div className="flex items-center gap-3">
                  <SettingsIcon className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold uppercase tracking-widest">Global AI Controller Config</h3>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-[#2a2d35] rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Cloud Providers
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-[#0a0a0b] rounded-xl border border-[#2a2d35]">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Cpu className="text-blue-500 w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">Google Gemini</p>
                        <p className="text-xs text-[#8e9299]">Default Controller (Built-in)</p>
                      </div>
                      <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">CONNECTED</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#8e9299] mb-4 flex items-center gap-2">
                    <Server className="w-3 h-3" /> Local & Self-Hosted
                  </h4>
                  <div className="space-y-4">
                    {providers.filter(p => p.type !== 'gemini').map((provider, idx) => (
                      <div key={idx} className="flex flex-col gap-3 p-4 bg-[#0a0a0b] rounded-xl border border-[#2a2d35]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#151619] flex items-center justify-center">
                            <Server className="text-orange-500 w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold uppercase tracking-tight">{provider.type}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={provider.endpoint || ''} 
                            onChange={(e) => {
                              updateProvider({ ...provider, endpoint: e.target.value });
                            }}
                            placeholder="Endpoint URL (e.g. http://localhost:11434)"
                            className="flex-1 bg-[#151619] border border-[#2a2d35] rounded-lg px-3 py-2 text-xs text-[#8e9299] focus:border-blue-500 focus:outline-none"
                          />
                          <button className="px-3 py-2 bg-[#1f2128] border border-[#2a2d35] rounded-lg text-[10px] font-bold hover:bg-[#252832]">TEST</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#8e9299] mb-4 flex items-center gap-2">
                    <Layout className="w-3 h-3" /> Export Preferences
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-2 p-4 bg-[#0a0a0b] rounded-xl border border-[#2a2d35]">
                       <label className="text-[10px] uppercase font-bold text-[#8e9299]">Default Resolution</label>
                       <select 
                         value={systemSettings?.defaultResolution || '1080p'}
                         onChange={(e) => updateSystemSettings({ defaultResolution: e.target.value as any })}
                         className="bg-[#151619] border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                       >
                         <option value="720p">720p (HD)</option>
                         <option value="1080p">1080p (FHD)</option>
                         <option value="4k">4K (UHD)</option>
                       </select>
                     </div>
                     <div className="flex flex-col gap-2 p-4 bg-[#0a0a0b] rounded-xl border border-[#2a2d35]">
                       <label className="text-[10px] uppercase font-bold text-[#8e9299]">Framerate</label>
                       <select 
                         value={systemSettings?.framerate || 30}
                         onChange={(e) => updateSystemSettings({ framerate: parseInt(e.target.value) as any })}
                         className="bg-[#151619] border border-[#2a2d35] rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                       >
                         <option value="24">24 fps (Cinematic)</option>
                         <option value="30">30 fps (Standard)</option>
                         <option value="60">60 fps (Smooth)</option>
                       </select>
                     </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Runtime Optimization
                  </h4>
                  <div className="p-4 bg-[#0a0a0b] rounded-xl border border-[#2a2d35] flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">Industrial Performance Mode</p>
                      <p className="text-[10px] text-[#8e9299]">Disables non-essential animations and transitions for max efficiency.</p>
                    </div>
                    <button 
                      onClick={() => updateSystemSettings({ performanceMode: !systemSettings.performanceMode })}
                      className={`w-12 h-6 rounded-full transition-all relative ${systemSettings.performanceMode ? 'bg-orange-500' : 'bg-[#1f2128]'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${systemSettings.performanceMode ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </section>

                <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl">
                  <p className="text-xs text-blue-300 leading-relaxed">
                    <strong>Pro Tip:</strong> VideoFlow automatically detects local endpoints. Running Ollama or LM Studio locally allows for high-privacy script generation and asset orchestration.
                  </p>
                </div>
              </div>
              
              <div className="p-6 border-t border-[#2a2d35] flex justify-end bg-[#151619]">
                <button 
                  onClick={applySettings}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg font-bold text-sm"
                >
                  Apply Settings
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
