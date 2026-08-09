import type { TitanCatalogExercise } from './catalog';
import { COMMON_EXERCISE_VIDEO_BATCH } from './videoRegistryCommonBatch';
import { CORE_GLUTES_EXERCISE_VIDEO_BATCH } from './videoRegistryCoreGlutesBatch';
import { CORE_POSTERIOR_EXERCISE_VIDEO_BATCH } from './videoRegistryCorePosteriorBatch';
import { EXERCISE_VIDEO_BATCH_4 } from './videoRegistryBatch4';
import { EXERCISE_VIDEO_REGISTRY, type ExerciseVideoMetadata } from './videoRegistry';

export const TITAN_EXERCISE_VIDEO_REGISTRY: Record<string, ExerciseVideoMetadata> = {
  ...EXERCISE_VIDEO_REGISTRY,
  ...COMMON_EXERCISE_VIDEO_BATCH,
  ...EXERCISE_VIDEO_BATCH_4,
  ...CORE_POSTERIOR_EXERCISE_VIDEO_BATCH,
  ...CORE_GLUTES_EXERCISE_VIDEO_BATCH,
};

export function getCatalogExerciseVideo(exercise: Pick<TitanCatalogExercise, 'id'>): ExerciseVideoMetadata | null {
  return TITAN_EXERCISE_VIDEO_REGISTRY[exercise.id] ?? null;
}

export function getVideoCoverage(exercises: Array<Pick<TitanCatalogExercise, 'id'>>) {
  const covered = exercises.filter((exercise) => Boolean(TITAN_EXERCISE_VIDEO_REGISTRY[exercise.id])).length;
  return {
    covered,
    total: exercises.length,
    pending: Math.max(0, exercises.length - covered),
    percentage: exercises.length ? Math.round((covered / exercises.length) * 100) : 0,
  };
}
