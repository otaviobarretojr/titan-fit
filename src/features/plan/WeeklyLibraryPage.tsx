import { useEffect, useMemo, useState } from 'react';
import { getExerciseVideo } from '../exercise-library/videos';
import type { ExerciseType, TitanExercise, TitanPlan } from './types';

type Props = { plan: TitanPlan | null };

export function WeeklyLibraryPage({ plan }: Props) {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(plan?.workouts[0]?.id ?? '');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const workout = useMemo(() => plan?.workouts.find((item) => item.id === selectedWorkoutId) ?? plan?.workouts[0] ?? null, [plan, selectedWorkoutId]);
  const exercise = workout?.exercises.find((item) => item.id === selectedExerciseId) ?? null;

  useEffect(() => {
    if (!exercise) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [exercise]);

  if (!plan || !workout) return <section className="hero-card compact"><span className="eyebrow">SEMANA TITAN</span><h2>Importe seu projeto</h2><p>Depois da importação, os grupos da semana e a biblioteca de exercícios aparecem aqui.</p></section>;

  return <section className="weekly-library-page">
    <header className="hero-card compact"><span className="eyebrow">SEMANA TITAN</span><h2>Grupos e exercícios</h2><p>Consulte o treino, a técnica e o vídeo de qualquer exercício sem iniciar uma sessão.</p></header>
    <div className="week-tabs" role="tablist" aria-label="Treinos da semana">
      {plan.workouts.map((item) => <button key={item.id} type="button" role="tab" aria-selected={item.id === workout.id} className={item.id === workout.id ? 'active' : ''} onClick={() => { setSelectedWorkoutId(item.id); setSelectedExerciseId(null); }}><strong>{capitalize(item.day)}</strong><span>{shortTitle(item.title)}</span></button>)}
    </div>
    <section className="weekly-workout-card"><span className="info-label">{capitalize(workout.day)}</span><h3>{workout.title}</h3>{workout.focus && <p>{workout.focus}</p>}<strong>{workout.exercises.length} exercícios</strong></section>
    <div className="weekly-exercise-list">
      {workout.exercises.map((item, index) => <button type="button" key={item.id} className="weekly-exercise-row" onClick={() => setSelectedExerciseId(item.id)}><span className="exercise-order">{index + 1}</span><span><strong>{item.name}</strong><small>{item.muscleGroup} · {typeLabel(item.exerciseType ?? 'strength')}</small></span><span aria-hidden="true">›</span></button>)}
    </div>
    {exercise && <ExerciseSheet exercise={exercise} onClose={() => setSelectedExerciseId(null)} />}
  </section>;
}

function ExerciseSheet({ exercise, onClose }: { exercise: TitanExercise; onClose: () => void }) {
  const type = exercise.exerciseType ?? 'strength';
  const video = type === 'cardio' ? null : getExerciseVideo(exercise);

  return <div className="exercise-sheet-backdrop" role="presentation">
    <article className="exercise-sheet" role="dialog" aria-modal="true" aria-label={`Detalhes de ${exercise.name}`}>
      <header className="sheet-header">
        <div><span className="info-label">{exercise.muscleGroup} · {typeLabel(type)}</span><h3>{exercise.name}</h3></div>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar detalhes">✕</button>
      </header>

      {video && <section className="exercise-video-card" aria-label="Vídeo de execução">
        <div className="exercise-video"><iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&modestbranding=1`} referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
        <div className="video-meta"><strong>{video.title}</strong><small>{video.source}</small></div>
      </section>}

      {!video && type !== 'cardio' && <div className="video-not-required"><strong>Vídeo ainda não disponível</strong><p>O exercício continua acessível normalmente. Ao importar a ficha com vídeos, o player aparecerá aqui automaticamente.</p></div>}
      {type === 'cardio' && <div className="video-not-required"><strong>Cardio</strong><p>Vídeo não necessário. Consulte abaixo a prescrição e as orientações.</p></div>}

      <div className="exercise-prescription">{prescription(exercise).map((item) => <span key={item}><strong>{item}</strong></span>)}</div>
      {exercise.technique && <section className="library-info"><span className="info-label">EXECUÇÃO</span><p>{exercise.technique}</p></section>}
      {exercise.commonMistakes?.length ? <section className="library-info"><span className="info-label">ERROS COMUNS</span><ul>{exercise.commonMistakes.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
      {exercise.alternatives?.length ? <section className="library-info"><span className="info-label">ALTERNATIVAS</span><ul>{exercise.alternatives.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
      <button type="button" className="secondary-action sheet-bottom-close" onClick={onClose}>Voltar para a semana</button>
    </article>
  </div>;
}

function prescription(exercise: TitanExercise) {
  const type = exercise.exerciseType ?? 'strength'; const items: string[] = [];
  if (exercise.sets) items.push(`${exercise.sets} séries`);
  if (type === 'strength') { items.push(`${exercise.minReps ?? '—'}–${exercise.maxReps ?? '—'} reps`); items.push(`RIR ${exercise.targetRir ?? '—'}`); }
  if (type === 'distance') items.push(`${exercise.minDistanceMeters ?? exercise.distanceMeters ?? '—'}–${exercise.maxDistanceMeters ?? exercise.distanceMeters ?? '—'} m`);
  if (type === 'cardio' && exercise.durationSeconds) items.push(`${Math.round(exercise.durationSeconds / 60)} min`);
  if (exercise.restSeconds) items.push(`${exercise.restSeconds}s descanso`);
  return items;
}
function typeLabel(type: ExerciseType) { return ({ strength: 'Musculação', distance: 'Distância', cardio: 'Cardio', isometric: 'Isometria', mobility: 'Mobilidade' })[type]; }
function capitalize(value: string) { return value ? value[0].toUpperCase() + value.slice(1) : value; }
function shortTitle(value: string) { return value.split('—')[0]?.trim() ?? value; }
