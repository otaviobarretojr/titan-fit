import { describe, expect, it } from 'vitest';
import { TITAN_FULL_EXERCISE_CATALOG } from '../src/features/exercise-library/library';
import { TITAN_EXERCISE_VIDEO_REGISTRY } from '../src/features/exercise-library/videoLibrary';
import { getExerciseVideo } from '../src/features/exercise-library/videos';
import type { TitanExercise } from '../src/features/plan/types';

describe('exercise video full coverage', () => {
  it('mantém vídeo reproduzível para 100% do catálogo TITAN', () => {
    const missing = TITAN_FULL_EXERCISE_CATALOG.filter((exercise) => {
      const workoutExercise: TitanExercise = {
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.primaryMuscle,
      };
      return !getExerciseVideo(workoutExercise)?.embedUrl;
    });

    expect(
      missing.map((exercise) => `${exercise.id} (${exercise.name})`),
      `Exercícios sem vídeo reproduzível: ${missing.map((exercise) => `${exercise.id} (${exercise.name})`).join(', ')}`,
    ).toEqual([]);
  });

  it('não mantém registros de mídia órfãos fora do catálogo', () => {
    const catalogIds = new Set(TITAN_FULL_EXERCISE_CATALOG.map((exercise) => exercise.id));
    const orphaned = Object.keys(TITAN_EXERCISE_VIDEO_REGISTRY).filter((id) => !catalogIds.has(id));
    expect(orphaned).toEqual([]);
  });
});
