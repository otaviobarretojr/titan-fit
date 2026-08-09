import type { ExerciseVideoMetadata } from './videoRegistry';

function embedded(exerciseId: string, videoId: string, title: string, sourceName: string): ExerciseVideoMetadata {
  return {
    exerciseId,
    provider: 'youtube',
    videoId,
    title,
    sourceName: `YouTube · ${sourceName}`,
    author: sourceName,
    licenseStatus: 'embedded-reference',
    attributionUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export const GAP_EXERCISE_VIDEO_BATCH_3: Record<string, ExerciseVideoMetadata> = {
  'pec-deck': embedded('pec-deck', 'Lw6A9NCwReU', 'Peck deck — execução', 'FITTR'),
  'wide-cable-row': embedded('wide-cable-row', 'l1jnqWqERIU', 'Remada aberta no cabo — execução', 'FITTR'),
  'cable-rear-delt-fly': embedded('cable-rear-delt-fly', '_Co_kM9v1Kk', 'Crucifixo inverso unilateral no cabo — execução', 'FITTR'),
};
