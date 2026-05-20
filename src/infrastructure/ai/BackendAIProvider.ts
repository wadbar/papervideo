import { AIProvider, GenerateScriptResult } from "../../core/domain/interfaces/AIProvider";

export class BackendAIProvider implements AIProvider {
  private token: string | null = null;
  private endpoint = '/api/ai';

  constructor() {
    this.token = localStorage.getItem('app_jwt_token');
  }

  private async fetchAuth(url: string, body?: any, signal?: AbortSignal) {
    if (!this.token) {
      // Auto-authenticate for the sake of the prototype
      const res = await fetch('/api/auth/login', { method: 'POST', signal });
      const data = await res.json();
      this.token = data.token;
      localStorage.setItem('app_jwt_token', this.token as string);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };

    const response = await fetch(`${this.endpoint}${url}`, {
      method: body ? 'POST' : 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async generateScript(
    idea: string, 
    targetAudience?: string, 
    tone?: string, 
    length?: 'short' | 'medium' | 'long', 
    keywords?: string[], 
    pacing?: 'fast-paced' | 'conversational' | 'slow-burn',
    signal?: AbortSignal
  ): Promise<GenerateScriptResult> {
    return this.fetchAuth('/script', { idea, targetAudience, tone, length, keywords, pacing }, signal);
  }

  async generateImage(prompt: string, signal?: AbortSignal): Promise<string> {
    const res = await this.fetchAuth('/image', { prompt }, signal);
    return res.imageUrl;
  }

  async generateThumbnailVariations(prompt: string, signal?: AbortSignal): Promise<string[]> {
    const res = await this.fetchAuth('/image-variations', { prompt }, signal);
    return res.imageUrls;
  }

  async generateNarration(text: string, voice: string, volume?: number, speed?: 'slow' | 'normal' | 'fast', signal?: AbortSignal): Promise<string> {
    const res = await this.fetchAuth('/narration', { text, voice, volume, speed }, signal);
    return res.audioUrl;
  }

  async generateMusic(prompt: string, signal?: AbortSignal): Promise<string> {
    const res = await this.fetchAuth('/music', { prompt }, signal);
    return res.musicUrl;
  }

  async generateMusicVariations(prompt: string, signal?: AbortSignal): Promise<string[]> {
    const res = await this.fetchAuth('/music-variations', { prompt }, signal);
    return res.musicUrls;
  }

  async generateVideo(sceneDescription: string, baseImageUrl: string, duration?: number, motionIntensity?: number, signal?: AbortSignal): Promise<string> {
    const res = await this.fetchAuth('/video', { sceneDescription, baseImageUrl, duration, motionIntensity }, signal);
    return res.videoUrl;
  }

  async cloneVoice(voiceName: string, audioSampleBase64: string, signal?: AbortSignal): Promise<string> {
    const res = await this.fetchAuth('/clone', { voiceName, audioSampleBase64 }, signal);
    return res.voiceId;
  }

  async refinePrompt(prompt: string, style?: string, signal?: AbortSignal): Promise<string> {
    const res = await this.fetchAuth('/refine', { prompt, style }, signal);
    return res.refinedPrompt;
  }

  async expandVisualDescription(prompt: string, narrationText: string, projectIdea: string, style?: string, signal?: AbortSignal): Promise<string> {
    const res = await this.fetchAuth('/expand', { prompt, narrationText, projectIdea, style }, signal);
    return res.expandedPrompt;
  }

  async refineScript(script: string, instructions?: string, signal?: AbortSignal): Promise<string> {
    const res = await this.fetchAuth('/refine-script', { script, instructions }, signal);
    return res.refinedScript;
  }

  async analyzeVisualConsistency(project: any, signal?: AbortSignal): Promise<string> {
    const res = await this.fetchAuth('/analyze-consistency', { project }, signal);
    return res.directive;
  }

  async generateVisualVariations(prompt: string, narration: string, projectIdea: string, signal?: AbortSignal): Promise<string[]> {
    return this.fetchAuth('/generate-visual-variations', { prompt, narration, projectIdea }, signal);
  }

  async suggestTransition(currentSceneDesc: string, nextSceneDesc: string, signal?: AbortSignal): Promise<string> {
    return this.fetchAuth('/suggest-transition', { currentSceneDesc, nextSceneDesc }, signal);
  }

  async suggestThumbnail(projectData: any, signal?: AbortSignal): Promise<any[]> {
    return this.fetchAuth('/suggest-thumbnail', projectData, signal);
  }

  async analyzeSceneMetadata(description: string, narration: string, signal?: AbortSignal): Promise<{ suggestions: string }> {
    return this.fetchAuth('/analyze-scene-metadata', { description, narration }, signal);
  }

  async optimizeSEO(projectData: any, signal?: AbortSignal): Promise<{ titles: string[], description: string, tags: string[] }> {
    return this.fetchAuth('/seo', projectData, signal);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const res = await this.fetchAuth('/health');
      return res.status === 'healthy';
    } catch {
      return false;
    }
  }
}
