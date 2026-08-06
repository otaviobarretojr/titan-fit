import { useEffect, useMemo, useState } from 'react';
import { loadWorkoutHistory, removeWorkoutHistoryRecord } from './storage';
import type { WorkoutHistoryRecord } from './types';

type Props = { refreshKey: number };

export function ProgressPage({ refreshKey }: Props) {
  const [records, setRecords] = useState<WorkoutHistoryRecord[]>(() => loadWorkoutHistory());

  useEffect(() => {
    setRecords(loadWorkoutHistory());
  }, [refreshKey]);

  const summary = useMemo(() => {
    const totalVolumeKg = records.reduce((total, record) => total + record.totalVolumeKg, 0);
    const totalSets = records.reduce((total, record) => total + record.totalSets, 0);
    return { totalVolumeKg, totalSets };
  }, [records]);

  const exerciseProgress = useMemo(() => {
    const map = new Map<string, { name: string; sessions: number; bestWeightKg: number; latestAt: string }>();
    [...records].reverse().forEach((record) => {
      record.exercises.forEach((exercise) => {
        const previous = map.get(exercise.exerciseId);
        const best = exercise.bestWeightKg ?? 0;
        map.set(exercise.exerciseId, {
          name: exercise.name,
          sessions: (previous?.sessions ?? 0) + 1,
          bestWeightKg: Math.max(previous?.bestWeightKg ?? 0, best),
          latestAt: record.completedAt
        });
      });
    });
    return [...map.values()].sort((a, b) => b.latestAt.localeCompare(a.latestAt));
  }, [records]);

  function removeRecord(recordId: string) {
    if (!window.confirm('Remover este treino do histórico?')) return;
    removeWorkoutHistoryRecord(recordId);
    setRecords(loadWorkoutHistory());
  }

  if (!records.length) {
    return <section className="hero-card compact"><span className="eyebrow">EVOLUÇÃO</span><h2>Nenhum treino concluído</h2><p>Conclua todas as séries e finalize um treino para criar seu primeiro registro permanente.</p></section>;
  }

  return <>
    <section className="section-header"><span className="eyebrow">EVOLUÇÃO</span><h2>Seu histórico</h2><p>{records.length} treino{records.length === 1 ? '' : 's'} concluído{records.length === 1 ? '' : 's'}.</p></section>
    <section className="progress-summary" aria-label="Resumo do histórico"><div><span className="info-label">TREINOS</span><strong>{records.length}</strong></div><div><span className="info-label">SÉRIES</span><strong>{summary.totalSets}</strong></div><div><span className="info-label">VOLUME</span><strong>{formatVolume(summary.totalVolumeKg)}</strong></div></section>
    {exerciseProgress.length > 0 && <section className="progress-section"><h3>Progressão por exercício</h3><div className="progression-list">{exerciseProgress.map((exercise) => <article className="progression-card" key={exercise.name}><div><span className="info-label">{exercise.sessions} sessão{exercise.sessions === 1 ? '' : 'ões'}</span><h3>{exercise.name}</h3></div><div><span className="info-label">MELHOR CARGA</span><strong>{exercise.bestWeightKg ? `${exercise.bestWeightKg} kg` : '—'}</strong></div></article>)}</div></section>}
    <section className="progress-section"><h3>Treinos concluídos</h3><div className="history-list">{records.map((record) => <article className="history-card" key={record.id}><header><div><span className="info-label">{formatDate(record.completedAt)} • {record.workoutDay}</span><h3>{record.workoutTitle}</h3><p>{record.planName}</p></div><strong>{formatDuration(record.durationSeconds)}</strong></header><div className="history-metrics"><span>{record.totalSets} séries</span><span>{formatVolume(record.totalVolumeKg)} de volume</span></div><button type="button" className="text-action danger-text" onClick={() => removeRecord(record.id)}>Remover registro</button></article>)}</div></section>
  </>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
function formatDuration(seconds: number) { const minutes = Math.max(1, Math.round(seconds / 60)); return `${minutes} min`; }
function formatVolume(value: number) { return value >= 1000 ? `${(value / 1000).toFixed(1)} t` : `${Math.round(value)} kg`; }
