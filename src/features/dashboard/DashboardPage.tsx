import { getExerciseSessions, getProgressionAdvice } from '../history/intelligence';
import { loadWorkoutHistory } from '../history/storage';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanPlan, TitanWorkoutDay } from '../plan/types';
import { WorkoutMuscleArt } from './WorkoutMuscleArt';

type DashboardPageProps = { plan: TitanPlan | null; onOpenPlan: () => void; onStartWorkout: (workoutId: string) => void; onOpenProgress: () => void; };
type CoachStatus = 'insufficient' | 'maintain' | 'progress' | 'review' | 'stagnant';
type CoachPriority = { status: CoachStatus; badge: string; title: string; message: string; detail: string; context?: string };
type WorkoutVisual = 'legs' | 'chest' | 'back' | 'shoulders' | 'arms' | 'full';
const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function getWorkoutVisual(title = '', focus = ''): WorkoutVisual { const value = normalize(`${title} ${focus}`); if (/leg|perna|quadr|posterior|glute|panturr/.test(value)) return 'legs'; if (/peit|peitor|chest|push/.test(value)) return 'chest'; if (/cost|dors|back|pull/.test(value)) return 'back'; if (/ombro|delto|shoulder/.test(value)) return 'shoulders'; if (/biceps|triceps|braco|arm/.test(value)) return 'arms'; return 'full'; }
function getTodayWorkout(plan: TitanPlan): TitanWorkoutDay | null { const today = WEEKDAYS[new Date().getDay()]; return plan.workouts.find((workout) => normalize(workout.day).includes(today)) ?? plan.workouts[0] ?? null; }
function getGreeting() { const hour = new Date().getHours(); if (hour < 12) return 'Bom dia'; if (hour < 18) return 'Boa tarde'; return 'Boa noite'; }
function formatToday() { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()); }

export function DashboardPage({ plan, onOpenPlan, onStartWorkout }: DashboardPageProps) {
  if (!plan) return <div className="dashboard-page"><section className="dashboard-welcome"><span className="eyebrow">SEU PROJETO COMEÇA AQUI</span><h2>Nenhum projeto ativo</h2><p>Importe seu Projeto TITAN para liberar treino, cardio e progressão.</p><button type="button" className="primary-action" onClick={onOpenPlan}>Importar projeto</button></section></div>;

  const workout = getTodayWorkout(plan);
  const exerciseCount = workout?.exercises.length ?? 0;
  const setCount = workout?.exercises.reduce((total, exercise) => total + Math.max(1, exercise.sets ?? 1), 0) ?? 0;
  const cardioCount = workout?.exercises.filter((exercise) => ['cardio','distance'].includes(exercise.exerciseType ?? '')).length ?? 0;
  const strengthStart = plan.project?.strengthStartTime ?? '20:00';
  const history = loadWorkoutHistory();
  const coach = getTodayCoachPriority(workout);
  const visual = getWorkoutVisual(workout?.title, workout?.focus);
  const nextCardio = plan.project?.cardioSchedule?.[0] ?? null;
  const latestCardio = getLatestCardio(history);

  return <div className="dashboard-page dashboard-page-clean">
    <section className="dashboard-heading"><div><span className="eyebrow">{formatToday()}</span><h2>{getGreeting()}, Otávio</h2><p>{plan.project?.name ?? plan.name}</p></div></section>
    <section className="today-workout" aria-labelledby="today-workout-title">
      <WorkoutMuscleArt visual={visual} />
      <div className="today-workout-topline"><span className="eyebrow">TREINO COMPLETO · {strengthStart}</span><span className="today-workout-day">{workout?.day ?? 'Hoje'}</span></div>
      <h3 id="today-workout-title">{workout?.title ?? 'Treino disponível'}</h3>
      <p>{workout?.focus ?? 'Siga o projeto e registre cada exercício.'}</p>
      <div className="today-workout-metrics"><span><strong>{exerciseCount}</strong> exercícios</span><span><strong>{setCount}</strong> registros</span>{cardioCount > 0 && <span><strong>{cardioCount}</strong> cardio</span>}</div>
      <button type="button" className="primary-action" disabled={!workout} onClick={() => workout && onStartWorkout(workout.id)}>Iniciar treino</button>
    </section>

    <section className="dashboard-cardio-card" aria-label="Resumo de cardio">
      <div><span className="eyebrow">CARDIO</span><strong>{nextCardio?.title ?? 'Sessão livre disponível'}</strong><p>{nextCardio ? `${nextCardio.day} · ${nextCardio.durationMinutes ?? '—'} min` : 'Registre Zona 2, caminhada, corrida ou HIIT pela aba Cardio.'}</p></div>
      <div className="dashboard-cardio-stats"><span><small>Último</small><strong>{latestCardio ? formatCardioDuration(latestCardio.durationSeconds) : '—'}</strong></span><span><small>Distância</small><strong>{latestCardio?.distanceMeters ? `${(latestCardio.distanceMeters / 1000).toFixed(2)} km` : '—'}</strong></span></div>
    </section>

    <section className={`dashboard-coach-card status-${coach.status}`} aria-label="Prioridade do Coach TITAN">
      <div className="dashboard-coach-topline"><span className="eyebrow">COACH TITAN · v0.29.1</span><span>{coach.badge}</span></div>
      <strong>{coach.title}</strong><p>{coach.message}</p>{coach.context && <small className="coach-context">{coach.context}</small>}{coach.detail && <details><summary>Ver orientação</summary><p>{coach.detail}</p></details>}
    </section>
  </div>;
}

