import { putRecord, getRecord } from './indexedDb';
import { STORE_NAMES, type DatabaseMetadata } from './schema';

const LEGACY_KEYS = {
  activePlan: 'titan-fit.active-plan.v1',
  workoutHistory: 'titan-fit:history:v1',
  cardioPlan: 'titan-fit:cardio-plan',
  cardioRecords: 'titan-fit:cardio-records'
} as const;

const WORKOUT_EXECUTION_PREFIX = 'titan-fit:execution:';

function readJson(key: string): unknown | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function listLegacyWorkoutExecutions(): Array<{ id: string; value: unknown }> {
  const executions: Array<{ id: string; value: unknown }> = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const storageKey = localStorage.key(index);
    if (!storageKey?.startsWith(WORKOUT_EXECUTION_PREFIX)) continue;
    const value = readJson(storageKey);
    if (value !== null) {
      executions.push({ id: storageKey.slice(WORKOUT_EXECUTION_PREFIX.length), value });
    }
  }
  return executions;
}

export async function migrateLegacyStorage(): Promise<{ migrated: boolean; items: number }> {
  const existingMetadata = await getRecord<DatabaseMetadata>(STORE_NAMES.metadata, 'database');
  if (existingMetadata?.migratedFromLocalStorageAt) return { migrated: false, items: 0 };

  let items = 0;
  const activePlan = readJson(LEGACY_KEYS.activePlan);
  const workoutHistory = readJson(LEGACY_KEYS.workoutHistory);
  const cardioPlan = readJson(LEGACY_KEYS.cardioPlan);
  const cardioRecords = readJson(LEGACY_KEYS.cardioRecords);

  if (activePlan) { await putRecord(STORE_NAMES.plans, 'active', activePlan); items += 1; }
  if (workoutHistory) { await putRecord(STORE_NAMES.workoutHistory, 'records', workoutHistory); items += 1; }
  if (cardioPlan) { await putRecord(STORE_NAMES.cardioPlans, 'active', cardioPlan); items += 1; }
  if (cardioRecords) { await putRecord(STORE_NAMES.cardioRecords, 'records', cardioRecords); items += 1; }

  for (const execution of listLegacyWorkoutExecutions()) {
    await putRecord(STORE_NAMES.workoutExecutions, execution.id, execution.value);
    items += 1;
  }

  await putRecord<DatabaseMetadata>(STORE_NAMES.metadata, 'database', {
    schemaVersion: 1,
    migratedFromLocalStorageAt: new Date().toISOString()
  });

  return { migrated: true, items };
}

export { LEGACY_KEYS, WORKOUT_EXECUTION_PREFIX };
