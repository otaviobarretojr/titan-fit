import type { ExerciseVideoMetadata } from './videoRegistry';

const fittr = (exerciseId: string, videoId: string, title: string): ExerciseVideoMetadata => ({
  exerciseId,
  provider: 'youtube',
  videoId,
  title,
  sourceName: 'YouTube · FITTR',
  author: 'FITTR',
  licenseStatus: 'embedded-reference',
  attributionUrl: `https://www.youtube.com/watch?v=${videoId}`,
});

export const CORE_POSTERIOR_EXERCISE_VIDEO_BATCH: Record<string, ExerciseVideoMetadata> = {
  'hanging-leg-raise': fittr('hanging-leg-raise', '3lykYcUcWNo', 'Elevação de pernas suspenso — execução'),
  'hanging-knee-raise': fittr('hanging-knee-raise', '9qCRbu88hVY', 'Elevação de joelhos suspenso — execução'),
  'concentration-curl': fittr('concentration-curl', 'ePICx35fsLg', 'Rosca concentrada — execução'),
  'standing-leg-curl': fittr('standing-leg-curl', 'CmtN7mqUkLQ', 'Flexora em pé — execução'),
};
