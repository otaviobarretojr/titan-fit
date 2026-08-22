import { useUnifiedCoachReport } from '../coach/useUnifiedCoachReport';
import type { CoachPillar } from '../coach/types';
import { getExerciseSessions, getProgressionAdvice } from '../history/intelligence';
import { loadWorkoutHistory } from '../history/storage';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanExercise, TitanPlan, TitanWorkoutDay } from '../plan/types';
import { loadWorkoutExecution } from '../workout/storage';
import { choiceLabel, loadTrainingChoice, resolveSelectedWorkout } from '../programming/activeWorkoutSelection';
import { WorkoutMuscleArt } from './WorkoutMuscleArt';
import { buildWeeklyCoachSummary } from './weeklyCoach';

type DashboardPageProps = { plan: TitanPlan | null; onOpenPlan: () => void; onStartWorkout: (workoutId: string) => void; };
type CoachStatus = 'insufficient' | 'maintain' | 'progress' | 'review' | 'stagnant';
type CoachPriority = { status: CoachStatus; badge: string; title: string; message: string; detail: string; context?: string };
type WorkoutVisual = 'legs' | 'chest' | 'back' | 'shoulders' | 'arms' | 'full';

function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function getWorkoutVisual(title = '', focus = ''): WorkoutVisual { const value = normalize(`${title} ${focus}`); if (/leg|perna|quadr|posterior|glute|panturr/.test(value)) return 'legs'; if (/peit|peitor|chest|push/.test(value)) return 'chest'; if (/cost|dors|back|pull/.test(value)) return 'back'; if (/ombro|delto|shoulder/.test(value)) return 'shoulders'; if (/biceps|triceps|braco|arm/.test(value)) return 'arms'; return 'full'; }
function isStrength(exercise: TitanExercise) { return (exercise.exerciseType ?? 'strength') === 'strength'; }
function isCardio(exercise: TitanExercise) { return exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance'; }
function getGreeting() { const hour = new Date().getHours(); if (hour < 12) return 'Bom dia'; if (hour < 18) return 'Boa tarde'; return 'Boa noite'; }
function formatToday() { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()); }
function isSameLocalDay(value: string, reference = new Date()) { const date = new Date(value); return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth() && date.getDate() === reference.getDate(); }
function wasWorkoutCompletedToday(history: WorkoutHistoryRecord[], planId: string, workoutId: string) { return history.some((record) => record.planId === planId && record.workoutId === workoutId && isSameLocalDay(record.completedAt)); }

