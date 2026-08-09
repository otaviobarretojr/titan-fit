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
  it('resolve no modo treino toda mídia reproduzível registrada na Biblioteca TITAN', () => {
    for (const [exerciseId, metadata] of Object.entries(TITAN_EXERCISE_VIDEO_REGISTRY)) {
      if (!metadata.videoId && !metadata.videoUrl) continue;
      const catalogExercise = TITAN_FULL_EXERCISE_CATALOG.find((exercise) => exercise.id === exerciseId);
      expect(catalogExercise, `Exercício ${exerciseId} precisa existir no catálogo`).toBeDefined();
      const workoutExercise: TitanExercise = {
        id: catalogExercise!.id,
        name: catalogExercise!.name,
        muscleGroup: catalogExercise!.primaryMuscle,
      };
      const resolved = getExerciseVideo(workoutExercise);
      expect(resolved, `Mídia não resolvida para ${exerciseId}`).not.toBeNull();
      expect(resolved?.provider).toBe(metadata.provider);
      expect(resolved?.embedUrl, `URL de incorporação ausente para ${exerciseId}`).toBeTruthy();
      if (metadata.videoId) expect(resolved?.videoId).toBe(metadata.videoId);
    }
  });

  it('gera URL Vimeo correta para os quatro vídeos Vimeo cadastrados', () => {
    const vimeoEntries = Object.entries(TITAN_EXERCISE_VIDEO_REGISTRY).filter(([, metadata]) => metadata.provider === 'vimeo');
    expect(vimeoEntries).toHaveLength(4);

    for (const [exerciseId, metadata] of vimeoEntries) {
      const catalogExercise = TITAN_FULL_EXERCISE_CATALOG.find((exercise) => exercise.id === exerciseId);
      expect(catalogExercise).toBeDefined();
      const resolved = getExerciseVideo({
        id: exerciseId,
        name: catalogExercise!.name,
        muscleGroup: catalogExercise!.primaryMuscle,
      });
      expect(resolved?.provider).toBe('vimeo');
      expect(resolved?.embedUrl).toBe(`https://player.vimeo.com/video/${metadata.videoId}`);
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
