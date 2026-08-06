import { getAllRecords, putRecord, clearStore } from '../database/indexedDb';
import { STORE_NAMES, TITAN_DB_VERSION, type DatabaseRecord, type StoreName } from '../database/schema';

export type TitanBackup = {
  format: 'titan-fit-backup';
  schemaVersion: number;
  exportedAt: string;
  stores: Partial<Record<StoreName, Array<DatabaseRecord<unknown>>>>;
};

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
  return backup.format === 'titan-fit-backup'
    && typeof backup.schemaVersion === 'number'
    && typeof backup.exportedAt === 'string'
    && !!backup.stores
    && typeof backup.stores === 'object';
}

export async function restoreBackup(backup: TitanBackup): Promise<void> {
  if (!validateBackup(backup)) throw new Error('Arquivo de backup inválido.');
  if (backup.schemaVersion > TITAN_DB_VERSION) throw new Error('Este backup foi criado por uma versão mais nova do TITAN FIT.');

  for (const storeName of Object.values(STORE_NAMES)) {
    await clearStore(storeName);
    const records = backup.stores[storeName] ?? [];
    for (const record of records) {
      await putRecord(storeName, record.id, record.value);
    }
  }
}

export function downloadBackup(backup: TitanBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `titan-fit-backup-${backup.exportedAt.slice(0, 10)}.titan-backup.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
