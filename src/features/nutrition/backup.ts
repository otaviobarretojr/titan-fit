export type TitanNutritionBackup = {
  schemaVersion: 1;
  exportedAt: string;
  data: Record<string, string>;
};

const PREFIX = 'titan-nutrition:';

export function createNutritionBackup(): TitanNutritionBackup {
  const data: Record<string, string> = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith(PREFIX)) continue;
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), data };
}

export function downloadNutritionBackup() {
  const backup = createNutritionBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `titan-nutrition-backup-${backup.exportedAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function restoreNutritionBackupText(text: string) {
  const parsed = JSON.parse(text) as Partial<TitanNutritionBackup>;
  if (parsed.schemaVersion !== 1 || !parsed.data || typeof parsed.data !== 'object') throw new Error('Backup inválido ou incompatível.');
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!key.startsWith(PREFIX) || typeof value !== 'string') continue;
    localStorage.setItem(key, value);
  }
}
