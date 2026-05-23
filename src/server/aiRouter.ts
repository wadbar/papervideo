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
const sysLog = (level: "INFO" | "WARN" | "ERROR", component: string, message: string, meta: Record<string, unknown> = {}) => {
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
    } catch (e: unknown) {
      attempt++;
      lastError = e instanceof Error ? e : new Error(String(e));
      sysLog("WARN", "NETWORK", `Fetch failed for ${new URL(url).hostname}, attempt ${attempt}/${maxRetries}. Retrying...`, { error: lastError.message });
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
    if (!prompt) {
      res.status(400).json({ error: 'Prompt não fornecido.' });
      return;
    }

    const result = await aiMotor.generate({
      prompt,
      systemInstruction,
      responseType: responseType || 'text',
      temperature: temperature || 0.7
    });

    res.json(result);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    sysLog("ERROR", "ROUTER", "Generate endpoint failed", { message: err.message });
    res.status(500).json({ 
      success: false, 
      error: 'Falha crítica no pipeline de IA.', 
      details: err.message 
    });
  }
});

// ============================================
// GERAÇÃO DE ROTEIRO (YouTube Script)
// ============================================
aiRouter.post('/script', async (req, res) => {
  try {
    const { idea, targetAudience, tone, length, keywords, pacing } = req.body;
    if (!idea) {
      res.status(400).json({ error: 'Ideia não fornecida.' });
      return;
    }

    const config = promptService.getYouTubeScriptPrompt({ idea, targetAudience, tone, length, keywords, pacing });

    const result = await aiMotor.generate({
      prompt: config.prompt,
      systemInstruction: config.systemInstruction,
      responseType: 'json'
    });
    
    res.json({ ...result.content, _meta: { provider: result.provider, model: result.model, metrics: result.metrics } });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    sysLog("ERROR", "ROUTER", "Script endpoint failed", { message: err.message });
    res.status(500).json({ error: 'Erro ao gerar script.', details: err.message });
  }
});

// ============================================
// GERAÇÃO DE IMAGEM
// ============================================
aiRouter.post('/image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt de imagem não fornecido.' });
      return;
    }

    const result = await aiMotor.execute({
      prompt,
      mode: 'image'
    });
    
    res.json({ imageUrl: result.content, _meta: { provider: result.provider, model: result.model } });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    sysLog("ERROR", "ROUTER", "Image endpoint failed", { message: err.message });
    res.status(500).json({ error: 'Falha ao gerar imagem.', details: err.message });
  }
});

// ============================================
// GERAÇÃO DE MÚSICA & VIDEO & CLONE
// ============================================
aiRouter.post('/narration', async (req, res) => {
  try {
    const { text, voice = "Zephyr" } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Nenhum texto para narrar.' });
      return;
    }
    
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
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    sysLog("ERROR", "ROUTER", "Narration endpoint failed", { message: err.message });
    res.status(500).json({ error: 'Erro ao gerar Voiceover', details: err.message });
  }
});

aiRouter.post('/music', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
       res.status(400).json({ error: 'Prompt não fornecido.' });
       return;
    }
    
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
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    sysLog("ERROR", "ROUTER", "Music endpoint failed", { message: err.message });
    res.status(500).json({ error: 'Erro ao gerar trilha sonora.', details: err.message });
  }
});

aiRouter.post('/video', async (req, res) => {
  try {
    const { sceneDescription, baseImageUrl, duration, motionIntensity, easing, motionType } = req.body;
    
    const videoUrl = await aiMotor.generateVideo(
       sceneDescription, 
       baseImageUrl, 
       duration, 
       motionIntensity,
       easing,
       motionType
    );

    res.json({ videoUrl, _meta: { provider: "ai-motor" } });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    sysLog("ERROR", "ROUTER", "Video endpoint failed", { message: err.message });
    res.status(500).json({ error: 'Erro ao gerar vídeo', details: err.message });
  }
});

