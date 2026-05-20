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
  Play,
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
      className="flex-1 p-8 md:p-16 overflow-y-auto custom-scrollbar bg-surface selection:bg-primary selection:text-on-primary"
    >
      <div className="max-w-[1400px] mx-auto space-y-20">
        <header className="relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--color-primary),0.5)]" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] opacity-60">System_Status: Operational</span>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl font-black tracking-tight text-on-surface leading-[0.85] uppercase">
                Neural<br />
                <span className="text-primary italic">Command</span>
              </h1>
              <p className="text-on-surface-variant text-xl font-medium max-w-2xl leading-relaxed opacity-60 tracking-tight">
                High-performance visual pipeline management. Architect autonomous synergy through the PaperCreeper V9 orchestration layer.
              </p>
            </div>
            
            <button 
              onClick={handleCreateProject}
              className="group relative flex items-center gap-6 bg-primary text-on-primary px-12 py-8 rounded-[2.5rem] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-on-primary),transparent)] opacity-20" />
              <div className="flex flex-col items-start relative z-10">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Bootstrap</span>
                 <span className="text-sm font-black uppercase tracking-widest text-on-primary">Initialize Space</span>
              </div>
              <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform relative z-10 text-on-primary" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
           <DashboardStat 
             title="Active Nodes" 
             value="14 / 20" 
             percent={70} 
             icon={<Cpu className="w-8 h-8" />}
             color="primary"
           />
           <DashboardStat 
             title="Neural Sync" 
             value="99.9%" 
             percent={99.9} 
             icon={<Globe className="w-8 h-8" />}
             color="secondary"
           />
           <DashboardStat 
             title="Thread Load" 
             value="28%" 
             percent={28} 
             icon={<Zap className="w-8 h-8" />}
             color="tertiary"
           />
           <DashboardStat 
             title="Logic Clusters" 
             value={projects.length.toString()} 
             percent={Math.min(projects.length * 10, 100)} 
             icon={<Workflow className="w-8 h-8" />}
             color="primary"
           />
        </div>

        <section id="recent-projects" className="space-y-12">
          <div className="flex items-center gap-6">
             <div className="w-12 h-12 rounded-2xl bg-surface-variant/30 flex items-center justify-center text-primary">
               <Clock className="w-6 h-6" />
             </div>
             <div className="flex flex-col">
               <h2 className="text-3xl font-black tracking-tighter text-on-surface uppercase">Neural History</h2>
               <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] opacity-40 italic">Temporal Archive // V9.2</p>
             </div>
             <div className="h-px flex-1 bg-outline-variant/20 mx-4" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {projects.length === 0 ? (
              <div className="bg-surface-variant/5 border-4 border-dashed border-outline-variant/30 p-24 rounded-[4rem] flex flex-col items-center justify-center text-center group">
                <div className="p-10 bg-surface-variant/30 rounded-[3rem] text-outline-variant mb-10 group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-20 h-20" />
                </div>
                <h3 className="text-2xl font-black text-on-surface uppercase tracking-[0.2em] mb-4">Void Cluster Detected</h3>
                <p className="text-on-surface-variant font-bold text-sm max-w-sm mb-12 opacity-40 leading-relaxed uppercase tracking-tight">No active visual threads found in the current sector. Initialize a bootstrap sequence to deploy a new project.</p>
                <button 
                   onClick={handleCreateProject}
                   className="flex items-center gap-6 bg-surface-variant px-12 py-6 rounded-[2.5rem] border border-outline-variant hover:bg-surface-variant-active shadow-xl transition-all font-black uppercase text-[11px] tracking-[0.3em] active:scale-95"
                >
                  Neural Link Start
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
                projects.sort((a, b) => (b.lastModified || b.createdAt) - (a.lastModified || a.createdAt)).map((project) => (
                  <motion.div 
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    onClick={() => handleSelectProject(project.id)}
                    className={`group cursor-pointer transition-all bg-surface-variant/10 rounded-[3rem] border-2 p-10 hover:p-12 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8 ${
                      project.id === activeProject?.id ? 'border-primary shadow-2xl shadow-primary/10' : 'border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-8 relative z-10">
                      <div className="w-20 h-20 rounded-[2rem] bg-surface flex items-center justify-center border-4 border-outline-variant/30 group-hover:border-primary transition-all group-hover:scale-110 shadow-inner group-hover:bg-primary/10 group-hover:text-primary">
                        <Video className="w-10 h-10" />
                      </div>
                      <div className="flex flex-col group-hover:translate-x-2 transition-transform">
                        <h3 className="font-black text-3xl text-on-surface tracking-tighter uppercase leading-none mb-3 group-hover:text-primary transition-colors">{project.title}</h3>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2">
                             <Layout className="w-3.5 h-3.5 opacity-40" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">{project.scenes.length} Scenes</span>
                           </div>
                           <div className="h-4 w-px bg-outline-variant/30" />
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${
                                project.status === 'completed' ? 'text-[#4ade80]' :
                                project.status === 'processing' ? 'text-primary' :
                                'text-on-surface-variant'
                              }`} />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Status: {project.status}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                       <div className="hidden lg:flex flex-col items-end">
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-30">Cluster_Core</p>
                          <p className="text-xs font-black text-on-surface opacity-40 uppercase tracking-tighter">PROTO_{project.id.slice(0, 8)}</p>
                       </div>
                       <div className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-variant/30 group-hover:bg-primary group-hover:text-on-primary transition-all group-hover:scale-110 active:scale-90">
                         <ChevronRight className="w-8 h-8 transition-transform group-hover:translate-x-1" />
                       </div>
                    </div>

                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
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
      bg: 'bg-primary/5',
      icon: 'bg-primary text-on-primary',
      bar: 'bg-primary',
      border: 'border-primary/10'
    },
    secondary: {
      bg: 'bg-secondary/5',
      icon: 'bg-secondary text-on-secondary',
      bar: 'bg-secondary',
      border: 'border-secondary/10'
    },
    tertiary: {
      bg: 'bg-tertiary/5',
      icon: 'bg-tertiary text-on-tertiary',
      bar: 'bg-tertiary',
      border: 'border-tertiary/10'
    }
  };

  const theme = themes[color];

  return (
    <div className={`bg-surface-variant/10 p-10 rounded-[3rem] border-2 ${theme.border} relative overflow-hidden group hover:bg-surface transition-all hover:scale-[1.02] shadow-sm hover:shadow-2xl`}>
      <div className="flex items-center justify-between mb-8">
        <div className={`w-20 h-20 ${theme.icon} rounded-[2rem] flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.3em] mb-2 opacity-40">{title}</p>
          <p className="text-3xl font-black text-on-surface uppercase tracking-tight">{value}</p>
        </div>
      </div>
      <div className="w-full h-3 bg-surface-variant/30 rounded-full overflow-hidden shadow-inner p-0.5">
         <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${percent}%` }} 
           className={`h-full ${theme.bar} rounded-full shadow-lg relative`} 
           transition={{ duration: 1.5, ease: 'circOut' }}
         >
            <div className="absolute inset-0 bg-white/30 skew-x-12 animate-pulse" />
         </motion.div>
      </div>
    </div>
  );
}

