import type { ExerciseVideoMetadata } from './videoRegistry';

const vimeo = (exerciseId: string, videoId: string, title: string, author: string): ExerciseVideoMetadata => ({
  exerciseId,
  provider: 'vimeo',
  videoId,
  title,
  sourceName: `Vimeo · ${author}`,
  author,
  licenseStatus: 'embedded-reference',
  attributionUrl: `https://vimeo.com/${videoId}`,
});

export const VIMEO_EXERCISE_VIDEO_BATCH: Record<string, ExerciseVideoMetadata> = {
  'front-squat': vimeo('front-squat', '342816938', 'Agachamento frontal com barra — execução', 'Ashley Drummonds'),
  'landmine-press': vimeo('landmine-press', '957944414', 'Landmine press — execução', 'E3 Rehab'),
  'pendulum-squat': vimeo('pendulum-squat', '1135595547', 'Agachamento pêndulo — execução', '4WRD'),
  'machine-crunch': vimeo('machine-crunch', '814256957', 'Abdominal máquina — execução', 'Amy Simpson Fitness'),
};
