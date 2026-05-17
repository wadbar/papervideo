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
    pacing?: 'fast-paced' | 'conversational' | 'slow-burn'
  ): Promise<GenerateScriptResult>;
  generateImage(prompt: string): Promise<string>;
  generateThumbnailVariations(prompt: string): Promise<string[]>;
  generateNarration(text: string, voice: string, volume?: number, speed?: 'slow' | 'normal' | 'fast'): Promise<string>;
  generateMusic(prompt: string): Promise<string>;
  generateVideo(sceneDescription: string, baseImageUrl: string, duration?: number, motionIntensity?: number): Promise<string>;
  cloneVoice(voiceName: string, audioSampleBase64: string): Promise<string>;
  refinePrompt(prompt: string, style?: string): Promise<string>;
  refineScript(script: string, instructions?: string): Promise<string>;
  optimizeSEO(projectData: any): Promise<{ titles: string[], description: string, tags: string[] }>;
  isHealthy(): Promise<boolean>;
}
