export interface YouTubeScriptPrompt {
  idea: string;
  targetAudience?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  keywords?: string[];
  pacing?: 'fast-paced' | 'conversational' | 'slow-burn';
}

export const promptService = {
  getYouTubeScriptPrompt({ 
    idea, 
    targetAudience = 'geral', 
    tone = 'engajador',
    length = 'medium',
    keywords = [],
    pacing = 'conversational'
  }: YouTubeScriptPrompt) {
    const lengthMap = {
      short: 'curto (aprox. 1-2 minutos de fala)',
      medium: 'médio (aprox. 5-8 minutos de fala)',
      long: 'longo (aprox. 10-15 minutos de fala)'
    };

    const pacingMap = {
      'fast-paced': 'ritmo acelerado, cortes rápidos, energia alta',
      'conversational': 'natural, dialógico, amigável',
      'slow-burn': 'reflexivo, imersivo, build-up lento'
    };

    return {
      systemInstruction: `
        Você é um Arquiteto de Conteúdo Viral especializado em YouTube. 
        Sua missão é criar roteiros de alta retenção que combinam psicologia de engajamento com clareza técnica.
        RESPREITANDO ESTRITAMENTE: O formato JSON de saída deve ser válido e sem conversas extras.
      `,
      prompt: `
        Crie um roteiro viral baseado na ideia: "${idea}".
        Público-alvo: ${targetAudience}
        Tom de voz: ${tone}
        Duração desejada: ${lengthMap[length]}
        Ritmo (Pacing): ${pacingMap[pacing]}
        ${keywords.length > 0 ? `Palavras-chave obrigatórias (integrar naturalmente): ${keywords.join(', ')}` : ''}

        Estrutura exigida (JSON):
        {
          "title": "Título magnético otimizado para CTR",
          "script": "O roteiro COMPLETO em formato Markdown, pronto para leitura.",
          "scenes": [
            {
              "description": "O que deve aparecer na tela (AI Image Generator Prompt para a cena)",
              "narrationText": "O texto EXATO que será narrado nesta cena específica"
            }
          ]
        }
      `
    };
  }
};
