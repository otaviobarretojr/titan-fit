import { getExerciseSessions, getProgressionAdvice } from '../history/intelligence';
import { loadWorkoutHistory } from '../history/storage';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanCardioSession, TitanExercise, TitanPlan, TitanWorkoutDay } from '../plan/types';
import { WorkoutMuscleArt } from './WorkoutMuscleArt';
import { buildWeeklyCoachSummary } from './weeklyCoach';
import { buildTitanScore } from './titanScore';

type DashboardPageProps = { plan: TitanPlan | null; onOpenPlan: () => void; onStartWorkout: (workoutId: string) => void; onOpenProgress: () => void; };
type CoachStatus = 'insufficient' | 'maintain' | 'progress' | 'review' | 'stagnant';
type CoachPriority = { status: CoachStatus; badge: string; title: string; message: string; detail: string; context?: string };
type WorkoutVisual = 'legs' | 'chest' | 'back' | 'shoulders' | 'arms' | 'full';
type TodayCardio = { title: string; day: string; durationMinutes: number | null; startTime?: string; zone?: string; detail?: string };
const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function getWorkoutVisual(title = '', focus = ''): WorkoutVisual { const value = normalize(`${title} ${focus}`); if (/leg|perna|quadr|posterior|glute|panturr/.test(value)) return 'legs'; if (/peit|peitor|chest|push/.test(value)) return 'chest'; if (/cost|dors|back|pull/.test(value)) return 'back'; if (/ombro|delto|shoulder/.test(value)) return 'shoulders'; if (/biceps|triceps|braco|arm/.test(value)) return 'arms'; return 'full'; }
function getTodayName() { return WEEKDAYS[new Date().getDay()]; }
function matchesToday(day: string) { return normalize(day).includes(getTodayName()); }
function getTodayWorkout(plan: TitanPlan): TitanWorkoutDay | null { return plan.workouts.find((workout) => matchesToday(workout.day)) ?? null; }
function isStrength(exercise: TitanExercise) { return (exercise.exerciseType ?? 'strength') === 'strength'; }
function isCardio(exercise: TitanExercise) { return exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance'; }
function getGreeting() { const hour = new Date().getHours(); if (hour < 12) return 'Bom dia'; if (hour < 18) return 'Boa tarde'; return 'Boa noite'; }
function formatToday() { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()); }

export function DashboardPage({ plan, onOpenPlan, onStartWorkout }: DashboardPageProps) {
  if (!plan) return <div className="dashboard-page"><section className="dashboard-welcome"><span className="eyebrow">SEU PROJETO COMEÇA AQUI</span><h2>Nenhum projeto ativo</h2><p>Importe seu Projeto TITAN para liberar treino, cardio e progressão.</p><button type="button" className="primary-action" onClick={onOpenPlan}>Importar projeto</button></section></div>;

  const dayPlan = getTodayWorkout(plan);
  const strengthExercises = dayPlan?.exercises.filter(isStrength) ?? [];
  const hasStrengthToday = strengthExercises.length > 0;
  const exerciseCount = strengthExercises.length;
  const setCount = strengthExercises.reduce((total, exercise) => total + Math.max(1, exercise.sets ?? 1), 0);
  const strengthStart = plan.project?.strengthStartTime ?? '20:00';
  const history = loadWorkoutHistory();
  const todayCardio = getTodayCardio(plan, dayPlan);
  const cardioDisplay: TodayCardio = todayCardio ?? { title: 'Cardio diário', day: 'Hoje', durationMinutes: null, zone: undefined, detail: 'O cardio faz parte da rotina diária. Tempo e zona ainda não estão definidos no projeto.' };
  const coach = getTodayCoachPriority(hasStrengthToday ? dayPlan : null, Boolean(todayCardio));
  const weeklyCoach = buildWeeklyCoachSummary(plan, history);
  const titanScore = buildTitanScore(plan, history);
  const visual = getWorkoutVisual(dayPlan?.title, dayPlan?.focus);

  const cardioCard = <section className={`dashboard-cardio-card today-cardio-highlight${!todayCardio ? ' cardio-unconfigured' : ''}`} aria-label="Cardio de hoje">
    <div><span className="eyebrow">CARDIO DE HOJE</span><strong>{cardioDisplay.title}</strong><p>{buildTodayCardioLine(cardioDisplay)}</p>{cardioDisplay.detail && <p>{cardioDisplay.detail}</p>}</div>
    <div className="dashboard-cardio-stats"><span><small>Tempo</small><strong>{cardioDisplay.durationMinutes ? `${cardioDisplay.durationMinutes} min` : 'A definir'}</strong></span><span><small>Zona</small><strong>{cardioDisplay.zone ?? 'A definir'}</strong></span></div>
  </section>;

  return <div className="dashboard-page dashboard-page-clean">
    <section className="dashboard-heading"><div><span className="eyebrow">{formatToday()}</span><h2>{getGreeting()}, Otávio</h2><p>{plan.project?.name ?? plan.name}</p></div></section>

    {hasStrengthToday && dayPlan ? <>
      <section className="today-workout" aria-labelledby="today-workout-title">
        <WorkoutMuscleArt visual={visual} />
        <div className="today-workout-topline"><span className="eyebrow">TREINO COMPLETO · {strengthStart}</span><span className="today-workout-day">{dayPlan.day}</span></div>
        <h3 id="today-workout-title">{dayPlan.title}</h3>
        <p>{dayPlan.focus ?? 'Siga o projeto e registre cada exercício.'}</p>
        <div className="today-workout-metrics"><span><strong>{exerciseCount}</strong> exercícios</span><span><strong>{setCount}</strong> registros</span></div>
        <button type="button" className="primary-action" onClick={() => onStartWorkout(dayPlan.id)}>Iniciar treino</button>
      </section>
      {cardioCard}
    </> : <>
      {cardioCard}
      <section className="today-rest-card" aria-label="Descanso da musculação">
        <span className="eyebrow">MUSCULAÇÃO</span>
        <h3>Descanso da musculação</h3>
        <p>{todayCardio ? 'Hoje o foco principal está no cardio programado.' : 'Hoje não há musculação programada. O cardio diário continua previsto, mas falta definir tempo e zona no projeto.'}</p>
        <span className="today-rest-badge">SEM MUSCULAÇÃO HOJE</span>
      </section>
    </>}

    <section className={`titan-score-card status-${titanScore.status}`} aria-label="Score TITAN">
      <div className="titan-score-main">
        <div><span className="eyebrow">SCORE TITAN</span><strong>{titanScore.label}</strong><p>{titanScore.message}</p></div>
        <div className="titan-score-value">{titanScore.score ?? '—'}<small>{titanScore.score === null ? 'BASE' : '/100'}</small></div>
      </div>
      {titanScore.score !== null && <div className="titan-score-pillars">
        <span><small>Musculação</small><strong>{titanScore.strengthScore}/35</strong></span>
        <span><small>Cardio</small><strong>{titanScore.cardioScore}/30</strong></span>
        <span><small>Progressão</small><strong>{titanScore.performanceScore}/20</strong></span>
        <span><small>Consistência</small><strong>{titanScore.consistencyScore}/15</strong></span>
      </div>}
    </section>

    <section className={`dashboard-coach-card status-${coach.status}`} aria-label="Prioridade do Coach TITAN">
      <div className="dashboard-coach-topline"><span className="eyebrow">COACH TITAN</span><span>{coach.badge}</span></div>
      <strong>{coach.title}</strong><p>{coach.message}</p>{coach.context && <small className="coach-context">{coach.context}</small>}
      <div className={`coach-weekly-snapshot status-${weeklyCoach.status}`}>
        <div className="coach-weekly-head"><span>LEITURA DA SEMANA</span><strong>{weeklyCoach.headline}</strong></div>
        <div className="coach-weekly-metrics">
          <span><small>Musculação</small><strong>{weeklyCoach.strengthSessions}</strong></span>
          <span><small>Cardios</small><strong>{weeklyCoach.cardioSessions}</strong></span>
          <span><small>PRs</small><strong>{weeklyCoach.prEvents}</strong></span>
          <span><small>Progredir</small><strong>{weeklyCoach.progressSignals}</strong></span>
        </div>
        <p>{weeklyCoach.message}</p>
      </div>
      {coach.detail && <details><summary>Ver orientação do dia</summary><p>{coach.detail}</p></details>}
    </section>
  </div>;
}

