import type { TitanPlan, TitanWorkoutDay } from '../plan/types';
import type { WorkoutHistoryRecord } from '../history/types';

export type TrainingChoice = 'pull' | 'push' | 'legs' | 'rest';

const STORAGE_KEY = 'titan-fit:programming-choice:v1';
const ORDER: TrainingChoice[] = ['pull', 'push', 'legs', 'rest'];

export function loadTrainingChoice(): TrainingChoice {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'pull' || value === 'push' || value === 'legs' || value === 'rest' ? value : 'pull';
}

export function saveTrainingChoice(choice: TrainingChoice) {
  localStorage.setItem(STORAGE_KEY, choice);
  window.dispatchEvent(new CustomEvent('titan:programming-choice-changed', { detail: choice }));
}

export function advanceTrainingChoice() {
  const current = loadTrainingChoice();
  const index = ORDER.indexOf(current);
  saveTrainingChoice(ORDER[(index + 1) % ORDER.length]);
}

export function choiceLabel(choice: TrainingChoice) {
  if (choice === 'pull') return 'PULL';
  if (choice === 'push') return 'PUSH';
  if (choice === 'legs') return 'LEGS';
  return 'DESCANSO';
}

export function getWorkoutKind(workout: TitanWorkoutDay): Exclude<TrainingChoice, 'rest'> | null {
  const text = `${workout.title} ${workout.focus ?? ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\bpull\b/.test(text)) return 'pull';
  if (/\bpush\b/.test(text)) return 'push';
  if (/\blegs?\b|perna|quadriceps|posterior|glute/.test(text)) return 'legs';
  return null;
}

export function getWorkoutsForChoice(plan: TitanPlan, choice: TrainingChoice) {
  if (choice === 'rest') return [];
  return plan.workouts.filter((workout) => getWorkoutKind(workout) === choice);
}

export function resolveSelectedWorkout(plan: TitanPlan, history: WorkoutHistoryRecord[], choice = loadTrainingChoice()): TitanWorkoutDay | null {
  const candidates = getWorkoutsForChoice(plan, choice);
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];

  const completed = history
    .filter((record) => record.planId === plan.id && candidates.some((candidate) => candidate.id === record.workoutId))
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  if (!completed.length) return candidates[0];
  const lastIndex = candidates.findIndex((candidate) => candidate.id === completed[0].workoutId);
  return candidates[(Math.max(lastIndex, 0) + 1) % candidates.length];
}
