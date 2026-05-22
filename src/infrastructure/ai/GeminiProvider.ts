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
      const variations = [
          `Cinematic close-up, high impact, ${prompt}`,
          `Dramatic wide shot, vibrant colors, ${prompt}`,
          `Minimalist professional layout, clean design, ${prompt}`
      ];
      
      const results = await Promise.allSettled(variations.map(p => this.generateImage(p)));
      const urls = results
          .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
          .map(r => r.value);
            
      if (urls.length === 0) {
          throw new Error("Failed to generate any thumbnail variations.");
      }
      return urls;
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
    return this.executeWithTelemetry('MusicGeneration', async () => {
      const HUGGING_FACE_TOKEN = process.env.VITE_HUGGING_FACE_TOKEN || process.env.HUGGING_FACE_TOKEN;
      if (!HUGGING_FACE_TOKEN) {
        throw new Error("Missing HUGGING_FACE_TOKEN for music generation integration.");
      }

      const response = await fetch("https://api-inference.huggingface.co/models/facebook/musicgen-small", {
        headers: {
          "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HuggingFace API failed: ${response.status} - ${errorText}`);
      }

      const audioBlob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
    });
  }

  async generateMusicVariations(prompt: string): Promise<string[]> {
    return this.executeWithTelemetry('MusicVariationsGeneration', async () => {
        // Generating sequential variations by slightly altering the prompt
        const variations = [
            `${prompt}, fast upbeat rhythm`,
            `${prompt}, cinematic dramatic tone`,
            `${prompt}, lofi chill vibes`
        ];

        const results = await Promise.allSettled(variations.map(v => this.generateMusic(v)));
        const successfulUrls = results
            .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
            .map(r => r.value);

        if (successfulUrls.length === 0) {
            throw new Error("All variations failed to generate. Check your API token or rate limits.");
        }

        return successfulUrls;
    });
  }

  async generateVideo(sceneDescription: string, baseImageUrl: string, duration = 4, motionIntensity = 5, easing?: string, motionType?: string): Promise<string> {
    return this.executeWithTelemetry('VideoSynthesis', async () => {
        const REPLICATE_API_TOKEN = process.env.VITE_REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN;
        if (!REPLICATE_API_TOKEN) {
             throw new Error("Missing REPLICATE_API_TOKEN for video synthesis integration.");
        }

        const motionBucketId = Math.max(1, Math.min(255, motionIntensity * 25));
        const videoLength = duration > 3 ? "25_frames_with_svd_xt" : "14_frames_with_svd";

        // Using Stability AI's Stable Video Diffusion API via Replicate
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                version: "3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438", // stable-video-diffusion
                input: {
                    cond_aug: 0.02,
                    decoding_t: 7,
                    input_image: baseImageUrl,
                    video_length: videoLength,
                    sizing_strategy: "maintain_aspect_ratio",
                    motion_bucket_id: motionBucketId,
                    frames_per_second: 6
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Replicate API Error: ${response.status} ${JSON.stringify(errorData)}`);
        }

        let prediction = await response.json();
        
        // Polling loop for async video generation
        while (prediction.status !== "succeeded" && prediction.status !== "failed") {
            await new Promise(r => setTimeout(r, 2000));
            const pollResponse = await fetch(prediction.urls.get, {
                headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
            });
            prediction = await pollResponse.json();
            if (prediction.status === "failed") {
                throw new Error("Video generation processing failed on Replicate.");
            }
        }

        return prediction.output; 
    });
  }

  async cloneVoice(voiceName: string, audioSampleBase64: string): Promise<string> {
    return this.executeWithTelemetry('VoiceCloning', async () => {
        const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
        if (!ELEVENLABS_API_KEY) {
             throw new Error("Missing ELEVENLABS_API_KEY for voice cloning integration.");
        }

        // Convert base64 back to Blob
        const fetchResponse = await fetch(audioSampleBase64);
        const blob = await fetchResponse.blob();

        const formData = new FormData();
        formData.append("name", voiceName);
        formData.append("files", blob, "sample.wav");
        formData.append("description", "Cloned via application interface");

        const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
            method: "POST",
            headers: {
                "xi-api-key": ELEVENLABS_API_KEY
            },
            body: formData
        });

        if (!response.ok) {
             const errText = await response.text();
             throw new Error(`Voice cloning failed with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        return data.voice_id;
    });
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

  async generateVisualVariations(prompt: string, narration: string, projectIdea: string): Promise<string[]> {
    return this.executeWithTelemetry('GenerateVisualVariations', async () => {
        const sysPrompt = `Act as an expert cinematic visual developer. Based on the provided project theme, current visual concept, and narration context, generate 3 highly detailed, distinct visual direction variations for this scene. Suggest different lighting setups, camera angles, and stylistic moods (e.g., Cyberpunk, Photorealistic, Noir).

        Project Theme: ${projectIdea}
        Current Narration: ${narration}
        Current Concept: ${prompt}
    
        Return strictly a JSON array of strings, where each string is a fully fleshed-out visual prompt variance. Example: ["Variation 1...", "Variation 2...", "Variation 3..."]`;
        
        const result = await this.genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: sysPrompt,
            config: {
                systemInstruction: 'You are an expert art director. Respond only with a JSON array of 3 strings.',
                responseMimeType: 'application/json',
                temperature: 0.9,
            }
        });

        if (!result.text) throw new Error("Verification failed.");
        return JSON.parse(result.text);
    });
  }

  async suggestTransition(currentSceneDesc: string, nextSceneDesc: string): Promise<string> {
    return this.executeWithTelemetry('SuggestTransition', async () => {
        const sysPrompt = `Act as an expert film editor. Suggest the most visually appropriate, cinematic video transition from the current scene to the next scene. Consider momentum, color profiles, and visual flow. 
        
        Current Scene: ${currentSceneDesc}
        Next Scene: ${nextSceneDesc}
        
        Available Transitions: Cut, Fade Through Black, Cross Dissolve, Dip to Color, Slide, Wipe, Push, Zoom Blur, Glitch, Light Leak, Morph.
        
        Select the single most appropriate transition name from the available options. Do NOT provide a sentence, just the transition name.`;
    
        const result = await this.genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: sysPrompt,
            config: {
                systemInstruction: 'You are an expert film editor. Return exactly one transition name from the list.',
                temperature: 0.3,
            }
        });

        if (!result.text) throw new Error("Transition suggestion failed.");
        return result.text.trim();
    });
  }

  async suggestThumbnail(projectData: any): Promise<any[]> {
    return this.executeWithTelemetry('ThumbnailSuggestion', async () => {
      const prompt = `Act as an elite YouTube thumbnail designer. Review this video concept:
      Title: "${projectData.title}"
      Idea: "${projectData.idea}"
      
      Suggest 3 high-impact thumbnail configurations including:
      - title: The text to show on the thumbnail
      - subtitle: Smaller context text
      - bgColor: Primary background color (HEX)
      - textColor: primary text color (HEX)
      - accentColor: Accent geometric color (HEX)
      - layout: Either 'centered', 'left', or 'split'
      
      Return as a JSON array of 3 objects. No chatter.`;

      const result = await this.genAI.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return JSON.parse(result.text || "[]");
    });
  }

  async analyzeSceneMetadata(description: string, narration: string): Promise<{ suggestions: string }> {
    return this.executeWithTelemetry('MetadataAnalysis', async () => {
        const prompt = `Analyze the following scene.
Description: ${description}
Narration: ${narration}

Suggest metadata improvements for better discoverability, engagement, and accessibility (like alt text, visual keywords, mood/tone tags).

Return strictly a JSON object with: { "suggestions": string }`;

        const result = await this.genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: 'You are an expert content strategist. Respond only with JSON.',
                responseMimeType: 'application/json',
                temperature: 0.7,
            }
        });

        if (!result.text) throw new Error("Metadata analysis returned empty response.");
        return JSON.parse(result.text);
    });
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
