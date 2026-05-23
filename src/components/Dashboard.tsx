import React from 'react';
import { 
  Plus, 
  FolderOpen, 
  Video, 
  Clock, 
  ChevronRight,
  Globe,
  Zap,
  Cpu,
  Layout,
  ArrowUpRight,
  Workflow
} from 'lucide-react';
import { motion } from 'motion/react';
import { useProjectStore } from '../core/store/useProjectStore';
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
      className="flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar bg-background selection:bg-primary selection:text-on-primary transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 m3-elevation-1 bg-surface-container p-8 lg:p-10 rounded-3xl border border-outline-variant/30">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--color-primary),0.5)]" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest opacity-80">System Operational</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-on-surface leading-[0.9] uppercase">
              Neural<br />
              <span className="text-primary italic">Command</span>
            </h1>
            <p className="text-on-surface-variant text-lg font-medium max-w-xl leading-relaxed opacity-80 tracking-tight">
              High-performance visual pipeline management. Architect autonomous synergy through the orchestration layer.
            </p>
          </div>
          
          <button 
            onClick={handleCreateProject}
            className="group flex-shrink-0 flex items-center gap-6 bg-primary text-on-primary px-8 py-6 md:py-8 rounded-3xl m3-elevation-2 hover:m3-elevation-3 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-on-primary),transparent)] opacity-10" />
            <div className="flex flex-col items-start relative z-10">
               <span className="text-xs font-bold uppercase tracking-widest opacity-80">Bootstrap</span>
               <span className="text-base font-black uppercase tracking-wider text-on-primary">Initialize Space</span>
            </div>
            <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform relative z-10 text-on-primary" />
          </button>
        </header>

        {/* Stats Grid Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <DashboardStat 
             title="Active Nodes" 
             value="14 / 20" 
             percent={70} 
             icon={<Cpu className="w-7 h-7" />}
             color="primary"
           />
           <DashboardStat 
             title="Neural Sync" 
             value="99.9%" 
             percent={99.9} 
             icon={<Globe className="w-7 h-7" />}
             color="secondary"
           />
           <DashboardStat 
             title="Thread Load" 
             value="28%" 
             percent={28} 
             icon={<Zap className="w-7 h-7" />}
             color="tertiary"
           />
           <DashboardStat 
             title="Logic Clusters" 
             value={projects.length.toString()} 
             percent={Math.min(projects.length * 10, 100)} 
             icon={<Workflow className="w-7 h-7" />}
             color="primary"
           />
        </section>

        {/* Projects History Section */}
        <section id="recent-projects" className="space-y-8">
          <div className="flex items-center gap-4 bg-surface-container p-4 rounded-3xl border border-outline-variant/30">
             <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
               <Clock className="w-6 h-6" />
             </div>
             <div className="flex flex-col">
               <h2 className="text-2xl font-bold tracking-tight text-on-surface uppercase">Neural History</h2>
               <p className="text-xs font-medium text-on-surface-variant uppercase tracking-widest opacity-80">Temporal Archive</p>
             </div>
             <div className="h-px flex-1 bg-outline-variant mx-4 opacity-50" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {projects.length === 0 ? (
              <div className="bg-surface-container border-2 border-dashed border-outline-variant p-16 md:p-24 rounded-3xl flex flex-col items-center justify-center text-center group transition-colors">
                <div className="p-8 bg-surface-variant text-on-surface-variant rounded-3xl mb-8 group-hover:scale-110 transition-transform m3-elevation-1">
                  <FolderOpen className="w-16 h-16" />
                </div>
                <h3 className="text-xl font-bold text-on-surface uppercase tracking-wider mb-3">Void Cluster Detected</h3>
                <p className="text-on-surface-variant text-sm max-w-sm mb-10 opacity-80 leading-relaxed uppercase tracking-wide">No active visual threads found in the current sector. Initialize a bootstrap sequence to deploy a new project.</p>
                <button 
                   onClick={handleCreateProject}
                   className="flex items-center gap-4 bg-secondary-container text-on-secondary-container px-8 py-4 rounded-3xl m3-elevation-1 hover:m3-elevation-2 transition-all font-bold uppercase text-xs tracking-widest active:scale-95"
                >
                  Neural Link Start
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
                projects.sort((a, b) => (b.lastModified || b.createdAt) - (a.lastModified || a.createdAt)).map((project) => (
                  <motion.div 
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    onClick={() => handleSelectProject(project.id)}
                    className={`group cursor-pointer transition-all bg-surface-container rounded-3xl border-2 p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 m3-elevation-1 hover:m3-elevation-2 ${
                      project.id === activeProject?.id ? 'border-primary' : 'border-transparent hover:border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-sm ${
                        project.id === activeProject?.id ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant group-hover:bg-primary-container group-hover:text-on-primary-container'
                      }`}>
                        <Video className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col group-hover:translate-x-1 transition-transform">
                        <h3 className="font-bold text-2xl text-on-surface tracking-tight uppercase mb-2 group-hover:text-primary transition-colors">{project.title}</h3>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2">
                             <Layout className="w-4 h-4 opacity-60 text-on-surface-variant" />
                             <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-80">{project.scenes.length} Scenes</span>
                           </div>
                           <div className="h-4 w-px bg-outline-variant opacity-50" />
                           <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                                project.status === 'completed' ? 'bg-[#4ade80]' :
                                project.status === 'processing' ? 'bg-primary animate-pulse' :
                                'bg-outline-variant'
                              }`} />
                              <span className="text-xs font-bold uppercase tracking-widest opacity-80 text-on-surface-variant">Status: {project.status}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                       <div className="hidden lg:flex flex-col items-end">
                          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-60">Cluster_Core</p>
                          <p className="text-sm font-mono text-on-surface opacity-80 mt-1 uppercase tracking-tighter">PROTO_{project.id.slice(0, 8)}</p>
                       </div>
                       <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-variant text-on-surface-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-all group-hover:scale-105 active:scale-95">
                         <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                       </div>
                    </div>

                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity text-on-surface">
                       <Workflow className="w-32 h-32 -rotate-12" />
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

function DashboardStat({ title, value, percent, icon, color }: { 
  title: string, value: string, percent: number, icon: React.ReactNode, color: 'primary' | 'secondary' | 'tertiary' 
}) {
  const themes = {
    primary: {
      bg: 'bg-primary-container',
      icon: 'bg-primary text-on-primary',
      bar: 'bg-primary',
      text: 'text-on-primary-container'
    },
    secondary: {
      bg: 'bg-secondary-container',
      icon: 'bg-secondary text-on-secondary',
      bar: 'bg-secondary',
      text: 'text-on-secondary-container'
    },
    tertiary: {
      bg: 'bg-tertiary-container',
      icon: 'bg-tertiary text-on-tertiary',
      bar: 'bg-tertiary',
      text: 'text-on-tertiary-container'
    }
  };

  const theme = themes[color];

  return (
    <div className={`bg-surface-container p-6 md:p-8 rounded-3xl border border-outline-variant/30 relative overflow-hidden group hover:m3-elevation-2 m3-elevation-1 transition-all`}>
      <div className="flex items-center justify-between mb-6">
        <div className={`w-14 h-14 ${theme.icon} rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 opacity-80">{title}</p>
          <p className="text-2xl font-black text-on-surface uppercase tracking-tight">{value}</p>
        </div>
      </div>
      <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden shadow-inner">
         <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${percent}%` }} 
           className={`h-full ${theme.bar} rounded-full relative`} 
           transition={{ duration: 1.0, ease: 'easeOut' }}
         >
            <div className="absolute inset-0 bg-white/20 skew-x-12 animate-pulse" />
         </motion.div>
      </div>
    </div>
  );
}


