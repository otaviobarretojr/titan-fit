import { useEffect, useRef, useState } from 'react';
import { BetaFeedbackPanel } from '../../features/beta/BetaFeedbackPanel';
import { ProfileSettingsPanel } from '../../features/profile/ProfileSettingsPanel';
import { createBackup, downloadBackup, restoreBackup, validateBackup, type RestoreSummary } from './backup';

const RESTORE_SUMMARY_KEY = 'titan-fit:restore-summary';
const APP_VERSION = '0.37.0';

export function BackupPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(RESTORE_SUMMARY_KEY);
    if (!raw) return;
    sessionStorage.removeItem(RESTORE_SUMMARY_KEY);
    try {
      setMessage(formatRestoreMessage(JSON.parse(raw) as RestoreSummary));
    } catch {
      setMessage('Backup restaurado com sucesso.');
    }
  }, []);

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
      const summary = await restoreBackup(parsed);
      setMessage(`${formatRestoreMessage(summary)} Recarregando o TITAN FIT...`);
      window.setTimeout(() => window.location.reload(), 1200);
    } catch {
      setMessage('Não foi possível restaurar o backup. O arquivo pode ser incompatível ou a gravação local falhou.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return <>
    <ProfileSettingsPanel />
    <BetaFeedbackPanel appVersion={APP_VERSION} />
    <section className="settings-card" aria-label="Backup local">
      <div><span className="info-label">BACKUP LOCAL</span><strong>Proteja seus registros</strong></div>
      <p>Exporte um arquivo com o banco TITAN FIT ou restaure os dados em outro aparelho.</p>
      <button type="button" className="secondary-action" disabled={busy} onClick={exportData}>Exportar backup</button>
      <button type="button" className="secondary-action" disabled={busy} onClick={() => inputRef.current?.click()}>Restaurar backup</button>
      <input ref={inputRef} className="file-input" type="file" accept=".json,.titan-backup.json,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importData(file); }} />
      {message && <p role="status">{message}</p>}
    </section>
  </>;
}

function formatRestoreMessage(summary: RestoreSummary) {
  const parts = [
    `${summary.plans} projeto${summary.plans === 1 ? '' : 's'}`,
    `${summary.workoutHistory} treino${summary.workoutHistory === 1 ? '' : 's'} no histórico`,
    `${summary.activeSessions} sessão${summary.activeSessions === 1 ? '' : 'ões'} ativa${summary.activeSessions === 1 ? '' : 's'}`,
  ];
  if (summary.preferences > 0) parts.push(`${summary.preferences} registro${summary.preferences === 1 ? '' : 's'} de evolução/preferências`);
  if (summary.cardioRecords > 0) parts.push(`${summary.cardioRecords} registro${summary.cardioRecords === 1 ? '' : 's'} de cardio`);
  return `Backup restaurado com sucesso: ${parts.join(' · ')}.`;
}