function getLatestCardio(records: WorkoutHistoryRecord[]) { for (const record of records) { for (const exercise of record.exercises) { if (exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance') return { durationSeconds: exercise.totalDurationSeconds, distanceMeters: exercise.totalDistanceMeters }; } } return null; }
function formatCardioDuration(seconds: number) { if (!seconds) return '—'; return `${Math.max(1, Math.round(seconds / 60))} min`; }

function getTodayCoachPriority(workout: TitanWorkoutDay | null): CoachPriority {
  if (!workout) return { status: 'insufficient', badge: 'SEM TREINO', title: 'Nenhuma prioridade hoje', message: 'Importe ou selecione um treino para o Coach analisar.', detail: '' };
  const records = loadWorkoutHistory();
  if (!records.length) return { status: 'insufficient', badge: 'CRIANDO BASE', title: 'Primeiro treino de referência', message: 'Hoje o objetivo é registrar cargas, repetições e RIR com consistência.', detail: 'A primeira execução cria sua linha de base e não conta como PR.' };
  const strengthExercises = workout.exercises.filter((exercise) => (exercise.exerciseType ?? 'strength') === 'strength');
  const analyses = strengthExercises.map((exercise) => { const advice = getProgressionAdvice(records, exercise.id); const sessions = getExerciseSessions(records, exercise.id).slice(0, 3); return { exercise, advice, sessions, stagnant: isStagnant(sessions) }; });
  const review = analyses.find((item) => item.advice.status === 'review');
  if (review) return { status: 'review', badge: 'ATENÇÃO', title: `${review.exercise.name} · ${review.advice.title}`, message: compactCoachMessage(review.advice.message), detail: review.advice.message, context: buildContext(records) };
  const stagnant = analyses.find((item) => item.stagnant);
  if (stagnant) return { status: 'stagnant', badge: 'ESTAGNAÇÃO', title: `${stagnant.exercise.name} · destravar progresso`, message: 'As últimas 3 sessões ficaram praticamente no mesmo nível.', detail: 'Mantenha a carga atual e tente ganhar 1 repetição total ou melhorar a execução antes de subir o peso.', context: buildContext(records) };
  const progressItems = analyses.filter((item) => item.advice.status === 'progress');
  if (progressItems.length) { const selected = progressItems[0]; return { status: 'progress', badge: 'PROGREDIR', title: `${selected.exercise.name} · ${selected.advice.title}`, message: compactCoachMessage(selected.advice.message), detail: progressItems.length > 1 ? `${selected.advice.message} Há ${progressItems.length} exercícios do treino de hoje com sinal positivo de progressão.` : selected.advice.message, context: buildContext(records) }; }
  const improvingReps = analyses.find((item) => item.advice.trend === 'improving');
  if (improvingReps) return { status: 'maintain', badge: 'EVOLUINDO', title: `${improvingReps.exercise.name} · consolidar evolução`, message: compactCoachMessage(improvingReps.advice.message), detail: improvingReps.advice.message, context: buildContext(records) };
  const selected = analyses.find((item) => item.advice.status !== 'insufficient');
  if (!selected) return { status: 'insufficient', badge: 'CRIANDO BASE', title: 'Continue registrando', message: 'Ainda faltam comparações suficientes no treino de hoje.', detail: 'Depois de repetir os exercícios, o Coach passa a sugerir quando manter, progredir ou revisar.', context: buildContext(records) };
  return { status: 'maintain', badge: 'MANTER', title: `${selected.exercise.name} · ${selected.advice.title}`, message: compactCoachMessage(selected.advice.message), detail: selected.advice.message, context: buildContext(records) };
}

function isStagnant(sessions: ReturnType<typeof getExerciseSessions>) { if (sessions.length < 3) return false; const performance = sessions.slice(0, 3).map(({ exercise }) => { const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0); return { maxWeight: valid.length ? Math.max(...valid.map((set) => set.weightKg ?? 0)) : 0, totalReps: valid.reduce((sum, set) => sum + (set.repetitions ?? 0), 0) }; }); if (performance.some((item) => item.maxWeight <= 0 || item.totalReps <= 0)) return false; const sameLoad = performance.every((item) => item.maxWeight === performance[0].maxWeight); const repSpread = Math.max(...performance.map((item) => item.totalReps)) - Math.min(...performance.map((item) => item.totalReps)); return sameLoad && repSpread <= 1; }
function buildContext(records: WorkoutHistoryRecord[]) { const last30 = records.filter((record) => Date.now() - new Date(record.completedAt).getTime() <= 30 * 24 * 60 * 60 * 1000); const sessions = last30.length; const prs = countPrEvents(last30); const cardios = last30.flatMap((record) => record.exercises).filter((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance').length; if (!sessions) return undefined; return `${sessions} treino${sessions === 1 ? '' : 's'} · ${prs} PR${prs === 1 ? '' : 's'} · ${cardios} cardio${cardios === 1 ? '' : 's'} nos últimos 30 dias`; }
function countPrEvents(records: WorkoutHistoryRecord[]) { const byExercise = new Map<string, Array<{ completedAt: string; weight: number; reps: number }>>(); for (const record of [...records].sort((a, b) => a.completedAt.localeCompare(b.completedAt))) { for (const exercise of record.exercises) { if ((exercise.exerciseType ?? 'strength') !== 'strength') continue; const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0); if (!valid.length) continue; const best = [...valid].sort((a, b) => ((b.weightKg ?? 0) * (b.repetitions ?? 0)) - ((a.weightKg ?? 0) * (a.repetitions ?? 0)))[0]; const list = byExercise.get(exercise.exerciseId) ?? []; list.push({ completedAt: record.completedAt, weight: best.weightKg ?? 0, reps: best.repetitions ?? 0 }); byExercise.set(exercise.exerciseId, list); } } let count = 0; for (const sessions of byExercise.values()) { let bestWeight = -1; let bestScore = -1; sessions.forEach((session, index) => { const score = session.weight * session.reps; if (index === 0) { bestWeight = session.weight; bestScore = score; return; } if (session.weight > bestWeight || score > bestScore) count += 1; bestWeight = Math.max(bestWeight, session.weight); bestScore = Math.max(bestScore, score); }); } return count; }
function compactCoachMessage(message: string) { const first = message.split('. ')[0]; return first.endsWith('.') ? first : `${first}.`; }
