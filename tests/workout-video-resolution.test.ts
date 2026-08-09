import { describe, expect, it } from 'vitest';
import { TITAN_FULL_EXERCISE_CATALOG } from '../src/features/exercise-library/library';
import { TITAN_EXERCISE_VIDEO_REGISTRY } from '../src/features/exercise-library/videoLibrary';
import { getExerciseVideo } from '../src/features/exercise-library/videos';
import { generateTitanPlanCandidates } from '../src/features/plan/generator';
import type { TitanExercise } from '../src/features/plan/types';
import type { TitanProfile, TitanTrainingAssessment } from '../src/features/profile/types';

const profile: TitanProfile = {
  id: 'profile-video-test',
  displayName: 'Teste',
  heightCm: 176,
  currentWeightKg: 92,
  primaryGoal: 'hypertrophy',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  onboardingCompleted: true,
};

const assessment: TitanTrainingAssessment = {
  id: 'assessment-video-test',
  profileId: profile.id,
  experience: 'advanced',
  trainingDaysPerWeek: 6,
  preferredSessionMinutes: 75,
  equipmentAccess: 'full-gym',
  cardioGoal: 'none',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
};

describe('workout video resolution', () => {
  it('resolve no modo treino todo vídeo YouTube registrado na Biblioteca TITAN', () => {
    for (const [exerciseId, metadata] of Object.entries(TITAN_EXERCISE_VIDEO_REGISTRY)) {
      if (metadata.provider !== 'youtube' || !metadata.videoId) continue;
      const catalogExercise = TITAN_FULL_EXERCISE_CATALOG.find((exercise) => exercise.id === exerciseId);
      expect(catalogExercise, `Exercício ${exerciseId} precisa existir no catálogo`).toBeDefined();
      const workoutExercise: TitanExercise = {
        id: catalogExercise!.id,
        name: catalogExercise!.name,
        muscleGroup: catalogExercise!.primaryMuscle,
      };
      expect(getExerciseVideo(workoutExercise)?.videoId, `Vídeo não resolvido para ${exerciseId}`).toBe(metadata.videoId);
    }
  });

  it('recupera vídeo de alternativa legada pelo nome mesmo quando o id é artificial', () => {
    const legacyAlternative: TitanExercise = {
      id: 'chest-press-machine::alt::supino-reto-com-barra',
      name: 'Supino reto com barra',
      muscleGroup: 'Peitoral',
    };
    expect(getExerciseVideo(legacyAlternative)?.videoId).toBe(TITAN_EXERCISE_VIDEO_REGISTRY['bench-press']?.videoId);
  });

  it('gera alternativas estruturadas com ids oficiais do catálogo', () => {
    const candidates = generateTitanPlanCandidates(profile, assessment);
    const exercises = candidates.flatMap((candidate) => candidate.plan.workouts).flatMap((workout) => workout.exercises);
    const exerciseWithAlternatives = exercises.find((exercise) => (exercise.alternativeExercises?.length ?? 0) > 0);
    expect(exerciseWithAlternatives).toBeDefined();
    for (const alternative of exerciseWithAlternatives?.alternativeExercises ?? []) {
      expect(TITAN_FULL_EXERCISE_CATALOG.some((catalogExercise) => catalogExercise.id === alternative.id)).toBe(true);
      expect(alternative.name).not.toMatch(/^[a-z0-9-]+$/);
    }
  });
});
