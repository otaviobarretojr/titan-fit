import { useMemo, useState } from 'react';
import { loadCardioPlan, loadCardioRecords, removeCardioPlan, removeCardioRecord, saveCardioPlan, saveCardioRecord } from './storage';
import type { CardioPlan, CardioPlanSession, CardioRecord, CardioType } from './types';

const labels: Record<CardioType, string> = {
  walk: 'Caminhada', zone2: 'Zona 2', run: 'Corrida', hiit: 'HIIT', bike: 'Bicicleta', stairs: 'Escada', other: 'Outro'
};

export function CardioPage() {
  const [plan, setPlan] = useState<CardioPlan | null>(() => loadCardioPlan());
  const [records, setRecords] = useState<CardioRecord[]>(() => loadCardioRecords());
  const [selectedSession, setSelectedSession] = useState<CardioPlanSession | null>(null);
  const completedIds = useMemo(() => new Set(records.map((record) => record.planSessionId).filter(Boolean)), [records]);

  function importPlan(file: File) {
    if (file.size > 1024 * 1024) { window.alert('O arquivo deve ter no máximo 1 MB.'); return; }
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as CardioPlan;
        if (!isValidPlan(parsed)) throw new Error();
        saveCardioPlan(parsed);
        setPlan(parsed);
      } catch {
        window.alert('Arquivo de cardio inválido.');
      }
    });
  }

  function completeSession(session: CardioPlanSession, data: Omit<CardioRecord, 'id' | 'planId' | 'planSessionId' | 'startedAt' | 'completedAt' | 'type'>) {
    const now = new Date().toISOString();
    saveCardioRecord({ id: crypto.randomUUID(), planId: plan?.id, planSessionId: session.id, type: session.type, startedAt: now, completedAt: now, ...data });
    setRecords(loadCardioRecords());
    setSelectedSession(null);
  }

  if (selectedSession) return <CardioSessionForm session={selectedSession} onCancel={() => setSelectedSession(null)} onSave={completeSession} />;

  return <>
    <section className="section-header"><span className="eyebrow">CARDIO • PRIMEIROS 5 KM</span><h2>{plan ? plan.name : 'Nenhum plano de cardio'}</h2><p>{plan?.description ?? 'Importe sua planilha progressiva para desenvolver condicionamento e chegar aos primeiros 5 km.'}</p></section>

    {!plan ? <section className="import-card"><span className="info-label">PLANILHA DE CARDIO</span><h3>Importar plano 5 km</h3><p>O arquivo define semanas, sessões, duração, tipo e objetivo de cada treino.</p><label className="primary-action file-action">Selecionar arquivo<input className="file-input" type="file" accept=".json,.titan-cardio" onChange={(event) => { const file = event.target.files?.[0]; if (file) importPlan(file); }} /></label></section> : <>
      <section className="cardio-progress"><div><span className="info-label">SESSÕES</span><strong>{completedIds.size}/{plan.weeks.reduce((sum, week) => sum + week.sessions.length, 0)}</strong></div><div><span className="info-label">DISTÂNCIA</span><strong>{records.reduce((sum, record) => sum + (record.distanceKm ?? 0), 0).toFixed(1)} km</strong></div></section>
      <section className="cardio-plan-list">{plan.weeks.map((week) => <article className="cardio-week" key={week.week}><header><span className="info-label">SEMANA {week.week}</span><h3>{week.title}</h3></header>{week.sessions.map((session) => <button type="button" className={`cardio-session ${completedIds.has(session.id) ? 'completed' : ''}`} key={session.id} onClick={() => setSelectedSession(session)}><div><span className="info-label">{labels[session.type]} • {session.durationMinutes} min</span><strong>{session.title}</strong><p>{session.description}</p></div><span>{completedIds.has(session.id) ? '✓' : '›'}</span></button>)}</article>)}</section>
      <button type="button" className="danger-action" onClick={() => { if (!window.confirm('Remover o plano de cardio? O histórico será mantido.')) return; removeCardioPlan(); setPlan(null); }}>Remover plano</button>
    </>}

    {records.length > 0 && <section className="progress-section"><h3>Histórico de cardio</h3><div className="history-list">{records.map((record) => <article className="history-card" key={record.id}><header><div><span className="info-label">{labels[record.type]} • {new Date(record.completedAt).toLocaleDateString('pt-BR')}</span><h3>{record.durationMinutes} min{record.distanceKm ? ` • ${record.distanceKm.toFixed(2)} km` : ''}</h3><p>{record.effort ? `Esforço ${record.effort}/10` : 'Sessão concluída'}</p></div></header><button type="button" className="text-action danger-text" onClick={() => { if (!window.confirm('Remover este registro?')) return; removeCardioRecord(record.id); setRecords(loadCardioRecords()); }}>Remover registro</button></article>)}</div></section>}
  </>;
}

function CardioSessionForm({ session, onCancel, onSave }: { session: CardioPlanSession; onCancel: () => void; onSave: (session: CardioPlanSession, data: Omit<CardioRecord, 'id' | 'planId' | 'planSessionId' | 'startedAt' | 'completedAt' | 'type'>) => void; }) {
  const [durationMinutes, setDurationMinutes] = useState(session.durationMinutes);
  const [distanceKm, setDistanceKm] = useState('');
  const [averageHeartRate, setAverageHeartRate] = useState('');
  const [maxHeartRate, setMaxHeartRate] = useState('');
  const [effort, setEffort] = useState('');
  const [notes, setNotes] = useState('');
  return <><button type="button" className="secondary-action back-action" onClick={onCancel}>← Voltar</button><section className="section-header"><span className="eyebrow">{labels[session.type]}</span><h2>{session.title}</h2><p>{session.description}</p>{session.target && <p><strong>Meta:</strong> {session.target}</p>}</section><section className="cardio-form"><label>Duração (min)<input type="number" min="1" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} /></label><label>Distância (km)<input type="number" min="0" step="0.01" value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} /></label><label>FC média<input type="number" min="0" value={averageHeartRate} onChange={(event) => setAverageHeartRate(event.target.value)} /></label><label>FC máxima<input type="number" min="0" value={maxHeartRate} onChange={(event) => setMaxHeartRate(event.target.value)} /></label><label>Esforço (1–10)<input type="number" min="1" max="10" value={effort} onChange={(event) => setEffort(event.target.value)} /></label><label>Observações<textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label><button type="button" className="primary-action" onClick={() => onSave(session, { durationMinutes, distanceKm: distanceKm ? Number(distanceKm) : undefined, averageHeartRate: averageHeartRate ? Number(averageHeartRate) : undefined, maxHeartRate: maxHeartRate ? Number(maxHeartRate) : undefined, effort: effort ? Number(effort) : undefined, notes: notes || undefined })}>Concluir sessão</button></section></>;
}

function isValidPlan(value: CardioPlan) {
  return value?.schemaVersion === 1 && value.goal === 'first-5k' && typeof value.id === 'string' && typeof value.name === 'string' && Array.isArray(value.weeks) && value.weeks.length > 0 && value.weeks.every((week) => Number.isInteger(week.week) && Array.isArray(week.sessions) && week.sessions.length > 0 && week.sessions.every((session) => typeof session.id === 'string' && typeof session.title === 'string' && typeof session.description === 'string' && Number.isFinite(session.durationMinutes) && session.durationMinutes > 0 && session.type in labels));
}
