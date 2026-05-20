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
  Workflow,
  Command,
  Monitor
} from 'lucide-react';
import { motion } from 'motion/react';
import { VideoProject } from '../core/domain/types';
import { YoutubeChannel } from '../core/services/youtubeChannelService';

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
  return (
    <motion.aside 
      initial={false}
      animate={{ width: isSidebarOpen ? 300 : 100 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col border-r border-outline-variant/30 bg-surface z-20 relative selection:bg-primary selection:text-on-primary"
    >
      <div className="px-8 py-10 flex items-center justify-between">
        <div className="flex items-center gap-5 overflow-hidden">
          <div className="w-12 h-12 rounded-[1.25rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 relative group">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.25rem]" />
            <Video className="text-on-primary w-7 h-7" />
          </div>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-black text-2xl tracking-tighter text-on-surface">PaperCreeper</span>
              <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em] -mt-1 opacity-60">Neural Engine V9</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className={`px-6 mb-10 transition-all ${!isSidebarOpen ? 'flex justify-center' : ''}`}>
        <button 
          onClick={onCreateProject}
          className={`${isSidebarOpen ? 'w-full px-8' : 'w-16 h-16 rounded-[1.5rem]'} flex items-center justify-center gap-4 bg-primary text-on-primary py-5 rounded-[1.5rem] shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-on-primary),transparent)] opacity-10" />
          <Plus className="w-7 h-7 relative z-10" />
          {isSidebarOpen && <span className="font-black text-xs uppercase tracking-[0.25em] relative z-10">Neural Map</span>}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-6 space-y-2 custom-scrollbar pb-10">
        <div className="space-y-1">
          <M3NavItem 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
            icon={<Layout className="w-5 h-5" />} 
            label="Nexus Explore" 
            isOpen={isSidebarOpen}
            color="primary"
          />

          <M3NavItem 
            active={view === 'observability'} 
            onClick={() => setView('observability')} 
            icon={<Activity className="w-5 h-5" />} 
            label="Telemetry Uplink" 
            isOpen={isSidebarOpen}
            color="secondary"
          />

          <M3NavItem 
            active={isYoutubeManagerOpen && !selectedChannelId} 
            onClick={() => onOpenYoutubeManager()} 
            icon={<Youtube className="w-5 h-5" />} 
            label="Neural Console" 
            isOpen={isSidebarOpen}
            color="error"
          />
        </div>

        <div className="pt-10 pb-4">
          {isSidebarOpen ? (
            <div className="flex items-center gap-4 px-2">
               <History className="w-3.5 h-3.5 text-on-surface-variant opacity-40" />
               <p className="text-[9px] uppercase tracking-[0.3em] text-on-surface-variant font-black opacity-40">Temporal Archive</p>
               <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
          ) : <div className="h-px bg-outline-variant/20 w-full" />}
        </div>

        <div className="space-y-1.5">
          {projects.slice(0, 8).map(project => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`w-full group flex items-center justify-between px-5 py-4 rounded-[1.25rem] transition-all cursor-pointer border border-transparent ${
                activeProjectId === project.id && view === 'studio' 
                  ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' 
                  : 'text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface hover:border-outline-variant/30'
              } ${!isSidebarOpen ? 'justify-center p-0 h-14 w-14 mx-auto' : ''}`}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                 <div className={`p-2 rounded-xl transition-all ${activeProjectId === project.id ? 'bg-primary text-on-primary' : 'bg-surface-variant/30 opacity-40 group-hover:opacity-100'}`}>
                   <FileText className="w-4 h-4 flex-shrink-0" />
                 </div>
                 {isSidebarOpen && (
                   <div className="flex flex-col truncate">
                     <p className="truncate text-[11px] font-black uppercase tracking-tight">{project.title}</p>
                     <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Protocol_{project.id.slice(0,4)}</p>
                   </div>
                 )}
              </div>
              {isSidebarOpen && (
                <button 
                  onClick={(e) => onDeleteProject(project.id, e)}
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center hover:bg-error/10 hover:text-error rounded-full transition-all active:scale-75"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </nav>

      <div className="px-6 py-8 border-t border-outline-variant/20 space-y-2 bg-surface-variant/5">
        <M3NavItem 
          active={false} 
          onClick={onOpenSettings} 
          icon={<SettingsIcon className="w-5 h-5" />} 
          label="Neural Core" 
          isOpen={isSidebarOpen}
          color="primary"
        />
        <M3NavItem 
          active={false} 
          onClick={() => setSidebarOpen(!isSidebarOpen)} 
          icon={<ChevronRight className={`w-5 h-5 transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : ''}`} />} 
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
    primary: active ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-primary/10 hover:text-primary',
    secondary: active ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/20' : 'text-on-surface-variant hover:bg-secondary/10 hover:text-secondary',
    error: active ? 'bg-error text-on-error shadow-lg shadow-error/20' : 'text-on-surface-variant hover:bg-error/10 hover:text-error',
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full group flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all relative overflow-hidden ${colors[color]} ${!isOpen ? 'justify-center w-14 h-14 mx-auto p-0' : ''}`}
    >
      <div className={`relative z-10 transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
      {isOpen && <span className="text-[11px] font-black uppercase tracking-[0.2em] z-10">{label}</span>}
      {active && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-on-primary),transparent)] opacity-10" />
      )}
    </button>
  );
}
