import { deleteRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { WorkoutExecution } from './types';

const STORAGE_PREFIX = 'titan-fit:execution:';
const SESSION_FALLBACK_PREFIX = 'titan-fit:execution-fallback:';

function key(planId: string, workoutId: string) {
  return `${STORAGE_PREFIX}${planId}:${workoutId}`;
}

function fallbackKey(planId: string, workoutId: string) {
  return `${SESSION_FALLBACK_PREFIX}${planId}:${workoutId}`;
}

function recordId(planId: string, workoutId: string) {
  return `${planId}:${workoutId}`;
}

function reportMirrorFailure(error: unknown) {
  console.warn('Não foi possível espelhar a sessão ativa no IndexedDB.', error);
}

function readExecution(storage: Storage, storageKey: string): WorkoutExecution | null {
  try {
    const raw = storage.getItem(storageKey);
    return raw ? JSON.parse(raw) as WorkoutExecution : null;
  } catch {
    return null;
  }
}

export function loadWorkoutExecution(planId: string, workoutId: string): WorkoutExecution | null {
  const primary = readExecution(localStorage, key(planId, workoutId));
  if (primary) return primary;

  const fallback = readExecution(sessionStorage, fallbackKey(planId, workoutId));
  if (fallback) {
    try {
      localStorage.setItem(key(planId, workoutId), JSON.stringify(fallback));
    } catch {
      // Mantém a sessão utilizável mesmo quando o armazenamento persistente está indisponível.
    }
  }
  return fallback;
}

export function saveWorkoutExecution(execution: WorkoutExecution) {
  const serialized = JSON.stringify(execution);

  try {
    localStorage.setItem(key(execution.planId, execution.workoutId), serialized);
  } catch (error) {
    console.warn('Não foi possível salvar a sessão ativa no armazenamento persistente.', error);
  }

  try {
    sessionStorage.setItem(fallbackKey(execution.planId, execution.workoutId), serialized);
  } catch {
    // O espelho em IndexedDB ainda será tentado abaixo.
  }

  void putRecord(STORE_NAMES.activeSessions, recordId(execution.planId, execution.workoutId), execution).catch(reportMirrorFailure);
}

export function removeWorkoutExecution(planId: string, workoutId: string) {
  try {
    localStorage.removeItem(key(planId, workoutId));
  } catch {
    // Segue removendo as demais cópias.
  }

  try {
    sessionStorage.removeItem(fallbackKey(planId, workoutId));
  } catch {
    // Sem ação necessária.
  }

  void deleteRecord(STORE_NAMES.activeSessions, recordId(planId, workoutId)).catch(reportMirrorFailure);
}
