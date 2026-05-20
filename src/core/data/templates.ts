import { VideoProject } from '../domain/types';

export const TEMPLATE_PROJECTS: VideoProject[] = [
  {
    id: 'template-ai-future',
    title: 'The AI Revolution',
    idea: 'A short documentary about the future of AI and human collaboration.',
    status: 'draft',
    createdAt: Date.now(),
    scenes: [
      {
        id: 'scene-2',
        description: 'A sprawling, lush green metropolis where advanced technology and vibrant nature coexist in perfect harmony. Golden-hour sunlight filters softly through atmospheric haze, illuminating sleek, monumental structures adorned with biomimetic vertical gardens and solar arrays. Captured from a sweeping aerial tracking shot, the scene features a photorealistic, cinematic aesthetic with rich, saturated greens and warm, ethereal lighting.',
        narrationText: 'We envision a world where technology serves humanity and preserves our planet.',
        imageStyle: 'Cinematic'
      },
      {
        id: 'scene-1',
        description: 'A futuristic AI laboratory bathed in moody, low-key lighting with glowing cyan and amber holographic interfaces. The camera executes a slow, deliberate pan across high-tech server racks and sleek computational cores, capturing the intricate details of the hardware. The artistic style is hyper-realistic and cinematic, emphasizing the striking contrast between deep shadows and neon technological luminescence.',
        narrationText: 'The future of artificial intelligence is not just about code; it is about our shared vision of tomorrow.',
        imageStyle: 'Cinematic',
        imageUrl: '/src/assets/images/anime_variation_1_1779027526972.png',
        thumbnailVariations: [
          '/src/assets/images/anime_variation_1_1779027526972.png',
          '/src/assets/images/anime_variation_2_1779027542626.png',
          '/src/assets/images/anime_variation_3_1779027559888.png'
        ]
      }
    ]
  }
];
