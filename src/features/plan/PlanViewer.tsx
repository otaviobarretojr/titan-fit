import { useState } from 'react';
import { SimpleWorkoutExecutionView } from '../workout/SimpleWorkoutExecutionView';
import type { ExerciseType, TitanExercise, TitanPlan, TitanWorkoutDay } from './types';

type Props = { plan: TitanPlan; initialWorkoutId?: string | null; onImportAnother: () => void; onRemove: () => void; onHistoryChange: () => void; onExitWorkout?: () => void; onDirectStartHandled?: () => void };

export function PlanViewer({ plan, initialWorkoutId, onImportAnother, onRemove, onHistoryChange, onExitWorkout, onDirectStartHandled }: Props) {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [executingWorkoutId, setExecutingWorkoutId] = useState<string | null>(() => initialWorkoutId ?? null);
  const selectedWorkout = plan.workouts.find((workout) => workout.id === selectedWorkoutId) ?? null;
  const selectedExercise = selectedWorkout?.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;
  const executingWorkout = plan.workouts.find((workout) => workout.id === executingWorkoutId) ?? null;

  if (executingWorkout) return <SimpleWorkoutExecutionView planId={plan.id} planName={plan.name} workout={executingWorkout} onBack={() => { setExecutingWorkoutId(null); setSelectedWorkoutId(null); onDirectStartHandled?.(); onExitWorkout?.(); }} onCompleted={() => { setExecutingWorkoutId(null); setSelectedWorkoutId(null); onDirectStartHandled?.(); onHistoryChange(); }} />;
  if (selectedWorkout && selectedExercise) return <ExerciseDetail exercise={selectedExercise} workout={selectedWorkout} onBack={() => setSelectedExerciseId(null)} />;
  if (selectedWorkout) return <WorkoutDetail workout={selectedWorkout} onBack={() => setSelectedWorkoutId(null)} onSelectExercise={setSelectedExerciseId} onStart={() => setExecutingWorkoutId(selectedWorkout.id)} />;

  const exerciseCount = plan.workouts.reduce((total, workout) => total + workout.exercises.length, 0);
  return <><section className="section-header"><span className="eyebrow">PROJETO ATIVO</span><h2>{plan.project?.name ?? plan.name}</h2>{plan.description && <p>{plan.description}</p>}<p>{plan.workouts.length} treinos • {exerciseCount} exercícios</p></section>
    <section className="section-header"><span className="eyebrow">TREINOS</span><h2>Projeto completo</h2><p>Programação ativa de musculação e cardio integrado.</p></section>
    <section className="workout-list">{plan.workouts.map((workout) => <button type="button" className="workout-card workout-card-button" key={workout.id} onClick={() => setSelectedWorkoutId(workout.id)}><div><span className="info-label">{workout.day}</span><h3>{workout.title}</h3>{workout.focus && <p>{workout.focus}</p>}</div><span className="workout-count">{workout.exercises.length}<small>exercícios</small></span></button>)}</section>
    <div className="stack-actions"><button type="button" className="secondary-action" onClick={onImportAnother}>Importar outro projeto</button><button type="button" className="danger-action" onClick={onRemove}>Remover projeto</button></div></>;
}

function WorkoutDetail({ workout, onBack, onSelectExercise, onStart }: { workout: TitanWorkoutDay; onBack: () => void; onSelectExercise: (id: string) => void; onStart: () => void }) {
  return <><button type="button" className="secondary-action back-action" onClick={onBack}>← Voltar para o projeto</button><section className="section-header"><span className="eyebrow">{workout.day.toUpperCase()}</span><h2>{workout.title}</h2>{workout.focus && <p>{workout.focus}</p>}<p>{workout.exercises.length} exercícios</p><button type="button" className="primary-action start-session" onClick={onStart}>Iniciar treino</button></section><section className="exercise-list">{workout.exercises.map((exercise, index) => <button type="button" className="exercise-card" key={exercise.id} onClick={() => onSelectExercise(exercise.id)}><span className="exercise-order">{index + 1}</span><div className="exercise-card-content"><span className="info-label">{exercise.muscleGroup} · {typeLabel(exercise.exerciseType ?? 'strength')}</span><h3>{exercise.name}</h3><p>{formatPrescription(exercise)}</p></div><span className="exercise-arrow">›</span></button>)}</section></>;
}

