import type { ExerciseVideoMetadata } from './videoRegistry';

const nasm = (exerciseId: string, videoId: string, title: string): ExerciseVideoMetadata => ({
  exerciseId,
  provider: 'youtube',
  videoId,
  title,
  sourceName: 'YouTube · NASM',
  author: 'NASM',
  licenseStatus: 'embedded-reference',
  attributionUrl: `https://www.youtube.com/watch?v=${videoId}`,
});

export const EXERCISE_VIDEO_BATCH_5: Record<string, ExerciseVideoMetadata> = {
  'good-morning': nasm('good-morning', 'Daq-wJMUnes', 'Good morning — execução'),
  'single-leg-press': nasm('single-leg-press', '3aYsOsBA7ZE', 'Leg press unilateral — execução'),
  'bench-dip': nasm('bench-dip', 'WVeZDBhZwLA', 'Mergulho no banco — execução'),
};
