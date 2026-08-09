import type { ExerciseVideoMetadata } from './videoRegistry';

function fittr(exerciseId: string, videoId: string, title: string): ExerciseVideoMetadata {
  return {
    exerciseId,
    provider: 'youtube',
    videoId,
    title,
    sourceName: 'YouTube · FITTR',
    author: 'FITTR',
    licenseStatus: 'embedded-reference',
    attributionUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export const RESIDUAL_EXERCISE_VIDEO_BATCH_1: Record<string, ExerciseVideoMetadata> = {
  'barbell-overhead-press': fittr('barbell-overhead-press', 'yAbzqcjGnLs', 'Desenvolvimento com barra — execução'),
  'stiff-deadlift': fittr('stiff-deadlift', 'DyaPkibG4k8', 'Stiff com barra — execução'),
  'machine-pulldown': fittr('machine-pulldown', 'X5n55mMqSUs', 'Puxada articulada / máquina — execução'),
};
