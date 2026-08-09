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

export const EXERCISE_VIDEO_BATCH_4: Record<string, ExerciseVideoMetadata> = {
  'close-grip-bench': fittr('close-grip-bench', 'e3f9Ybbik8o', 'Supino pegada fechada — execução'),
  'step-up': fittr('step-up', 'BHUu__ZSFEk', 'Subida no banco com halteres — execução'),
  'dumbbell-fly': fittr('dumbbell-fly', 'xZOpv3xa_ZA', 'Crucifixo com halteres — execução'),
  'cable-pull-through': fittr('cable-pull-through', 'w27k-J98eJ0', 'Pull through no cabo — execução'),
  'inverted-row': fittr('inverted-row', 'Zev745CHMMQ', 'Remada invertida — execução'),
};