export function DashboardPage({ plan, onOpenPlan, onStartWorkout }: DashboardPageProps) {
  const unifiedCoach = useUnifiedCoachReport();
  if (!plan) return <div className="dashboard-page"><section className="dashboard-welcome"><span className="eyebrow">SEU PROJETO COMEÇA AQUI</span><h2>Nenhum projeto ativo</h2><p>Importe seu Projeto TITAN para liberar treino, cardio e progressão.</p><button type="button" className="primary-action" onClick={onOpenPlan}>Inserir projeto</button></section></div>;

  const history = loadWorkoutHistory();
  const trainingChoice = loadTrainingChoice();
  const dayPlan = resolveSelectedWorkout(plan, history, trainingChoice);
  const exercises = dayPlan?.exercises ?? [];
  const strengthExercises = exercises.filter(isStrength);
  const cardioExercises = exercises.filter(isCardio);
  const hasWorkoutToday = trainingChoice !== 'rest' && exercises.length > 0;
  const setCount = strengthExercises.reduce((total, exercise) => total + Math.max(1, exercise.sets ?? 1), 0);
  const strengthStart = plan.project?.strengthStartTime ?? '20:00';
  const workoutCompletedToday = dayPlan ? wasWorkoutCompletedToday(history, plan.id, dayPlan.id) : false;
  const activeExecution = dayPlan && !workoutCompletedToday ? loadWorkoutExecution(plan.id, dayPlan.id) : null;
  const workoutCoach = getTodayCoachPriority(dayPlan);
  const weeklyCoach = buildWeeklyCoachSummary(plan, history);
  const visual = getWorkoutVisual(dayPlan?.title, dayPlan?.focus);
  const compositionLabel = workoutComposition(strengthExercises.length, cardioExercises.length);
  const coachPriority = unifiedCoach?.priority;
  const coachStatus = coachPriority ? severityStatus(coachPriority.severity) : workoutCoach.status;
  const coachBadge = unifiedCoach ? `${pillarName(coachPriority?.pillar)} · ${unifiedCoach.score.total}/100` : workoutCoach.badge;
  const coachTitle = coachPriority?.title ?? workoutCoach.title;
  const coachMessage = coachPriority?.message ?? workoutCoach.message;

  return <div className="dashboard-page dashboard-page-clean dashboard-training-focus">
    <section className="dashboard-heading"><div><span className="eyebrow">{formatToday()}</span><h2>{getGreeting()}, Otávio</h2><p>{plan.project?.name ?? plan.name}</p></div></section>
    {hasWorkoutToday && dayPlan ? <section className="today-workout" aria-labelledby="today-workout-title">
      <WorkoutMuscleArt visual={visual} />
      <div className="today-workout-topline"><span className="eyebrow">TREINO ATIVO · {choiceLabel(trainingChoice)} · {strengthStart}</span><span className="today-workout-day">Sequência do projeto</span></div>
      <h3 id="today-workout-title">{dayPlan.title}</h3>
      <p>{dayPlan.focus ?? 'Siga o projeto e registre cada etapa.'}</p>
      <div className="today-workout-metrics"><span><strong>{exercises.length}</strong> etapas</span>{setCount > 0 && <span><strong>{setCount}</strong> séries</span>}<span><strong>{compositionLabel}</strong></span></div>
      {workoutCompletedToday ? <span className="today-rest-badge">✓ TREINO CONCLUÍDO</span> : <button type="button" className="primary-action" onClick={() => onStartWorkout(dayPlan.id)}>{activeExecution ? 'Retomar treino' : 'Iniciar treino'}</button>}
      {activeExecution && <small className="coach-context">Sessão iniciada e salva neste aparelho.</small>}
    </section> : <section className="today-rest-card" aria-label="Recuperação"><span className="eyebrow">PROGRAMAÇÃO ATIVA</span><h3>{trainingChoice === 'rest' ? 'Descanso ativado' : 'Treino não encontrado'}</h3><p>{trainingChoice === 'rest' ? 'A Programação está definida para recuperação. Ative PULL, PUSH ou LEGS quando quiser treinar.' : `Não existe ${choiceLabel(trainingChoice)} compatível no projeto ativo.`}</p><span className="today-rest-badge">{trainingChoice === 'rest' ? 'DESCANSO' : choiceLabel(trainingChoice)}</span></section>}

    <section className={`dashboard-coach-card status-${coachStatus}`} aria-label="Prioridade do Coach TITAN"><div className="dashboard-coach-topline"><span className="eyebrow">COACH TITAN 1.0</span><span>{coachBadge}</span></div><strong>{coachTitle}</strong><p>{coachMessage}</p>{unifiedCoach ? <small className="coach-context">{unifiedCoach.availablePillars}/3 pilares · confiança {confidenceName(unifiedCoach.score.dataConfidence)}</small> : workoutCoach.context && <small className="coach-context">{workoutCoach.context}</small>}<div className={`coach-weekly-snapshot status-${weeklyCoach.status}`}><div className="coach-weekly-head"><span>LEITURA DA SEMANA</span><strong>{weeklyCoach.headline}</strong></div><div className="coach-weekly-metrics"><span><small>Musculação</small><strong>{weeklyCoach.strengthSessions}</strong></span><span><small>Cardios</small><strong>{weeklyCoach.cardioSessions}</strong></span><span><small>PRs</small><strong>{weeklyCoach.prEvents}</strong></span><span><small>Progredir</small><strong>{weeklyCoach.progressSignals}</strong></span></div><p>{weeklyCoach.message}</p></div>{workoutCoach.detail && <details><summary>Ver orientação do treino ativo</summary><p>{workoutCoach.detail}</p></details>}</section>
  </div>;
}

