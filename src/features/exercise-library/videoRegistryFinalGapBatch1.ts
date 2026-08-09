import type { ExerciseVideoMetadata } from './videoRegistry';

const embedded = (
  exerciseId: string,
  videoId: string,
  title: string,
  sourceName: string,
  author: string,
): ExerciseVideoMetadata => ({
  exerciseId,
  provider: 'youtube',
  videoId,
  title,
  sourceName,
  author,
  licenseStatus: 'embedded-reference',
  attributionUrl: `https://www.youtube.com/watch?v=${videoId}`,
});

export const FINAL_GAP_EXERCISE_VIDEO_BATCH_1: Record<string, ExerciseVideoMetadata> = {
  'tbar-row': embedded('tbar-row', '5foJiIVhs8Q', 'Remada T — execução', 'YouTube · referência BarBend', 'BarBend'),
  'nordic-curl': embedded('nordic-curl', 'v_Egn_3CCsM', 'Nordic curl — execução', 'YouTube · referência BarBend', 'BarBend'),
  'barbell-shrug': embedded('barbell-shrug', 'NAqCVe2mwzM', 'Encolhimento com barra — execução', 'YouTube · referência BarBend', 'BarBend'),
  'dumbbell-shrug': embedded('dumbbell-shrug', 'sWeYG_I5HA4', 'Encolhimento com halteres — execução', 'YouTube · referência BarBend', 'BarBend'),
};
