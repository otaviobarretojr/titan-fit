import { useEffect, useMemo, useState } from 'react';
import { addWorkoutHistoryRecord, loadWorkoutHistory } from '../history/storage';
import type { HistoryExercise, WorkoutHistoryRecord } from '../history/types';
import type { TitanWorkoutDay } from '../plan/types';
import { loadWorkoutExecution, removeWorkoutExecution, saveWorkoutExecution } from './storage';
import type { ExecutedSet, WorkoutExecution } from './types';

type Props = { planId: string; planName: string; workout: TitanWorkoutDay; onBack: () => void; onCompleted: () => void; };
type WorkoutSummary = { durationSeconds: number; totalVolumeKg: number; totalSets: number; cardioMinutes: number; prs: string[]; };

export function WorkoutExecutionView({ planId, planName, workout, onBack, onCompleted }: Props) {
  const previousHistory = useMemo(() => loadWorkoutHistory(), []);
  const previousExercises = useMemo(() => getPreviousExercises(previousHistory, workout.id), [previousHistory, workout.id]);
  const [execution, setExecution] = useState<WorkoutExecution>(() => loadWorkoutExecution(planId, workout.id) ?? createExecution(planId, workout));
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(() => findFirstPendingExercise(workout, loadWorkoutExecution(planId, workout.id)));
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [prMessage, setPrMessage] = useState<string | null>(null);

  useEffect(() => { saveWorkoutExecution(execution); }, [execution]);
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = window.setInterval(() => setTimerSeconds((current) => {
      if (current <= 1) { setTimerRunning(false); if (navigator.vibrate) navigator.vibrate([180, 100, 180]); return 0; }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const totals = useMemo(() => {
    const sets = Object.values(execution.exercises).flatMap((exercise) => exercise.sets);
    const completedSets = sets.filter((set) => set.completed);
    const volume = completedSets.reduce((total, set) => total + (set.weightKg ?? 0) * (set.repetitions ?? 0), 0);
    return { completed: completedSets.length, total: sets.length, volume };
  }, [execution]);
  const activeExercise = workout.exercises[activeExerciseIndex];
  const activeSets = execution.exercises[activeExercise.id].sets;
  const exerciseCompleted = activeSets.every((set) => set.completed);
  const progress = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;
  const isCardio = activeExercise.muscleGroup.toLowerCase() === 'cardio';
  const previousExercise = previousExercises.get(activeExercise.id) ?? null;
  const nextExerciseName = workout.exercises[activeExerciseIndex + 1]?.name ?? null;

  function updateSet(exerciseId: string, setNumber: number, patch: Partial<ExecutedSet>) {
    setExecution((current) => ({ ...current, updatedAt: new Date().toISOString(), exercises: { ...current.exercises, [exerciseId]: { ...current.exercises[exerciseId], sets: current.exercises[exerciseId].sets.map((set) => set.setNumber === setNumber ? { ...set, ...patch } : set) } } }));
  }
  function startRest(seconds: number) { if (seconds <= 0) return; setTimerSeconds(seconds); setTimerRunning(true); }
  function completeSet(set: ExecutedSet) {
    const completed = !set.completed;
    updateSet(activeExercise.id, set.setNumber, { completed });
    if (completed) {
      startRest(activeExercise.restSeconds);
      const previousBest = previousExercise?.bestWeightKg ?? 0;
      if ((set.weightKg ?? 0) > previousBest && (set.repetitions ?? 0) > 0) {
        setPrMessage(`Novo PR: ${activeExercise.name} — ${set.weightKg} kg × ${set.repetitions}`);
      }
    } else setPrMessage(null);
  }
  function nextExercise() { setPrMessage(null); setActiveExerciseIndex((value) => Math.min(workout.exercises.length - 1, value + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function previousExerciseNav() { setPrMessage(null); setActiveExerciseIndex((value) => Math.max(0, value - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  function finishWorkout() {
    if (totals.completed !== totals.total) return;
    const completedAt = new Date().toISOString();
    const record = createHistoryRecord(planId, planName, workout, execution, completedAt);
    const prs = record.exercises.filter((exercise) => (exercise.bestWeightKg ?? 0) > (previousExercises.get(exercise.exerciseId)?.bestWeightKg ?? 0) && exercise.bestWeightKg !== null).map((exercise) => `${exercise.name}: ${exercise.bestWeightKg} kg`);
    addWorkoutHistoryRecord(record);
    removeWorkoutExecution(planId, workout.id);
    setTimerRunning(false);
    setTimerSeconds(0);
    const cardioMinutes = workout.exercises.filter((exercise) => exercise.muscleGroup.toLowerCase() === 'cardio').reduce((total, exercise) => total + Math.round((exercise.durationSeconds ?? 0) / 60), 0);
    setSummary({ durationSeconds: record.durationSeconds, totalVolumeKg: record.totalVolumeKg, totalSets: record.totalSets, cardioMinutes, prs });
  }
  function resetSession() {
    if (!window.confirm('Apagar todos os registros desta sessão?')) return;
    removeWorkoutExecution(planId, workout.id); setExecution(createExecution(planId, workout)); setActiveExerciseIndex(0); setTimerRunning(false); setTimerSeconds(0); setPrMessage(null);
  }

  if (summary) return <section className="workout-summary"><span className="eyebrow">TREINO CONCLUÍDO</span><h2>{workout.title}</h2><p>Excelente. Sua sessão foi salva no histórico.</p><div className="summary-grid"><div><span>Tempo</span><strong>{formatDuration(summary.durationSeconds)}</strong></div><div><span>Volume</span><strong>{Math.round(summary.totalVolumeKg).toLocaleString('pt-BR')} kg</strong></div><div><span>Séries</span><strong>{summary.totalSets}</strong></div><div><span>Cardio</span><strong>{summary.cardioMinutes ? `${summary.cardioMinutes} min` : '—'}</strong></div></div>{summary.prs.length > 0 && <div className="pr-summary"><span className="eyebrow">NOVOS RECORDES</span>{summary.prs.map((pr) => <strong key={pr}>🏆 {pr}</strong>)}</div>}<button type="button" className="primary-action" onClick={onCompleted}>Ver progresso</button></section>;

  return <div className="workout-mode">
    <button type="button" className="secondary-action back-action" onClick={onBack}>← Sair do modo treino</button>
    <section className="workout-progress-card"><div><span className="eyebrow">MODO TREINO · EXERCÍCIO {activeExerciseIndex + 1} DE {workout.exercises.length}</span><h2>{workout.title}</h2><p>{totals.completed} / {totals.total} séries · Volume {Math.round(totals.volume).toLocaleString('pt-BR')} kg</p></div><strong>{progress}%</strong><div className="workout-progress-track"><span style={{ width: `${progress}%` }} /></div></section>

    {timerSeconds > 0 && <section className="rest-timer active" aria-label="Cronômetro de descanso"><div><span className="info-label">DESCANSO AUTOMÁTICO</span><strong>{formatTimer(timerSeconds)}</strong></div><div className="timer-actions"><button type="button" className="secondary-action" onClick={() => setTimerRunning((value) => !value)}>{timerRunning ? 'Pausar' : 'Continuar'}</button><button type="button" className="secondary-action" onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}>Pular</button></div></section>}
    {prMessage && <aside className="pr-banner" role="status">🏆 <strong>{prMessage}</strong></aside>}

    <article className={`active-exercise-card ${isCardio ? 'cardio-exercise' : ''}`}>
      <header><span className="exercise-order">{activeExerciseIndex + 1}</span><div><span className="info-label">{activeExercise.muscleGroup}</span><h3>{activeExercise.name}</h3></div></header>
      <div className="exercise-prescription"><span><strong>{activeExercise.sets}</strong> {activeExercise.sets === 1 ? 'série' : 'séries'}</span>{isCardio ? <span><strong>{Math.round((activeExercise.durationSeconds ?? 0) / 60)}</strong> min</span> : <><span><strong>{activeExercise.minReps ?? '—'}–{activeExercise.maxReps ?? '—'}</strong> reps</span><span><strong>RIR {activeExercise.targetRir ?? '—'}</strong></span></>}</div>
      {!isCardio && <div className="progression-panel"><div><span>Última sessão</span><strong>{formatPrevious(previousExercise)}</strong></div><div><span>Meta de hoje</span><strong>{formatTarget(previousExercise, activeExercise.minReps, activeExercise.maxReps)}</strong></div></div>}
      {activeExercise.technique && <p className="exercise-cue">{activeExercise.technique}</p>}

      <div className="set-entry-list">{activeSets.map((set) => <div className={`set-entry ${set.completed ? 'completed' : ''}`} key={set.setNumber}><div className="set-entry-title"><strong>{isCardio ? 'Cardio' : `Série ${set.setNumber} de ${activeSets.length}`}</strong><span>{set.completed ? 'Concluída' : 'Pendente'}</span></div>{!isCardio && <div className="set-entry-fields"><label>Carga (kg)<input aria-label={`${activeExercise.name} série ${set.setNumber} carga`} type="number" inputMode="decimal" min="0" step="0.5" value={set.weightKg ?? ''} onChange={(event) => updateSet(activeExercise.id, set.setNumber, { weightKg: event.target.value === '' ? null : Number(event.target.value) })} /></label><label>Repetições<input aria-label={`${activeExercise.name} série ${set.setNumber} repetições`} type="number" inputMode="numeric" min="0" value={set.repetitions ?? ''} onChange={(event) => updateSet(activeExercise.id, set.setNumber, { repetitions: event.target.value === '' ? null : Number(event.target.value) })} /></label><label>RIR<input aria-label={`${activeExercise.name} série ${set.setNumber} RIR`} type="number" inputMode="numeric" min="0" max="10" value={set.rir ?? ''} onChange={(event) => updateSet(activeExercise.id, set.setNumber, { rir: event.target.value === '' ? null : Number(event.target.value) })} /></label></div>}<button type="button" className="complete-set-action" aria-pressed={set.completed} onClick={() => completeSet(set)}>{set.completed ? '✓ Série concluída' : isCardio ? 'Concluir cardio' : 'Registrar série'}</button></div>)}</div>

      {!isCardio && activeExercise.restSeconds > 0 && <button type="button" className="text-action rest-shortcut" onClick={() => startRest(activeExercise.restSeconds)}>Iniciar descanso de {formatRest(activeExercise.restSeconds)}</button>}
    </article>

    {nextExerciseName && <aside className="next-exercise-preview"><span>Próximo exercício</span><strong>{nextExerciseName}</strong></aside>}
    <div className="exercise-navigation"><button type="button" className="secondary-action" disabled={activeExerciseIndex === 0} onClick={previousExerciseNav}>Anterior</button>{activeExerciseIndex < workout.exercises.length - 1 ? <button type="button" className="primary-action" disabled={!exerciseCompleted} onClick={nextExercise}>Próximo exercício</button> : <button type="button" className="primary-action" disabled={totals.completed !== totals.total} onClick={finishWorkout}>Concluir e salvar treino</button>}</div>
    <button type="button" className="danger-action reset-session" onClick={resetSession}>Resetar sessão</button>
  </div>;
}

function getPreviousExercises(history: WorkoutHistoryRecord[], workoutId: string) { const record = history.find((item) => item.workoutId === workoutId); return new Map((record?.exercises ?? []).map((exercise) => [exercise.exerciseId, exercise])); }
function formatPrevious(previous: HistoryExercise | null) { if (!previous) return 'Sem histórico'; const bestSet = [...previous.sets].filter((set) => set.weightKg !== null && set.repetitions !== null).sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0))[0]; return bestSet ? `${bestSet.weightKg} kg × ${bestSet.repetitions}` : 'Sem carga registrada'; }
function formatTarget(previous: HistoryExercise | null, minReps?: number, maxReps?: number) { if (!previous?.bestWeightKg) return `${minReps ?? '—'}–${maxReps ?? '—'} reps com técnica`; return `${previous.bestWeightKg} kg · buscar ${maxReps ?? minReps ?? 'mais'} reps`; }
function findFirstPendingExercise(workout: TitanWorkoutDay, execution: WorkoutExecution | null) { if (!execution) return 0; const index = workout.exercises.findIndex((exercise) => execution.exercises[exercise.id]?.sets.some((set) => !set.completed)); return index < 0 ? workout.exercises.length - 1 : index; }
function createExecution(planId: string, workout: TitanWorkoutDay): WorkoutExecution { const now = new Date().toISOString(); return { planId, workoutId: workout.id, startedAt: now, updatedAt: now, exercises: Object.fromEntries(workout.exercises.map((exercise) => [exercise.id, { exerciseId: exercise.id, sets: Array.from({ length: exercise.sets }, (_, index) => ({ setNumber: index + 1, weightKg: null, repetitions: null, rir: exercise.targetRir ?? null, completed: false })) }])) }; }
function createHistoryRecord(planId: string, planName: string, workout: TitanWorkoutDay, execution: WorkoutExecution, completedAt: string): WorkoutHistoryRecord { const exercises = workout.exercises.map((exercise) => { const sets = execution.exercises[exercise.id].sets.map(({ setNumber, weightKg, repetitions, rir }) => ({ setNumber, weightKg, repetitions, rir })); const volumeKg = sets.reduce((total, set) => total + (set.weightKg ?? 0) * (set.repetitions ?? 0), 0); const weights = sets.map((set) => set.weightKg).filter((value): value is number => value !== null); return { exerciseId: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup, sets, volumeKg, bestWeightKg: weights.length ? Math.max(...weights) : null }; }); return { id: `${planId}:${workout.id}:${completedAt}`, planId, planName, workoutId: workout.id, workoutTitle: workout.title, workoutDay: workout.day, startedAt: execution.startedAt, completedAt, durationSeconds: Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)), totalSets: exercises.reduce((total, exercise) => total + exercise.sets.length, 0), totalVolumeKg: exercises.reduce((total, exercise) => total + exercise.volumeKg, 0), exercises }; }
function formatTimer(seconds: number) { const minutes = Math.floor(seconds / 60); return `${minutes}:${String(seconds % 60).padStart(2, '0')}`; }
function formatRest(seconds: number) { return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
function formatDuration(seconds: number) { const minutes = Math.max(1, Math.round(seconds / 60)); return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}min` : `${minutes} min`; }
