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

export const CORE_GLUTES_EXERCISE_VIDEO_BATCH: Record<string, ExerciseVideoMetadata> = {
  'dead-bug': nasm('dead-bug', 'bxn9FBrt4-A', 'Dead bug — execução'),
  'bird-dog': nasm('bird-dog', 'ZdAHe9_HeEw', 'Bird dog — execução'),
  'side-plank': nasm('side-plank', '44ND4bOB-T0', 'Prancha lateral — execução'),
  'glute-bridge': nasm('glute-bridge', 'Z3cY3d3BBo4', 'Ponte de glúteos — execução'),
};
