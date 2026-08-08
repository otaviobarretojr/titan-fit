import { useMemo, useState } from 'react';
import { TESTER_CHECKLIST, clearTesterKit, downloadTesterReport, loadTesterKit, saveTesterKit, type TesterChecklistItemId, type TesterKitState } from './testerKit';

export function TesterKitPanel({ appVersion }: { appVersion: string }) {
  const [state, setState] = useState<TesterKitState | null>(() => loadTesterKit());
  const [name, setName] = useState(state?.testerName ?? '');
  const [notes, setNotes] = useState(state?.notes ?? '');
  const progress = useMemo(() => state ? Math.round((state.completedItems.length / TESTER_CHECKLIST.length) * 100) : 0, [state]);

  function start() {
    const testerName = name.trim();
    if (!testerName) return;
    const next: TesterKitState = { testerName, startedAt: new Date().toISOString(), completedItems: [] };
    saveTesterKit(next);
    setState(next);
  }

  function toggle(id: TesterChecklistItemId) {
    if (!state) return;
    const completedItems = state.completedItems.includes(id) ? state.completedItems.filter((item) => item !== id) : [...state.completedItems, id];
    const finished = completedItems.length === TESTER_CHECKLIST.length;
    const next: TesterKitState = { ...state, completedItems, completedAt: finished ? (state.completedAt ?? new Date().toISOString()) : undefined };
    saveTesterKit(next);
    setState(next);
  }

  function saveNotes() {
    if (!state) return;
    const next = { ...state, notes: notes.trim() || undefined };
    saveTesterKit(next);
    setState(next);
  }

  function reset() {
    if (!window.confirm('Reiniciar o checklist deste testador?')) return;
    clearTesterKit();
    setState(null);
    setName('');
    setNotes('');
  }

  return <section className="settings-card tester-kit-card" aria-label="Kit do Testador Beta">
    <div><span className="info-label">BETA PRIVADO</span><strong>Kit do Testador</strong><small>Siga o roteiro para testar as funções principais sem precisar adivinhar por onde começar.</small></div>
    {!state ? <div className="tester-start"><label>Nome do testador<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Karine" /></label><button type="button" className="secondary-action" disabled={!name.trim()} onClick={start}>Iniciar teste guiado</button></div> : <>
      <div className="tester-progress"><div><strong>{state.testerName}</strong><small>{state.completedItems.length} de {TESTER_CHECKLIST.length} etapas concluídas</small></div><span>{progress}%</span></div>
      <div className="tester-progress-bar" aria-label={`Progresso do teste: ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
      <div className="tester-checklist">{TESTER_CHECKLIST.map((item) => <label key={item.id} className={state.completedItems.includes(item.id) ? 'done' : ''}><input type="checkbox" checked={state.completedItems.includes(item.id)} onChange={() => toggle(item.id)} /><span><strong>{item.title}</strong><small>{item.description}</small></span></label>)}</div>
      <label className="tester-notes">Observações gerais<textarea value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={saveNotes} placeholder="O que funcionou bem? O que ficou confuso?" /></label>
      {state.completedAt && <p className="tester-complete">Checklist concluído. O relatório já pode ser exportado.</p>}
      <button type="button" className="secondary-action" onClick={() => downloadTesterReport({ ...state, notes: notes.trim() || undefined }, appVersion)}>Exportar relatório do teste</button>
      <button type="button" className="text-action" onClick={reset}>Reiniciar checklist</button>
    </>}
  </section>;
}
