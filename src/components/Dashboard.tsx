import React from 'react';
import { Play, FolderOpen, Video, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { VideoProject } from '../core/domain/types';

interface DashboardProps {
  projects: VideoProject[];
  onCreateProject: () => void;
  onSelectProject: (id: string) => void;
}

export default function Dashboard({ projects, onCreateProject, onSelectProject }: DashboardProps) {
  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-1 p-8 overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2 font-display">Welcome Back</h1>
          <p className="text-[#8e9299]">Ready to build your next masterpiece?</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="hardware-card p-6 bg-[#151619] border-[#2a2d35]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FolderOpen className="text-blue-500 w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#8e9299] uppercase tracking-widest">Total Projects</h3>
              </div>
              <p className="text-4xl font-bold font-display">{projects.length}</p>
           </div>
           <div className="hardware-card p-6 bg-[#151619] border-[#2a2d35]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Play className="text-green-500 w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#8e9299] uppercase tracking-widest">Completed</h3>
              </div>
              <p className="text-4xl font-bold font-display">{projects.filter(p => p.status === 'completed').length}</p>
           </div>
           <div className="hardware-card p-6 bg-[#151619] border-[#2a2d35]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Video className="text-red-500 w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#8e9299] uppercase tracking-widest">Total Scenes</h3>
              </div>
              <p className="text-4xl font-bold font-display">{projects.reduce((acc, p) => acc + p.scenes.length, 0)}</p>
           </div>
        </div>

        <div className="flex items-center justify-between mb-8">
           <h2 className="text-xl font-bold font-display">Recent Projects</h2>
           <button 
              onClick={onCreateProject}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg active:scale-95 text-sm font-bold"
           >
             <Plus className="w-4 h-4" /> New Project
           </button>
        </div>

        {projects.length === 0 ? (
          <div className="hardware-card p-12 flex flex-col items-center justify-center text-center border-dashed border-2">
            <div className="w-16 h-16 rounded-full bg-[#1f2128] flex items-center justify-center mb-6">
              <FolderOpen className="text-blue-500 w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">No projects yet</h2>
            <p className="text-[#8e9299] mb-8 max-w-sm">
              Create your first video project to start exploring the power of integrated AI tools.
            </p>
            <button 
              onClick={onCreateProject}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl transition-all shadow-lg active:scale-95"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <motion.div
                key={project.id}
                whileHover={{ y: -4 }}
                onClick={() => onSelectProject(project.id)}
                className="hardware-card group cursor-pointer overflow-hidden flex flex-col h-[280px]"
              >
                <div className="h-32 bg-[#1f2128] relative flex items-center justify-center group-hover:bg-[#252832] transition-colors">
                  <Play className="w-10 h-10 text-blue-500 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-1 truncate">{project.title}</h3>
                  <p className="text-[#8e9299] text-sm line-clamp-2 flex-1">
                    {project.idea || 'No description yet...'}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded ${
                      project.status === 'completed' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {project.status}
                    </span>
                    <span className="text-[#8e9299] text-xs">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
