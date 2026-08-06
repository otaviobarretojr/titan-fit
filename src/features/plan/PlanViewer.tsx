import { useState } from 'react';
import { WorkoutExecutionView } from '../workout/WorkoutExecutionView';
import type { TitanExercise, TitanPlan, TitanWorkoutDay } from './types';

type PlanViewerProps = {
  plan: TitanPlan;
  initialWorkoutId?: string | null;
  onImportAnother: () => void;
  onRemove: () => void;
  onHistoryChange: () => void;
  onDirectStartHandled?: () => void;
};

export function PlanViewer({ plan, initialWorkoutId, onImportAnother, onRemove, onHistoryChange, onDirectStartHandled }: PlanViewerProps) {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [executingWorkoutId, setExecutingWorkoutId] = useState<string | null>(() => initialWorkoutId ?? null);
  const selectedWorkout = plan.workouts.find((workout) => workout.id === selectedWorkoutId) ?? null;
  const selectedExercise = selectedWorkout?.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;
  const executingWorkout = plan.workouts.find((workout) => workout.id === executingWorkoutId) ?? null;

  if (executingWorkout) return <WorkoutExecutionView planId={plan.id} planName={plan.name} workout={executingWorkout} onBack={() => { setExecutingWorkoutId(null); onDirectStartHandled?.(); }} onCompleted={() => { setExecutingWorkoutId(null); setSelectedWorkoutId(null); onDirectStartHandled?.(); onHistoryChange(); }} />;
  if (selectedWorkout && selectedExercise) return <ExerciseDetail exercise={selectedExercise} workout={selectedWorkout} onBack={() => setSelectedExerciseId(null)} />;
  if (selectedWorkout) return <WorkoutDetail workout={selectedWorkout} onBack={() => setSelectedWorkoutId(null)} onSelectExercise={setSelectedExerciseId} onStart={() => setExecutingWorkoutId(selectedWorkout.id)} />;

  const exerciseCount = plan.workouts.reduce((total, workout) => total + workout.exercises.length, 0);
  const videoCount = plan.workouts.reduce((total, workout) => total + workout.exercises.filter((exercise) => exercise.video).length, 0);
  const cardioSessions = plan.project?.cardioSchedule ?? [];

  return <>
    <section className="section-header"><span className="eyebrow">PROJETO ATIVO</span><h2>{plan.project?.name ?? plan.name}</h2>{plan.description && <p>{plan.description}</p>}<p>{plan.workouts.length} treinos de musculação • {exerciseCount} exercícios • {cardioSessions.length} sessões de cardio</p></section>

    {cardioSessions.length > 0 && <section className="detail-card" aria-label="Plano progressivo para 5 km">
      <span className="info-label">PROJETO 5 KM</span>
      <h3>{plan.project?.cardioGoal ?? 'Evolução progressiva até correr 5 km'}</h3>
      <p>Cardio programado às 17:30, com musculação às {plan.project?.strengthStartTime ?? '20:00'}.</p>
      <div className="workout-list">{cardioSessions.map((session) => <article className="workout-card" key={session.id}>
        <div><span className="info-label">{session.day} · {session.startTime}</span><h3>{session.title}</h3>{session.goal && <p>{session.goal}</p>}{session.instructions?.length ? <ul>{session.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ul> : null}</div>
        <span className="workout-count">{session.durationMinutes}<small>min</small></span>
      </article>)}</div>
    </section>}

    <section className="section-header"><span className="eyebrow">MUSCULAÇÃO</span><h2>Treinos do projeto</h2><p>{videoCount} vídeos vinculados</p></section>
    <section className="workout-list" aria-label="Treinos importados">{plan.workouts.map((workout) => <button type="button" className="workout-card workout-card-button" key={workout.id} onClick={() => setSelectedWorkoutId(workout.id)}><div><span className="info-label">{workout.day}</span><h3>{workout.title}</h3>{workout.focus && <p>{workout.focus}</p>}</div><span className="workout-count">{workout.exercises.length}<small>exercícios</small></span></button>)}</section>
    <div className="stack-actions"><button type="button" className="secondary-action" onClick={onImportAnother}>Importar outro projeto</button><button type="button" className="danger-action" onClick={onRemove}>Remover projeto</button></div>
  </>;
}

function WorkoutDetail({ workout, onBack, onSelectExercise, onStart }: { workout: TitanWorkoutDay; onBack: () => void; onSelectExercise: (exerciseId: string) => void; onStart: () => void; }) {
  return <><button type="button" className="secondary-action back-action" onClick={onBack}>← Voltar para o projeto</button><section className="section-header"><span className="eyebrow">{workout.day.toUpperCase()}</span><h2>{workout.title}</h2>{workout.focus && <p>{workout.focus}</p>}<p>{workout.exercises.length} exercícios</p><button type="button" className="primary-action start-session" onClick={onStart}>Iniciar treino</button></section><section className="exercise-list" aria-label={`Exercícios de ${workout.title}`}>{workout.exercises.map((exercise, index) => <button type="button" className="exercise-card" key={exercise.id} onClick={() => onSelectExercise(exercise.id)}><span className="exercise-order">{index + 1}</span><div className="exercise-card-content"><span className="info-label">{exercise.muscleGroup}</span><h3>{exercise.name}</h3><p>{formatPrescription(exercise)}</p></div><span className="exercise-arrow">›</span></button>)}</section></>;
}

function ExerciseDetail({ exercise, workout, onBack }: { exercise: TitanExercise; workout: TitanWorkoutDay; onBack: () => void; }) {
  const [showVideo, setShowVideo] = useState(false);
  return <><button type="button" className="secondary-action back-action" onClick={onBack}>← Voltar para o treino</button><section className="exercise-detail-header"><span className="eyebrow">{workout.title.toUpperCase()}</span><h2>{exercise.name}</h2><p>{exercise.muscleGroup}</p></section><section className="prescription-grid" aria-label="Prescrição do exercício"><Metric label="Séries" value={String(exercise.sets)} /><Metric label="Repetições" value={formatRepetitions(exercise)} /><Metric label="RIR" value={exercise.targetRir === undefined ? '—' : String(exercise.targetRir)} /><Metric label="Descanso" value={formatRest(exercise.restSeconds)} /></section>{exercise.video && <section className="video-card"><div className="video-card-heading"><div><span className="info-label">VÍDEO DE EXECUÇÃO</span><strong>{exercise.video.title ?? exercise.name}</strong></div><button type="button" className="secondary-action" onClick={() => setShowVideo((current) => !current)}>{showVideo ? 'Fechar vídeo' : 'Ver execução'}</button></div>{showVideo && <div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${exercise.video.videoId}?rel=0`} title={exercise.video.title ?? `Execução de ${exercise.name}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}</section>}{exercise.technique && <DetailSection title="Técnica" text={exercise.technique} />}{exercise.commonMistakes?.length ? <ListSection title="Erros comuns" items={exercise.commonMistakes} /> : null}{exercise.alternatives?.length ? <ListSection title="Alternativas" items={exercise.alternatives} /> : null}</>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric-card"><span className="info-label">{label}</span><strong>{value}</strong></div>; }
function DetailSection({ title, text }: { title: string; text: string }) { return <section className="detail-card"><span className="info-label">{title.toUpperCase()}</span><p>{text}</p></section>; }
function ListSection({ title, items }: { title: string; items: string[] }) { return <section className="detail-card"><span className="info-label">{title.toUpperCase()}</span><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>; }
function formatPrescription(exercise: TitanExercise) { return `${exercise.sets} séries • ${formatRepetitions(exercise)} • ${formatRest(exercise.restSeconds)} descanso`; }
function formatRepetitions(exercise: TitanExercise) { if (exercise.durationSeconds) return `${exercise.durationSeconds}s`; if (exercise.minReps !== undefined && exercise.maxReps !== undefined) return exercise.minReps === exercise.maxReps ? String(exercise.minReps) : `${exercise.minReps}–${exercise.maxReps}`; return '—'; }
function formatRest(seconds: number) { if (seconds < 60) return `${seconds}s`; const minutes = Math.floor(seconds / 60); const remainder = seconds % 60; return remainder ? `${minutes}m ${remainder}s` : `${minutes} min`; }
