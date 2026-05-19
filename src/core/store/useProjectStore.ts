import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VideoProject } from '../domain/types';
import { sysLog } from '../../lib/sys';

interface ProjectState {
  projects: VideoProject[];
  history: Record<string, VideoProject[]>; // Temporal Isolation Buffer
  activeProjectId: string | null;
  createNewProject: () => string;
  updateProject: (project: VideoProject) => void;
  deleteProject: (id: string) => void;
  setActiveProjectId: (id: string | null) => void;
  getActiveProject: () => VideoProject | undefined;
  importProject: (project: VideoProject) => void;
  createSnapshot: (id: string) => void;
  restoreLastSnapshot: (id: string) => void;
  clearAllHistory: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      history: {},
      activeProjectId: null,
      createNewProject: () => {
        const id = crypto.randomUUID();
        const newProject: VideoProject = {
          id,
          title: `Project ${new Date().toISOString().slice(0, 10)}`,
          idea: '',
          scenes: [],
          status: 'draft',
          createdAt: Date.now(),
          lastModified: Date.now()
        };
        set((state) => ({ 
          projects: [newProject, ...state.projects],
          activeProjectId: id 
        }));
        sysLog(`New project stream initialized: ${id}`, 'info');
        return id;
      },
      updateProject: (updated) => set((state) => {
        const now = Date.now();
        return {
          projects: state.projects.map(p => 
            p.id === updated.id ? { ...updated, lastModified: now } : p
          )
        };
      }),
      createSnapshot: (id) => {
        const state = get();
        const project = state.projects.find(p => p.id === id);
        if (project) {
          try {
            const snapshot = JSON.parse(JSON.stringify(project)); // Deep copy isolation
            const projectHistory = state.history[id] || [];
            
            // Limit history depth for resource optimization
            const newHistory = [snapshot, ...projectHistory].slice(0, 8);
            
            set((state) => ({
              history: { ...state.history, [id]: newHistory }
            }));

            sysLog(`State snapshot committed for ${id}. Buffer depth: ${newHistory.length}`, 'info');
          } catch (e: any) {
            sysLog(`State capture fault: ${e.message}`, 'error');
          }
        }
      },
      restoreLastSnapshot: (id) => set((state) => {
          const projectHistory = state.history[id] || [];
          if (projectHistory.length === 0) {
              sysLog(`No available snapshots for redirection: ${id}`, 'warn');
              return state;
          }
          
          const [lastSnapshot, ...remainingHistory] = projectHistory;
          sysLog(`Project state rolled back to previous checkpoint: ${id}`, 'info');
          
          return {
              projects: state.projects.map(p => p.id === id ? lastSnapshot : p),
              history: { ...state.history, [id]: remainingHistory }
          };
      }),
      clearAllHistory: () => {
          set({ history: {} });
          sysLog('System wide history buffer cleared for memory reclamation.', 'info');
      },
      deleteProject: (id) => set((state) => {
        const newHistory = { ...state.history };
        delete newHistory[id];
        sysLog(`Project de-allocated from registry: ${id}`, 'info');
        return {
            projects: state.projects.filter(p => p.id !== id),
            activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
            history: newHistory
        };
      }),
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      getActiveProject: () => {
        const state = get();
        return state.projects.find(p => p.id === state.activeProjectId);
      },
      importProject: (project) => set((state) => {
        // simple validation to ensure it has an ID
        if (!project || !project.id) return state;
        const exists = state.projects.some(p => p.id === project.id);
        if (exists) {
            return {
                projects: state.projects.map(p => p.id === project.id ? project : p)
            };
        }
        return {
            projects: [project, ...state.projects],
            activeProjectId: project.id
        };
      })
    }),
    {
      name: 'app-video-projects',
    }
  )
);
