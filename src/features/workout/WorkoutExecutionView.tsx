import { useEffect, useMemo, useState } from 'react';
import type { TitanWorkoutDay } from '../plan/types';
import { loadWorkoutExecution, removeWorkoutExecution, saveWorkoutExecution } from './storage';
import type { ExecutedSet, WorkoutExecution } from './types';

type Props = {
  planId: string;
  workout: TitanWorkoutDay;
  onBack: () => void;
};

export function WorkoutExecutionView({ planId, workout, onBack }: Props) {
  const [execution, setExecution] = useState<WorkoutExecution>(() =>
    loadWorkoutExecution(planId, workout.id) ?? createExecution(planId, workout)
  );
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    saveWorkoutExecution(execution);
  }, [execution]);

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          if (navigator.vibrate) navigator.vibrate([180, 100, 180]);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const totals = useMemo(() => {
    const sets = Object.values(execution.exercises).flatMap((exercise) => exercise.sets);
    return { completed: sets.filter((set) => set.completed).length, total: sets.length };
  }, [execution]);

  function updateSet(exerciseId: string, setNumber: number, patch: Partial<ExecutedSet>) {
    setExecution((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      exercises: {
        ...current.exercises,
        [exerciseId]: {
          ...current.exercises[exerciseId],
          sets: current.exercises[exerciseId].sets.map((set) => set.setNumber === setNumber ? { ...set, ...patch } : set)
        }
      }
    }));
  }

  function startRest(seconds: number) {
    setTimerSeconds(seconds);
    setTimerRunning(true);
  }

  function resetSession() {
    if (!window.confirm('Apagar todos os registros desta sessão?')) return;
    removeWorkoutExecution(planId, workout.id);
    setExecution(createExecution(planId, workout));
    setTimerRunning(false);
    setTimerSeconds(0);
  }

  return (
    <>
      <button type="button" className="secondary-action back-action" onClick={onBack}>← Voltar para o treino</button>
      <section className="section-header">
        <span className="eyebrow">MODO TREINO</span>
        <h2>{workout.title}</h2>
        <p>{totals.completed} de {totals.total} séries concluídas</p>
      </section>

      <section className="rest-timer" aria-label="Cronômetro de descanso">
        <div><span className="info-label">DESCANSO</span><strong>{formatTimer(timerSeconds)}</strong></div>
        <div className="timer-actions">
          <button type="button" className="secondary-action" onClick={() => setTimerRunning((value) => !value)} disabled={!timerSeconds}>{timerRunning ? 'Pausar' : 'Continuar'}</button>
          <button type="button" className="secondary-action" onClick={() => { setTimerRunning(false); setTimerSeconds(0); }}>Zerar</button>
        </div>
      </section>

      <section className="execution-list">
        {workout.exercises.map((exercise, exerciseIndex) => (
          <article className="execution-card" key={exercise.id}>
            <header><span className="exercise-order">{exerciseIndex + 1}</span><div><span className="info-label">{exercise.muscleGroup}</span><h3>{exercise.name}</h3></div></header>
            <div className="set-table-header"><span>Série</span><span>kg</span><span>Reps</span><span>RIR</span><span>Feita</span></div>
            {execution.exercises[exercise.id].sets.map((set) => (
              <div className={`set-row ${set.completed ? 'completed' : ''}`} key={set.setNumber}>
                <strong>{set.setNumber}</strong>
                <input aria-label={`${exercise.name} série ${set.setNumber} carga`} type="number" inputMode="decimal" min="0" step="0.5" value={set.weightKg ?? ''} onChange={(event) => updateSet(exercise.id, set.setNumber, { weightKg: event.target.value === '' ? null : Number(event.target.value) })} />
                <input aria-label={`${exercise.name} série ${set.setNumber} repetições`} type="number" inputMode="numeric" min="0" value={set.repetitions ?? ''} onChange={(event) => updateSet(exercise.id, set.setNumber, { repetitions: event.target.value === '' ? null : Number(event.target.value) })} />
                <input aria-label={`${exercise.name} série ${set.setNumber} RIR`} type="number" inputMode="numeric" min="0" max="10" value={set.rir ?? ''} onChange={(event) => updateSet(exercise.id, set.setNumber, { rir: event.target.value === '' ? null : Number(event.target.value) })} />
                <button type="button" className="set-check" aria-label={`Concluir ${exercise.name} série ${set.setNumber}`} aria-pressed={set.completed} onClick={() => { const completed = !set.completed; updateSet(exercise.id, set.setNumber, { completed }); if (completed) startRest(exercise.restSeconds); }}>{set.completed ? '✓' : '○'}</button>
              </div>
            ))}
            <button type="button" className="text-action rest-shortcut" onClick={() => startRest(exercise.restSeconds)}>Iniciar descanso de {formatRest(exercise.restSeconds)}</button>
          </article>
        ))}
      </section>

      <button type="button" className="danger-action reset-session" onClick={resetSession}>Resetar sessão</button>
    </>
  );
}

function createExecution(planId: string, workout: TitanWorkoutDay): WorkoutExecution {
  const now = new Date().toISOString();
  return {
    planId,
    workoutId: workout.id,
    startedAt: now,
    updatedAt: now,
    exercises: Object.fromEntries(workout.exercises.map((exercise) => [exercise.id, {
      exerciseId: exercise.id,
      sets: Array.from({ length: exercise.sets }, (_, index) => ({ setNumber: index + 1, weightKg: null, repetitions: null, rir: exercise.targetRir ?? null, completed: false }))
    }]))
  };
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatRest(seconds: number) {
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
