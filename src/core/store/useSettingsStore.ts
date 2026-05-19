/// <reference types="vite/client" />
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProviderConfig, ProviderType, ClonedVoice } from '../domain/types';
import { AIProvider } from '../domain/interfaces/AIProvider';
import { BackendAIProvider } from '../../infrastructure/ai/BackendAIProvider';

// A mock implementation for local providers
class LocalProviderMock implements AIProvider {
  constructor(private config: ProviderConfig) {}
  async generateScript(
    idea: string, 
    targetAudience?: string, 
    tone?: string, 
    length?: 'short' | 'medium' | 'long', 
    keywords?: string[], 
    pacing?: 'fast-paced' | 'conversational' | 'slow-burn',
    signal?: AbortSignal
  ) { 
    if (signal?.aborted) throw new Error('Aborted');
    return { 
      script: `Mock Script for ${this.config.type}\nIdea: ${idea}\nAudience: ${targetAudience}\nTone: ${tone}\nLength: ${length}\nPacing: ${pacing}\nKeywords: ${keywords?.join(', ')}`, 
      scenes: [] 
    }; 
  }
  async generateImage(prompt: string, signal?: AbortSignal) { return `https://picsum.photos/seed/${Math.random()}/1024/768`; }
  async generateThumbnailVariations(prompt: string, signal?: AbortSignal) { return [`https://picsum.photos/seed/${Math.random()}/1024/768`, `https://picsum.photos/seed/${Math.random()}/1024/768`, `https://picsum.photos/seed/${Math.random()}/1024/768`]; }
  async generateNarration(text: string, voice: string, volume?: number, speed?: 'slow' | 'normal' | 'fast', signal?: AbortSignal) { return ""; }
  async generateMusic(prompt: string, signal?: AbortSignal) { return ""; }
  async generateMusicVariations(prompt: string, signal?: AbortSignal) { return [""]; }
  async generateVideo(desc: string, img: string, duration?: number, motion?: number, signal?: AbortSignal) { return ""; }
  async cloneVoice(voiceName: string, audioSampleBase64: string, signal?: AbortSignal) { return `local-cloned-${Date.now()}`; }
  async refinePrompt(prompt: string, style?: string, signal?: AbortSignal) { return `${prompt} (Refined ${style})`; }
  async expandVisualDescription(prompt: string, narrationText: string, projectIdea: string, style?: string, signal?: AbortSignal) { return `${prompt} (Expanded: ${narrationText} - ${projectIdea}) ${style || ''}`; }
  async refineScript(script: string, instructions?: string, signal?: AbortSignal) { return `${script} (Refined: ${instructions || 'Default improvement'})`; }
  async analyzeVisualConsistency(_project: any, signal?: AbortSignal) { return "Cohesive cinematic lighting and high-contrast color palette"; }
  async optimizeSEO(projectData: any, signal?: AbortSignal) { return { titles: ["Title 1", "Title 2", "Title 3"], description: "Optimized description", tags: ["tag1", "tag2"] }; }
  async isHealthy() { return true; }
}

interface SystemSettings {
  defaultResolution: '720p' | '1080p' | '4k';
  framerate: 24 | 30 | 60;
  theme: 'dark' | 'midnight' | 'oled';
  performanceMode: boolean;
}

interface SettingsState {
  providers: ProviderConfig[];
  activeProviderType: ProviderType;
  clonedVoices: ClonedVoice[];
  systemSettings: SystemSettings;
  updateProvider: (config: ProviderConfig) => void;
  setActiveProviderType: (type: ProviderType) => void;
  addClonedVoice: (voice: ClonedVoice) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  getAIProviderInstance: () => AIProvider;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      providers: [
        { type: 'gemini', apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' },
        { type: 'ollama', endpoint: 'http://localhost:11434' },
        { type: 'lmstudio', endpoint: 'http://localhost:1234' }
      ],
      activeProviderType: 'gemini',
      clonedVoices: [],
      systemSettings: {
        defaultResolution: '1080p',
        framerate: 30,
        theme: 'dark',
        performanceMode: false
      },
      updateProvider: (config) => set((state) => ({
        providers: state.providers.map(p => p.type === config.type ? config : p)
      })),
      setActiveProviderType: (type) => set({ activeProviderType: type }),
      addClonedVoice: (voice) => set((state) => ({ clonedVoices: [...state.clonedVoices, voice] })),
      updateSystemSettings: (settings) => set((state) => ({ systemSettings: { ...state.systemSettings, ...settings } })),

      getAIProviderInstance: () => {
        const state = get();
        const activeConfig = state.providers.find(p => p.type === state.activeProviderType);
        
        switch (state.activeProviderType) {
          case 'gemini':
            // O Backend agora protege a chave e roda todas as operações com Express + JWT
            return new BackendAIProvider();
          case 'ollama':
          case 'lmstudio':
          default:
            return new LocalProviderMock(activeConfig!);
        }
      }
    }),
    {
      name: 'app-settings',
      // skip functions when persisting
      partialize: (state) => ({
        providers: state.providers,
        activeProviderType: state.activeProviderType,
        clonedVoices: state.clonedVoices,
      })
    }
  )
);
