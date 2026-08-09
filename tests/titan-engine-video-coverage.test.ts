import { describe, expect, it } from 'vitest';
import { getExerciseVideo } from '../src/features/exercise-library/videos';
import { generateTitanPlanCandidates } from '../src/features/plan/generator';
import type { TitanExercise } from '../src/features/plan/types';
import type { EquipmentAccess, TitanProfile, TitanTrainingAssessment, TrainingExperience } from '../src/features/profile/types';

const experiences: TrainingExperience[] = ['beginner', 'intermediate', 'advanced'];
const equipmentOptions: EquipmentAccess[] = ['full-gym', 'home-gym', 'minimal', 'bodyweight'];
const trainingDays = [3, 4, 5, 6];

function profile(id: string): TitanProfile {
  return {
    id,
    displayName: 'Cobertura TITAN',
    heightCm: 176,
    currentWeightKg: 92,
    primaryGoal: 'hypertrophy',
    createdAt: '2026-08-09',
    updatedAt: '2026-08-09',
    onboardingCompleted: true,
  };
}

function assessment(profileId: string, experience: TrainingExperience, equipmentAccess: EquipmentAccess, days: number): TitanTrainingAssessment {
  return {
    id: `${profileId}:assessment`,
    profileId,
    experience,
    trainingDaysPerWeek: days,
    preferredSessionMinutes: 75,
    equipmentAccess,
    cardioGoal: 'none',
    createdAt: '2026-08-09',
    updatedAt: '2026-08-09',
  };
}

function asWorkoutExercise(exercise: TitanExercise): TitanExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
  };
}

describe('TITAN Engine video coverage', () => {
  it('gera somente exercícios principais com vídeo reproduzível em toda a matriz suportada', () => {
    const missing = new Set<string>();

    for (const experience of experiences) {
      for (const equipmentAccess of equipmentOptions) {
        for (const days of trainingDays) {
          const id = `video-${experience}-${equipmentAccess}-${days}`;
          const candidates = generateTitanPlanCandidates(profile(id), assessment(id, experience, equipmentAccess, days));
          for (const candidate of candidates) {
            for (const workout of candidate.plan.workouts) {
              for (const exercise of workout.exercises) {
                if (!getExerciseVideo(asWorkoutExercise(exercise))?.embedUrl) missing.add(`${exercise.id} (${exercise.name})`);
              }
            }
          }
        }
      }
    }

    expect([...missing], `Exercícios gerados sem vídeo: ${[...missing].join(', ')}`).toEqual([]);
  });

  it('mantém vídeo reproduzível também para todas as alternativas estruturadas geradas', () => {
    const missing = new Set<string>();

    for (const experience of experiences) {
      for (const equipmentAccess of equipmentOptions) {
        for (const days of trainingDays) {
          const id = `alt-video-${experience}-${equipmentAccess}-${days}`;
          const candidates = generateTitanPlanCandidates(profile(id), assessment(id, experience, equipmentAccess, days));
          for (const candidate of candidates) {
            for (const workout of candidate.plan.workouts) {
              for (const exercise of workout.exercises) {
                for (const alternative of exercise.alternativeExercises ?? []) {
                  const resolved: TitanExercise = {
                    ...exercise,
                    ...alternative,
                    muscleGroup: alternative.muscleGroup ?? exercise.muscleGroup,
                  };
                  if (!getExerciseVideo(asWorkoutExercise(resolved))?.embedUrl) missing.add(`${resolved.id} (${resolved.name})`);
                }
              }
            }
          }
        }
      }
    }

    expect([...missing], `Alternativas geradas sem vídeo: ${[...missing].join(', ')}`).toEqual([]);
  });
});
