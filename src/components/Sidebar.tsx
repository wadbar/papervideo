import React from 'react';
import { 
  Plus, 
  Layout, 
  Video, 
  ChevronRight,
  Trash2,
  FileText,
  Settings as SettingsIcon,
  Youtube,
  Activity,
  History,
  Sun,
  Moon
} from 'lucide-react';
import { motion } from 'motion/react';
import { VideoProject } from '../core/domain/types';
import { YoutubeChannel } from '../core/services/youtubeChannelService';
import { useTheme } from '../core/contexts/ThemeContext';

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  view: 'dashboard' | 'studio' | 'observability';
  setView: (view: 'dashboard' | 'studio' | 'observability') => void;
  projects: VideoProject[];
  activeProjectId: string | null;
  channels: YoutubeChannel[];
  onCreateProject: () => void;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onOpenYoutubeManager: (channelId?: string) => void;
  onOpenSettings: () => void;
  isYoutubeManagerOpen: boolean;
  selectedChannelId?: string;
}

export default function Sidebar({
  isSidebarOpen, setSidebarOpen, view, setView, projects, activeProjectId, channels,
  onCreateProject, onSelectProject, onDeleteProject, onOpenYoutubeManager, onOpenSettings,
  isYoutubeManagerOpen, selectedChannelId
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isSidebarOpen ? 320 : 100 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col border-r border-outline-variant/30 bg-surface z-20 relative selection:bg-primary selection:text-on-primary"
    >
      <div className="px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-5 overflow-hidden">
          <div className="w-12 h-12 rounded-[1.25rem] bg-primary flex items-center justify-center shadow-lg shadow-primary/30 relative group flex-shrink-0">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.25rem]" />
            <Video className="text-on-primary w-6 h-6" />
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-bold text-xl tracking-tight text-on-surface">PaperCreeper</span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-[0.1em] opacity-80">Neural Engine V9</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className={`px-6 mb-8 transition-all ${!isSidebarOpen ? 'flex justify-center' : ''}`}>
        <button 
          onClick={onCreateProject}
          className={`${isSidebarOpen ? 'w-full px-6' : 'w-14 h-14 rounded-[1.5rem]'} min-h-[56px] flex items-center justify-center gap-3 bg-primary text-on-primary py-4 rounded-[1.5rem] shadow-md hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all group overflow-hidden relative`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-on-primary),transparent)] opacity-10" />
          <Plus className="w-6 h-6 relative z-10 flex-shrink-0" />
          {isSidebarOpen && <span className="font-medium text-sm tracking-wide relative z-10">Neural Map</span>}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar pb-10">
        <div className="space-y-1">
          <M3NavItem 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
            icon={<Layout className="w-5 h-5 flex-shrink-0" />} 
            label="Nexus Explore" 
            isOpen={isSidebarOpen}
            color="primary"
          />

          <M3NavItem 
            active={view === 'observability'} 
            onClick={() => setView('observability')} 
            icon={<Activity className="w-5 h-5 flex-shrink-0" />} 
            label="Telemetry Uplink" 
            isOpen={isSidebarOpen}
            color="secondary"
          />

          <M3NavItem 
            active={isYoutubeManagerOpen && !selectedChannelId} 
            onClick={() => onOpenYoutubeManager()} 
            icon={<Youtube className="w-5 h-5 flex-shrink-0" />} 
            label="Neural Console" 
            isOpen={isSidebarOpen}
            color="error"
          />
        </div>

        <div className="pt-8 pb-4">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 px-4">
               <History className="w-4 h-4 text-on-surface-variant opacity-60" />
               <p className="text-xs tracking-wider text-on-surface-variant font-medium opacity-60">Temporal Archive</p>
               <div className="h-px flex-1 bg-outline-variant/30 ml-2" />
            </div>
          ) : <div className="h-px bg-outline-variant/30 w-full" />}
        </div>

        <div className="space-y-1">
          {projects.slice(0, 8).map(project => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`w-full group flex items-center justify-between px-4 py-3 rounded-2xl min-h-[56px] transition-all cursor-pointer border border-transparent ${
                activeProjectId === project.id && view === 'studio' 
                  ? 'bg-primary-container text-on-primary-container border-primary/10 shadow-sm' 
                  : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface hover:border-outline-variant/30'
              } ${!isSidebarOpen ? 'justify-center p-0 h-14 w-14 mx-auto' : ''}`}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                 <div className={`p-2 rounded-xl transition-all ${activeProjectId === project.id ? 'bg-primary text-on-primary' : 'bg-surface-variant/50 text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary'}`}>
                   <FileText className="w-4 h-4 flex-shrink-0" />
                 </div>
                 {isSidebarOpen && (
                   <div className="flex flex-col truncate">
                     <p className="truncate text-sm font-medium tracking-tight text-on-surface">{project.title}</p>
                     <p className="text-[10px] font-medium opacity-60 uppercase tracking-wider">{project.id.slice(0,4)}</p>
                   </div>
                 )}
              </div>
              {isSidebarOpen && (
                <button 
                  onClick={(e) => onDeleteProject(project.id, e)}
                  className="opacity-0 group-hover:opacity-100 w-10 h-10 flex items-center justify-center hover:bg-error-container hover:text-on-error-container rounded-full transition-all active:scale-95"
                  aria-label="Delete Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </nav>

      <div className="px-4 py-6 border-t border-outline-variant/20 space-y-1 bg-surface-variant/10">
        <M3NavItem 
          active={false} 
          onClick={toggleTheme} 
          icon={theme === 'light' ? <Moon className="w-5 h-5 flex-shrink-0" /> : <Sun className="w-5 h-5 flex-shrink-0" />} 
          label={theme === 'light' ? 'Dark Mode' : 'Light Mode'} 
          isOpen={isSidebarOpen}
          color="secondary"
        />
        <M3NavItem 
          active={false} 
          onClick={onOpenSettings} 
          icon={<SettingsIcon className="w-5 h-5 flex-shrink-0" />} 
          label="Neural Core" 
          isOpen={isSidebarOpen}
          color="primary"
        />
        <M3NavItem 
          active={false} 
          onClick={() => setSidebarOpen(!isSidebarOpen)} 
          icon={<ChevronRight className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />} 
          label="Retract Link" 
          isOpen={isSidebarOpen}
          color="secondary"
        />
      </div>
    </motion.aside>
  );
}

function M3NavItem({ active, onClick, icon, label, isOpen, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isOpen: boolean, color: 'primary' | 'secondary' | 'error' }) {
  const colors = {
    primary: active ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface hover:bg-primary/10 hover:text-primary',
    secondary: active ? 'bg-secondary-container text-on-secondary-container shadow-sm' : 'text-on-surface hover:bg-secondary/10 hover:text-secondary',
    error: active ? 'bg-error-container text-on-error-container shadow-sm' : 'text-on-surface hover:bg-error/10 hover:text-error',
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full group flex items-center gap-4 px-4 py-3 rounded-2xl min-h-[56px] transition-all relative overflow-hidden ${colors[color]} ${!isOpen ? 'justify-center w-14 h-14 mx-auto p-0' : ''}`}
    >
      <div className={`relative z-10 transition-transform duration-300 ${active ? 'scale-105' : 'group-hover:scale-105'}`}>{icon}</div>
      {isOpen && <span className="text-sm font-medium tracking-wide z-10">{label}</span>}
      {active && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-on-primary-container),transparent)] opacity-[0.04]" />
      )}
    </button>
  );
}
