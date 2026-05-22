/// <reference types="vite/client" />
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProviderConfig, ProviderType, ClonedVoice } from '../domain/types';
import { AIProvider } from '../domain/interfaces/AIProvider';
import { BackendAIProvider } from '../../infrastructure/ai/BackendAIProvider';

interface SystemSettings {
  defaultResolution: '720p' | '1080p' | '4k';
  framerate: 24 | 30 | 60;
  theme: 'dark' | 'midnight' | 'oled';
  performanceMode: boolean;
  autoSync: boolean;
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
        performanceMode: false,
        autoSync: false
      },
      updateProvider: (config) => set((state) => ({
        providers: state.providers.map(p => p.type === config.type ? config : p)
      })),
      setActiveProviderType: (type) => set({ activeProviderType: type }),
      addClonedVoice: (voice) => set((state) => ({ clonedVoices: [...state.clonedVoices, voice] })),
      updateSystemSettings: (settings) => set((state) => ({ systemSettings: { ...state.systemSettings, ...settings } })),

      getAIProviderInstance: () => {
        return new BackendAIProvider();
      }
    }),
    {
      name: 'app-settings',
      // skip functions when persisting
      partialize: (state) => ({
        providers: state.providers,
        activeProviderType: state.activeProviderType,
        clonedVoices: state.clonedVoices,
        systemSettings: state.systemSettings,
      })
    }
  )
);
