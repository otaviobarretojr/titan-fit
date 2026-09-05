import { useEffect, useMemo, useState } from 'react';
import { loadWorkoutHistory, addWorkoutHistoryRecord } from '../history/storage';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanExercise, TitanWorkoutDay } from '../plan/types';
import { loadWorkoutExecution, removeWorkoutExecution, saveWorkoutExecution } from './storage';
import type { ExecutedSet, WorkoutExecution } from './types';

type Props = { planId: string; planName: string; workout: TitanWorkoutDay; onBack: () => void; onCompleted: () => void };
type Summary = { durationSeconds: number; totalSets: number };

export function SimpleWorkoutExecutionView({ planId, planName, workout, onBack, onCompleted }: Props) {
  const initial = useMemo(() => normalizeExecution(loadWorkoutExecution(planId, workout.id), planId, workout), [planId, workout]);
  const [execution, setExecution] = useState<WorkoutExecution>(initial);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(() => firstPending(workout, initial));
  const [restSeconds, setRestSeconds] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(() => initial.timerStartedAt ? secondsSince(initial.timerStartedAt) : 0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => saveWorkoutExecution(execution), [execution]);
  useEffect(() => {
    if (!execution.timerStartedAt) { setSessionSeconds(0); return; }
    setSessionSeconds(secondsSince(execution.timerStartedAt));
    const id = window.setInterval(() => setSessionSeconds(secondsSince(execution.timerStartedAt!)), 1000);
    return () => window.clearInterval(id);
  }, [execution.timerStartedAt]);
  useEffect(() => {
    if (!restRunning || restSeconds <= 0) return;
    const id = window.setInterval(() => setRestSeconds((value) => {
      if (value <= 1) { setRestRunning(false); navigator.vibrate?.([180, 100, 180]); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [restRunning, restSeconds]);

  const entries = Object.values(execution.exercises).flatMap((item) => item.sets);
  const completedSets = entries.filter((set) => set.completed).length;
  const totalSets = entries.length;
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
  const exercise = workout.exercises[activeExerciseIndex];
  const exerciseExecution = execution.exercises[exercise.id];
  const exerciseCompleted = exerciseExecution.sets.every((set) => set.completed);
  const previous = useMemo(() => findPreviousPerformance(exercise.id), [exercise.id]);
  const loadSuggestion = useMemo(() => suggestLoad(exercise, previous), [exercise, previous]);

  function updateSet(setNumber: number, field: 'weightKg' | 'repetitions', value: string) {
    const parsed = value === '' ? null : Number(value.replace(',', '.'));
    setExecution((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      exercises: {
        ...current.exercises,
        [exercise.id]: {
          ...current.exercises[exercise.id],
          sets: current.exercises[exercise.id].sets.map((set) => set.setNumber === setNumber ? { ...set, [field]: Number.isFinite(parsed) ? parsed : null } : set),
        },
      },
    }));
  }

  function completeSet(setNumber: number) {
    const target = exerciseExecution.sets.find((set) => set.setNumber === setNumber);
    if (!target) return;
    if ((exercise.exerciseType ?? 'strength') === 'strength' && (!target.repetitions || target.repetitions <= 0)) {
      window.alert('Informe as repetições antes de concluir a série.');
      return;
    }
    const completed = !target.completed;
    const timerStartedAt = completed && !execution.timerStartedAt ? new Date().toISOString() : execution.timerStartedAt;
    setExecution((current) => ({
      ...current,
      ...(timerStartedAt ? { timerStartedAt } : {}),
      updatedAt: new Date().toISOString(),
      exercises: {
        ...current.exercises,
        [exercise.id]: {
          ...current.exercises[exercise.id],
          sets: current.exercises[exercise.id].sets.map((set) => set.setNumber === setNumber ? { ...set, completed } : set),
        },
      },
    }));
    if (completed && (exercise.restSeconds ?? 0) > 0 && setNumber < exerciseExecution.sets.length) {
      setRestSeconds(exercise.restSeconds ?? 0);
      setRestRunning(true);
    } else if (!completed) {
      setRestRunning(false);
      setRestSeconds(0);
    }
  }

  function nextExercise() {
    setRestRunning(false); setRestSeconds(0); setShowTip(false);
    setActiveExerciseIndex((value) => Math.min(workout.exercises.length - 1, value + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function previousExercise() {
    setRestRunning(false); setRestSeconds(0); setShowTip(false);
    setActiveExerciseIndex((value) => Math.max(0, value - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function finishWorkout() {
    if (completedSets !== totalSets) return;
    const completedAt = new Date().toISOString();
    const record = createHistoryRecord(planId, planName, workout, execution, completedAt);
    addWorkoutHistoryRecord(record);
    removeWorkoutExecution(planId, workout.id);
    setRestRunning(false); setRestSeconds(0);
    setSummary({ durationSeconds: record.durationSeconds, totalSets: record.totalSets });
  }
  function resetSession() {
    if (!window.confirm('Apagar os registros desta sessão?')) return;
    const next = createExecution(planId, workout);
    saveWorkoutExecution(next); setExecution(next); setActiveExerciseIndex(0);
    setRestRunning(false); setRestSeconds(0); setSessionSeconds(0); setShowTip(false);
  }

  if (summary) return <section className="workout-summary focus-workout-summary"><span className="eyebrow">TREINO CONCLUÍDO</span><h2>{workout.title}</h2><div className="summary-grid"><div><span>Tempo</span><strong>{formatDuration(summary.durationSeconds)}</strong></div><div><span>Séries</span><strong>{summary.totalSets}</strong></div></div><button type="button" className="primary-action" onClick={onCompleted}>Finalizar</button></section>;

  return <div className="workout-mode focus-workout-mode">
    <header className="focus-workout-topbar"><button type="button" className="workout-exit" onClick={onBack}>←</button><div><span>{activeExerciseIndex + 1} / {workout.exercises.length}</span><strong>{formatSessionTime(sessionSeconds)}</strong></div><span>{progress}%</span></header>
    <div className="focus-progress-track"><span style={{ width: `${progress}%` }} /></div>

    {restSeconds > 0 && <section className="focus-rest-timer" aria-label="Cronômetro de descanso"><span>DESCANSO</span><strong>{formatTimer(restSeconds)}</strong><div><button type="button" onClick={() => setRestSeconds((value) => Math.max(0, value - 15))}>−15s</button><button type="button" onClick={() => setRestRunning((value) => !value)}>{restRunning ? 'Pausar' : 'Continuar'}</button><button type="button" onClick={() => setRestSeconds((value) => value + 15)}>+15s</button></div></section>}

    <article className="focus-exercise-card">
      <span className="info-label">{exercise.muscleGroup}</span>
      <h2>{exercise.name}</h2>
      <div className="focus-prescription">
        <div><span>SÉRIES</span><strong>{exerciseExecution.sets.length}</strong></div>
        <div><span>REPS</span><strong>{formatReps(exercise)}</strong></div>
        <div><span>DESCANSO</span><strong>{exercise.restSeconds ? formatRest(exercise.restSeconds) : '—'}</strong></div>
      </div>

      {(previous || loadSuggestion) && <section className="load-guidance">
        {previous && <div><span>ÚLTIMO TREINO</span><strong>{previous.weightKg !== null ? `${previous.weightKg} kg` : '—'} · {previous.repsText}</strong></div>}
        {loadSuggestion !== null && <div className="load-suggestion"><span>CARGA SUGERIDA</span><strong>{loadSuggestion} kg</strong></div>}
      </section>}

      {(exercise.technique || exercise.commonMistakes?.length) && <div className="tip-block"><button type="button" className="tip-toggle" onClick={() => setShowTip((value) => !value)}>Dica de execução {showTip ? '−' : '+'}</button>{showTip && <div className="tip-content">{exercise.technique && <p>{exercise.technique}</p>}{exercise.commonMistakes?.length ? <p><strong>Evite:</strong> {exercise.commonMistakes.slice(0, 3).join(' · ')}</p> : null}</div>}</div>}

      <div className="focus-set-list">
        {exerciseExecution.sets.map((set) => <div className={`focus-set-row ${set.completed ? 'completed' : ''}`} key={set.setNumber}>
          <span className="set-number">{set.setNumber}</span>
          <label><span>CARGA</span><div><input inputMode="decimal" type="number" min="0" step="0.5" value={set.weightKg ?? ''} disabled={set.completed} placeholder={loadSuggestion !== null ? String(loadSuggestion) : 'kg'} onChange={(event) => updateSet(set.setNumber, 'weightKg', event.target.value)} /><small>kg</small></div></label>
          <label><span>REPS</span><input inputMode="numeric" type="number" min="0" step="1" value={set.repetitions ?? ''} disabled={set.completed} placeholder={String(exercise.minReps ?? '')} onChange={(event) => updateSet(set.setNumber, 'repetitions', event.target.value)} /></label>
          <button type="button" className="set-check" aria-pressed={set.completed} onClick={() => completeSet(set.setNumber)}>{set.completed ? '✓' : 'OK'}</button>
        </div>)}
      </div>
    </article>

    <div className="focus-exercise-navigation"><button type="button" disabled={activeExerciseIndex === 0} onClick={previousExercise}>Anterior</button>{activeExerciseIndex < workout.exercises.length - 1 ? <button type="button" className="primary-action" disabled={!exerciseCompleted} onClick={nextExercise}>Próximo exercício</button> : <button type="button" className="primary-action" disabled={completedSets !== totalSets} onClick={finishWorkout}>Concluir treino</button>}</div>
    <button type="button" className="quiet-link reset-session" onClick={resetSession}>Resetar sessão</button>
  </div>;
}

function blankSet(setNumber: number): ExecutedSet { return { setNumber, weightKg:null, repetitions:null, rir:null, durationSeconds:null, distanceMeters:null, speedKmh:null, inclinePercent:null, averagePace:null, averageHeartRate:null, calories:null, rpe:null, cardioZone:null, notes:null, completed:false }; }
function createExecution(planId: string, workout: TitanWorkoutDay): WorkoutExecution { const now = new Date().toISOString(); return { planId, workoutId:workout.id, startedAt:now, updatedAt:now, exercises:Object.fromEntries(workout.exercises.map((exercise) => [exercise.id, { exerciseId:exercise.id, exerciseType:exercise.exerciseType ?? 'strength', selectedExerciseId:exercise.id, selectedExerciseName:exercise.name, sets:Array.from({ length:Math.max(1, exercise.sets ?? 1) }, (_, index) => blankSet(index + 1)) }])) }; }
function normalizeExecution(saved: WorkoutExecution | null, planId: string, workout: TitanWorkoutDay): WorkoutExecution { if (!saved) return createExecution(planId, workout); const fresh=createExecution(planId, workout); for (const exercise of workout.exercises) { const old=saved.exercises?.[exercise.id]; if (!old) continue; fresh.exercises[exercise.id].sets=fresh.exercises[exercise.id].sets.map((set,index)=>({ ...set, ...(old.sets?.[index] ?? {}), setNumber:set.setNumber })); } const hasCompleted=Object.values(fresh.exercises).some((item)=>item.sets.some((set)=>set.completed)); return { ...fresh, startedAt:saved.startedAt ?? fresh.startedAt, timerStartedAt:saved.timerStartedAt ?? (hasCompleted ? saved.startedAt : undefined), updatedAt:saved.updatedAt ?? fresh.updatedAt }; }
function firstPending(workout:TitanWorkoutDay, execution:WorkoutExecution) { const index=workout.exercises.findIndex((exercise)=>execution.exercises[exercise.id]?.sets.some((set)=>!set.completed)); return index < 0 ? Math.max(0, workout.exercises.length - 1) : index; }
function createHistoryRecord(planId:string, planName:string, workout:TitanWorkoutDay, execution:WorkoutExecution, completedAt:string):WorkoutHistoryRecord { const exercises=workout.exercises.map((exercise)=>{ const sets=execution.exercises[exercise.id].sets.filter((set)=>set.completed).map(({ completed:_completed, ...set })=>set); const volumeKg=sets.reduce((sum,set)=>sum+((set.weightKg ?? 0)*(set.repetitions ?? 0)),0); const weights=sets.map((set)=>set.weightKg).filter((value):value is number=>value !== null); return { exerciseId:exercise.id, name:exercise.name, muscleGroup:exercise.muscleGroup, exerciseType:exercise.exerciseType ?? 'strength', sets, volumeKg, bestWeightKg:weights.length?Math.max(...weights):null, totalDistanceMeters:0, totalDurationSeconds:0, bestSpeedKmh:null, bestInclinePercent:null, averageHeartRate:null }; }); const startedAt=execution.timerStartedAt ?? completedAt; return { id:`${planId}:${workout.id}:${completedAt}`, planId, planName, workoutId:workout.id, workoutTitle:workout.title, workoutDay:workout.day, startedAt, completedAt, durationSeconds:Math.max(0,Math.round((new Date(completedAt).getTime()-new Date(startedAt).getTime())/1000)), totalSets:exercises.reduce((sum,item)=>sum+item.sets.length,0), totalVolumeKg:exercises.reduce((sum,item)=>sum+item.volumeKg,0), exercises }; }
function findPreviousPerformance(exerciseId:string) { const records=loadWorkoutHistory(); for (const record of records) { const item=record.exercises.find((exercise)=>exercise.exerciseId===exerciseId); if (!item || item.sets.length===0) continue; const weights=item.sets.map((set)=>set.weightKg).filter((value):value is number=>value!==null); const reps=item.sets.map((set)=>set.repetitions).filter((value):value is number=>value!==null); return { weightKg:weights.length?Math.max(...weights):null, reps, repsText:reps.length?reps.join(' / '):'sem reps registradas' }; } return null; }
function suggestLoad(exercise:TitanExercise, previous:ReturnType<typeof findPreviousPerformance>) { if (!previous?.weightKg) return null; const reps=previous.reps; const reachedTop=Boolean(exercise.maxReps && reps.length && reps.every((rep)=>rep>=exercise.maxReps!)); if (!reachedTop) return previous.weightKg; const increment=previous.weightKg>=50?2.5:1; return Math.round((previous.weightKg+increment)*2)/2; }
function formatReps(exercise:TitanExercise) { if (exercise.minReps && exercise.maxReps) return exercise.minReps === exercise.maxReps ? String(exercise.minReps) : `${exercise.minReps}–${exercise.maxReps}`; return String(exercise.minReps ?? exercise.maxReps ?? '—'); }
function formatRest(seconds:number) { return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`; }
function secondsSince(value:string) { return Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/1000)); }
function formatTimer(seconds:number) { return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`; }
function formatSessionTime(seconds:number) { return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; }
function formatDuration(seconds:number) { return `${Math.max(1,Math.round(seconds/60))} min`; }
