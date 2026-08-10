import { useMemo, useState } from 'react';
import { ExerciseLibraryPage } from '../exercise-library/ExerciseLibraryPage';
import { NutritionProgramPanel } from '../nutrition/NutritionProgramPanel';
import type { TitanExercise, TitanPlan, TitanWorkoutDay } from '../plan/types';
import '../../styles/nutrition-v053.css';

type Props = { plan: TitanPlan | null };
type ProgrammingTab = 'week' | 'nutrition' | 'library';
const DAY_ORDER = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const JS_DAY_TO_TITAN = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export function ProgrammingPage({ plan }: Props) {
  const [selected, setSelected] = useState<TitanWorkoutDay | null>(null);
  const [activeTab, setActiveTab] = useState<ProgrammingTab>('week');
  const today = JS_DAY_TO_TITAN[new Date().getDay()];
  const workouts = useMemo(() => !plan ? [] : [...plan.workouts].sort((a, b) => dayIndex(a.day) - dayIndex(b.day)), [plan]);

  if (selected) return <WorkoutDetail workout={selected} onBack={() => setSelected(null)} />;

  const todayWorkout = workouts.find((item) => normalize(item.day).includes(today));
  const nextDay = DAY_ORDER[(DAY_ORDER.indexOf(today) + 1) % DAY_ORDER.length];

  return <div className="programming-page">
    <section className="section-header programming-header"><span className="eyebrow">PLANEJAMENTO TITAN</span><h2>Programação</h2><p>Treino, cardio e dieta organizados em uma única programação semanal.</p></section>

    <div className="programming-tabs programming-tabs-v053" role="tablist" aria-label="Conteúdo da programação">
      <button type="button" role="tab" aria-selected={activeTab === 'week'} className={activeTab === 'week' ? 'active' : ''} onClick={() => setActiveTab('week')}>Treino</button>
      <button type="button" role="tab" aria-selected={activeTab === 'nutrition'} className={activeTab === 'nutrition' ? 'active' : ''} onClick={() => setActiveTab('nutrition')}>Dieta</button>
      <button type="button" role="tab" aria-selected={activeTab === 'library'} className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>Biblioteca</button>
    </div>

    {activeTab === 'library' && <ExerciseLibraryPage />}
    {activeTab === 'nutrition' && <NutritionProgramPanel />}

    {activeTab === 'week' && (!plan ? <ProgrammingEmpty /> : <>
      <section className="programming-today" aria-label="Treino de hoje"><div><span className="eyebrow">HOJE · {today.slice(0, 3).toUpperCase()}</span><h3>{todayWorkout?.title ?? 'Recuperação'}</h3><p>{todayWorkout ? workoutSummary(todayWorkout) : 'Sem sessão programada para hoje'}</p></div></section>
      <section className="programming-section" aria-labelledby="week-program-title"><div className="programming-section-head"><div><span className="programming-section-icon strength">⌁</span><div><span className="eyebrow">DOMINGO → SÁBADO</span><h3 id="week-program-title">Treinos da semana</h3></div></div><small>{workouts.length} dias programados</small></div><div className="programming-list">{DAY_ORDER.map((day) => {
        const workout = workouts.find((item) => normalize(item.day).includes(day));
        const isToday = day === today;
        const isTomorrow = day === nextDay;
        if (!workout) return <article className={`programming-day-card rest${isToday ? ' today' : ''}`} key={day}><DayLabel day={day} isToday={isToday} /><div className="programming-day-copy"><strong>Recuperação</strong><small>Sem sessão programada</small></div><DayStatus isToday={isToday} isTomorrow={isTomorrow} fallback="DESCANSO" /></article>;
        return <button type="button" className={`programming-day-card${isToday ? ' today' : ''}`} key={workout.id} onClick={() => setSelected(workout)}><DayLabel day={day} isToday={isToday} /><div className="programming-day-copy"><strong>{workout.title}</strong><small>{workoutSummary(workout)}</small></div><DayStatus isToday={isToday} isTomorrow={isTomorrow} /></button>;
      })}</div></section>
    </>)}
  </div>;
}

function ProgrammingEmpty() { return <section className="programming-empty"><span className="eyebrow">PROGRAMAÇÃO</span><h2>Nenhum projeto de treino ativo</h2><p>Importe ou gere um projeto de treino para preencher esta área. O plano nutricional é independente e pode ser inserido pela aba Dieta.</p></section>; }

function WorkoutDetail({ workout, onBack }: { workout: TitanWorkoutDay; onBack: () => void }) {
  const strength = workout.exercises.filter(isStrength);
  const cardio = workout.exercises.filter(isCardio);
  return <div className="programming-detail"><button type="button" className="secondary-action programming-back" onClick={onBack}>‹ Voltar à programação</button><section className="programming-detail-hero"><span className="eyebrow">{workout.day.toUpperCase()} · PROJETO TITAN</span><h2>{workout.title}</h2><p>{workout.focus ?? 'Sessão programada no projeto ativo.'}</p><div className="programming-detail-summary"><span><small>Etapas</small><strong>{workout.exercises.length}</strong></span>{strength.length > 0 && <span><small>Séries</small><strong>{strength.reduce((sum, exercise) => sum + (exercise.sets ?? 1), 0)}</strong></span>}{cardio.length > 0 && <span><small>Cardio</small><strong>{cardio.length}</strong></span>}</div></section><div className="programming-exercise-list">{workout.exercises.map((exercise, index) => <ExerciseGuide key={exercise.id} exercise={exercise} index={index + 1} />)}</div></div>;
}

