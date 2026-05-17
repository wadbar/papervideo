import React from 'react';
import { 
  Play, 
  Settings as SettingsIcon, 
  Plus, 
  Layout, 
  Video, 
  Music, 
  FileText, 
  Image as ImageIcon, 
  ExternalLink,
  ChevronRight,
  Loader2,
  Trash2,
  FolderOpen,
  X,
  Server,
  Cpu,
  Globe,
  Youtube,
  Activity
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
      animate={{ width: isSidebarOpen ? 280 : 80 }}
      className="flex flex-col border-r border-[#2a2d35] bg-[#151619] z-20"
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Video className="text-white w-5 h-5" />
        </div>
        {isSidebarOpen && (
          <span className="font-bold text-lg tracking-tight">VideoFlow</span>
        )}
      </div>

      <div className="px-4 mb-6">
        <button 
          onClick={onCreateProject}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 transition-all active:scale-95 font-medium shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-5 h-5" />
          {isSidebarOpen && <span>New Project</span>}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
        <button 
          onClick={() => setView('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-[#1f2128] text-white' : 'text-[#8e9299] hover:bg-[#1f2128] hover:text-white'}`}
        >
          <Layout className="w-5 h-5 flex-shrink-0" />
          {isSidebarOpen && <span>Overview</span>}
        </button>

        <button 
          onClick={() => setView('observability')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${view === 'observability' ? 'bg-[#1f2128] text-white' : 'text-[#8e9299] hover:bg-[#1f2128] hover:text-white'}`}
        >
          <Activity className="w-5 h-5 flex-shrink-0 text-blue-500" />
          {isSidebarOpen && <span>Observability</span>}
        </button>

        <button 
          onClick={() => onOpenYoutubeManager()}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isYoutubeManagerOpen && !selectedChannelId ? 'bg-[#1f2128] text-white' : 'text-[#8e9299] hover:bg-[#1f2128] hover:text-white'}`}
        >
           <Youtube className="w-5 h-5 flex-shrink-0 text-red-500" />
           {isSidebarOpen && <span>Canais do YouTube</span>}
        </button>

        {isSidebarOpen && channels.length > 0 && (
          <div className="pl-8 space-y-1">
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => onOpenYoutubeManager(channel.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#8e9299] hover:bg-[#1f2128] hover:text-white transition-colors text-left truncate"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="pt-4 pb-2">
          {isSidebarOpen && <p className="text-[10px] uppercase tracking-wider text-[#8e9299] font-bold px-3">Recent Projects</p>}
        </div>

        {projects.map(project => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`w-full group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${activeProjectId === project.id && view === 'studio' ? 'bg-[#1f2128] text-white' : 'text-[#8e9299] hover:bg-[#1f2128] hover:text-white'}`}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && (
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium">{project.title}</p>
                <p className="text-[10px] opacity-60">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {isSidebarOpen && (
              <button 
                onClick={(e) => onDeleteProject(project.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[#2a2d35]">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2 text-[#8e9299] hover:bg-[#1f2128] hover:text-white rounded-lg transition-colors"
        >
          <SettingsIcon className="w-5 h-5 flex-shrink-0" />
          {isSidebarOpen && <span>Settings</span>}
        </button>
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="w-full flex items-center gap-3 px-3 py-2 mt-2 text-[#8e9299] hover:bg-[#1f2128] hover:text-white rounded-lg transition-colors"
        >
          <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
          {isSidebarOpen && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
