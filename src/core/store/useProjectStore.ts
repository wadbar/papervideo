import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VideoProject } from '../domain/types';

interface ProjectState {
  projects: VideoProject[];
  activeProjectId: string | null;
  createNewProject: () => string;
  updateProject: (project: VideoProject) => void;
  deleteProject: (id: string) => void;
  setActiveProjectId: (id: string | null) => void;
  getActiveProject: () => VideoProject | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      createNewProject: () => {
        const id = crypto.randomUUID();
        const newProject: VideoProject = {
          id,
          title: `Session ${new Date().toISOString().slice(0, 10)}`,
          idea: '',
          scenes: [],
          status: 'draft',
          createdAt: Date.now()
        };
        set((state) => ({ 
          projects: [newProject, ...state.projects],
          activeProjectId: id 
        }));
        return id;
      },
      updateProject: (updated) => set((state) => ({
        projects: state.projects.map(p => p.id === updated.id ? updated : p)
      })),
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        activeProjectId: state.activeProjectId === id ? null : state.activeProjectId
      })),
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      getActiveProject: () => {
        const state = get();
        return state.projects.find(p => p.id === state.activeProjectId);
      }
    }),
    {
      name: 'omni-video-projects',
    }
  )
);
