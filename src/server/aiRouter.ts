import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiRateLimiter } from './rateLimiter';
import { authenticateToken } from './auth.middleware';
import { aiMotor } from '../core/services/aiMotor';
import { promptService } from '../core/services/promptService';

export const aiRouter = Router();

// ==========================================
// TELEMETRY & LOGGING (STRUCTURED)
// ==========================================
const sysLog = (level: "INFO" | "WARN" | "ERROR", component: string, message: string, meta: Record<string, any> = {}) => {
  const timestamp = new Date().toISOString();
  let color = "\x1b[36m";
  if (level === "WARN") color = "\x1b[33m";
  if (level === "ERROR") color = "\x1b[31m";
  const reset = "\x1b[0m";
  const metaString = Object.keys(meta).length > 0 ? ` | Meta: ${JSON.stringify(meta)}` : "";
  console.log(`${color}[${timestamp}] [${level}] [${component}]${reset} - ${message}${metaString}`);
};

// ============================================
// EXPONENTIAL BACKOFF FETCH
// ============================================
export async function fetchWithBackoff(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let attempt = 0;
  let lastError: Error | null = null;
  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (e: any) {
      attempt++;
      lastError = e;
      sysLog("WARN", "NETWORK", `Fetch failed for ${new URL(url).hostname}, attempt ${attempt}/${maxRetries}. Retrying...`, { error: e.message });
      if (attempt >= maxRetries) break;
      const backoffTime = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  throw new Error(`Fetch failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

// Aplica Rate Limiting e Auth em toda a rotas de IA
aiRouter.use(aiRateLimiter);
aiRouter.use(authenticateToken);

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sysLog("ERROR", "ROUTER", "Gemini key missing.");
    throw new Error("Chave do Gemini não configurada no servidor.");
  }
  return new GoogleGenerativeAI(apiKey);
};

// ============================================
// GERAÇÃO UNIVERSAL (Mecanismo de Fallback)
// ============================================
aiRouter.post('/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction, responseType, temperature } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt não fornecido.' });

    const result = await aiMotor.generate({
      prompt,
      systemInstruction,
      responseType: responseType || 'text',
      temperature: temperature || 0.7
    });

    res.json(result);
  } catch (error: any) {
    sysLog("ERROR", "ROUTER", "Generate endpoint failed", { message: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Falha crítica no pipeline de IA.', 
      details: error.message 
    });
  }
});

// ============================================
// GERAÇÃO DE ROTEIRO (YouTube Script)
// ============================================
aiRouter.post('/script', async (req, res) => {
  try {
    const { idea, targetAudience, tone, length, keywords, pacing } = req.body;
    if (!idea) return res.status(400).json({ error: 'Ideia não fornecida.' });

    const config = promptService.getYouTubeScriptPrompt({ idea, targetAudience, tone, length, keywords, pacing });

    const result = await aiMotor.generate({
      prompt: config.prompt,
      systemInstruction: config.systemInstruction,
      responseType: 'json'
    });
    
    res.json({ ...result.content, _meta: { provider: result.provider, model: result.model, metrics: result.metrics } });
  } catch (error: any) {
    sysLog("ERROR", "ROUTER", "Script endpoint failed", { message: error.message });
    res.status(500).json({ error: 'Erro ao gerar script.', details: error.message });
  }
});

// ============================================
// GERAÇÃO DE IMAGEM
// ============================================
aiRouter.post('/image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt de imagem não fornecido.' });

    const result = await aiMotor.execute({
      prompt,
      mode: 'image'
    });
    
    res.json({ imageUrl: result.content, _meta: { provider: result.provider, model: result.model } });
  } catch (error: any) {
    sysLog("ERROR", "ROUTER", "Image endpoint failed", { message: error.message });
    res.status(500).json({ error: 'Falha ao gerar imagem.', details: error.message });
  }
});

// ============================================
// GERAÇÃO DE MÚSICA & VIDEO & CLONE
// ============================================
aiRouter.post('/narration', async (req, res) => {
  try {
    const { text, voice = "Zephyr" } = req.body;
    if (!text) return res.status(400).json({ error: 'Nenhum texto para narrar.' });
    
    // ElevenLabs implementation logic
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      throw new Error("Missing ELEVENLABS_API_KEY for voiceovers.");
    }
    
    const response = await fetchWithBackoff("https://api.elevenlabs.io/v1/text-to-speech/" + encodeURIComponent(voice) + "/stream", {
        method: "POST",
        headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
            }
        })
    });
    
    if (!response.ok) {
        throw new Error(`ElevenLabs TTS Failed: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioUrl = `data:audio/mp3;base64,${buffer.toString('base64')}`;
    res.json({ audioUrl });
  } catch (error: any) {
    sysLog("ERROR", "ROUTER", "Narration endpoint failed", { message: error.message });
    res.status(500).json({ error: 'Erro ao gerar Voiceover', details: error.message });
  }
});

