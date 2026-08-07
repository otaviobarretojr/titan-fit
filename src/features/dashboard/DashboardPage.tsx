import type { TitanPlan, TitanWorkoutDay } from '../plan/types';

type DashboardPageProps = { plan: TitanPlan | null; onOpenPlan: () => void; onStartWorkout: (workoutId: string) => void; onOpenProgress: () => void; };
const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function getTodayWorkout(plan: TitanPlan): TitanWorkoutDay | null { const today = WEEKDAYS[new Date().getDay()]; return plan.workouts.find((workout) => normalize(workout.day).includes(today)) ?? plan.workouts[0] ?? null; }
function getGreeting() { const hour = new Date().getHours(); if (hour < 12) return 'Bom dia'; if (hour < 18) return 'Boa tarde'; return 'Boa noite'; }
function formatToday() { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()); }

export function DashboardPage({ plan, onOpenPlan, onStartWorkout, onOpenProgress }: DashboardPageProps) {
  if (!plan) return <div className="dashboard-page"><section className="dashboard-welcome"><span className="eyebrow">SEU PROJETO COMEÇA AQUI</span><h2>Nenhum projeto ativo</h2><p>Importe seu Projeto TITAN para liberar o treino do dia, cardio incluído e progressão.</p><button type="button" className="primary-action" onClick={onOpenPlan}>Importar projeto</button></section></div>;

  const workout = getTodayWorkout(plan);
  const exerciseCount = workout?.exercises.length ?? 0;
  const setCount = workout?.exercises.reduce((total, exercise) => total + Math.max(1, exercise.sets ?? 1), 0) ?? 0;
  const cardioCount = workout?.exercises.filter((exercise) => (exercise.exerciseType ?? 'strength') === 'cardio').length ?? 0;
  const strengthStart = plan.project?.strengthStartTime ?? '20:00';

  return <div className="dashboard-page">
    <section className="dashboard-heading"><div><span className="eyebrow">{formatToday()}</span><h2>{getGreeting()}, Otávio</h2><p>{plan.project?.name ?? plan.name}</p></div></section>
    <section className="today-workout" aria-labelledby="today-workout-title">
      <div className="today-workout-topline"><span className="eyebrow">TREINO COMPLETO · {strengthStart}</span><span className="today-workout-day">{workout?.day ?? 'Hoje'}</span></div>
      <h3 id="today-workout-title">{workout?.title ?? 'Treino disponível'}</h3>
      <p>{workout?.focus ?? 'Siga o projeto e registre cada exercício.'}</p>
      <div className="today-workout-metrics"><span><strong>{exerciseCount}</strong> exercícios</span><span><strong>{setCount}</strong> registros</span>{cardioCount > 0 && <span><strong>{cardioCount}</strong> cardio</span>}</div>
      <button type="button" className="primary-action" disabled={!workout} onClick={() => workout && onStartWorkout(workout.id)}>Iniciar treino</button>
    </section>
    <section className="dashboard-grid" aria-label="Resumo de treino"><button type="button" className="dashboard-tile" onClick={onOpenPlan}><span className="dashboard-tile-icon">▤</span><span>Projeto completo</span><strong>Ver exercícios</strong><small>Musculação, cardio e mobilidade na mesma sessão</small></button><button type="button" className="dashboard-tile" onClick={onOpenProgress}><span className="dashboard-tile-icon">↗</span><span>Progresso</span><strong>Acompanhar evolução</strong><small>Cargas, distância, cardio e histórico</small></button></section>
  </div>;
}
