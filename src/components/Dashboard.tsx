import React, { useMemo, useState } from 'react';
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
  Workflow,
  Archive,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProjectStore } from '../core/store/useProjectStore';
import { sysLog } from '../lib/sys';

export default function Dashboard() {
  const { projects, createNewProject, setActiveProjectId, getActiveProject, deleteProject } = useProjectStore();
  
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const handleCreateProject = () => {
    sysLog('Initializing new project stream bootstrap sequence...', 'info');
    const id = createNewProject();
    setActiveProjectId(id);
  };

  const activeProject = getActiveProject();

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
  };

  // 30 days in ms
  const STALE_THRESHOLD = 30 * 24 * 60 * 60 * 1000;
  
  const staleProjects = useMemo(() => {
    const now = Date.now();
    return projects.filter(p => now - (p.lastModified || p.createdAt) > STALE_THRESHOLD);
  }, [projects]);

  const totalScenes = projects.reduce((acc, p) => acc + p.scenes.length, 0);
  const totalSynthesisTime = projects.reduce((acc, p) => acc + p.scenes.reduce((sAcc, s) => sAcc + (s.videoDuration || 4), 0), 0);

  const archiveStaleProjects = () => {
    if (staleProjects.length === 0) return;
    
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(staleProjects));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `neural_archive_stale_${Date.now()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      staleProjects.forEach(p => deleteProject(p.id));
      setShowArchiveModal(false);
      sysLog(`${staleProjects.length} stale projects archived locally and purged from active memory.`, 'info');
    } catch (error: any) {
      sysLog(`Failed to archive projects: ${error.message}`, 'error');
    }
  };

  return (
    <div 
      id="dashboard-root"
      className="flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar bg-[var(--color-background)] selection:bg-[var(--color-primary)] selection:text-[var(--color-on-primary)] transition-colors duration-300 relative"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 m3-elevation-1 bg-[var(--color-surface-container)] p-8 lg:p-10 rounded-3xl border border-[var(--color-outline-variant)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/5 to-transparent pointer-events-none" />
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full shadow-[0_0_10px_rgba(var(--color-primary),0.5)]" />
              <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest opacity-80">System Operational</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[var(--color-on-surface)] leading-[0.9] uppercase">
              Neural<br />
              <span className="text-[var(--color-primary)] italic">Command</span>
            </h1>
            <p className="text-[var(--color-on-surface-variant)] text-lg font-medium max-w-xl leading-relaxed opacity-80 tracking-tight">
              High-performance visual pipeline management. Architect autonomous synergy through the orchestration layer.
            </p>
          </div>
          
          <button 
            onClick={handleCreateProject}
            className="group flex-shrink-0 flex items-center gap-6 bg-[var(--color-primary)] text-[var(--color-on-primary)] px-8 py-6 md:py-8 rounded-3xl m3-elevation-2 hover:m3-elevation-3 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden relative min-h-[64px]"
            aria-label="Create new project"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-on-primary),transparent)] opacity-10" />
            <div className="flex flex-col items-start relative z-10">
               <span className="text-xs font-bold uppercase tracking-widest opacity-80">Bootstrap</span>
               <span className="text-base font-black uppercase tracking-wider text-[var(--color-on-primary)]">Initialize Space</span>
            </div>
            <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform relative z-10 text-[var(--color-on-primary)]" />
          </button>
        </header>

        {/* Stale Project Banner */}
        <AnimatePresence>
          {staleProjects.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="bg-[var(--color-secondary-container)]/50 border border-[var(--color-secondary)]/50 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--color-secondary)]/20 flex items-center justify-center text-[var(--color-secondary)]">
                  <Archive className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-on-surface)] uppercase tracking-tight">Stale Projects Detected</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)] opacity-80">You have {staleProjects.length} project(s) inactive for over 30 days. Archive them to local storage to declutter your workspace.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowArchiveModal(true)}
                className="whitespace-nowrap px-6 py-4 min-h-[48px] bg-[var(--color-secondary)] text-[var(--color-on-secondary)] rounded-3xl font-bold uppercase tracking-wider text-xs hover:scale-105 active:scale-95 transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-[var(--color-secondary)]/30"
              >
                Review Archive
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <DashboardStat 
             title="Total Projects" 
             value={projects.length.toString()} 
             percent={Math.min(projects.length * 5, 100)} 
             icon={<Workflow className="w-7 h-7" />}
             color="primary"
           />
           <DashboardStat 
             title="Total Scenes" 
             value={totalScenes.toString()} 
             percent={Math.min(totalScenes * 2, 100)} 
             icon={<Layout className="w-7 h-7" />}
             color="secondary"
           />
           <DashboardStat 
             title="Synthesis Time" 
             value={`${totalSynthesisTime}s`} 
             percent={Math.min(totalSynthesisTime / 10, 100)} 
             icon={<Zap className="w-7 h-7" />}
             color="tertiary"
           />
           <DashboardStat 
             title="Active Nodes" 
             value="14 / 20" 
             percent={70} 
             icon={<Cpu className="w-7 h-7" />}
             color="primary"
           />
        </section>

        {/* Projects History Section */}
        <section id="recent-projects" className="space-y-8">
          <div className="flex items-center gap-4 bg-[var(--color-surface-container)] p-4 rounded-3xl border border-[var(--color-outline-variant)]">
             <div className="w-14 h-14 rounded-2xl bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] flex items-center justify-center">
               <Clock className="w-7 h-7" />
             </div>
             <div className="flex flex-col">
               <h2 className="text-2xl font-bold tracking-tight text-[var(--color-on-surface)] uppercase">Neural History</h2>
               <p className="text-xs font-medium text-[var(--color-on-surface-variant)] uppercase tracking-widest opacity-80">Temporal Archive</p>
             </div>
             <div className="h-px flex-1 bg-[var(--color-outline-variant)] mx-4 opacity-50" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {projects.length === 0 ? (
              <div className="bg-[var(--color-surface-container)] border-2 border-dashed border-[var(--color-outline-variant)] p-16 md:p-24 rounded-3xl flex flex-col items-center justify-center text-center group transition-colors">
                <div className="p-8 bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] rounded-3xl mb-8 group-hover:scale-110 transition-transform m3-elevation-1">
                  <FolderOpen className="w-16 h-16" />
                </div>
                <h3 className="text-xl font-bold text-[var(--color-on-surface)] uppercase tracking-wider mb-3">Void Cluster Detected</h3>
                <p className="text-[var(--color-on-surface-variant)] text-sm max-w-sm mb-10 opacity-80 leading-relaxed uppercase tracking-wide">No active visual threads found in the current sector. Initialize a bootstrap sequence to deploy a new project.</p>
                <button 
                   onClick={handleCreateProject}
                   className="flex items-center justify-center gap-4 bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] px-8 py-4 min-w-[200px] min-h-[48px] rounded-3xl m3-elevation-1 hover:m3-elevation-2 transition-all font-bold uppercase text-xs tracking-widest active:scale-95 focus:outline-none focus:ring-4 focus:ring-[var(--color-secondary-container)]/50"
                   aria-label="Create New Project"
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
                    className={`group cursor-pointer transition-all bg-[var(--color-surface-container)] rounded-3xl border-2 p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 m3-elevation-1 hover:m3-elevation-2 ${
                      project.id === activeProject?.id ? 'border-[var(--color-primary)]' : 'border-transparent hover:border-[var(--color-outline-variant)]'
                    }`}
                  >
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-sm ${
                        project.id === activeProject?.id ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] group-hover:bg-[var(--color-primary-container)] group-hover:text-[var(--color-on-primary-container)]'
                      }`}>
                        <Video className="w-8 h-8" />
                      </div>
                      <div className="flex flex-col group-hover:translate-x-1 transition-transform">
                        <h3 className="font-bold text-2xl text-[var(--color-on-surface)] tracking-tight uppercase mb-2 group-hover:text-[var(--color-primary)] transition-colors">{project.title}</h3>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2">
                             <Layout className="w-4 h-4 opacity-60 text-[var(--color-on-surface-variant)]" />
                             <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] opacity-80">{project.scenes.length} Scenes</span>
                           </div>
                           <div className="h-4 w-px bg-[var(--color-outline-variant)] opacity-50" />
                           <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                                project.status === 'completed' ? 'bg-[#4ade80]' :
                                project.status === 'processing' ? 'bg-[var(--color-primary)] animate-pulse' :
                                'bg-[var(--color-outline-variant)]'
                              }`} />
                              <span className="text-xs font-bold uppercase tracking-widest opacity-80 text-[var(--color-on-surface-variant)]">Status: {project.status}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                       <div className="hidden lg:flex flex-col items-end">
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] opacity-60">Cluster_Core</p>
                          <p className="text-sm font-mono text-[var(--color-on-surface)] opacity-80 mt-1 uppercase tracking-tighter">PROTO_{project.id.slice(0, 8)}</p>
                       </div>
                       <div className="w-14 h-14 min-h-[56px] min-w-[56px] rounded-2xl flex items-center justify-center bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] group-hover:bg-[var(--color-primary-container)] group-hover:text-[var(--color-on-primary-container)] transition-all group-hover:scale-105 active:scale-95">
                         <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                       </div>
                    </div>

                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity text-[var(--color-on-surface)]">
                       <Workflow className="w-32 h-32 -rotate-12" />
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showArchiveModal && (
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-background)]/80 backdrop-blur-sm p-6"
          >
             <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-[3rem] p-10 max-w-lg w-full m3-elevation-3 flex flex-col"
             >
                <div className="w-20 h-20 bg-[var(--color-secondary)]/20 rounded-full flex items-center justify-center text-[var(--color-secondary)] mb-6 mx-auto">
                    <Archive className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--color-on-surface)] text-center mb-4">Archive Stale Projects</h2>
                <p className="text-[var(--color-on-surface-variant)] text-center opacity-80 leading-relaxed max-w-sm mx-auto mb-8">
                   You are about to download a local backup of {staleProjects.length} stale project(s) and remove them from active memory. This action reduces interface clutter.
                </p>
                <div className="flex gap-4 w-full">
                    <button 
                       onClick={() => setShowArchiveModal(false)}
                       className="flex-1 py-4 min-h-[48px] rounded-3xl font-bold uppercase tracking-widest text-xs border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-variant)] transition-colors text-[var(--color-on-surface)] focus:outline-none focus:ring-4 focus:ring-[var(--color-outline-variant)]/50"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={archiveStaleProjects}
                       className="flex-1 py-4 min-h-[48px] bg-[var(--color-secondary)] text-[var(--color-on-secondary)] rounded-3xl font-bold uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 m3-elevation-2 focus:outline-none focus:ring-4 focus:ring-[var(--color-secondary)]/50"
                    >
                       <Download className="w-4 h-4" />
                       Export & Purge
                    </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardStat({ title, value, percent, icon, color }: { 
  title: string, value: string, percent: number, icon: React.ReactNode, color: 'primary' | 'secondary' | 'tertiary' 
}) {
  const themes = {
    primary: {
      bg: 'bg-[var(--color-primary-container)]',
      icon: 'bg-[var(--color-primary)] text-[var(--color-on-primary)]',
      bar: 'bg-[var(--color-primary)]',
      text: 'text-[var(--color-on-primary-container)]'
    },
    secondary: {
      bg: 'bg-[var(--color-secondary-container)]',
      icon: 'bg-[var(--color-secondary)] text-[var(--color-on-secondary)]',
      bar: 'bg-[var(--color-secondary)]',
      text: 'text-[var(--color-on-secondary-container)]'
    },
    tertiary: {
      bg: 'bg-[var(--color-tertiary-container)]',
      icon: 'bg-[var(--color-tertiary)] text-[var(--color-on-tertiary)]',
      bar: 'bg-[var(--color-tertiary)]',
      text: 'text-[var(--color-on-tertiary-container)]'
    }
  };

  const theme = themes[color];

  return (
    <div className={`bg-[var(--color-surface-container)] p-6 md:p-8 rounded-3xl border border-[var(--color-outline-variant)] relative overflow-hidden group hover:m3-elevation-2 m3-elevation-1 transition-all`}>
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className={`w-14 h-14 min-h-[56px] min-w-[56px] ${theme.icon} rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div className="text-right flex flex-col justify-end">
          <p className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1 opacity-80">{title}</p>
          <p className="text-2xl font-black text-[var(--color-on-surface)] uppercase tracking-tight">{value}</p>
        </div>
      </div>
      <div className="w-full h-2 bg-[var(--color-surface-variant)] rounded-full overflow-hidden shadow-inner relative z-10">
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



