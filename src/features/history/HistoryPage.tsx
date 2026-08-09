import { useState } from 'react';
import { loadWorkoutHistory } from './storage';
import type { WorkoutHistoryRecord } from './types';

type HistoryPageProps = { refreshKey?: number };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value)).replace('.', '').toUpperCase();
}
function formatDuration(seconds: number) { const minutes = Math.round(seconds / 60); return `${minutes} min`; }
function completedRecords(record: WorkoutHistoryRecord) { return record.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0); }

export function HistoryPage({ refreshKey = 0 }: HistoryPageProps) {
  void refreshKey;
  const records = loadWorkoutHistory();
  const [selected, setSelected] = useState<WorkoutHistoryRecord | null>(null);

  if (selected) return <section className="history-detail-screen">
    <header className="history-detail-header"><div><span className="eyebrow">{formatDate(selected.completedAt)} · {selected.workoutDay}</span><h2>{selected.workoutTitle}</h2><p>{formatDuration(selected.durationSeconds)} · {completedRecords(selected)} registros</p></div><button type="button" className="history-close" onClick={() => setSelected(null)} aria-label="Fechar histórico">×</button></header>
    <div className="history-exercise-list">{selected.exercises.map((exercise) => <article className="history-exercise-card" key={exercise.exerciseId}><div className="history-exercise-heading"><div><span>{exercise.muscleGroup}</span><strong>{exercise.name}</strong></div><span className="history-type">{exercise.exerciseType === 'cardio' ? 'Cardio' : exercise.exerciseType === 'isometric' ? 'Isometria' : 'Musculação'}</span></div><div className="history-set-list">{exercise.sets.map((item) => <div className="history-set-row" key={item.setNumber}><span>{exercise.exerciseType === 'cardio' ? 'Sessão' : `Série ${item.setNumber}`}</span>{item.weightKg !== null && <strong>{item.weightKg} kg</strong>}{item.repetitions !== null && <strong>{item.repetitions} reps</strong>}{item.rir !== null && <strong>RIR {item.rir}</strong>}{item.durationSeconds !== null && <strong>{Math.round(item.durationSeconds / 60)} min</strong>}{item.distanceMeters !== null && <strong>{(item.distanceMeters / 1000).toFixed(1)} km</strong>}{item.speedKmh !== null && <strong>{item.speedKmh} km/h</strong>}{item.inclinePercent !== null && item.inclinePercent > 0 && <strong>{item.inclinePercent}% incl.</strong>}{item.averageHeartRate !== null && <strong>{item.averageHeartRate} bpm</strong>}</div>)}</div></article>)}</div>
    <button type="button" className="secondary-action history-back" onClick={() => setSelected(null)}>Voltar ao histórico</button>
  </section>;

  return <section className="history-page"><header className="section-header"><span className="eyebrow">TREINOS REALIZADOS</span><h2>Histórico</h2><p>Veja exatamente o que foi executado em cada sessão.</p></header>{records.length === 0 ? <div className="history-empty"><strong>Nenhum treino registrado</strong><p>Quando você concluir um treino, ele aparecerá aqui automaticamente.</p></div> : <div className="history-list">{records.map((record) => <button type="button" className="history-session-card" key={record.id} onClick={() => setSelected(record)}><div className="history-date"><strong>{formatDate(record.completedAt).split(' ')[0]}</strong><span>{formatDate(record.completedAt).split(' ')[1]}</span></div><div className="history-session-main"><span>{record.workoutDay}</span><strong>{record.workoutTitle}</strong><small>{formatDuration(record.durationSeconds)} · {completedRecords(record)} registros</small></div><span className="history-chevron">›</span></button>)}</div>}</section>;
}