aiRouter.post('/music', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt não fornecido.' });
    
    const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
    if (!HUGGING_FACE_TOKEN) {
      throw new Error("Missing HUGGING_FACE_TOKEN for music generation.");
    }

    const response = await fetchWithBackoff("https://api-inference.huggingface.co/models/facebook/musicgen-small", {
      headers: {
        "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
        throw new Error(`HuggingFace API fail. Status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const musicUrl = `data:audio/mp3;base64,${buffer.toString('base64')}`;
    res.json({ musicUrl });
  } catch (error: any) {
    sysLog("ERROR", "ROUTER", "Music endpoint failed", { message: error.message });
    res.status(500).json({ error: 'Erro ao gerar trilha sonora.', details: error.message });
  }
});

aiRouter.post('/video', async (req, res) => {
  try {
    const { sceneDescription, baseImageUrl, duration, motionIntensity } = req.body;
    
    if (!baseImageUrl) {
        return res.status(400).json({ error: "Missing image payload."});
    }

    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
        throw new Error("Missing REPLICATE_API_TOKEN for video synthesis.");
    }

    // Call SVD via Replicate
    const response = await fetchWithBackoff("https://api.replicate.com/v1/predictions", {
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
                video_length: "14_frames_with_svd",
                sizing_strategy: "maintain_aspect_ratio",
                motion_bucket_id: motionIntensity || 127,
                frames_per_second: 6
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Replicate API Error: ${response.status}`);
    }

    let prediction = await response.json();
    
    // Polling loop inside standard HTTP controller (Warning: might hit gateway timeouts if takes > 30s)
    let attempts = 0;
    while (prediction.status !== "succeeded" && prediction.status !== "failed" && attempts < 30) {
        await new Promise(r => setTimeout(r, 2000));
        const pollResponse = await fetchWithBackoff(prediction.urls.get, {
            headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` }
        }, 1);
        prediction = await pollResponse.json();
        attempts++;
    }

    if (prediction.status === "failed") {
        throw new Error("Video generation processing failed on Replicate.");
    }

    if (prediction.status !== "succeeded") {
        throw new Error("Video generation timeout.");
    }

    res.json({ videoUrl: prediction.output, _meta: { provider: "replicate", model: "stable-video-diffusion" } });
  } catch (error: any) {
    sysLog("ERROR", "ROUTER", "Video endpoint failed", { message: error.message });
    res.status(500).json({ error: 'Erro ao gerar vídeo', details: error.message });
  }
});

aiRouter.post('/clone', async (req, res) => {
  try {
    const { voiceName, audioSampleBase64 } = req.body;
    if (!voiceName || !audioSampleBase64) {
        return res.status(400).json({ error: "Missing required parameters."});
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
        throw new Error("Missing ELEVENLABS_API_KEY for voice cloning.");
    }

    // We parse the base64 audio and push it as form data
    const base64Data = audioSampleBase64.replace(/^data:audio\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: "audio/mp3" });
    const formData = new FormData();
    formData.append("name", voiceName);
    formData.append("files", blob, "sample.mp3");
    formData.append("description", "Cloned via API");

    const response = await fetchWithBackoff("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: {
            "xi-api-key": ELEVENLABS_API_KEY
        },
        body: formData as any
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Voice cloning failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.json({ voiceId: data.voice_id });
  } catch (error: any) {
    sysLog("ERROR", "ROUTER", "Clone Voice endpoint failed", { message: error.message });
    res.status(500).json({ error: 'Erro ao clonar voz', details: error.message });
  }
});

// ============================================
// OBSERVABILIDADE (Métricas do Motor)
// ============================================
aiRouter.get('/metrics', (req, res) => {
  try {
    const metrics = aiMotor.getMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao extrair métricas do pipeline.', details: error.message });
  }
});

// ============================================
// SEO & REFINEMENT
// ============================================
aiRouter.post('/seo', async (req, res) => {
  try {
    const projectData = req.body;
    const result = await (aiMotor as any).optimizeSEO(projectData);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao otimizar SEO.', details: error.message });
  }
});

aiRouter.post('/generate-visual-variations', async (req, res) => {
  try {
    const { prompt, narration, projectIdea } = req.body;
    const result = await (aiMotor as any).generateVisualVariations(prompt, narration, projectIdea);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao gerar variações.', details: error.message });
  }
});

aiRouter.post('/suggest-transition', async (req, res) => {
  try {
    const { currentSceneDesc, nextSceneDesc } = req.body;
    const result = await (aiMotor as any).suggestTransition(currentSceneDesc, nextSceneDesc);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao sugerir transição.', details: error.message });
  }
});

aiRouter.post('/analyze-scene-metadata', async (req, res) => {
  try {
    const { description, narration } = req.body;
    const result = await (aiMotor as any).analyzeSceneMetadata(description, narration);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao analisar metadados da cena.', details: error.message });
  }
});

aiRouter.post('/expand', async (req, res) => {
  try {
    const { prompt, narrationText, projectIdea, style } = req.body;
    const result = await (aiMotor as any).expandVisualDescription(prompt, narrationText, projectIdea, style);
    res.json({ expandedPrompt: result });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao expandir prompt.', details: error.message });
  }
});

aiRouter.post('/refine', async (req, res) => {
  try {
    const { prompt, style } = req.body;
    const result = await (aiMotor as any).refinePrompt(prompt, style);
    res.json({ refinedPrompt: result });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao refinar prompt.', details: error.message });
  }
});

aiRouter.get('/health', async (req, res) => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    await model.generateContent("ping");
    res.json({ status: 'healthy', provider: 'backend-gemini' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy' });
  }
});