aiRouter.post('/clone', async (req, res) => {
  try {
    const { voiceName, audioSampleBase64 } = req.body;
    const result = await aiMotor.cloneVoice(voiceName, audioSampleBase64);
    res.json({ voiceId: result.id, name: result.name, provider: result.provider });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    sysLog("ERROR", "ROUTER", "Clone Voice endpoint failed", { message: err.message });
    res.status(500).json({ error: 'Erro ao clonar voz', details: err.message });
  }
});

// ============================================
// OBSERVABILIDADE (Métricas do Motor)
// ============================================
aiRouter.get('/metrics', (req, res) => {
  try {
    const metrics = aiMotor.getMetrics();
    res.json(metrics);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).json({ error: 'Erro ao extrair métricas do pipeline.', details: err.message });
  }
});

// ============================================
// SEO & REFINEMENT
// ============================================
aiRouter.post('/seo', async (req, res) => {
  try {
    const projectData = req.body;
    const result = await aiMotor.optimizeSEO(projectData);
    res.json(result.content);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    sysLog("ERROR", "ROUTER", "SEO optimization failed", { message: err.message });
    res.status(500).json({ error: 'Erro ao otimizar SEO.', details: err.message });
  }
});

aiRouter.post('/suggest-thumbnail', async (req, res) => {
  try {
    const projectData = req.body;
    const result = await aiMotor.suggestThumbnail(projectData);
    res.json(result.content);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    sysLog("ERROR", "ROUTER", "Thumbnail suggestion failed", { message: err.message });
    res.status(500).json({ error: 'Erro ao sugerir thumbnail.', details: err.message });
  }
});

aiRouter.post('/generate-visual-variations', async (req, res) => {
  try {
    const { prompt, narration, projectIdea } = req.body;
    const result = await aiMotor.generateVisualVariations(prompt, narration, projectIdea);
    res.json(result);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).json({ error: 'Erro ao gerar variações.', details: err.message });
  }
});

aiRouter.post('/suggest-transition', async (req, res) => {
  try {
    const { currentSceneDesc, nextSceneDesc } = req.body;
    const result = await aiMotor.suggestTransition(currentSceneDesc, nextSceneDesc);
    res.json(result);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).json({ error: 'Erro ao sugerir transição.', details: err.message });
  }
});

aiRouter.post('/analyze-scene-metadata', async (req, res) => {
  try {
    const { description, narration } = req.body;
    const result = await aiMotor.analyzeSceneMetadata(description, narration);
    res.json(result);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).json({ error: 'Erro ao analisar metadados da cena.', details: err.message });
  }
});

aiRouter.post('/expand', async (req, res) => {
  try {
    const { prompt, narrationText, projectIdea, style } = req.body;
    const result = await aiMotor.expandVisualDescription(prompt, narrationText, projectIdea, style);
    res.json({ expandedPrompt: result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).json({ error: 'Erro ao expandir prompt.', details: err.message });
  }
});

aiRouter.post('/refine', async (req, res) => {
  try {
    const { prompt, style } = req.body;
    const result = await aiMotor.refinePrompt(prompt, style);
    res.json({ refinedPrompt: result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).json({ error: 'Erro ao refinar prompt.', details: err.message });
  }
});

aiRouter.post('/analyze-consistency', async (req, res) => {
  try {
    const { project } = req.body;
    const result = await aiMotor.analyzeVisualConsistency(project);
    res.json({ directive: result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).json({ error: 'Erro ao analisar consistência visual.', details: err.message });
  }
});

aiRouter.post('/refine-script', async (req, res) => {
  try {
    const { script, instructions } = req.body;
    const result = await aiMotor.refineScript(script, instructions);
    res.json({ refinedScript: result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).json({ error: 'Erro ao refinar roteiro.', details: err.message });
  }
});

aiRouter.post('/image-variations', async (req, res) => {
  try {
    const { prompt } = req.body;
    const results = await Promise.all([
      aiMotor.execute({ prompt: `${prompt}, variance A`, mode: 'image' }),
      aiMotor.execute({ prompt: `${prompt}, variance B`, mode: 'image' }),
      aiMotor.execute({ prompt: `${prompt}, variance C`, mode: 'image' })
    ]);
    res.json({ imageUrls: results.map(r => r.content) });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).json({ error: 'Erro ao gerar variações de imagem.', details: err.message });
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
