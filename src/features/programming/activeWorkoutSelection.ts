import type { TitanPlan, TitanWorkoutDay } from '../plan/types';
import type { WorkoutHistoryRecord } from '../history/types';
import { getScheduledWorkout, isScheduledRestDay } from './fixedSchedule';

export type TrainingChoice = 'pull' | 'push' | 'legs' | 'rest';

// Compatibilidade legada: a partir da rotina fixa, a escolha manual deixa de comandar o treino.
export function loadTrainingChoice(): TrainingChoice {
  return isScheduledRestDay() ? 'rest' : 'pull';
}

export function saveTrainingChoice(_choice: TrainingChoice) {
  // Intencionalmente sem efeito: a rotina semanal agora é fixa.
}

export function advanceTrainingChoice() {
  // Intencionalmente sem efeito: o avanço é determinado pelo calendário semanal.
}

export function choiceLabel(choice: TrainingChoice) {
  return choice === 'rest' ? 'DESCANSO' : 'ROTINA';
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

export function resolveSelectedWorkout(plan: TitanPlan, _history: WorkoutHistoryRecord[], _choice: TrainingChoice = loadTrainingChoice()): TitanWorkoutDay | null {
  return getScheduledWorkout(plan);
}