function workoutComposition(strength: number, cardio: number) { if (strength && cardio) return 'Força + cardio'; if (cardio) return 'Cardio'; if (strength) return 'Musculação'; return 'Sessão'; }
function severityStatus(severity: 'positive' | 'attention' | 'neutral'): CoachStatus { if (severity === 'attention') return 'review'; if (severity === 'positive') return 'progress'; return 'maintain'; }
function pillarName(pillar?: CoachPillar) { if (pillar === 'recovery') return 'RECUPERAÇÃO'; if (pillar === 'evolution') return 'EVOLUÇÃO'; return 'TREINO'; }
function confidenceName(confidence: 'low' | 'medium' | 'high') { if (confidence === 'high') return 'alta'; if (confidence === 'medium') return 'média'; return 'baixa'; }
function getTodayCoachPriority(workout: TitanWorkoutDay | null): CoachPriority {
  if (!workout) return { status:'maintain', badge:'RECUPERAÇÃO', title:'Sem treino ativo', message:'Selecione PULL, PUSH ou LEGS na Programação quando quiser treinar.', detail:'O Dashboard respeita a seleção manual feita na Programação.' };
  const strengthExercises = workout.exercises.filter(isStrength);
  const cardioExercises = workout.exercises.filter(isCardio);
  if (!strengthExercises.length && cardioExercises.length) return { status:'maintain', badge:'CARDIO', title:workout.title, message:'O foco é cumprir a sessão cardiovascular prevista no projeto.', detail:'Registre tempo, distância, ritmo, frequência cardíaca e percepção de esforço durante a execução.' };
  const records = loadWorkoutHistory();
  if (!records.length) return { status:'insufficient', badge:'CRIANDO BASE', title:'Primeiro treino de referência', message:'O objetivo é registrar cargas e repetições com consistência.', detail:'A primeira execução válida cria sua referência inicial.' };
  const analyses = strengthExercises.map((exercise)=>{const advice=getProgressionAdvice(records,exercise.id);const sessions=getExerciseSessions(records,exercise.id).slice(0,3);return {exercise,advice,sessions,stagnant:isStagnant(sessions)}});
  const review=analyses.find((item)=>item.advice.status==='review'); if(review)return {status:'review',badge:'ATENÇÃO',title:`${review.exercise.name} · ${review.advice.title}`,message:compactCoachMessage(review.advice.message),detail:review.advice.message,context:buildContext(records)};
  const stagnant=analyses.find((item)=>item.stagnant); if(stagnant)return {status:'stagnant',badge:'ESTAGNAÇÃO',title:`${stagnant.exercise.name} · destravar progresso`,message:'As últimas 3 sessões ficaram praticamente no mesmo nível.',detail:'Mantenha a carga atual e tente ganhar 1 repetição total ou melhorar a execução antes de subir o peso.',context:buildContext(records)};
  const progressItems=analyses.filter((item)=>item.advice.status==='progress'); if(progressItems.length){const selected=progressItems[0];return {status:'progress',badge:'PROGREDIR',title:`${selected.exercise.name} · ${selected.advice.title}`,message:compactCoachMessage(selected.advice.message),detail:selected.advice.message,context:buildContext(records)}}
  const selected=analyses.find((item)=>item.advice.status!=='insufficient'); if(!selected)return {status:'insufficient',badge:'CRIANDO BASE',title:'Continue registrando',message:'Ainda faltam comparações suficientes neste treino.',detail:'Depois de repetir os exercícios, o Coach passa a sugerir quando manter, progredir ou revisar.',context:buildContext(records)};
  return {status:'maintain',badge:'MANTER',title:`${selected.exercise.name} · ${selected.advice.title}`,message:compactCoachMessage(selected.advice.message),detail:selected.advice.message,context:buildContext(records)};
}
function isStagnant(sessions: ReturnType<typeof getExerciseSessions>) { if (sessions.length < 3) return false; const performance=sessions.slice(0,3).map(({exercise})=>{const valid=(exercise.sets??[]).filter((set)=>(set.weightKg??0)>0&&(set.repetitions??0)>0);return {maxWeight:valid.length?Math.max(...valid.map((set)=>set.weightKg??0)):0,totalReps:valid.reduce((sum,set)=>sum+(set.repetitions??0),0)}}); if(performance.some((item)=>item.maxWeight<=0||item.totalReps<=0))return false; const sameLoad=performance.every((item)=>item.maxWeight===performance[0].maxWeight); const repSpread=Math.max(...performance.map((item)=>item.totalReps))-Math.min(...performance.map((item)=>item.totalReps)); return sameLoad&&repSpread<=1; }
function buildContext(records: WorkoutHistoryRecord[]) { const last30=records.filter((record)=>Date.now()-new Date(record.completedAt).getTime()<=30*24*60*60*1000); const strengthSessions=last30.filter((record)=>record.exercises.some((exercise)=>(exercise.exerciseType??'strength')==='strength')).length; const cardioSessions=last30.filter((record)=>record.exercises.some((exercise)=>exercise.exerciseType==='cardio'||exercise.exerciseType==='distance')).length; if(!strengthSessions&&!cardioSessions)return undefined; return `${strengthSessions} treino${strengthSessions===1?'':'s'} de musculação · ${cardioSessions} treino${cardioSessions===1?'':'s'} com cardio nos últimos 30 dias`; }
function compactCoachMessage(message:string){const first=message.split('. ')[0];return first.endsWith('.')?first:`${first}.`;}
