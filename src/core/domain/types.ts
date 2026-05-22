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
    autoDucking?: boolean;
  };
  status: 'draft' | 'processing' | 'completed';
  createdAt: number;
  lastModified?: number;
  exportSettings?: {
    resolution: '1080p' | '4k' | '720p';
    framerate: 24 | 30 | 60;
    aspectRatio: '16:9' | '9:16' | '1:1' | '1:1.91';
    preset?: 'Youtube' | 'TikTok' | 'Instagram' | 'LinkedIn' | 'Custom';
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
  motionEasing?: string;
  motionType?: string;
  imageStyle?: string;
  transition?: string; // e.g. fade, cut, slide, crosszoom
  postProcessing?: PostProcessingEffects;
  metadataSuggestions?: string;
  tags?: string[];
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
  sampleUrl?: string;
  provider: string;
}
