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

export const COMMON_EXERCISE_VIDEO_BATCH: Record<string, ExerciseVideoMetadata> = {
  'push-up': fittr('push-up', 'x1k3PHidXBQ', 'Flexão de braços — execução'),
  'weighted-push-up': fittr('weighted-push-up', 'evrgReVKeQg', 'Flexão com carga — execução'),
  'dumbbell-row': fittr('dumbbell-row', '8p36XRW3ZlU', 'Remada unilateral com halter — execução'),
  'barbell-row': fittr('barbell-row', 'XeICq5Hlj8o', 'Remada curvada com barra — execução'),
  'goblet-squat': fittr('goblet-squat', 'RMLonZPjnNU', 'Agachamento goblet — execução'),
  'barbell-hip-thrust': fittr('barbell-hip-thrust', 'a2Y_5wTtzMY', 'Hip thrust com barra — execução'),
  'cable-fly': {
    exerciseId: 'cable-fly',
    provider: 'youtube',
    videoId: 'QUcXXwxa6hE',
    title: 'Crucifixo no cabo — execução',
    sourceName: 'YouTube · Miqueias Alves Personal',
    author: 'Miqueias Alves Personal',
    licenseStatus: 'embedded-reference',
    attributionUrl: 'https://www.youtube.com/watch?v=QUcXXwxa6hE',
  },
};
