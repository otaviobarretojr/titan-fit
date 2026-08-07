import { useEffect, useMemo, useState } from 'react';
import { BodyEvolutionPage } from '../evolution/BodyEvolutionPage';
import { calculateRecovery, calculateStrengthPr, formatLastStrengthSession, getExerciseSessions, getProgressionAdvice } from './intelligence';
import { loadWorkoutHistory, removeWorkoutHistoryRecord } from './storage';
import type { HistoryExercise, WorkoutHistoryRecord } from './types';

export function ProgressPage({ refreshKey }: { refreshKey: number }) {
  const [view, setView] = useState<'body' | 'training'>('body');
  return <>
    <section className="section-header evolution-center-header"><span className="eyebrow">CENTRO DE EVOLUÇÃO · v0.26</span><h2>Evolução</h2><p>Acompanhe o físico e o desempenho de treino no mesmo lugar.</p></section>
    <div className="evolution-switch" role="tablist" aria-label="Centro de evolução">
      <button type="button" role="tab" aria-selected={view === 'body'} className={view === 'body' ? 'active' : ''} onClick={() => setView('body')}>Corpo</button>
      <button type="button" role="tab" aria-selected={view === 'training'} className={view === 'training' ? 'active' : ''} onClick={() => setView('training')}>Treino</button>
    </div>
    {view === 'body' ? <BodyEvolutionPage /> : <WorkoutProgress refreshKey={refreshKey} />}
  </>;
}

function WorkoutProgress({ refreshKey }: { refreshKey: number }) {
  const [records, setRecords] = useState<WorkoutHistoryRecord[]>(() => loadWorkoutHistory());
  useEffect(() => { setRecords(loadWorkoutHistory()); }, [refreshKey]);
  const totalSets = useMemo(() => records.reduce((total, record) => total + (record.totalSets ?? 0), 0), [records]);
  const exerciseProgress = useMemo(() => {
    const map = new Map<string, { exercise: HistoryExercise; sessions: number; latestAt: string }>();
    [...records].reverse().forEach((record) => record.exercises.forEach((exercise) => {
      const previous = map.get(exercise.exerciseId);
      const merged: HistoryExercise = { ...exercise, exerciseType: exercise.exerciseType ?? 'strength', bestWeightKg: Math.max(previous?.exercise.bestWeightKg ?? 0, exercise.bestWeightKg ?? 0) || null, totalDistanceMeters: Math.max(previous?.exercise.totalDistanceMeters ?? 0, exercise.totalDistanceMeters ?? 0), totalDurationSeconds: Math.max(previous?.exercise.totalDurationSeconds ?? 0, exercise.totalDurationSeconds ?? 0), bestSpeedKmh: Math.max(previous?.exercise.bestSpeedKmh ?? 0, exercise.bestSpeedKmh ?? 0) || null, bestInclinePercent: Math.max(previous?.exercise.bestInclinePercent ?? 0, exercise.bestInclinePercent ?? 0) || null, averageHeartRate: exercise.averageHeartRate ?? previous?.exercise.averageHeartRate ?? null };
      map.set(exercise.exerciseId, { exercise: merged, sessions: (previous?.sessions ?? 0) + 1, latestAt: record.completedAt });
    }));
    return [...map.values()].sort((a, b) => b.latestAt.localeCompare(a.latestAt));
  }, [records]);
  const recovery = useMemo(() => calculateRecovery(records).slice(0, 6), [records]);
  function removeRecord(recordId: string) { if (!window.confirm('Remover este treino do histórico?')) return; removeWorkoutHistoryRecord(recordId); setRecords(loadWorkoutHistory()); }
  if (!records.length) return <section className="hero-card compact"><span className="eyebrow">TREINO</span><h2>Nenhum treino concluído</h2><p>Finalize um treino para criar o primeiro registro permanente.</p></section>;

  return <div className="training-evolution-view">
    <section className="section-header"><span className="eyebrow">COACH TITAN · v0.26</span><h2>Inteligência do treino</h2><p>O Coach analisa até três sessões recentes para orientar carga, repetições e recuperação.</p></section>
    <section className="progress-summary"><div><span className="info-label">TREINOS</span><strong>{records.length}</strong></div><div><span className="info-label">REGISTROS</span><strong>{totalSets}</strong></div></section>
    {recovery.length > 0 && <section className="progress-section"><h3>Recuperação estimada</h3><p className="exercise-cue">Estimativa baseada apenas no tempo desde o último estímulo registrado. Não substitui sono, dor, desempenho ou percepção de recuperação.</p><div className="progression-list">{recovery.map((item) => <article className="progression-card" key={item.muscleGroup}><div><span className="info-label">{item.label}</span><h3>{item.muscleGroup}</h3></div><div><span className="info-label">RECUPERAÇÃO</span><strong>{item.percent}%</strong></div><small>Último estímulo: {formatDate(item.lastTrainedAt)}</small></article>)}</div></section>}
    <section className="progress-section"><h3>Progressão por exercício</h3><div className="progression-list">{exerciseProgress.map(({ exercise, sessions }) => <ExerciseIntelligenceCard key={exercise.exerciseId} exercise={exercise} sessions={sessions} records={records} />)}</div></section>
    <section className="progress-section"><h3>Treinos concluídos</h3><div className="history-list">{records.map((record) => <article className="history-card" key={record.id}><header><div><span className="info-label">{formatDate(record.completedAt)} • {record.workoutDay}</span><h3>{record.workoutTitle}</h3><p>{record.planName}</p></div><strong>{formatDuration(record.durationSeconds)}</strong></header><div className="history-metrics"><span>{record.totalSets} registros</span></div><button type="button" className="text-action danger-text" onClick={() => removeRecord(record.id)}>Remover registro</button></article>)}</div></section>
  </div>;
}

