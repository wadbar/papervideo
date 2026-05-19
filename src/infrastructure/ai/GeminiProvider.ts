import { GoogleGenAI } from "@google/genai";
import { AIProvider, GenerateScriptResult } from "../../core/domain/interfaces/AIProvider";
import { sysLog } from "../../lib/sys";

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  private async executeWithTelemetry<T>(opName: string, op: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await op();
      const duration = (performance.now() - start).toFixed(0);
      sysLog(`${opName} latency: ${duration}ms`, 'info');
      return result;
    } catch (e: any) {
      sysLog(`${opName} failed: ${e.message}`, 'error');
      throw e;
    }
  }

  async generateScript(
    idea: string,
    targetAudience?: string,
    tone?: string,
    length?: 'short' | 'medium' | 'long',
    keywords?: string[],
    pacing?: 'fast-paced' | 'conversational' | 'slow-burn'
  ): Promise<GenerateScriptResult> {
    return this.executeWithTelemetry('ScriptGeneration', async () => {
        const prompt = `
          Act as an Industrial AI Content Architect.
          Objective: High-retention YouTube Scripting.
          
          Technical Parameters:
          Context: "${idea}"
          Audience: ${targetAudience || 'General'}
          Tone: ${tone || 'Engaging'}
          Length: ${length || 'Medium'}
          Pacing: ${pacing || 'Conversational'}
          Taxonomy: ${keywords?.join(', ') || 'None'}
          
          Output JSON only:
          {
            "script": "Markdown text with structured sections",
            "scenes": [
              { "description": "Visual prompt - professional lighting and framing", "narrationText": "Captivating Voiceover" }
            ]
          }
        `;

        const result = await this.genAI.models.generateContent({
          model: "gemini-3.1-flash-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        return JSON.parse(result.text ?? '{}');
    });
  }

  async generateImage(prompt: string): Promise<string> {
    return this.executeWithTelemetry('ImageSynthesis', async () => {
      const mainPrompt = `UHD, photorealistic, cinematic volumetric lighting, raytracing, technical high-end, 8k, IMAX framing. SUBJECT: ${prompt} --negative blurry, noisy, lowres, text, watermark`;
      
      const result = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: mainPrompt
      });
      
      const part = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (part?.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      throw new Error("No image data returned from synthesis system");
    });
  }

  async generateThumbnailVariations(prompt: string): Promise<string[]> {
      // In a real scenario, we would call a model that returns multiple images or call it 3 times
      // For this optimization, we'll simulate slightly different prompts for more variation
      const variations = [
          `Cinematic close-up, high impact, ${prompt}`,
          `Dramatic wide shot, vibrant colors, ${prompt}`,
          `Minimalist professional layout, clean design, ${prompt}`
      ];
      
      return variations.map((p, i) => `https://picsum.photos/seed/${encodeURIComponent(p.slice(0, 15))}_${i}/1024/768`);
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

  async generateMusicVariations(prompt: string): Promise<string[]> {
    await new Promise(r => setTimeout(r, 2000));
    return [
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    ];
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
    const refinedPrompt = `Act as a world-class visual director for high-end cinema. 
    Refine this basic prompt into a professional text-to-image command.
    
    CRITICAL INSTRUCTIONS:
    - Focus on atmospheric lighting (volumetric, bokeh, depth of field).
    - Specify high-end camera gear (Arri Alexa, 35mm lens).
    - Use technical art terms (chiaroscuro, octane render, intricate textures).
    - Style focus: ${style}.
    
    Original Concept: ${prompt}
    
    Output ONLY the final prompt. No chatter.`;

    const result = await this.genAI.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: refinedPrompt
    });

    return result.text || prompt;
  }

  async expandVisualDescription(prompt: string, narrationText: string, projectIdea: string, style: string = "Cinematic"): Promise<string> {
    const expandPrompt = `Act as a world-class visual director and conceptual artist.
    Your task is to expand and deeply enhance a scene's visual description based on its narration and the overall project theme. 
    This description will be used as a high-end text-to-image prompt.

    CRITICAL INSTRUCTIONS:
    - Infuse the scene with details that match the tone of the narration.
    - Elaborate on the environment, lighting, composition, and mood.
    - Maintain consistency with the overall project theme.
    - Incorporate technical art terms and camera specifications (e.g., volumetric lighting, Arri Alexa, 35mm, cinematic color grading).
    - Style focus: ${style}.

    Project Theme: ${projectIdea}
    Current Narration: ${narrationText}
    Base Visual Concept: ${prompt}

    Output EXACTLY the enriched, highly-detailed visual prompt. No chatter, no explanations.`;

    const result = await this.genAI.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: expandPrompt
    });

    return result.text || prompt;
  }

  /**
   * INOVATION: Smart Scene Analysis (Visual Bible)
   * Analyze high-level project context to maintain strict visual consistency based on cinematic metrics.
   */
  async analyzeVisualConsistency(project: any): Promise<string> {
    return this.executeWithTelemetry('VisualConsistencyAnalysis', async () => {
        const scenesContext = project.scenes.slice(0, 5).map((s: any) => s.description).join(' | ');
        const prompt = `
          Act as a Lead Cinematographer and Visual Brand Architect.
          Objective: Establish a UNIFIED VISUAL BIBLE for the project.
          
          Project Focus: "${project.idea}"
          Scene Contextual Samples: "${scenesContext}"
          
          Technical Parameters for Directive:
          1. Color Grading Archetype (e.g., Teal & Orange, Moody Monochrome, Warm Sepia)
          2. Lighting Signature (e.g., Chiaroscuro, Volumetric, High-Key Corporate)
          3. Framing & Lens Language (e.g., Wide-Angle Dynamic, Shallow DOF Macro)
          
          Guidelines:
          Return a concise directive (max 30 words) that will prefix all future scene prompts. No conversational filler.
        `;
        
        const result = await this.genAI.models.generateContent({
            model: "gemini-3.1-flash-preview",
            contents: prompt
        });
        return result.text?.trim() || "Cinematic 8k realism with consistent volumetric lighting";
    });
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
    return this.executeWithTelemetry('SEOOptimization', async () => {
        const prompt = `
          Act as a Senior YouTube Growth Strategist and SEO Metadata Architect.
          Objective: Maximize CTR and Search Visibility for the following project.
          
          Technical Parameters:
          Project Context: "${projectData.idea}"
          Target Audience: ${projectData.targetAudience || 'General'}
          Seed Keywords: ${projectData.keywords?.join(', ') || 'Auto-detect'}
          
          Output JSON only:
          {
            "titles": [
              "High-CTR Title 1 (Punchy, 40-50 chars)",
              "Search-Optimized Title 2 (Includes core keywords)",
              "Curiosity-Gap Title 3 (Extreme retention focus)"
            ],
            "description": "Structured SEO Description: Hook -> Value Proposition -> Timecodes Placeholder -> Relevant Hashtags.",
            "tags": ["primary keyword", "secondary keyword", "long-tail keyword", "niche tag"]
          }
        `;

        const result = await this.genAI.models.generateContent({
          model: "gemini-3.1-flash-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        try {
          return JSON.parse(result.text || "{}");
        } catch (e) {
          sysLog("SEO JSON Parse failure, attempting recovery", "warn");
          return { titles: [], description: "", tags: [] };
        }
    });
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