function getTodayCardio(plan: TitanPlan, workout: TitanWorkoutDay | null): TodayCardio | null {
  const scheduled = plan.project?.cardioSchedule?.find((session) => matchesToday(session.day));
  if (scheduled) return cardioFromSchedule(scheduled);
  const embedded = workout?.exercises.find(isCardio);
  if (!embedded) return null;
  return { title: embedded.name, day: workout?.day ?? 'Hoje', durationMinutes: embedded.durationSeconds ? Math.round(embedded.durationSeconds / 60) : null, zone: embedded.cardioZone, detail: embedded.notes };
}
function cardioFromSchedule(session: TitanCardioSession): TodayCardio { return { title: session.title, day: session.day, durationMinutes: session.durationMinutes, startTime: session.startTime, zone: cardioZoneFromSchedule(session), detail: session.goal ?? session.phase }; }
function cardioZoneFromSchedule(session: TitanCardioSession) { if (session.type === 'zone2') return 'Zona 2'; if (session.type === 'hiit') return 'HIIT'; return undefined; }
function buildTodayCardioLine(cardio: TodayCardio) { const parts = [cardio.day]; if (cardio.startTime) parts.push(cardio.startTime); return parts.join(' · '); }

function getTodayCoachPriority(workout: TitanWorkoutDay | null, hasConfiguredCardioToday = false): CoachPriority {
  if (!workout) return hasConfiguredCardioToday
    ? { status: 'maintain', badge: 'CARDIO HOJE', title: 'Musculação em descanso', message: 'Hoje o foco é cumprir o cardio programado e preservar a recuperação muscular.', detail: 'Registre a sessão na aba Cardio para que o histórico acompanhe tempo, distância, ritmo e frequência cardíaca.' }
    : { status: 'maintain', badge: 'CARDIO DIÁRIO', title: 'Descanso da musculação', message: 'Hoje não há musculação. O cardio diário continua previsto, mas o projeto ainda não definiu tempo e zona.', detail: 'Defina a sessão de cardio do dia no projeto para que a Home mostre duração e zona-alvo sem precisar estimar valores.' };
  const records = loadWorkoutHistory();
  if (!records.length) return { status: 'insufficient', badge: 'CRIANDO BASE', title: 'Primeiro treino de referência', message: 'Hoje o objetivo é registrar cargas, repetições e RIR com consistência.', detail: 'A primeira execução cria sua linha de base e não conta como PR.' };
  const strengthExercises = workout.exercises.filter(isStrength);
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
