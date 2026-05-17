import { GoogleGenAI, Modality } from "@google/genai";
import { AIProvider, GenerateScriptResult } from "../../core/domain/interfaces/AIProvider";

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async generateScript(
    idea: string,
    targetAudience?: string,
    tone?: string,
    length?: 'short' | 'medium' | 'long',
    keywords?: string[],
    pacing?: 'fast-paced' | 'conversational' | 'slow-burn'
  ): Promise<GenerateScriptResult> {
    const prompt = `
      Expert YouTube Scriptwriter Mode.
      Idea: "${idea}"
      Target Audience: ${targetAudience || 'General'}
      Tone: ${tone || 'Engaging'}
      Script Length: ${length || 'Medium'}
      Pacing: ${pacing || 'Conversational'}
      Keywords: ${keywords?.join(', ') || 'None'}
      
      Output JSON only:
      {
        "script": "Markdown text with structured sections",
        "scenes": [
          { "description": "Visual prompt", "narrationText": "Voiceover" }
        ]
      }
    `;

    const result = await this.genAI.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(result.text ?? '{}');
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      const result = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt
      });
      
      const part = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (part?.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("No image data returned from API");
    } catch (e) {
      console.warn("[GeminiProvider] Image gen fallback triggered", e);
      return `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 10))}/1024/768`;
    }
  }

  async generateThumbnailVariations(prompt: string): Promise<string[]> {
      return [
        `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 10))}_1/1024/768`,
        `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 10))}_2/1024/768`,
        `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 10))}_3/1024/768`
      ];
  }

  async generateNarration(text: string, voice: string = "Zephyr", volume?: number, speed?: 'slow' | 'normal' | 'fast'): Promise<string> {
    try {
      const result = await this.genAI.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: text,
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice as any },
            },
          },
        },
      });

      const audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return audioData ? `data:audio/mp3;base64,${audioData}` : "";
    } catch (e) {
      console.error("[GeminiProvider] Narration error", e);
      throw e;
    }
  }

  async generateMusic(prompt: string): Promise<string> {
    await new Promise(r => setTimeout(r, 2000));
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  }

  async generateVideo(sceneDescription: string, baseImageUrl: string): Promise<string> {
    await new Promise(r => setTimeout(r, 3000));
    return "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4";
  }

  async cloneVoice(voiceName: string, audioSampleBase64: string): Promise<string> {
    // Simulate API call for voice cloning
    await new Promise(r => setTimeout(r, 2000));
    return `custom-voice-${voiceName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  }

  async refinePrompt(prompt: string, style: string = "Cinematic"): Promise<string> {
    const refinedPrompt = `Refine this simple image/video prompt to make it more descriptive, professional, and visually stunning. 
    Keep it in English. Format: "Subject, environment, lighting, camera angle, technical details, style: ${style}".
    
    Simple Prompt: ${prompt}`;

    const result = await this.genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: refinedPrompt
    });

    return result.text || prompt;
  }

  async refineScript(script: string, instructions: string = "Improve the script's pacing and tone"): Promise<string> {
    const prompt = `Refine the following YouTube script based on these instructions: ${instructions}
    
    Script:
    ${script}`;

    const result = await this.genAI.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: prompt
    });

    return result.text || script;
  }

  async optimizeSEO(projectData: any): Promise<{ titles: string[], description: string, tags: string[] }> {
    const prompt = `Based on this video project, generate:
    1. Three high-CTR YouTube titles.
    2. An SEO-optimized description with hashtags.
    3. A list of relevant tags.
    
    Project Idea: ${projectData.idea}
    Target Audience: ${projectData.targetAudience}
    Keywords: ${projectData.keywords?.join(', ')}
    
    Return strictly a JSON object with: { "titles": string[], "description": string, "tags": string[] }`;

    const result = await this.genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    try {
      return JSON.parse(result.text || "{}");
    } catch {
      return { titles: [], description: "", tags: [] };
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "ping"
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}
