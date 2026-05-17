import { AIProvider, GenerateScriptResult } from "../../core/domain/interfaces/AIProvider";

export class BackendAIProvider implements AIProvider {
  private token: string | null = null;
  private endpoint = '/api/ai';

  constructor() {
    this.token = localStorage.getItem('omni_jwt_token');
  }

  private async fetchAuth(url: string, body?: any) {
    if (!this.token) {
      // Auto-authenticate for the sake of the prototype
      const res = await fetch('/api/auth/login', { method: 'POST' });
      const data = await res.json();
      this.token = data.token;
      localStorage.setItem('omni_jwt_token', this.token as string);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };

    const response = await fetch(`${this.endpoint}${url}`, {
      method: body ? 'POST' : 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined
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
    pacing?: 'fast-paced' | 'conversational' | 'slow-burn'
  ): Promise<GenerateScriptResult> {
    return this.fetchAuth('/script', { idea, targetAudience, tone, length, keywords, pacing });
  }

  async generateImage(prompt: string): Promise<string> {
    const res = await this.fetchAuth('/image', { prompt });
    return res.imageUrl;
  }

  async generateThumbnailVariations(prompt: string): Promise<string[]> {
    const res = await this.fetchAuth('/image-variations', { prompt });
    return res.imageUrls;
  }

  async generateNarration(text: string, voice: string, volume?: number, speed?: 'slow' | 'normal' | 'fast'): Promise<string> {
    const res = await this.fetchAuth('/narration', { text, voice, volume, speed });
    return res.audioUrl;
  }

  async generateMusic(prompt: string): Promise<string> {
    const res = await this.fetchAuth('/music', { prompt });
    return res.musicUrl;
  }

  async generateVideo(sceneDescription: string, baseImageUrl: string, duration?: number, motionIntensity?: number): Promise<string> {
    const res = await this.fetchAuth('/video', { sceneDescription, baseImageUrl, duration, motionIntensity });
    return res.videoUrl;
  }

  async cloneVoice(voiceName: string, audioSampleBase64: string): Promise<string> {
    const res = await this.fetchAuth('/clone', { voiceName, audioSampleBase64 });
    return res.voiceId;
  }

  async refinePrompt(prompt: string, style?: string): Promise<string> {
    const res = await this.fetchAuth('/refine', { prompt, style });
    return res.refinedPrompt;
  }

  async refineScript(script: string, instructions?: string): Promise<string> {
    const res = await this.fetchAuth('/refine-script', { script, instructions });
    return res.refinedScript;
  }

  async optimizeSEO(projectData: any): Promise<{ titles: string[], description: string, tags: string[] }> {
    return this.fetchAuth('/seo', projectData);
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
