import { Scene } from '../types';

export interface GenerateScriptResult {
  script: string;
  scenes: Scene[];
}

export interface AIProvider {
  generateScript(
    idea: string, 
    targetAudience?: string, 
    tone?: string, 
    length?: 'short' | 'medium' | 'long', 
    keywords?: string[], 
    pacing?: 'fast-paced' | 'conversational' | 'slow-burn',
    signal?: AbortSignal
  ): Promise<GenerateScriptResult>;
  generateImage(prompt: string, signal?: AbortSignal): Promise<string>;
  generateThumbnailVariations(prompt: string, signal?: AbortSignal): Promise<string[]>;
  generateNarration(text: string, voice: string, volume?: number, speed?: 'slow' | 'normal' | 'fast', signal?: AbortSignal): Promise<string>;
  generateMusic(prompt: string, signal?: AbortSignal): Promise<string>;
  generateMusicVariations(prompt: string, signal?: AbortSignal): Promise<string[]>;
  generateVideo(sceneDescription: string, baseImageUrl: string, duration?: number, motionIntensity?: number, signal?: AbortSignal): Promise<string>;
  cloneVoice(voiceName: string, audioSampleBase64: string, signal?: AbortSignal): Promise<string>;
  refinePrompt(prompt: string, style?: string, signal?: AbortSignal): Promise<string>;
  expandVisualDescription(prompt: string, narrationText: string, projectIdea: string, style?: string, signal?: AbortSignal): Promise<string>;
  refineScript(script: string, instructions?: string, signal?: AbortSignal): Promise<string>;
  analyzeVisualConsistency(project: any, signal?: AbortSignal): Promise<string>;
  optimizeSEO(projectData: any, signal?: AbortSignal): Promise<{ titles: string[], description: string, tags: string[] }>;
  isHealthy(): Promise<boolean>;
}
