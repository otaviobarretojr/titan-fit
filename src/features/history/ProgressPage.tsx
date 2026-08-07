import { useEffect, useMemo, useState } from 'react';
import { loadWorkoutHistory, removeWorkoutHistoryRecord } from './storage';
import type { HistoryExercise, WorkoutHistoryRecord } from './types';

export function ProgressPage({ refreshKey }: { refreshKey: number }) {
  const [records, setRecords] = useState<WorkoutHistoryRecord[]>(() => loadWorkoutHistory());
  useEffect(() => { setRecords(loadWorkoutHistory()); }, [refreshKey]);

  const summary = useMemo(() => ({
    totalVolumeKg: records.reduce((total, record) => total + (record.totalVolumeKg ?? 0), 0),
    totalSets: records.reduce((total, record) => total + (record.totalSets ?? 0), 0)
  }), [records]);

  const exerciseProgress = useMemo(() => {
    const map = new Map<string, { exercise: HistoryExercise; sessions: number; latestAt: string }>();
    [...records].reverse().forEach((record) => record.exercises.forEach((exercise) => {
      const previous = map.get(exercise.exerciseId);
      const merged: HistoryExercise = {
        ...exercise,
        exerciseType: exercise.exerciseType ?? 'strength',
        bestWeightKg: Math.max(previous?.exercise.bestWeightKg ?? 0, exercise.bestWeightKg ?? 0) || null,
        totalDistanceMeters: Math.max(previous?.exercise.totalDistanceMeters ?? 0, exercise.totalDistanceMeters ?? 0),
        totalDurationSeconds: Math.max(previous?.exercise.totalDurationSeconds ?? 0, exercise.totalDurationSeconds ?? 0),
        bestSpeedKmh: Math.max(previous?.exercise.bestSpeedKmh ?? 0, exercise.bestSpeedKmh ?? 0) || null,
        bestInclinePercent: Math.max(previous?.exercise.bestInclinePercent ?? 0, exercise.bestInclinePercent ?? 0) || null,
        averageHeartRate: exercise.averageHeartRate ?? previous?.exercise.averageHeartRate ?? null
      };
      map.set(exercise.exerciseId, { exercise: merged, sessions: (previous?.sessions ?? 0) + 1, latestAt: record.completedAt });
    }));
    return [...map.values()].sort((a, b) => b.latestAt.localeCompare(a.latestAt));
  }, [records]);

  function removeRecord(recordId: string) { if (!window.confirm('Remover este treino do histórico?')) return; removeWorkoutHistoryRecord(recordId); setRecords(loadWorkoutHistory()); }
  if (!records.length) return <section className="hero-card compact"><span className="eyebrow">EVOLUÇÃO</span><h2>Nenhum treino concluído</h2><p>Finalize um treino para criar o primeiro registro permanente.</p></section>;

  return <><section className="section-header"><span className="eyebrow">EVOLUÇÃO</span><h2>Seu histórico</h2><p>{records.length} treino{records.length === 1 ? '' : 's'} concluído{records.length === 1 ? '' : 's'}.</p></section>
    <section className="progress-summary"><div><span className="info-label">TREINOS</span><strong>{records.length}</strong></div><div><span className="info-label">REGISTROS</span><strong>{summary.totalSets}</strong></div><div><span className="info-label">VOLUME</span><strong>{formatVolume(summary.totalVolumeKg)}</strong></div></section>
    <section className="progress-section"><h3>Progressão por exercício</h3><div className="progression-list">{exerciseProgress.map(({ exercise, sessions }) => <article className="progression-card" key={exercise.exerciseId}><div><span className="info-label">{sessions} sessão{sessions === 1 ? '' : 'ões'} · {exercise.exerciseType ?? 'strength'}</span><h3>{exercise.name}</h3></div><div><span className="info-label">MELHOR RESULTADO</span><strong>{formatBest(exercise)}</strong></div>{(exercise.exerciseType ?? 'strength') === 'cardio' && <small>{formatCardioDetail(exercise)}</small>}</article>)}</div></section>
    <section className="progress-section"><h3>Treinos concluídos</h3><div className="history-list">{records.map((record) => <article className="history-card" key={record.id}><header><div><span className="info-label">{formatDate(record.completedAt)} • {record.workoutDay}</span><h3>{record.workoutTitle}</h3><p>{record.planName}</p></div><strong>{formatDuration(record.durationSeconds)}</strong></header><div className="history-metrics"><span>{record.totalSets} registros</span><span>{formatVolume(record.totalVolumeKg)} de volume</span></div><button type="button" className="text-action danger-text" onClick={() => removeRecord(record.id)}>Remover registro</button></article>)}</div></section></>;
}

function formatBest(exercise: HistoryExercise) {
  const type = exercise.exerciseType ?? 'strength';
  if (type === 'strength') return exercise.bestWeightKg ? `${exercise.bestWeightKg} kg` : '—';
  if (type === 'distance') return `${Math.round(exercise.totalDistanceMeters ?? 0)} m${exercise.bestWeightKg ? ` · ${exercise.bestWeightKg} kg` : ''}`;
  if (type === 'cardio') return `${Math.round((exercise.totalDurationSeconds ?? 0) / 60)} min${exercise.bestInclinePercent !== null && exercise.bestInclinePercent !== undefined ? ` · ${exercise.bestInclinePercent}%` : ''}`;
  return `${Math.round((exercise.totalDurationSeconds ?? 0) / 60)} min`;
}
function formatCardioDetail(exercise: HistoryExercise) { const details = []; if (exercise.bestSpeedKmh) details.push(`${exercise.bestSpeedKmh} km/h`); if (exercise.averageHeartRate) details.push(`${exercise.averageHeartRate} bpm`); return details.join(' · ') || 'Tempo e intensidade registrados'; }
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
function formatDuration(seconds: number) { return `${Math.max(1, Math.round(seconds / 60))} min`; }
function formatVolume(value: number) { return value >= 1000 ? `${(value / 1000).toFixed(1)} t` : `${Math.round(value)} kg`; }
