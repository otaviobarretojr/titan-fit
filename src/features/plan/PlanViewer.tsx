import { useState } from 'react';
import { WorkoutExecutionView } from '../workout/WorkoutExecutionView';
import type { TitanExercise, TitanPlan, TitanWorkoutDay } from './types';

type PlanViewerProps = { plan: TitanPlan; onImportAnother: () => void; onRemove: () => void; };

export function PlanViewer({ plan, onImportAnother, onRemove }: PlanViewerProps) {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [executingWorkoutId, setExecutingWorkoutId] = useState<string | null>(null);
  const selectedWorkout = plan.workouts.find((workout) => workout.id === selectedWorkoutId) ?? null;
  const selectedExercise = selectedWorkout?.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;
  const executingWorkout = plan.workouts.find((workout) => workout.id === executingWorkoutId) ?? null;

  if (executingWorkout) return <WorkoutExecutionView planId={plan.id} workout={executingWorkout} onBack={() => setExecutingWorkoutId(null)} />;
  if (selectedWorkout && selectedExercise) return <ExerciseDetail exercise={selectedExercise} workout={selectedWorkout} onBack={() => setSelectedExerciseId(null)} />;
  if (selectedWorkout) return <WorkoutDetail workout={selectedWorkout} onBack={() => setSelectedWorkoutId(null)} onSelectExercise={setSelectedExerciseId} onStart={() => setExecutingWorkoutId(selectedWorkout.id)} />;

  const exerciseCount = plan.workouts.reduce((total, workout) => total + workout.exercises.length, 0);
  const videoCount = plan.workouts.reduce((total, workout) => total + workout.exercises.filter((exercise) => exercise.video).length, 0);

  return <>
    <section className="section-header"><span className="eyebrow">FICHA ATIVA</span><h2>{plan.name}</h2>{plan.description && <p>{plan.description}</p>}<p>{plan.workouts.length} treinos • {exerciseCount} exercícios • {videoCount} vídeos</p></section>
    <section className="workout-list" aria-label="Treinos importados">{plan.workouts.map((workout) => <button type="button" className="workout-card workout-card-button" key={workout.id} onClick={() => setSelectedWorkoutId(workout.id)}><div><span className="info-label">{workout.day}</span><h3>{workout.title}</h3>{workout.focus && <p>{workout.focus}</p>}</div><span className="workout-count">{workout.exercises.length}<small>exercícios</small></span></button>)}</section>
    <div className="stack-actions"><button type="button" className="secondary-action" onClick={onImportAnother}>Importar outra ficha</button><button type="button" className="danger-action" onClick={onRemove}>Remover ficha</button></div>
  </>;
}

function WorkoutDetail({ workout, onBack, onSelectExercise, onStart }: { workout: TitanWorkoutDay; onBack: () => void; onSelectExercise: (exerciseId: string) => void; onStart: () => void; }) {
  return <>
    <button type="button" className="secondary-action back-action" onClick={onBack}>← Voltar para a ficha</button>
    <section className="section-header"><span className="eyebrow">{workout.day.toUpperCase()}</span><h2>{workout.title}</h2>{workout.focus && <p>{workout.focus}</p>}<p>{workout.exercises.length} exercícios</p><button type="button" className="primary-action start-session" onClick={onStart}>Iniciar treino</button></section>
    <section className="exercise-list" aria-label={`Exercícios de ${workout.title}`}>{workout.exercises.map((exercise, index) => <button type="button" className="exercise-card" key={exercise.id} onClick={() => onSelectExercise(exercise.id)}><span className="exercise-order">{index + 1}</span><div className="exercise-card-content"><span className="info-label">{exercise.muscleGroup}</span><h3>{exercise.name}</h3><p>{formatPrescription(exercise)}</p></div><span className="exercise-arrow">›</span></button>)}</section>
  </>;
}

function ExerciseDetail({ exercise, workout, onBack }: { exercise: TitanExercise; workout: TitanWorkoutDay; onBack: () => void; }) {
  const [showVideo, setShowVideo] = useState(false);
  return <>
    <button type="button" className="secondary-action back-action" onClick={onBack}>← Voltar para o treino</button>
    <section className="exercise-detail-header"><span className="eyebrow">{workout.title.toUpperCase()}</span><h2>{exercise.name}</h2><p>{exercise.muscleGroup}</p></section>
    <section className="prescription-grid" aria-label="Prescrição do exercício"><Metric label="Séries" value={String(exercise.sets)} /><Metric label="Repetições" value={formatRepetitions(exercise)} /><Metric label="RIR" value={exercise.targetRir === undefined ? '—' : String(exercise.targetRir)} /><Metric label="Descanso" value={formatRest(exercise.restSeconds)} /></section>
    {exercise.video && <section className="video-card"><div className="video-card-heading"><div><span className="info-label">VÍDEO DE EXECUÇÃO</span><strong>{exercise.video.title ?? exercise.name}</strong></div><button type="button" className="secondary-action" onClick={() => setShowVideo((current) => !current)}>{showVideo ? 'Fechar vídeo' : 'Ver execução'}</button></div>{showVideo && <div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${exercise.video.videoId}?rel=0`} title={exercise.video.title ?? `Execução de ${exercise.name}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}</section>}
    {exercise.technique && <DetailSection title="Técnica" text={exercise.technique} />}{exercise.commonMistakes?.length ? <ListSection title="Erros comuns" items={exercise.commonMistakes} /> : null}{exercise.alternatives?.length ? <ListSection title="Alternativas" items={exercise.alternatives} /> : null}
  </>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric-card"><span className="info-label">{label}</span><strong>{value}</strong></div>; }
function DetailSection({ title, text }: { title: string; text: string }) { return <section className="detail-card"><span className="info-label">{title.toUpperCase()}</span><p>{text}</p></section>; }
function ListSection({ title, items }: { title: string; items: string[] }) { return <section className="detail-card"><span className="info-label">{title.toUpperCase()}</span><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>; }
function formatPrescription(exercise: TitanExercise) { return `${exercise.sets} séries • ${formatRepetitions(exercise)} • ${formatRest(exercise.restSeconds)} descanso`; }
function formatRepetitions(exercise: TitanExercise) { if (exercise.durationSeconds) return `${exercise.durationSeconds}s`; if (exercise.minReps !== undefined && exercise.maxReps !== undefined) return exercise.minReps === exercise.maxReps ? String(exercise.minReps) : `${exercise.minReps}–${exercise.maxReps}`; return '—'; }
function formatRest(seconds: number) { if (seconds < 60) return `${seconds}s`; const minutes = Math.floor(seconds / 60); const remainder = seconds % 60; return remainder ? `${minutes}m ${remainder}s` : `${minutes} min`; }