function ExerciseGuide({ exercise, index }: { exercise: TitanExercise; index: number }) {
  const cardio = isCardio(exercise);
  return <details className="programming-exercise-card"><summary><span className="programming-exercise-order">{index}</span><span><strong>{exercise.name}</strong><small>{cardio ? cardioPrescription(exercise) : `${exercise.sets ?? 1} séries · ${repRange(exercise)} · RIR ${exercise.targetRir ?? '—'}`}</small></span><span className="programming-chevron">⌄</span></summary><div className="programming-exercise-guide"><InfoRow label="Tipo" value={exerciseTypeLabel(exercise)} /><InfoRow label="Grupo / foco" value={exercise.muscleGroup} />{!cardio && <InfoRow label="Descanso" value={exercise.restSeconds ? `${exercise.restSeconds}s` : 'A definir'} />}{exercise.cardioZone && <InfoRow label="Zona" value={exercise.cardioZone} />}{exercise.technique && <GuideBlock title="Execução" text={exercise.technique} />}{exercise.notes && <GuideBlock title="Orientação" text={exercise.notes} />}{exercise.commonMistakes?.length ? <GuideList title="Erros comuns" items={exercise.commonMistakes} /> : null}{exercise.alternativeExercises?.length ? <GuideList title="Alternativas" items={exercise.alternativeExercises.map((item) => item.name)} /> : exercise.alternatives?.length ? <GuideList title="Alternativas" items={exercise.alternatives} /> : null}</div></details>;
}

function DayLabel({ day, isToday = false }: { day: string; isToday?: boolean }) { return <span className={`programming-day-label${isToday ? ' active' : ''}`}><strong>{day.slice(0, 3).toUpperCase()}</strong></span>; }
function DayStatus({ isToday, isTomorrow, fallback }: { isToday: boolean; isTomorrow: boolean; fallback?: string }) { if (isToday) return <span className="programming-tag today-tag">HOJE</span>; if (isTomorrow) return <span className="programming-tag tomorrow-tag">AMANHÃ</span>; if (fallback) return <span className="programming-tag">{fallback}</span>; return <span className="programming-chevron">›</span>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="programming-info-row"><span>{label}</span><strong>{value}</strong></div>; }
function GuideBlock({ title, text }: { title: string; text: string }) { return <div className="programming-guide-block"><span className="eyebrow">{title.toUpperCase()}</span><p>{text}</p></div>; }
function GuideList({ title, items }: { title: string; items: string[] }) { return <div className="programming-guide-block"><span className="eyebrow">{title.toUpperCase()}</span><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
function isStrength(exercise: TitanExercise) { return (exercise.exerciseType ?? 'strength') === 'strength'; }
function isCardio(exercise: TitanExercise) { return exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance'; }
function workoutSummary(workout: TitanWorkoutDay) { const strength = workout.exercises.filter(isStrength).length; const cardio = workout.exercises.filter(isCardio).length; const parts = [`${workout.exercises.length} etapas`]; if (strength) parts.push(`${strength} de musculação`); if (cardio) parts.push(`${cardio} de cardio`); return `${workout.focus ?? 'Sessão programada'} · ${parts.join(' · ')}`; }
function cardioPrescription(exercise: TitanExercise) { const parts: string[] = []; if (exercise.durationSeconds) parts.push(`${Math.round(exercise.durationSeconds / 60)} min`); if (exercise.distanceMeters) parts.push(`${(exercise.distanceMeters / 1000).toFixed(1).replace('.', ',')} km`); if (exercise.cardioZone) parts.push(exercise.cardioZone); if (exercise.targetHeartRateMin || exercise.targetHeartRateMax) parts.push(`FC ${exercise.targetHeartRateMin ?? '—'}–${exercise.targetHeartRateMax ?? '—'}`); return parts.join(' · ') || 'Cardio programado'; }
function exerciseTypeLabel(exercise: TitanExercise) { if (exercise.exerciseType === 'distance') return 'Distância'; if (exercise.exerciseType === 'cardio') return 'Cardio'; if (exercise.exerciseType === 'mobility') return 'Mobilidade'; if (exercise.exerciseType === 'isometric') return 'Isometria'; return 'Musculação'; }
function repRange(exercise: TitanExercise) { if (exercise.minReps && exercise.maxReps) return `${exercise.minReps}–${exercise.maxReps} reps`; if (exercise.maxReps) return `até ${exercise.maxReps} reps`; if (exercise.minReps) return `${exercise.minReps}+ reps`; return 'reps a definir'; }
function dayIndex(value: string) { const normalized = normalize(value); const index = DAY_ORDER.findIndex((day) => normalized.includes(day)); return index === -1 ? 99 : index; }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
