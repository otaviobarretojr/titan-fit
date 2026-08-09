import { getExerciseSessions, getProgressionAdvice } from '../history/intelligence';
import { loadWorkoutHistory } from '../history/storage';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanExercise, TitanPlan, TitanWorkoutDay } from '../plan/types';
import { cardioZoneLabel, getTodayCardioSession } from '../cardio/currentCardio';
import { WorkoutMuscleArt } from './WorkoutMuscleArt';
import { buildWeeklyCoachSummary } from './weeklyCoach';
import { buildTitanScore } from './titanScore';

type DashboardPageProps = { plan: TitanPlan | null; onOpenPlan: () => void; onStartWorkout: (workoutId: string) => void; onStartCardio: (sessionId: string) => void; onOpenProgress: () => void; };
type CoachStatus = 'insufficient' | 'maintain' | 'progress' | 'review' | 'stagnant';
type CoachPriority = { status: CoachStatus; badge: string; title: string; message: string; detail: string; context?: string };
type WorkoutVisual = 'legs' | 'chest' | 'back' | 'shoulders' | 'arms' | 'full';
const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function getWorkoutVisual(title = '', focus = ''): WorkoutVisual { const value = normalize(`${title} ${focus}`); if (/leg|perna|quadr|posterior|glute|panturr/.test(value)) return 'legs'; if (/peit|peitor|chest|push/.test(value)) return 'chest'; if (/cost|dors|back|pull/.test(value)) return 'back'; if (/ombro|delto|shoulder/.test(value)) return 'shoulders'; if (/biceps|triceps|braco|arm/.test(value)) return 'arms'; return 'full'; }
function getTodayName() { return WEEKDAYS[new Date().getDay()]; }
function matchesToday(day: string) { return normalize(day).includes(getTodayName()); }
function getTodayWorkout(plan: TitanPlan): TitanWorkoutDay | null { return plan.workouts.find((workout) => matchesToday(workout.day)) ?? null; }
function isStrength(exercise: TitanExercise) { return (exercise.exerciseType ?? 'strength') === 'strength'; }
function getGreeting() { const hour = new Date().getHours(); if (hour < 12) return 'Bom dia'; if (hour < 18) return 'Boa tarde'; return 'Boa noite'; }
function formatToday() { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()); }

