import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiRateLimiter } from './rateLimiter';
import { authenticateToken } from './auth.middleware';
import { aiMotor } from '../core/services/aiMotor';
import { promptService } from '../core/services/promptService';

export const aiRouter = Router();

// Aplica Rate Limiting e Auth em toda a rotas de IA
aiRouter.use(aiRateLimiter);
aiRouter.use(authenticateToken);

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chave do Gemini não configurada no servidor.");
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
    console.error('[AI Router Error - Generate]', error);
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
    console.error('[AI Router Error - Script]', error);
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
    console.error("[AI Router Error - Image]", error);
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
    throw new Error("Native TTS model required for production voiceovers.");
  } catch (error: any) {
    console.error('[AI Router Error - Narration]', error);
    res.status(500).json({ error: 'Erro ao gerar Voiceover', details: error.message });
  }
});

aiRouter.post('/music', async (req, res) => {
  try {
    const { prompt } = req.body;
    res.json({ musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao gerar trilha sonora.' });
  }
});

aiRouter.post('/video', async (req, res) => {
  try {
    const { sceneDescription, baseImageUrl, duration, motionIntensity } = req.body;
    
    const result = await aiMotor.execute({
      prompt: sceneDescription,
      mode: 'video',
      payload: { imageUrl: baseImageUrl, duration, motion: motionIntensity }
    });

    res.json({ videoUrl: result.content, _meta: { provider: result.provider, model: result.model } });
  } catch (error: any) {
    console.error('[AI Router Error - Video]', error);
    res.status(500).json({ error: 'Erro ao gerar vídeo', details: error.message });
  }
});

aiRouter.post('/clone', async (req, res) => {
  const { voiceName } = req.body;
  await new Promise(r => setTimeout(r, 2000));
  res.json({ voiceId: `server-cloned-${voiceName?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}` });
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
