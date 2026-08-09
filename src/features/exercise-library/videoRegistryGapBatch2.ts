import type { ExerciseVideoMetadata } from './videoRegistry';

const embedded = (exerciseId: string, videoId: string, title: string, author: string): ExerciseVideoMetadata => ({
  exerciseId,
  provider: 'youtube',
  videoId,
  title,
  sourceName: `YouTube · ${author}`,
  author,
  licenseStatus: 'embedded-reference',
  attributionUrl: `https://www.youtube.com/watch?v=${videoId}`,
});

export const GAP_EXERCISE_VIDEO_BATCH_2: Record<string, ExerciseVideoMetadata> = {
  'pull-up': embedded('pull-up', '9yVGh3XbJ34', 'Barra fixa — execução', 'NASM'),
  'assisted-pull-up': embedded('assisted-pull-up', 'B_VkNQS5YLs', 'Barra fixa assistida — execução', 'NASM'),
  'dumbbell-bench-press': embedded('dumbbell-bench-press', 'RUbcymdwWsA', 'Supino reto com halteres — execução', 'FITTR'),
  'machine-dip': embedded('machine-dip', '1PQq7fftFNY', 'Mergulho máquina — execução', 'FITTR'),
  'cable-curl': embedded('cable-curl', 'K18C5Yo0Bhc', 'Rosca no cabo — execução', 'FITTR'),
  'standing-calf-raise': embedded('standing-calf-raise', 'ix9LRCNb38U', 'Panturrilha em pé — execução', 'FITTR'),
  'single-leg-calf-raise': embedded('single-leg-calf-raise', '2tkZ-DJY6Fg', 'Panturrilha unilateral — execução', 'FITTR'),
  'reverse-crunch': embedded('reverse-crunch', 'p03StPfWmWY', 'Crunch reverso — execução', 'FITTR'),
};
