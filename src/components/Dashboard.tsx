import React from 'react';
import { 
  Plus, 
  FolderOpen, 
  Video, 
  Clock, 
  ChevronRight,
  Activity,
  Globe,
  Zap,
  Cpu,
  Layout,
  Play
} from 'lucide-react';
import { motion } from 'motion/react';
import { useProjectStore } from '../core/store/useProjectStore';
import { VideoProject } from '../core/domain/types';

import { sysLog } from '../lib/sys';

export default function Dashboard() {
  const { projects, createNewProject, setActiveProjectId, getActiveProject } = useProjectStore();
  
  const handleCreateProject = () => {
    sysLog('Initializing new project stream bootstrap sequence...', 'info');
    const id = createNewProject();
    setActiveProjectId(id);
  };

  const activeProject = getActiveProject();

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
  };

  return (
    <div 
      id="dashboard-root"
      className="flex-1 p-8 overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 relative">
          <div className="absolute -top-12 left-0 text-[120px] font-black text-white/[0.02] pointer-events-none select-none tracking-tighter uppercase italic">
            PAPERCREEPER
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-[0.3em]">Orchestration Node // Online</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-2 uppercase italic">Project <span className="text-blue-500">Controller</span></h1>
          <p className="text-[#8e9299] max-w-lg">Industrial-grade distributed architecture for high-performance visual pipelines and autonomous agent synergy.</p>
        </header>

        <div className="mb-12 hardware-card bg-black/40 border-blue-500/10 p-4 overflow-hidden relative">
           <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
           <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
              <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400/60 uppercase tracking-widest">
                <span className="text-blue-400">KERNEL_OK:</span> 0.00ms latency detected in local stack
              </div>
              <div className="text-white/20 px-4">•</div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400/60 uppercase tracking-widest">
                <span className="text-blue-400">WSL_SYNC:</span> Automated environment mapping complete
              </div>
              <div className="text-white/20 px-4">•</div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-orange-400/60 uppercase tracking-widest">
                <span className="text-orange-400">AGENT_ALERT:</span> 12 high-priority tasks queueing
              </div>
              <div className="text-white/20 px-4">•</div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400/60 uppercase tracking-widest">
                <span className="text-blue-400">MEMORY_STABLE:</span> 14.2GB Cache allocated
              </div>
              <div className="text-white/20 px-4">•</div>
              {/* Duplicate for seamless marquee */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400/60 uppercase tracking-widest">
                <span className="text-blue-400">KERNEL_OK:</span> 0.00ms latency detected in local stack
              </div>
              <div className="text-white/20 px-4">•</div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400/60 uppercase tracking-widest">
                <span className="text-blue-400">WSL_SYNC:</span> Automated environment mapping complete
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <div className="hardware-card p-6 bg-[#151619] border-[#2a2d35] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <Cpu className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-600/10 rounded-xl">
                  <Activity className="text-blue-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-blue-500 uppercase tracking-widest leading-none mb-1">Active Nodes</p>
                  <p className="text-2xl font-bold font-mono">14 / 20</p>
                </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                 <motion.div animate={{ width: '70%' }} className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </div>
           </div>

           <div className="hardware-card p-6 bg-[#151619] border-[#2a2d35] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <Globe className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-600/10 rounded-xl">
                  <Globe className="text-green-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest leading-none mb-1">Global Sync</p>
                  <p className="text-2xl font-bold font-mono">99.8%</p>
                </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                 <motion.div animate={{ width: '99.8%' }} className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              </div>
           </div>

           <div className="hardware-card p-6 bg-[#151619] border-[#2a2d35] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <Zap className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-600/10 rounded-xl">
                  <Zap className="text-orange-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-orange-500 uppercase tracking-widest leading-none mb-1">Thread Load</p>
                  <p className="text-2xl font-bold font-mono">42%</p>
                </div>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   animate={{ width: ['40%', '45%', '42%', '48%', '43%'] }} 
                   transition={{ repeat: Infinity, duration: 2 }}
                   className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                 />
              </div>
           </div>

           <div className="hardware-card p-6 bg-[#151619] border-[#2a2d35] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <Layout className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-600/10 rounded-xl">
                  <Layout className="text-purple-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-purple-500 uppercase tracking-widest leading-none mb-1">Projects</p>
                  <p className="text-2xl font-bold font-mono">{projects.length}</p>
                </div>
              </div>
              <div className="flex gap-1">
                 {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`flex-1 h-1 rounded-full ${i < projects.length ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-white/5'}`} />
                 ))}
              </div>
           </div>
        </div>

        <section id="recent-projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight uppercase italic flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Recent Logic Streams
            </h2>
            <button 
              onClick={handleCreateProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Stream
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {projects.length === 0 ? (
              <div className="hardware-card p-12 flex flex-col items-center justify-center text-center bg-[#151619]/50 border-dashed border-[#2a2d35]">
                <FolderOpen className="w-12 h-12 text-[#2a2d35] mb-4" />
                <h3 className="text-lg font-bold mb-1 uppercase italic">No Active Streams</h3>
                <p className="text-[#8e9299] text-sm max-w-xs mb-6">Initialize a new project stream to begin visual orchestration.</p>
                <button 
                   onClick={handleCreateProject}
                   className="px-6 py-3 bg-[#1f2128] hover:bg-[#2a2d35] text-white rounded-xl transition-all font-bold uppercase tracking-widest text-[10px]"
                >
                  Bootstrap Project
                </button>
              </div>
            ) : (
                projects.sort((a, b) => (b.lastModified || b.createdAt) - (a.lastModified || a.createdAt)).map((project) => (
                  <motion.div 
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectProject(project.id)}
                    className={`hardware-card p-5 group cursor-pointer transition-all hover:bg-[#1f2128] border-l-4 ${
                      project.id === activeProject?.id ? 'border-l-blue-500 bg-[#1f2128]' : 'border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-colors">
                          <Video className="text-[#8e9299] group-hover:text-blue-400 w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-none mb-1 group-hover:text-blue-100 transition-colors">{project.title}</h3>
                          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest">
                            <span className="text-[#8e9299]">{project.scenes.length} Scenes</span>
                            <span className="text-white/10">•</span>
                            <span className={
                              project.status === 'completed' ? 'text-green-500' :
                              project.status === 'processing' ? 'text-blue-500' :
                              'text-orange-500'
                            }>
                              {project.status === 'draft' ? '[DRAFT_MODE]' : 
                               project.status === 'processing' ? '[COMPILING]' : 
                               project.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="text-[#2a2d35] group-hover:text-blue-500 w-6 h-6 transition-transform group-hover:translate-x-1" />
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