function ExerciseDetail({ exercise, workout, onBack }: { exercise: TitanExercise; workout: TitanWorkoutDay; onBack: () => void }) {
  const type = exercise.exerciseType ?? 'strength';
  return <><button type="button" className="secondary-action back-action" onClick={onBack}>← Voltar para o treino</button><section className="exercise-detail-header"><span className="eyebrow">{workout.title.toUpperCase()}</span><h2>{exercise.name}</h2><p>{exercise.muscleGroup} · {typeLabel(type)}</p></section><section className="prescription-grid">{metrics(exercise).map((metric) => <Metric key={metric.label} {...metric} />)}</section>{exercise.technique && <DetailSection title="Técnica" text={exercise.technique} />}{exercise.commonMistakes?.length ? <ListSection title="Erros comuns" items={exercise.commonMistakes} /> : null}{exercise.progression?.length ? <section className="detail-card"><span className="info-label">PROGRESSÃO PLANEJADA</span>{exercise.progression.map((step) => <p key={`${step.startWeek}-${step.endWeek}`}><strong>Semanas {step.startWeek}–{step.endWeek}:</strong> {step.inclinePercent ?? '—'}% · {step.speedMinKmh ?? step.speedKmh ?? '—'}–{step.speedMaxKmh ?? step.speedKmh ?? '—'} km/h</p>)}</section> : null}</>;
}

function metrics(exercise: TitanExercise) { const type=exercise.exerciseType ?? 'strength'; const result=[] as Array<{label:string;value:string}>; if(exercise.sets)result.push({label:'Séries',value:String(exercise.sets)}); if(type==='strength')result.push({label:'Repetições',value:formatRepetitions(exercise)}); if(type==='distance')result.push({label:'Distância',value:exercise.minDistanceMeters&&exercise.maxDistanceMeters?`${exercise.minDistanceMeters}–${exercise.maxDistanceMeters} m`:`${exercise.distanceMeters??'—'} m`}); if(['cardio','isometric','mobility'].includes(type))result.push({label:'Tempo',value:formatDuration(exercise.durationSeconds)}); if(type==='cardio'&&exercise.inclinePercent!==undefined)result.push({label:'Inclinação',value:`${exercise.inclinePercent}%`}); if(exercise.restSeconds!==undefined&&exercise.restSeconds>0)result.push({label:'Descanso',value:formatRest(exercise.restSeconds)}); return result; }
function Metric({label,value}:{label:string;value:string}){return <div className="metric-card"><span className="info-label">{label}</span><strong>{value}</strong></div>;}
function DetailSection({title,text}:{title:string;text:string}){return <section className="detail-card"><span className="info-label">{title.toUpperCase()}</span><p>{text}</p></section>;}
function ListSection({title,items}:{title:string;items:string[]}){return <section className="detail-card"><span className="info-label">{title.toUpperCase()}</span><ul>{items.map((item)=><li key={item}>{item}</li>)}</ul></section>;}
function formatPrescription(exercise:TitanExercise){return metrics(exercise).map((item)=>item.value).join(' • ');}
function formatRepetitions(exercise:TitanExercise){if(exercise.minReps!==undefined&&exercise.maxReps!==undefined)return exercise.minReps===exercise.maxReps?String(exercise.minReps):`${exercise.minReps}–${exercise.maxReps}`;return '—';}
function formatRest(seconds:number){if(seconds<60)return `${seconds}s`;return `${Math.floor(seconds/60)}m${seconds%60?` ${seconds%60}s`:''}`;}
function formatDuration(seconds?:number){return seconds?`${Math.round(seconds/60)} min`:'—';}
function typeLabel(type:ExerciseType){return ({strength:'Musculação',distance:'Distância',cardio:'Cardio',isometric:'Isometria',mobility:'Mobilidade'})[type];}
