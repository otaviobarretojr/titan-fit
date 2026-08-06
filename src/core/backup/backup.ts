import { getAllRecords, replaceAllStores } from '../database/indexedDb';
import { STORE_NAMES, TITAN_DB_VERSION, type DatabaseRecord, type StoreName } from '../database/schema';

export type TitanBackup = {
  format: 'titan-fit-backup';
  schemaVersion: number;
  exportedAt: string;
  stores: Partial<Record<StoreName, Array<DatabaseRecord<unknown>>>>;
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

export async function restoreBackup(backup: TitanBackup): Promise<void> {
  if (!validateBackup(backup)) throw new Error('Arquivo de backup inválido.');
  if (backup.schemaVersion > TITAN_DB_VERSION) throw new Error('Este backup foi criado por uma versão mais nova do TITAN FIT.');
  await replaceAllStores(backup.stores);
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
