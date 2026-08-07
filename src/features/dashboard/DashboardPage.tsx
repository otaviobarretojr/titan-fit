import { getProgressionAdvice } from '../history/intelligence';
import { loadWorkoutHistory } from '../history/storage';
import type { TitanPlan, TitanWorkoutDay } from '../plan/types';

type DashboardPageProps = { plan: TitanPlan | null; onOpenPlan: () => void; onStartWorkout: (workoutId: string) => void; onOpenProgress: () => void; };
const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function getTodayWorkout(plan: TitanPlan): TitanWorkoutDay | null { const today = WEEKDAYS[new Date().getDay()]; return plan.workouts.find((workout) => normalize(workout.day).includes(today)) ?? plan.workouts[0] ?? null; }
function getGreeting() { const hour = new Date().getHours(); if (hour < 12) return 'Bom dia'; if (hour < 18) return 'Boa tarde'; return 'Boa noite'; }
function formatToday() { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()); }

export function DashboardPage({ plan, onOpenPlan, onStartWorkout }: DashboardPageProps) {
  if (!plan) return <div className="dashboard-page"><section className="dashboard-welcome"><span className="eyebrow">SEU PROJETO COMEÇA AQUI</span><h2>Nenhum projeto ativo</h2><p>Importe seu Projeto TITAN para liberar o treino do dia, cardio incluído e progressão.</p><button type="button" className="primary-action" onClick={onOpenPlan}>Importar projeto</button></section></div>;

  const workout = getTodayWorkout(plan);
  const exerciseCount = workout?.exercises.length ?? 0;
  const setCount = workout?.exercises.reduce((total, exercise) => total + Math.max(1, exercise.sets ?? 1), 0) ?? 0;
  const cardioCount = workout?.exercises.filter((exercise) => (exercise.exerciseType ?? 'strength') === 'cardio').length ?? 0;
  const strengthStart = plan.project?.strengthStartTime ?? '20:00';
  const coach = getTodayCoachPriority(workout);

  return <div className="dashboard-page dashboard-page-clean">
    <section className="dashboard-heading"><div><span className="eyebrow">{formatToday()}</span><h2>{getGreeting()}, Otávio</h2><p>{plan.project?.name ?? plan.name}</p></div></section>
    <section className="today-workout" aria-labelledby="today-workout-title">
      <div className="today-workout-topline"><span className="eyebrow">TREINO COMPLETO · {strengthStart}</span><span className="today-workout-day">{workout?.day ?? 'Hoje'}</span></div>
      <h3 id="today-workout-title">{workout?.title ?? 'Treino disponível'}</h3>
      <p>{workout?.focus ?? 'Siga o projeto e registre cada exercício.'}</p>
      <div className="today-workout-metrics"><span><strong>{exerciseCount}</strong> exercícios</span><span><strong>{setCount}</strong> registros</span>{cardioCount > 0 && <span><strong>{cardioCount}</strong> cardio</span>}</div>
      <button type="button" className="primary-action" disabled={!workout} onClick={() => workout && onStartWorkout(workout.id)}>Iniciar treino</button>
    </section>
    <section className={`dashboard-coach-card status-${coach.status}`} aria-label="Prioridade do Coach TITAN">
      <div className="dashboard-coach-topline"><span className="eyebrow">COACH TITAN</span><span>{coach.badge}</span></div>
      <strong>{coach.title}</strong>
      <p>{coach.message}</p>
      {coach.detail && <details><summary>Ver orientação</summary><p>{coach.detail}</p></details>}
    </section>
  </div>;
}

function getTodayCoachPriority(workout: TitanWorkoutDay | null) {
  if (!workout) return { status: 'insufficient', badge: 'SEM TREINO', title: 'Nenhuma prioridade hoje', message: 'Importe ou selecione um treino para o Coach analisar.', detail: '' };
  const records = loadWorkoutHistory();
  if (!records.length) return { status: 'insufficient', badge: 'CRIANDO BASE', title: 'Primeiro treino de referência', message: 'Hoje o objetivo é registrar cargas, repetições e RIR com consistência.', detail: 'A primeira execução cria sua linha de base e não conta como PR.' };

  const strengthExercises = workout.exercises.filter((exercise) => (exercise.exerciseType ?? 'strength') === 'strength');
  const candidates = strengthExercises.map((exercise) => ({ exercise, advice: getProgressionAdvice(records, exercise.id) }));
  const priority = { review: 0, progress: 1, maintain: 2, insufficient: 3 } as const;
  candidates.sort((a, b) => priority[a.advice.status] - priority[b.advice.status]);
  const selected = candidates[0];
  if (!selected || selected.advice.status === 'insufficient') return { status: 'insufficient', badge: 'CRIANDO BASE', title: 'Continue registrando', message: 'Ainda faltam comparações suficientes no treino de hoje.', detail: 'Depois de repetir os exercícios, o Coach passa a sugerir quando manter, progredir ou revisar.' };

  const badge = selected.advice.status === 'review' ? 'ATENÇÃO' : selected.advice.status === 'progress' ? 'PROGREDIR' : 'MANTER';
  return {
    status: selected.advice.status,
    badge,
    title: `${selected.exercise.name} · ${selected.advice.title}`,
    message: compactCoachMessage(selected.advice.message),
    detail: selected.advice.message,
  };
}

function compactCoachMessage(message: string) {
  const first = message.split('. ')[0];
  return first.endsWith('.') ? first : `${first}.`;
}
