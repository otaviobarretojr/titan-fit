import { useRef, useState } from 'react';
import { createBackup, downloadBackup, restoreBackup, validateBackup } from './backup';

export function BackupPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function exportData() {
    setBusy(true);
    setMessage('');
    try {
      const backup = await createBackup();
      downloadBackup(backup);
      setMessage('Backup exportado com sucesso.');
    } catch {
      setMessage('Não foi possível exportar o backup.');
    } finally {
      setBusy(false);
    }
  }

  async function importData(file: File) {
    setBusy(true);
    setMessage('');
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!validateBackup(parsed)) throw new Error('invalid');
      if (!window.confirm('Restaurar este backup? Os dados atuais do banco serão substituídos.')) return;
      await restoreBackup(parsed);
      setMessage('Backup restaurado. Recarregando o TITAN FIT...');
      window.setTimeout(() => window.location.reload(), 800);
    } catch {
      setMessage('Arquivo de backup inválido ou incompatível.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return <section className="settings-card" aria-label="Backup local">
    <div><span className="info-label">BACKUP LOCAL</span><strong>Proteja seus registros</strong></div>
    <p>Exporte um arquivo com o banco TITAN FIT ou restaure os dados em outro aparelho.</p>
    <button type="button" className="secondary-action" disabled={busy} onClick={exportData}>Exportar backup</button>
    <button type="button" className="secondary-action" disabled={busy} onClick={() => inputRef.current?.click()}>Restaurar backup</button>
    <input ref={inputRef} className="file-input" type="file" accept=".json,.titan-backup.json,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importData(file); }} />
    {message && <p role="status">{message}</p>}
  </section>;
}
