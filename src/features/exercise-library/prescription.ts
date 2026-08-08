import type { TrainingExperience } from '../profile/types';
import { TITAN_EXERCISE_CATALOG, type TitanCatalogExercise } from './catalog';

export type TitanPrescriptionInput = {
  experience: TrainingExperience;
  trainingDaysPerWeek: number;
  preferredSessionMinutes: number;
  equipmentAccess: 'full-gym' | 'home-gym' | 'minimal' | 'bodyweight';
};

export type TitanPrescriptionRule = {
  weeklySetsPerMuscle: [number, number];
  defaultRir: [number, number];
  compoundRestSeconds: [number, number];
  isolationRestSeconds: [number, number];
  maxExercisesPerSession: number;
};

const experienceRank: Record<TrainingExperience, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export function getPrescriptionRule(input: TitanPrescriptionInput): TitanPrescriptionRule {
  const weeklySetsPerMuscle: [number, number] = input.experience === 'beginner' ? [6, 10] : input.experience === 'intermediate' ? [8, 14] : [10, 16];
  const maxExercisesPerSession = input.preferredSessionMinutes <= 45 ? 5 : input.preferredSessionMinutes <= 60 ? 6 : 8;
  return {
    weeklySetsPerMuscle,
    defaultRir: input.experience === 'beginner' ? [2, 3] : [1, 3],
    compoundRestSeconds: [120, 180],
    isolationRestSeconds: [60, 120],
    maxExercisesPerSession,
  };
}

function equipmentAllowed(exercise: TitanCatalogExercise, access: TitanPrescriptionInput['equipmentAccess']) {
  if (access === 'full-gym') return true;
  if (access === 'bodyweight') return exercise.equipment.includes('bodyweight');
  if (access === 'minimal') return exercise.equipment.some((item) => item === 'bodyweight' || item === 'dumbbell');
  return exercise.equipment.some((item) => item !== 'machine' || exercise.equipment.includes('dumbbell') || exercise.equipment.includes('bodyweight'));
}

export function getEligibleExercises(input: TitanPrescriptionInput) {
  return TITAN_EXERCISE_CATALOG.filter((exercise) =>
    experienceRank[exercise.minExperience] <= experienceRank[input.experience] && equipmentAllowed(exercise, input.equipmentAccess),
  );
}

export function buildSplitTemplate(days: number): string[][] {
  if (days <= 2) return Array.from({ length: Math.max(days, 1) }, () => ['full-body']);
  if (days === 3) return [['push'], ['pull'], ['legs']];
  if (days === 4) return [['upper'], ['lower'], ['upper'], ['lower']];
  if (days === 5) return [['push'], ['pull'], ['legs'], ['upper'], ['lower']];
  return [['push'], ['pull'], ['legs'], ['push'], ['pull'], ['legs']];
}
