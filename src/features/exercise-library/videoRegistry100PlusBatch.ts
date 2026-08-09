import type { ExerciseVideoMetadata } from './videoRegistry';

function embedded(exerciseId: string, videoId: string, title: string, author: string): ExerciseVideoMetadata {
  return {
    exerciseId,
    provider: 'youtube',
    videoId,
    title,
    sourceName: `YouTube · ${author}`,
    author,
    licenseStatus: 'embedded-reference',
    attributionUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export const EXERCISE_VIDEO_100_PLUS_BATCH: Record<string, ExerciseVideoMetadata> = {
  'neutral-lat-pulldown': embedded('neutral-lat-pulldown', 'JFYBQMYFiFQ', 'Puxada neutra — execução', 'Marzrodie'),
  'one-arm-cable-row': embedded('one-arm-cable-row', 'Xzo997CAHvE', 'Remada unilateral no cabo — execução', 'Trifocus Fitness Academy'),
  'cable-kickback': embedded('cable-kickback', 'SqO-VUEak2M', 'Coice no cabo — execução', 'PureGym'),
};
