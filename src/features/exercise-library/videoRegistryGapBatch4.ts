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

export const GAP_EXERCISE_VIDEO_BATCH_4: Record<string, ExerciseVideoMetadata> = {
  'bayesian-curl': embedded('bayesian-curl', '4NN4hl0O5V4', 'Rosca Bayesian — execução', 'SET FOR SET'),
  'cable-hip-abduction': embedded('cable-hip-abduction', '_mqI6dcUYos', 'Abdução de quadril no cabo — execução', 'SET FOR SET'),
};
