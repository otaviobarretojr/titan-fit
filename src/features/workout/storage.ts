import type { WorkoutExecution } from './types';

const STORAGE_PREFIX = 'titan-fit:execution:';

function key(planId: string, workoutId: string) {
  return `${STORAGE_PREFIX}${planId}:${workoutId}`;
}

export function loadWorkoutExecution(planId: string, workoutId: string): WorkoutExecution | null {
  try {
    const raw = localStorage.getItem(key(planId, workoutId));
    return raw ? JSON.parse(raw) as WorkoutExecution : null;
  } catch {
    return null;
  }
}

export function saveWorkoutExecution(execution: WorkoutExecution) {
  localStorage.setItem(key(execution.planId, execution.workoutId), JSON.stringify(execution));
}

export function removeWorkoutExecution(planId: string, workoutId: string) {
  localStorage.removeItem(key(planId, workoutId));
}
