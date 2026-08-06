import { deleteRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { WorkoutExecution } from './types';

const STORAGE_PREFIX = 'titan-fit:execution:';

function key(planId: string, workoutId: string) {
  return `${STORAGE_PREFIX}${planId}:${workoutId}`;
}

function recordId(planId: string, workoutId: string) {
  return `${planId}:${workoutId}`;
}

function reportMirrorFailure(error: unknown) {
  console.warn('Não foi possível espelhar a sessão ativa no IndexedDB.', error);
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
  void putRecord(STORE_NAMES.activeSessions, recordId(execution.planId, execution.workoutId), execution).catch(reportMirrorFailure);
}

export function removeWorkoutExecution(planId: string, workoutId: string) {
  localStorage.removeItem(key(planId, workoutId));
  void deleteRecord(STORE_NAMES.activeSessions, recordId(planId, workoutId)).catch(reportMirrorFailure);
}
