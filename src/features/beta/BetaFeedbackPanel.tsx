import { useEffect, useState } from 'react';
import { buildBetaFeedbackEntry, downloadBetaFeedback, loadBetaFeedback, saveBetaFeedback, type BetaFeedbackEntry, type BetaFeedbackKind } from './feedback';

export function BetaFeedbackPanel({ appVersion }: { appVersion: string }) {
  const [kind, setKind] = useState<BetaFeedbackKind>('bug');
  const [screen, setScreen] = useState('');
  const [message, setMessage] = useState('');
  const [entries, setEntries] = useState<BetaFeedbackEntry[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void loadBetaFeedback().then(setEntries).catch(() => setStatus('Não foi possível carregar feedbacks anteriores.'));
  }, []);

  async function submit() {
    if (message.trim().length < 5) return setStatus('Descreva o feedback com um pouco mais de detalhe.');
    try {
      const entry = buildBetaFeedbackEntry(kind, message, appVersion, screen);
      const next = await saveBetaFeedback(entry);
      setEntries(next);
      setMessage('');
      setScreen('');
      setStatus('Feedback salvo neste aparelho. Exporte o arquivo quando quiser compartilhar com o TITAN LAB.');
    } catch {
      setStatus('Não foi possível salvar o feedback.');
    }
  }

  return <section className="settings-card beta-feedback-card" aria-label="Feedback do beta">
    <div><span className="info-label">Beta privado</span><strong>Enviar feedback</strong><small>Registre bugs, dúvidas e ideias enquanto usa o app. O conteúdo fica local até você exportar.</small></div>
    <div className="beta-feedback-types" role="group" aria-label="Tipo de feedback">
      {([['bug','Bug'],['confusing','Algo confuso'],['idea','Ideia'],['positive','Funcionou bem']] as Array<[BetaFeedbackKind,string]>).map(([value,label]) => <button key={value} type="button" className={kind === value ? 'active' : ''} onClick={() => setKind(value)}>{label}</button>)}
    </div>
    <label>Tela ou área <small>Opcional</small><input value={screen} onChange={(event) => setScreen(event.target.value)} placeholder="Ex.: Treino, Cardio, Configurações" /></label>
    <label>O que aconteceu?<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Conte o que você esperava, o que aconteceu e, se souber, como reproduzir." /></label>
    <button type="button" className="profile-save" onClick={() => void submit()}>Salvar feedback</button>
    {entries.length > 0 && <div className="beta-feedback-footer"><small>{entries.length} feedback{entries.length === 1 ? '' : 's'} salvo{entries.length === 1 ? '' : 's'} neste aparelho.</small><button type="button" className="secondary-action" onClick={() => downloadBetaFeedback(entries)}>Exportar feedbacks</button></div>}
    {status && <p className="beta-status" role="status">{status}</p>}
  </section>;
}