function ExerciseIntelligenceCard({ exercise, sessions, records }: { exercise: HistoryExercise; sessions: number; records: WorkoutHistoryRecord[] }) {
  const type = exercise.exerciseType ?? 'strength';
  if (type !== 'strength') return <article className="progression-card"><div><span className="info-label">{sessions} sessão{sessions === 1 ? '' : 'ões'} · {type}</span><h3>{exercise.name}</h3></div><div><span className="info-label">MELHOR RESULTADO</span><strong>{formatBest(exercise)}</strong></div>{type === 'cardio' && <small>{formatCardioDetail(exercise)}</small>}</article>;
  const pr = calculateStrengthPr(records, exercise.exerciseId);
  const advice = getProgressionAdvice(records, exercise.exerciseId);
  const latest = getExerciseSessions(records, exercise.exerciseId)[0]?.exercise;
  return <article className="progression-card coach-progress-card">
    <div><span className="info-label">{sessions} sessão{sessions === 1 ? '' : 'ões'} · MUSCULAÇÃO</span><h3>{exercise.name}</h3></div>
    <div><span className="info-label">ÚLTIMA SESSÃO</span><strong>{latest ? formatLastStrengthSession(latest) : '—'}</strong></div>
    <div className="history-metrics"><span>🏆 Carga: {pr.bestWeightKg ? `${pr.bestWeightKg} kg` : '—'}</span>{pr.bestSet && <span>🏆 Melhor série: {pr.bestSet.weightKg} × {pr.bestSet.repetitions}</span>}</div>
    <div className="smart-progress-meta"><span className={`trend-chip ${advice.trend}`}>{trendLabel(advice.trend)}</span><span className={`confidence-chip ${advice.confidence}`}>Confiança {confidenceLabel(advice.confidence)}</span></div>
    {(advice.suggestedWeightKg || advice.suggestedReps) && <div className="next-target-card"><span className="info-label">PRÓXIMO ALVO</span><strong>{formatTarget(advice.suggestedWeightKg, advice.suggestedReps)}</strong></div>}
    <div className={`coach-advice ${advice.status}`}><span className="info-label">COACH TITAN</span><strong>{advice.title}</strong><p>{advice.message}</p></div>
  </article>;
}

function formatBest(exercise: HistoryExercise) { const type = exercise.exerciseType ?? 'strength'; if (type === 'strength') return exercise.bestWeightKg ? `${exercise.bestWeightKg} kg` : '—'; if (type === 'distance') return `${Math.round(exercise.totalDistanceMeters ?? 0)} m${exercise.bestWeightKg ? ` · ${exercise.bestWeightKg} kg` : ''}`; if (type === 'cardio') return `${Math.round((exercise.totalDurationSeconds ?? 0) / 60)} min${exercise.bestInclinePercent !== null && exercise.bestInclinePercent !== undefined ? ` · ${exercise.bestInclinePercent}%` : ''}`; return `${Math.round((exercise.totalDurationSeconds ?? 0) / 60)} min`; }
function formatCardioDetail(exercise: HistoryExercise) { const details = []; if (exercise.bestSpeedKmh) details.push(`${exercise.bestSpeedKmh} km/h`); if (exercise.averageHeartRate) details.push(`${exercise.averageHeartRate} bpm`); return details.join(' · ') || 'Tempo e intensidade registrados'; }
function formatDate(value: string) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
function formatDuration(seconds: number) { return `${Math.max(1, Math.round(seconds / 60))} min`; }
function trendLabel(trend: 'first' | 'stable' | 'improving' | 'declining') { if (trend === 'improving') return '↗ Evoluindo'; if (trend === 'declining') return '↘ Atenção'; if (trend === 'stable') return '→ Estável'; return '● Referência'; }
function confidenceLabel(confidence: 'low' | 'medium' | 'high') { if (confidence === 'high') return 'alta'; if (confidence === 'medium') return 'média'; return 'baixa'; }
function formatTarget(weight: number | null, reps: number | null) { const parts = []; if (weight) parts.push(`${Number.isInteger(weight) ? weight : weight.toFixed(1)} kg`); if (reps) parts.push(`${reps} reps/série`); return parts.join(' · ') || 'Consolidar sessão'; }
