import { useEffect, useMemo, useState } from 'react';
import { TrainingPlanExport } from './TrainingPlanExport';
import type { TitanExercise, TitanPlan, TitanWorkoutDay } from '../plan/types';
import { loadWorkoutExecution } from '../workout/storage';
import { loadWorkoutHistory } from '../history/storage';
import { choiceLabel, getWorkoutsForChoice, loadTrainingChoice, resolveSelectedWorkout, saveTrainingChoice, type TrainingChoice } from './activeWorkoutSelection';

type Props = { plan: TitanPlan | null; onStartWorkout?: (workoutId: string) => void };
const DAY_ORDER = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export function ProgrammingPage({ plan, onStartWorkout }: Props) {
  const [selected, setSelected] = useState<TitanWorkoutDay | null>(null);
  const [trainingChoice, setTrainingChoice] = useState<TrainingChoice>(() => loadTrainingChoice());
  const workouts = useMemo(() => !plan ? [] : [...plan.workouts].sort((a, b) => dayIndex(a.day) - dayIndex(b.day)), [plan]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const detailId = typeof event.state?.titanProgrammingWorkoutId === 'string' ? event.state.titanProgrammingWorkoutId : null;
      setSelected(detailId ? workouts.find((item) => item.id === detailId) ?? null : null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [workouts]);

  function openWorkout(workout: TitanWorkoutDay) {
    window.history.pushState({ ...window.history.state, titanProgrammingWorkoutId: workout.id }, '');
    setSelected(workout);
  }
  function closeWorkout() { if (window.history.state?.titanProgrammingWorkoutId) window.history.back(); else setSelected(null); }

  if (selected) return <WorkoutDetail workout={selected} plan={plan} onBack={closeWorkout} onStartWorkout={onStartWorkout} />;

  const history = loadWorkoutHistory();
  const activeWorkout = plan ? resolveSelectedWorkout(plan, history, trainingChoice) : null;
  const activeExecution = plan && activeWorkout ? loadWorkoutExecution(plan.id, activeWorkout.id) : null;

  return <div className="programming-page">
    <section className="section-header programming-header"><span className="eyebrow">PLANEJAMENTO TITAN</span><h2>Programação</h2><p>Escolha o treino que ficará ativo no Dashboard.</p></section>
    {plan && <TrainingPlanExport plan={plan} />}
    {!plan ? <ProgrammingEmpty /> : <>
      <TrainingChoiceSelector plan={plan} value={trainingChoice} onChange={(choice) => { saveTrainingChoice(choice); setTrainingChoice(choice); }} />
      <section className="programming-today" aria-label="Treino ativo"><div><span className="eyebrow">ATIVO · {choiceLabel(trainingChoice)}</span><h3>{trainingChoice === 'rest' ? 'Descanso' : activeWorkout?.title ?? 'Treino indisponível'}</h3><p>{trainingChoice === 'rest' ? 'Recuperação selecionada manualmente.' : activeWorkout ? workoutSummary(activeWorkout) : `Nenhum ${choiceLabel(trainingChoice)} encontrado no projeto.`}</p>{activeExecution && <span className="programming-tag today-tag">SESSÃO EM ANDAMENTO</span>}{trainingChoice !== 'rest' && activeWorkout && onStartWorkout && <button type="button" className="primary-action" onClick={() => onStartWorkout(activeWorkout.id)}>{activeExecution ? 'Retomar treino' : 'Iniciar treino'}</button>}</div></section>
      <section className="programming-section" aria-labelledby="week-program-title"><div className="programming-section-head"><div><span className="programming-section-icon strength">⌁</span><div><span className="eyebrow">PROJETO ATIVO</span><h3 id="week-program-title">Tabela completa</h3></div></div><small>{workouts.length} treinos</small></div><div className="programming-list">{workouts.map((workout) => <button type="button" className="programming-day-card" key={workout.id} onClick={() => openWorkout(workout)}><DayLabel day={workout.day} /><div className="programming-day-copy"><strong>{workout.title}</strong><small>{workoutSummary(workout)}</small></div><span className="programming-chevron">›</span></button>)}</div></section>
    </>}
  </div>;
}

function TrainingChoiceSelector({ plan, value, onChange }: { plan: TitanPlan; value: TrainingChoice; onChange: (choice: TrainingChoice) => void }) {
  const choices: TrainingChoice[] = ['pull', 'push', 'legs', 'rest'];
  return <section className="programming-section" aria-label="Selecionar treino ativo"><div className="programming-section-head"><div><span className="programming-section-icon strength">✓</span><div><span className="eyebrow">PRÓXIMA SESSÃO</span><h3>Ativar treino</h3></div></div><small>Dashboard seguirá esta escolha</small></div><div className="programming-list">{choices.map((choice) => { const count = choice === 'rest' ? 0 : getWorkoutsForChoice(plan, choice).length; const active = value === choice; return <button key={choice} type="button" className={`programming-day-card${active ? ' today' : ''}`} onClick={() => onChange(choice)}><span className={`programming-day-label${active ? ' active' : ''}`}><strong>{choice === 'rest' ? 'OFF' : choiceLabel(choice).slice(0, 3)}</strong></span><div className="programming-day-copy"><strong>{choiceLabel(choice)}</strong><small>{choice === 'rest' ? 'Recuperação' : count > 1 ? `${count} variações em sequência` : count === 1 ? '1 treino disponível' : 'Não disponível'}</small></div>{active ? <span className="programming-tag today-tag">ATIVO</span> : <span className="programming-chevron">›</span>}</button>; })}</div></section>;
}

function ProgrammingEmpty() { return <section className="programming-empty"><span className="eyebrow">PROGRAMAÇÃO</span><h2>Nenhum projeto de treino ativo</h2><p>Importe ou gere um projeto de treino para preencher esta área.</p></section>; }
function WorkoutDetail({ workout, plan, onBack, onStartWorkout }: { workout: TitanWorkoutDay; plan: TitanPlan | null; onBack: () => void; onStartWorkout?: (workoutId: string) => void }) { const strength = workout.exercises.filter(isStrength); const cardio = workout.exercises.filter(isCardio); const activeExecution = plan ? loadWorkoutExecution(plan.id, workout.id) : null; return <div className="programming-detail"><button type="button" className="secondary-action programming-back" onClick={onBack}>‹ Voltar à programação</button><section className="programming-detail-hero"><span className="eyebrow">{workout.day.toUpperCase()} · PROJETO TITAN</span><h2>{workout.title}</h2><p>{workout.focus ?? 'Sessão programada no projeto ativo.'}</p><div className="programming-detail-summary"><span><small>Etapas</small><strong>{workout.exercises.length}</strong></span>{strength.length > 0 && <span><small>Séries</small><strong>{strength.reduce((sum, exercise) => sum + (exercise.sets ?? 1), 0)}</strong></span>}{cardio.length > 0 && <span><small>Cardio</small><strong>{cardio.length}</strong></span>}</div>{activeExecution && <span className="programming-tag today-tag">SESSÃO EM ANDAMENTO</span>}{onStartWorkout && <button type="button" className="primary-action" onClick={() => onStartWorkout(workout.id)}>{activeExecution ? 'Retomar treino' : 'Iniciar este treino'}</button>}</section><div className="programming-exercise-list">{workout.exercises.map((exercise, index) => <ExerciseGuide key={exercise.id} exercise={exercise} index={index + 1} />)}</div></div>; }
function ExerciseGuide({ exercise, index }: { exercise: TitanExercise; index: number }) { const cardio = isCardio(exercise); return <details className="programming-exercise-card"><summary><span className="programming-exercise-order">{index}</span><span><strong>{exercise.name}</strong><small>{cardio ? cardioPrescription(exercise) : `${exercise.sets ?? 1} séries · ${repRange(exercise)}`}</small></span><span className="programming-chevron">⌄</span></summary><div className="programming-exercise-guide"><InfoRow label="Tipo" value={exerciseTypeLabel(exercise)} /><InfoRow label="Grupo / foco" value={exercise.muscleGroup} />{!cardio && <InfoRow label="Descanso" value={exercise.restSeconds ? `${exercise.restSeconds}s` : 'A definir'} />}{exercise.cardioZone && <InfoRow label="Zona" value={exercise.cardioZone} />}{exercise.technique && <GuideBlock title="Execução" text={exercise.technique} />}{exercise.notes && <GuideBlock title="Orientação" text={exercise.notes} />}{exercise.commonMistakes?.length ? <GuideList title="Erros comuns" items={exercise.commonMistakes} /> : null}{exercise.alternativeExercises?.length ? <GuideList title="Alternativas" items={exercise.alternativeExercises.map((item) => item.name)} /> : exercise.alternatives?.length ? <GuideList title="Alternativas" items={exercise.alternatives} /> : null}</div></details>; }
function DayLabel({ day }: { day: string }) { return <span className="programming-day-label"><strong>{day.slice(0, 3).toUpperCase()}</strong></span>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="programming-info-row"><span>{label}</span><strong>{value}</strong></div>; }
function GuideBlock({ title, text }: { title: string; text: string }) { return <div className="programming-guide-block"><span className="eyebrow">{title.toUpperCase()}</span><p>{text}</p></div>; }
function GuideList({ title, items }: { title: string; items: string[] }) { return <div className="programming-guide-block"><span className="eyebrow">{title.toUpperCase()}</span><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
function isStrength(exercise: TitanExercise) { return (exercise.exerciseType ?? 'strength') === 'strength'; }
function isCardio(exercise: TitanExercise) { return exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance'; }
function workoutSummary(workout: TitanWorkoutDay) { const strength = workout.exercises.filter(isStrength).length; const cardio = workout.exercises.filter(isCardio).length; const parts = [`${workout.exercises.length} etapas`]; if (strength) parts.push(`${strength} de musculação`); if (cardio) parts.push(`${cardio} de cardio`); return `${workout.focus ?? 'Sessão programada'} · ${parts.join(' · ')}`; }
function cardioPrescription(exercise: TitanExercise) { const parts: string[] = []; if (exercise.durationSeconds) parts.push(`${Math.round(exercise.durationSeconds / 60)} min`); if (exercise.distanceMeters) parts.push(`${(exercise.distanceMeters / 1000).toFixed(1).replace('.', ',')} km`); if (exercise.cardioZone) parts.push(exercise.cardioZone); return parts.join(' · ') || 'Cardio programado'; }
function exerciseTypeLabel(exercise: TitanExercise) { if (exercise.exerciseType === 'distance') return 'Distância'; if (exercise.exerciseType === 'cardio') return 'Cardio'; if (exercise.exerciseType === 'mobility') return 'Mobilidade'; if (exercise.exerciseType === 'isometric') return 'Isometria'; return 'Musculação'; }
function repRange(exercise: TitanExercise) { if (exercise.minReps && exercise.maxReps) return `${exercise.minReps}–${exercise.maxReps} reps`; if (exercise.maxReps) return `até ${exercise.maxReps} reps`; if (exercise.minReps) return `${exercise.minReps}+ reps`; return 'reps a definir'; }
function dayIndex(value: string) { const normalized = normalize(value); const index = DAY_ORDER.findIndex((day) => normalized.includes(day)); return index === -1 ? 99 : index; }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