export function DashboardPage({ plan, onOpenPlan, onStartWorkout, onStartCardio }: DashboardPageProps) {
  if (!plan) return <div className="dashboard-page"><section className="dashboard-welcome"><span className="eyebrow">SEU PROJETO COMEÇA AQUI</span><h2>Nenhum projeto ativo</h2><p>Importe seu Projeto TITAN para liberar treino, cardio e progressão.</p><button type="button" className="primary-action" onClick={onOpenPlan}>Inserir projeto</button></section></div>;

  const dayPlan = getTodayWorkout(plan);
  const strengthExercises = dayPlan?.exercises.filter(isStrength) ?? [];
  const hasStrengthToday = strengthExercises.length > 0;
  const exerciseCount = strengthExercises.length;
  const setCount = strengthExercises.reduce((total, exercise) => total + Math.max(1, exercise.sets ?? 1), 0);
  const strengthStart = plan.project?.strengthStartTime ?? '20:00';
  const history = loadWorkoutHistory();
  const todayCardio = getTodayCardioSession(plan);
  const coach = getTodayCoachPriority(hasStrengthToday ? dayPlan : null, Boolean(todayCardio));
  const weeklyCoach = buildWeeklyCoachSummary(plan, history);
  const titanScore = buildTitanScore(plan, history);
  const visual = getWorkoutVisual(dayPlan?.title, dayPlan?.focus);

  const cardioCard = todayCardio ? <section className="dashboard-cardio-card today-cardio-highlight" aria-label="Cardio de hoje">
    <div><span className="eyebrow">CARDIO DE HOJE · {todayCardio.startTime}</span><strong>{todayCardio.title}</strong><p>{todayCardio.durationMinutes} min · {cardioZoneLabel(todayCardio)}</p>{todayCardio.goal && <p>{todayCardio.goal}</p>}</div>
    <div className="dashboard-cardio-stats"><span><small>Tempo</small><strong>{todayCardio.durationMinutes} min</strong></span><span><small>Zona</small><strong>{cardioZoneLabel(todayCardio)}</strong></span></div>
    <button type="button" className="primary-action" onClick={() => onStartCardio(todayCardio.id)}>Iniciar cardio</button>
  </section> : <section className="dashboard-cardio-card cardio-unconfigured" aria-label="Cardio de hoje"><div><span className="eyebrow">CARDIO DE HOJE</span><strong>Sem cardio programado</strong><p>Não há sessão prevista para hoje no projeto ativo.</p></div></section>;

  return <div className="dashboard-page dashboard-page-clean">
    <section className="dashboard-heading"><div><span className="eyebrow">{formatToday()}</span><h2>{getGreeting()}, Otávio</h2><p>{plan.project?.name ?? plan.name}</p></div></section>
    {hasStrengthToday && dayPlan ? <><section className="today-workout" aria-labelledby="today-workout-title"><WorkoutMuscleArt visual={visual} /><div className="today-workout-topline"><span className="eyebrow">TREINO COMPLETO · {strengthStart}</span><span className="today-workout-day">{dayPlan.day}</span></div><h3 id="today-workout-title">{dayPlan.title}</h3><p>{dayPlan.focus ?? 'Siga o projeto e registre cada exercício.'}</p><div className="today-workout-metrics"><span><strong>{exerciseCount}</strong> exercícios</span><span><strong>{setCount}</strong> registros</span></div><button type="button" className="primary-action" onClick={() => onStartWorkout(dayPlan.id)}>Iniciar treino</button></section>{cardioCard}</> : <>{cardioCard}<section className="today-rest-card" aria-label="Descanso da musculação"><span className="eyebrow">MUSCULAÇÃO</span><h3>Descanso da musculação</h3><p>{todayCardio ? 'Hoje o foco principal está no cardio programado.' : 'Hoje não há musculação nem cardio programados.'}</p><span className="today-rest-badge">SEM MUSCULAÇÃO HOJE</span></section></>}

    <section className={`titan-score-card status-${titanScore.status}`} aria-label="Score TITAN"><div className="titan-score-main"><div><span className="eyebrow">SCORE TITAN</span><strong>{titanScore.label}</strong><p>{titanScore.message}</p></div><div className="titan-score-value">{titanScore.score ?? '—'}<small>{titanScore.score === null ? 'BASE' : '/100'}</small></div></div>{titanScore.score !== null && <div className="titan-score-pillars"><span><small>Musculação</small><strong>{titanScore.strengthScore}/35</strong></span><span><small>Cardio</small><strong>{titanScore.cardioScore}/30</strong></span><span><small>Progressão</small><strong>{titanScore.performanceScore}/20</strong></span><span><small>Consistência</small><strong>{titanScore.consistencyScore}/15</strong></span></div>}</section>

    <section className={`dashboard-coach-card status-${coach.status}`} aria-label="Prioridade do Coach TITAN"><div className="dashboard-coach-topline"><span className="eyebrow">COACH TITAN</span><span>{coach.badge}</span></div><strong>{coach.title}</strong><p>{coach.message}</p>{coach.context && <small className="coach-context">{coach.context}</small>}<div className={`coach-weekly-snapshot status-${weeklyCoach.status}`}><div className="coach-weekly-head"><span>LEITURA DA SEMANA</span><strong>{weeklyCoach.headline}</strong></div><div className="coach-weekly-metrics"><span><small>Musculação</small><strong>{weeklyCoach.strengthSessions}</strong></span><span><small>Cardios</small><strong>{weeklyCoach.cardioSessions}</strong></span><span><small>PRs</small><strong>{weeklyCoach.prEvents}</strong></span><span><small>Progredir</small><strong>{weeklyCoach.progressSignals}</strong></span></div><p>{weeklyCoach.message}</p></div>{coach.detail && <details><summary>Ver orientação do dia</summary><p>{coach.detail}</p></details>}</section>
  </div>;
}

