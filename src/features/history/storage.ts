import type { WorkoutHistoryRecord } from './types';

const HISTORY_KEY = 'titan-fit:history:v1';

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
}

export function addWorkoutHistoryRecord(record: WorkoutHistoryRecord) {
  const records = loadWorkoutHistory().filter((item) => item.id !== record.id);
  saveWorkoutHistory([record, ...records]);
}

export function removeWorkoutHistoryRecord(recordId: string) {
  saveWorkoutHistory(loadWorkoutHistory().filter((record) => record.id !== recordId));
}
