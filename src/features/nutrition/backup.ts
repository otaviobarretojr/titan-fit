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

export async function downloadNutritionBackup(): Promise<'shared' | 'downloaded'> {
  const backup = createNutritionBackup();
  const contents = JSON.stringify(backup, null, 2);
  const filename = `titan-nutrition-backup-${backup.exportedAt.slice(0, 10)}.json`;
  const file = new File([contents], filename, { type: 'application/json' });

  try {
    if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({
        title: 'Backup TITAN Nutrition',
        text: 'Backup dos dados do TITAN Nutrition.',
        files: [file],
      });
      return 'shared';
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
  }

  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

export function restoreNutritionBackupText(text: string) {
  const parsed = JSON.parse(text) as Partial<TitanNutritionBackup>;
  if (parsed.schemaVersion !== 1 || !parsed.data || typeof parsed.data !== 'object') throw new Error('Backup inválido ou incompatível.');
  for (const [key, value] of Object.entries(parsed.data)) {
    if (!key.startsWith(PREFIX) || typeof value !== 'string') continue;
    localStorage.setItem(key, value);
  }
}
