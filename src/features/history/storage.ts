import { putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { WorkoutHistoryRecord } from './types';

const HISTORY_KEY = 'titan-fit:history:v1';

function reportMirrorFailure(error: unknown) {
  console.warn('Não foi possível espelhar o histórico no IndexedDB.', error);
}

export function loadWorkoutHistory(): WorkoutHistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkoutHistoryRecord[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.completedAt.localeCompare(a.completedAt)) : [];
  } catch {
    return [];
  }
}

export function saveWorkoutHistory(records: WorkoutHistoryRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  void putRecord(STORE_NAMES.workoutHistory, 'records', records).catch(reportMirrorFailure);
}

export function addWorkoutHistoryRecord(record: WorkoutHistoryRecord) {
  const records = loadWorkoutHistory().filter((item) => item.id !== record.id);
  saveWorkoutHistory([record, ...records]);
}

export function removeWorkoutHistoryRecord(recordId: string) {
  saveWorkoutHistory(loadWorkoutHistory().filter((record) => record.id !== recordId));
}
