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
        id: 'scene-1',
        description: 'A futuristic AI laboratory with glowing holographic interfaces and high-tech equipment.',
        narrationText: 'The future of artificial intelligence is not just about code; it is about our shared vision of tomorrow.',
        imageStyle: 'Anime',
        imageUrl: '/src/assets/images/anime_variation_1_1779027526972.png',
        thumbnailVariations: [
          '/src/assets/images/anime_variation_1_1779027526972.png',
          '/src/assets/images/anime_variation_2_1779027542626.png',
          '/src/assets/images/anime_variation_3_1779027559888.png'
        ]
      },
      {
        id: 'scene-2',
        description: 'A lush green city where technology and nature coexist harmoniously, with sleek solar panels and vertical gardens.',
        narrationText: 'We envision a world where technology serves humanity and preserves our planet.',
        imageStyle: 'Anime',
        imageUrl: 'https://picsum.photos/seed/future-city/1024/768'
      }
    ]
  }
];
