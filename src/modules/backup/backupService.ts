import { db, type TitanFitDatabase } from '../../database/database';

const TABLES = ['trainingPlans','trainingPlanSessions','trainingPlanExercises','exerciseDefinitions','trainingSessions','setExecutions','cardioPlans','cardioExecutions','importHistory','appPreferences'] as const;
export interface TitanBackup { schema: 'TITAN_FIT_BACKUP'; version: 1; createdAt: string; tables: Record<string, unknown[]> }

export async function createBackup(database: TitanFitDatabase = db): Promise<TitanBackup> {
  const tables: Record<string, unknown[]> = {};
  for (const table of TABLES) tables[table] = await database.table(table).toArray();
  const backup: TitanBackup = { schema: 'TITAN_FIT_BACKUP', version: 1, createdAt: new Date().toISOString(), tables };
  await database.backups.add({ createdAt: backup.createdAt, version: 1, data: JSON.stringify(backup) });
  return backup;
}

export async function restoreBackup(raw: string, database: TitanFitDatabase = db) {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || (parsed as TitanBackup).schema !== 'TITAN_FIT_BACKUP' || (parsed as TitanBackup).version !== 1) throw new Error('Backup incompatível.');
  const backup = parsed as TitanBackup;
  if (!backup.tables || TABLES.some((name) => !Array.isArray(backup.tables[name]))) throw new Error('Backup incompleto.');
  await database.transaction('rw', TABLES.map((name) => database.table(name)), async () => {
    for (const name of TABLES) { const table = database.table(name); await table.clear(); await table.bulkAdd(backup.tables[name]); }
  });
}

export function downloadJson(value: unknown, fileName: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url);
}
