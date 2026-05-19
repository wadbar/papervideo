/**
 * UniversalSystem.mjs
 * 
 * SISTEMA DE IA DE ALTA PERFORMANCE (ESM)
 * 
 * Este arquivo é 100% modular, autocontido e isolado.
 * Pode ser movido entre projetos Node.js apenas com o .env correspondente.
 */

import { fileURLToPath } from 'url';
import path from 'path';

// Cores para logs de terminal (ANSI)
const RESET = "\x1b[0m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";

const log = (level, message, metadata = {}) => {
  const ts = new Date().toISOString();
  let color = RESET;
  if (level === 'info') color = CYAN;
  if (level === 'success') color = GREEN;
  if (level === 'warn') color = YELLOW;
  if (level === 'error' || level === 'fatal') color = RED;

  const msg = typeof message === 'object' ? JSON.stringify(message) : message;
  const metaStr = Object.keys(metadata).length ? ` | DATA: ${JSON.stringify(metadata)}` : '';
  console.log(`${color}[${ts}] [AI-COREV8] [${level.toUpperCase()}]${RESET} ${msg}${metaStr}`);
};

/**
 * Agente Crítico de Sanitização e Parsing JSON
 * Desenvolvido para neutralizar "alucinações" de markdown em respostas estruturadas.
 */
const sanitizeAndParseJSON = (rawString) => {
  if (typeof rawString !== 'string') return rawString;
  
  try {
    // 1. Sanitização agressiva: Remove blocos de código e espaços residuais
    let cleaned = rawString.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
    
    // 2. Extração heurística (Chain of Custody): Identifica o envelope mais externo
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    const startArr = cleaned.indexOf('[');
    const endArr = cleaned.lastIndexOf(']');
    
    let target = cleaned;
    if (start !== -1 && end !== -1) {
      const obj = cleaned.substring(start, end + 1);
      const arr = (startArr !== -1 && endArr !== -1) ? cleaned.substring(startArr, endArr + 1) : '';
      target = obj.length >= arr.length ? obj : arr;
    }
    
    return JSON.parse(target);
  } catch (error) {
    log('error', 'Falha de Integridade JSON', { error: error.message, sample: rawString.substring(0, 50) });
    throw new Error('CORRUPTO: Resposta não cumpre formato JSON solicitado.');
  }
};

/**
 * Pipeline de Provedores com Fallback Sequencial
 */
const PROVIDERS = [
  {
    id: 'ollama',
    label: 'LOCAL_OLLAMA (Nível 1)',
    timeout: 15000,
    checkEnv: () => !!process.env.OLLAMA_HOST,
    call: async (payload) => {
      const resp = await fetch(`${process.env.OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
          system: payload.system,
          prompt: payload.prompt,
          options: { temperature: payload.temp },
          stream: false
        }),
        signal: AbortSignal.timeout(15000)
      });
      if (!resp.ok) throw new Error(`Ollama Offline: ${resp.status}`);
      const data = await resp.json();
      return data.response;
    }
  },
  {
    id: 'gemini',
    label: 'CLOUD_GEMINI (Nível 2)',
    timeout: 25000,
    checkEnv: () => !!process.env.GEMINI_API_KEY,
    call: async (payload) => {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: 'user', 
            parts: [{ text: `INSTRUCTION: ${payload.system}\n\nINPUT: ${payload.prompt}` }] 
          }],
          generationConfig: { temperature: payload.temp }
        }),
        signal: AbortSignal.timeout(25000)
      });
      if (!resp.ok) throw new Error(`Gemini Error: ${resp.status}`);
      const data = await resp.json();
      return data.candidates[0].content.parts[0].text;
    }
  },
  {
    id: 'nvidia',
    label: 'GPU_NIM_NVIDIA (Nível 3)',
    timeout: 30000,
    checkEnv: () => !!process.env.NVIDIA_API_KEY,
    call: async (payload) => {
      const url = `${process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'}/chat/completions`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct',
          messages: [
            { role: 'system', content: payload.system },
            { role: 'user', content: payload.prompt }
          ],
          temperature: payload.temp
        }),
        signal: AbortSignal.timeout(30000)
      });
      if (!resp.ok) throw new Error(`NVIDIA Error: ${resp.status}`);
      const data = await resp.json();
      return data.choices[0].message.content;
    }
  }
];

/**
 * MÉTODO MESTRE: generate()
 * Interface universal de alta resiliência.
 */
export async function generate({ 
  prompt, 
  systemInstruction = 'Você é um arquiteto de sistemas avançado.', 
  responseType = 'text', 
  temperature = 0.7 
}) {
  const sessionStart = Date.now();
  log('info', 'Sessão de Geração Iniciada', { prompt_len: prompt.length, mode: responseType });

  for (const provider of PROVIDERS) {
    if (!provider.checkEnv()) {
      log('warn', `Provedor Desabilitado: ${provider.label}`);
      continue;
    }

    try {
      log('info', `Engajando Pipeline: ${provider.label}...`);
      
      const rawResponse = await provider.call({
        prompt,
        system: systemInstruction,
        temp: temperature
      });

      let content = rawResponse;
      if (responseType === 'json') {
        try {
          content = sanitizeAndParseJSON(rawResponse);
        } catch (parseError) {
          log('warn', `Erro de Parsing no ${provider.id}. Executando Auto-Fallback imediatamante.`);
          throw parseError; // Avança para o próximo provedor da chain
        }
      }

      const elapsed = Date.now() - sessionStart;
      const result = {
        success: true,
        provider: provider.id,
        model: process.env[`${provider.id.toUpperCase()}_MODEL`] || 'default',
        content,
        timestamp: new Date().toISOString(),
        metrics: { latency_ms: elapsed }
      };

      log('success', `Célula de Inteligência Respondida via ${provider.id}`, { elapsed: `${elapsed}ms` });
      return result;

    } catch (err) {
      log('error', `Falha Crítica no Provedor: ${provider.label}`, { reason: err.message });
      // Loop continua para o nível seguinte de redundância
    }
  }

  log('fatal', 'COLAPSO DO BARRAMENTO DE IA. Todos os níveis falharam.');
  return {
    success: false,
    provider: 'none',
    error: 'Circuit Breaker: All redundant systems exhausted.',
    timestamp: new Date().toISOString()
  };
}
