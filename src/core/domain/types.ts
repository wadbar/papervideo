import { PostProcessingEffects } from '../../lib/visualUtils';

export interface VideoProject {
  id: string;
  title: string;
  idea: string;
  tone?: string;
  targetAudience?: string;
  keywords?: string[];
  scriptLength?: 'short' | 'medium' | 'long';
  pacing?: 'fast-paced' | 'conversational' | 'slow-burn';
  script?: string;
  scenes: Scene[];
  audio?: {
    narrationUrl?: string;
    musicUrl?: string;
    musicVariations?: string[];
    musicPrompt?: string;
    narrationVolume?: number;
    musicVolume?: number;
    speechSpeed?: 'slow' | 'normal' | 'fast';
  };
  status: 'draft' | 'processing' | 'completed';
  createdAt: number;
  lastModified?: number;
  exportSettings?: {
    resolution: '1080p' | '4k' | '720p';
    framerate: 24 | 30 | 60;
  };
}

export interface Scene {
  id: string;
  description: string;
  imageUrl?: string;
  thumbnailVariations?: string[];
  videoUrl?: string;
  narrationText?: string;
  videoDuration?: number;
  motionIntensity?: number;
  motionType?: string;
  imageStyle?: string;
  transition?: string; // e.g. fade, cut, slide, crosszoom
  postProcessing?: PostProcessingEffects;
}

export type ProviderType = 'gemini' | 'ollama' | 'lmstudio' | 'nvidia';

export interface ProviderConfig {
  type: ProviderType;
  endpoint?: string;
  apiKey?: string;
}

export interface ClonedVoice {
  id: string;
  name: string;
}
