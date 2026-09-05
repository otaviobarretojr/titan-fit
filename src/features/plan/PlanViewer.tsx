import { useState } from 'react';
import { SimpleWorkoutExecutionView } from '../workout/SimpleWorkoutExecutionView';
import type { TitanExercise, TitanPlan, TitanWorkoutDay } from './types';

type Props = { plan: TitanPlan; initialWorkoutId?: string | null; onImportAnother: () => void; onRemove: () => void; onHistoryChange: () => void; onExitWorkout?: () => void; onDirectStartHandled?: () => void };

export function PlanViewer({ plan, initialWorkoutId, onHistoryChange, onExitWorkout, onDirectStartHandled }: Props) {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [executingWorkoutId, setExecutingWorkoutId] = useState<string | null>(() => initialWorkoutId ?? null);
  const selectedWorkout = plan.workouts.find((workout) => workout.id === selectedWorkoutId) ?? null;
  const selectedExercise = selectedWorkout?.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;
  const executingWorkout = plan.workouts.find((workout) => workout.id === executingWorkoutId) ?? null;

  if (executingWorkout) return <SimpleWorkoutExecutionView planId={plan.id} planName={plan.name} workout={executingWorkout} onBack={() => { setExecutingWorkoutId(null); setSelectedWorkoutId(null); onDirectStartHandled?.(); onExitWorkout?.(); }} onCompleted={() => { setExecutingWorkoutId(null); setSelectedWorkoutId(null); onDirectStartHandled?.(); onHistoryChange(); }} />;
  if (selectedWorkout && selectedExercise) return <ExerciseDetail exercise={selectedExercise} workout={selectedWorkout} onBack={() => setSelectedExerciseId(null)} />;
  if (selectedWorkout) return <WorkoutDetail workout={selectedWorkout} onBack={() => setSelectedWorkoutId(null)} onSelectExercise={setSelectedExerciseId} onStart={() => setExecutingWorkoutId(selectedWorkout.id)} />;

  return <section className="training-library">
    <header className="section-header"><span className="eyebrow">PROGRAMAÇÃO</span><h2>Seus treinos</h2><p>{plan.workouts.length} sessões na programação atual.</p></header>
    <div className="training-list">{plan.workouts.map((workout) => {
      const totalSets = workout.exercises.reduce((sum, exercise) => sum + Math.max(1, exercise.sets ?? 1), 0);
      return <button type="button" className="training-card" key={workout.id} onClick={() => setSelectedWorkoutId(workout.id)}><div><span>{workout.day}</span><strong>{workout.title}</strong><small>{workout.exercises.length} exercícios · {totalSets} séries</small></div><span className="training-chevron">›</span></button>;
    })}</div>
  </section>;
}

function WorkoutDetail({ workout, onBack, onSelectExercise, onStart }: { workout: TitanWorkoutDay; onBack: () => void; onSelectExercise: (id: string) => void; onStart: () => void }) {
  return <section className="workout-detail-simple">
    <button type="button" className="quiet-link back-settings" onClick={onBack}>← Voltar</button>
    <header className="section-header"><span className="eyebrow">{workout.day.toUpperCase()}</span><h2>{workout.title}</h2>{workout.focus && <p>{workout.focus}</p>}<button type="button" className="primary-action start-session" onClick={onStart}>Iniciar treino</button></header>
    <div className="exercise-list-simple">{workout.exercises.map((exercise, index) => <button type="button" className="exercise-list-row" key={exercise.id} onClick={() => onSelectExercise(exercise.id)}><span className="exercise-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{exercise.name}</strong><small>{exercise.muscleGroup}</small><p>{formatPrescription(exercise)}</p></div><span>›</span></button>)}</div>
  </section>;
}

function ExerciseDetail({ exercise, workout, onBack }: { exercise: TitanExercise; workout: TitanWorkoutDay; onBack: () => void }) {
  return <section className="exercise-detail-simple">
    <button type="button" className="quiet-link back-settings" onClick={onBack}>← Voltar</button>
    <span className="eyebrow">{workout.title}</span><h2>{exercise.name}</h2><p className="exercise-muscle">{exercise.muscleGroup}</p>
    <div className="focus-prescription exercise-detail-prescription"><div><span>SÉRIES</span><strong>{exercise.sets ?? 1}</strong></div><div><span>REPS</span><strong>{formatRepetitions(exercise)}</strong></div><div><span>DESCANSO</span><strong>{exercise.restSeconds ? formatRest(exercise.restSeconds) : '—'}</strong></div></div>
    {exercise.technique && <section className="detail-tip"><span className="info-label">DICA DE EXECUÇÃO</span><p>{exercise.technique}</p></section>}
    {exercise.commonMistakes?.length ? <section className="detail-tip subtle"><span className="info-label">EVITE</span><p>{exercise.commonMistakes.slice(0, 3).join(' · ')}</p></section> : null}
    {exercise.alternatives?.length ? <section className="detail-tip subtle"><span className="info-label">ALTERNATIVA</span><p>{exercise.alternatives.slice(0, 2).join(' · ')}</p></section> : null}
  </section>;
}

function formatPrescription(exercise:TitanExercise) {
  const chunks = [`${exercise.sets ?? 1}×${formatRepetitions(exercise)}`];
  if (exercise.restSeconds) chunks.push(formatRest(exercise.restSeconds));
  return chunks.join(' · ');
}
function formatRepetitions(exercise:TitanExercise) { if(exercise.minReps!==undefined&&exercise.maxReps!==undefined)return exercise.minReps===exercise.maxReps?String(exercise.minReps):`${exercise.minReps}–${exercise.maxReps}`; return '—'; }
function formatRest(seconds:number){if(seconds<60)return `${seconds}s`;return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
