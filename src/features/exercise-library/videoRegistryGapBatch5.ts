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

export const GAP_EXERCISE_VIDEO_BATCH_5: Record<string, ExerciseVideoMetadata> = {
  'machine-curl': embedded('machine-curl', 'uqgPWQ8vUfk', 'Rosca máquina — execução', 'FITTR'),
};
