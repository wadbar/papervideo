/**
 * UniversalSystem.ts
 * AI Controller, universal, agnostic and failure-shielded.
 * Production-level Fallback Architecture.
 */

export interface AIResponse {
  success: boolean;
  provider: 'ollama' | 'gemini' | 'nvidia' | 'unknown';
  model: string;
  content: string | object;
  timestamp: string;
}

const PROVIDERS = [
  {
    name: 'ollama' as const,
    enabled: !!process.env.OLLAMA_HOST,
    generate: async (prompt: string, systemInstruction: string) => {
      const response = await fetch(`${process.env.OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL,
          prompt: `${systemInstruction}\n\n${prompt}`,
          stream: false
        })
      });
      if (!response.ok) throw new Error(`Ollama Falhou: ${response.statusText}`);
      const data = await response.json();
      return data.response;
    }
  },
  {
    name: 'gemini' as const,
    enabled: !!process.env.GEMINI_API_KEY,
    generate: async (prompt: string, systemInstruction: string) => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }]
        })
      });
      if (!response.ok) throw new Error(`Gemini Falhou: ${response.statusText}`);
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
  },
  {
    name: 'nvidia' as const,
    enabled: !!process.env.NVIDIA_API_KEY,
    generate: async (prompt: string, systemInstruction: string) => {
      const response = await fetch(`${process.env.NVIDIA_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ]
        })
      });
      if (!response.ok) throw new Error(`NVIDIA Falhou: ${response.statusText}`);
      const data = await response.json();
      return data.choices[0].message.content;
    }
  }
];

export async function generate({
  prompt,
  systemInstruction = 'You are a professional assistant.',
  responseType = 'text',
  temperature = 0.7
}: {
  prompt: string;
  systemInstruction?: string;
  responseType?: 'text' | 'json';
  temperature?: number;
}): Promise<AIResponse> {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] [UniversalSystem] INFO: Starting processing...`);

  for (const provider of PROVIDERS) {
    if (!provider.enabled) {
      console.log(`[${timestamp}] [UniversalSystem] WARN: Provider ${provider.name} disabled. Skipping...`);
      continue;
    }

    try {
      console.log(`[${timestamp}] [UniversalSystem] INFO: Attempting provider: ${provider.name}...`);
      const rawContent = await provider.generate(prompt, systemInstruction);

      let content: string | object = rawContent;

      if (responseType === 'json') {
        content = sanitizeAndParseJSON(rawContent);
      }

      const elapsed = Date.now() - start;
      console.log(`[${timestamp}] [UniversalSystem] SUCCESS: Provider ${provider.name} responded in ${elapsed}ms.`);

      return {
        success: true,
        provider: provider.name,
        model: process.env[`${provider.name.toUpperCase()}_MODEL`] || 'unknown',
        content,
        timestamp
      };
    } catch (error) {
      const elapsed = Date.now() - start;
      console.error(`[${timestamp}] [UniversalSystem] ERROR: Provider ${provider.name} failed after ${elapsed}ms. Error:`, error);
      // Fallback automático para o próximo provedor (Circut Breaker light)
    }
  }

  throw new Error(`[${timestamp}] [UniversalSystem] FATAL: All providers exhausted.`);
}

function sanitizeAndParseJSON(input: string): object {
  try {
    // Escapa sanitização de markdown e lixo residual
    const jsonMatch = input.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const cleanedString = jsonMatch ? jsonMatch[0] : input;
    return JSON.parse(cleanedString);
  } catch (error) {
    console.error(`[UniversalSystem] JSON sanitization error:`, error);
    throw new Error('Failed to sanitize AI JSON response.');
  }
}
