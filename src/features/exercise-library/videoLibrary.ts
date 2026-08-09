import type { TitanCatalogExercise } from './catalog';
import { COMMON_EXERCISE_VIDEO_BATCH } from './videoRegistryCommonBatch';
import { CORE_GLUTES_EXERCISE_VIDEO_BATCH } from './videoRegistryCoreGlutesBatch';
import { CORE_POSTERIOR_EXERCISE_VIDEO_BATCH } from './videoRegistryCorePosteriorBatch';
import { EXERCISE_VIDEO_BATCH_4 } from './videoRegistryBatch4';
import { EXERCISE_VIDEO_BATCH_5 } from './videoRegistryBatch5';
import { FINAL_GAP_EXERCISE_VIDEO_BATCH_1 } from './videoRegistryFinalGapBatch1';
import { GAP_EXERCISE_VIDEO_BATCH_2 } from './videoRegistryGapBatch2';
import { GAP_EXERCISE_VIDEO_BATCH_3 } from './videoRegistryGapBatch3';
import { GAP_EXERCISE_VIDEO_BATCH_4 } from './videoRegistryGapBatch4';
import { GAP_EXERCISE_VIDEO_BATCH_5 } from './videoRegistryGapBatch5';
import { VIMEO_EXERCISE_VIDEO_BATCH } from './videoRegistryVimeoBatch';
import { EXERCISE_VIDEO_100_PLUS_BATCH } from './videoRegistry100PlusBatch';
import { RESIDUAL_EXERCISE_VIDEO_BATCH_1 } from './videoRegistryResidualBatch1';
import { RESIDUAL_EXERCISE_VIDEO_FINAL_BATCH } from './videoRegistryResidualFinalBatch';
import { EXERCISE_VIDEO_REGISTRY, type ExerciseVideoMetadata } from './videoRegistry';

export const TITAN_EXERCISE_VIDEO_REGISTRY: Record<string, ExerciseVideoMetadata> = {
  ...EXERCISE_VIDEO_REGISTRY,
  ...COMMON_EXERCISE_VIDEO_BATCH,
  ...EXERCISE_VIDEO_BATCH_4,
  ...CORE_POSTERIOR_EXERCISE_VIDEO_BATCH,
  ...CORE_GLUTES_EXERCISE_VIDEO_BATCH,
  ...EXERCISE_VIDEO_BATCH_5,
  ...FINAL_GAP_EXERCISE_VIDEO_BATCH_1,
  ...GAP_EXERCISE_VIDEO_BATCH_2,
  ...GAP_EXERCISE_VIDEO_BATCH_3,
  ...GAP_EXERCISE_VIDEO_BATCH_4,
  ...GAP_EXERCISE_VIDEO_BATCH_5,
  ...VIMEO_EXERCISE_VIDEO_BATCH,
  ...EXERCISE_VIDEO_100_PLUS_BATCH,
  ...RESIDUAL_EXERCISE_VIDEO_BATCH_1,
  ...RESIDUAL_EXERCISE_VIDEO_FINAL_BATCH,
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