function getTodayCoachPriority(workout: TitanWorkoutDay | null, hasConfiguredCardioToday = false): CoachPriority {
  if (!workout) return hasConfiguredCardioToday ? { status:'maintain', badge:'CARDIO HOJE', title:'Musculação em descanso', message:'Hoje o foco é cumprir o cardio programado e preservar a recuperação muscular.', detail:'Inicie o cardio pelo Dashboard e registre tempo, distância, ritmo e frequência cardíaca.' } : { status:'maintain', badge:'RECUPERAÇÃO', title:'Dia sem treino programado', message:'Hoje não há musculação nem cardio previstos no projeto.', detail:'Use o dia para recuperação e mantenha os registros do projeto em dia.' };
  const records = loadWorkoutHistory();
  if (!records.length) return { status:'insufficient', badge:'CRIANDO BASE', title:'Primeiro treino de referência', message:'Hoje o objetivo é registrar cargas, repetições e RIR com consistência.', detail:'A primeira execução cria sua linha de base e não conta como PR.' };
  const strengthExercises = workout.exercises.filter(isStrength);
  const analyses = strengthExercises.map((exercise)=>{const advice=getProgressionAdvice(records,exercise.id);const sessions=getExerciseSessions(records,exercise.id).slice(0,3);return {exercise,advice,sessions,stagnant:isStagnant(sessions)}});
  const review=analyses.find((item)=>item.advice.status==='review'); if(review)return {status:'review',badge:'ATENÇÃO',title:`${review.exercise.name} · ${review.advice.title}`,message:compactCoachMessage(review.advice.message),detail:review.advice.message,context:buildContext(records)};
  const stagnant=analyses.find((item)=>item.stagnant); if(stagnant)return {status:'stagnant',badge:'ESTAGNAÇÃO',title:`${stagnant.exercise.name} · destravar progresso`,message:'As últimas 3 sessões ficaram praticamente no mesmo nível.',detail:'Mantenha a carga atual e tente ganhar 1 repetição total ou melhorar a execução antes de subir o peso.',context:buildContext(records)};
  const progressItems=analyses.filter((item)=>item.advice.status==='progress'); if(progressItems.length){const selected=progressItems[0];return {status:'progress',badge:'PROGREDIR',title:`${selected.exercise.name} · ${selected.advice.title}`,message:compactCoachMessage(selected.advice.message),detail:selected.advice.message,context:buildContext(records)}}
  const selected=analyses.find((item)=>item.advice.status!=='insufficient'); if(!selected)return {status:'insufficient',badge:'CRIANDO BASE',title:'Continue registrando',message:'Ainda faltam comparações suficientes no treino de hoje.',detail:'Depois de repetir os exercícios, o Coach passa a sugerir quando manter, progredir ou revisar.',context:buildContext(records)};
  return {status:'maintain',badge:'MANTER',title:`${selected.exercise.name} · ${selected.advice.title}`,message:compactCoachMessage(selected.advice.message),detail:selected.advice.message,context:buildContext(records)};
}
function isStagnant(sessions: ReturnType<typeof getExerciseSessions>) { if (sessions.length < 3) return false; const performance=sessions.slice(0,3).map(({exercise})=>{const valid=(exercise.sets??[]).filter((set)=>(set.weightKg??0)>0&&(set.repetitions??0)>0);return {maxWeight:valid.length?Math.max(...valid.map((set)=>set.weightKg??0)):0,totalReps:valid.reduce((sum,set)=>sum+(set.repetitions??0),0)}}); if(performance.some((item)=>item.maxWeight<=0||item.totalReps<=0))return false; const sameLoad=performance.every((item)=>item.maxWeight===performance[0].maxWeight); const repSpread=Math.max(...performance.map((item)=>item.totalReps))-Math.min(...performance.map((item)=>item.totalReps)); return sameLoad&&repSpread<=1; }
function buildContext(records: WorkoutHistoryRecord[]) { const last30=records.filter((record)=>Date.now()-new Date(record.completedAt).getTime()<=30*24*60*60*1000); const sessions=last30.length; const cardios=last30.flatMap((record)=>record.exercises).filter((exercise)=>exercise.exerciseType==='cardio'||exercise.exerciseType==='distance').length; if(!sessions)return undefined; return `${sessions} treino${sessions===1?'':'s'} · ${cardios} cardio${cardios===1?'':'s'} nos últimos 30 dias`; }
function compactCoachMessage(message:string){const first=message.split('. ')[0];return first.endsWith('.')?first:`${first}.`;}
