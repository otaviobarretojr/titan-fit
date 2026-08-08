import { getAllRecords, replaceAllStores } from '../database/indexedDb';
import { LEGACY_KEYS, WORKOUT_EXECUTION_PREFIX } from '../database/migrateLegacyStorage';
import { STORE_NAMES, TITAN_DB_VERSION, type DatabaseRecord, type StoreName } from '../database/schema';

export type TitanBackup = {
  format: 'titan-fit-backup';
  schemaVersion: number;
  exportedAt: string;
  stores: Partial<Record<StoreName, Array<DatabaseRecord<unknown>>>>;
};

export type RestoreSummary = {
  stores: number;
  records: number;
  plans: number;
  workoutHistory: number;
  activeSessions: number;
  cardioPlans: number;
  cardioRecords: number;
  preferences: number;
};

const allowedStores = new Set<string>(Object.values(STORE_NAMES));

function isDatabaseRecord(value: unknown): value is DatabaseRecord<unknown> {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<DatabaseRecord<unknown>>;
  return typeof record.id === 'string'
    && record.id.trim().length > 0
    && typeof record.updatedAt === 'string'
    && !Number.isNaN(Date.parse(record.updatedAt))
    && Object.prototype.hasOwnProperty.call(record, 'value');
}

export async function createBackup(): Promise<TitanBackup> {
  const stores: TitanBackup['stores'] = {};
  for (const storeName of Object.values(STORE_NAMES)) {
    stores[storeName] = await getAllRecords(storeName);
  }
  return {
    format: 'titan-fit-backup',
    schemaVersion: TITAN_DB_VERSION,
    exportedAt: new Date().toISOString(),
    stores
  };
}

export function validateBackup(value: unknown): value is TitanBackup {
  if (!value || typeof value !== 'object') return false;
  const backup = value as Partial<TitanBackup>;

  if (backup.format !== 'titan-fit-backup') return false;
  if (!Number.isInteger(backup.schemaVersion) || (backup.schemaVersion ?? 0) < 1) return false;
  if (typeof backup.exportedAt !== 'string' || Number.isNaN(Date.parse(backup.exportedAt))) return false;
  if (!backup.stores || typeof backup.stores !== 'object' || Array.isArray(backup.stores)) return false;

  for (const [storeName, records] of Object.entries(backup.stores)) {
    if (!allowedStores.has(storeName) || !Array.isArray(records)) return false;
    if (!records.every(isDatabaseRecord)) return false;
    const ids = records.map((record) => record.id);
    if (new Set(ids).size !== ids.length) return false;
  }

  return true;
}

export async function restoreBackup(backup: TitanBackup): Promise<RestoreSummary> {
  if (!validateBackup(backup)) throw new Error('Arquivo de backup inválido.');
  if (backup.schemaVersion > TITAN_DB_VERSION) throw new Error('Este backup foi criado por uma versão mais nova do TITAN FIT.');

  await replaceAllStores(backup.stores);
  syncLegacyMirrors(backup);
  const summary = await verifyRestore(backup);
  sessionStorage.setItem('titan-fit:restore-summary', JSON.stringify(summary));
  return summary;
}

function syncLegacyMirrors(backup: TitanBackup) {
  clearLegacyMirrors();

  const activePlan = getBackupRecordValue(backup, STORE_NAMES.plans, 'active');
  const workoutHistory = getBackupRecordValue(backup, STORE_NAMES.workoutHistory, 'records');
  const cardioPlan = getBackupRecordValue(backup, STORE_NAMES.cardioPlans, 'active');
  const cardioRecords = getBackupRecordValue(backup, STORE_NAMES.cardioRecords, 'records');

  if (activePlan !== undefined) localStorage.setItem(LEGACY_KEYS.activePlan, JSON.stringify(activePlan));
  if (workoutHistory !== undefined) localStorage.setItem(LEGACY_KEYS.workoutHistory, JSON.stringify(workoutHistory));
  if (cardioPlan !== undefined) localStorage.setItem(LEGACY_KEYS.cardioPlan, JSON.stringify(cardioPlan));
  if (cardioRecords !== undefined) localStorage.setItem(LEGACY_KEYS.cardioRecords, JSON.stringify(cardioRecords));

  for (const record of backup.stores[STORE_NAMES.activeSessions] ?? []) {
    localStorage.setItem(`${WORKOUT_EXECUTION_PREFIX}${record.id}`, JSON.stringify(record.value));
  }
}

function clearLegacyMirrors() {
  Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
  const executionKeys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(WORKOUT_EXECUTION_PREFIX)) executionKeys.push(key);
  }
  executionKeys.forEach((key) => localStorage.removeItem(key));
}

function getBackupRecordValue(backup: TitanBackup, storeName: StoreName, id: string): unknown | undefined {
  return backup.stores[storeName]?.find((record) => record.id === id)?.value;
}

async function verifyRestore(backup: TitanBackup): Promise<RestoreSummary> {
  let records = 0;
  let stores = 0;

  for (const storeName of Object.values(STORE_NAMES)) {
    const expected = backup.stores[storeName] ?? [];
    const restored = await getAllRecords(storeName);
    if (restored.length !== expected.length) {
      throw new Error(`Falha ao verificar a restauração de ${storeName}.`);
    }
    if (expected.length > 0) stores += 1;
    records += restored.length;
  }

  return {
    stores,
    records,
    plans: backup.stores[STORE_NAMES.plans]?.length ?? 0,
    workoutHistory: countArrayValue(backup, STORE_NAMES.workoutHistory, 'records'),
    activeSessions: backup.stores[STORE_NAMES.activeSessions]?.length ?? 0,
    cardioPlans: backup.stores[STORE_NAMES.cardioPlans]?.length ?? 0,
    cardioRecords: countArrayValue(backup, STORE_NAMES.cardioRecords, 'records'),
    preferences: backup.stores[STORE_NAMES.preferences]?.length ?? 0,
  };
}

function countArrayValue(backup: TitanBackup, storeName: StoreName, id: string) {
  const value = getBackupRecordValue(backup, storeName, id);
  return Array.isArray(value) ? value.length : 0;
}

export function downloadBackup(backup: TitanBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `titan-fit-backup-${backup.exportedAt.slice(0, 10)}.titan-backup.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
