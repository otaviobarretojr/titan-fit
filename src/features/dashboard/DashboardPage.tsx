import type { TitanCardioSession, TitanPlan, TitanWorkoutDay } from '../plan/types';

type DashboardPageProps = { plan: TitanPlan | null; onOpenPlan: () => void; onStartWorkout: (workoutId: string) => void; onStartCardio: (sessionId: string) => void; onOpenProgress: () => void; };
const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function getTodayWorkout(plan: TitanPlan): TitanWorkoutDay | null { const today = WEEKDAYS[new Date().getDay()]; return plan.workouts.find((workout) => normalize(workout.day).includes(today)) ?? plan.workouts[0] ?? null; }
function getTodayCardio(plan: TitanPlan): TitanCardioSession | null { const today = WEEKDAYS[new Date().getDay()]; return plan.project?.cardioSchedule?.find((session) => normalize(session.day).includes(today)) ?? null; }
function addMinutes(time: string, minutes: number) { const [hours, mins] = time.split(':').map(Number); const total = hours * 60 + mins + minutes; return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; }
function getGreeting() { const hour = new Date().getHours(); if (hour < 12) return 'Bom dia'; if (hour < 18) return 'Boa tarde'; return 'Boa noite'; }
function formatToday() { return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()); }

export function DashboardPage({ plan, onOpenPlan, onStartWorkout, onStartCardio, onOpenProgress }: DashboardPageProps) {
  if (!plan) return <div className="dashboard-page"><section className="dashboard-welcome"><span className="eyebrow">SEU PROJETO COMEÇA AQUI</span><h2>Nenhum projeto ativo</h2><p>Importe seu Projeto TITAN para liberar musculação, cardio, horários e progressão.</p><button type="button" className="primary-action" onClick={onOpenPlan}>Importar projeto</button></section></div>;

  const workout = getTodayWorkout(plan);
  const cardio = getTodayCardio(plan);
  const exerciseCount = workout?.exercises.length ?? 0;
  const setCount = workout?.exercises.reduce((total, exercise) => total + exercise.sets, 0) ?? 0;
  const strengthStart = plan.project?.strengthStartTime ?? '20:00';
  const cardioEnd = cardio ? addMinutes(cardio.startTime, cardio.durationMinutes) : '';

  return <div className="dashboard-page">
    <section className="dashboard-heading"><div><span className="eyebrow">{formatToday()}</span><h2>{getGreeting()}, Otávio</h2><p>{plan.project?.name ?? plan.name}</p></div></section>

    {cardio && <section className="today-cardio" aria-labelledby="today-cardio-title">
      <div className="today-workout-topline"><span className="eyebrow">CARDIO · {cardio.startTime}–{cardioEnd}</span><span className="today-workout-day">Projeto 5 km</span></div>
      <h3 id="today-cardio-title">{cardio.title}</h3>
      <p>{cardio.goal ?? plan.project?.cardioGoal}</p>
      <div className="today-workout-metrics"><span><strong>{cardio.durationMinutes}</strong> min</span><span><strong>{cardio.instructions?.length ?? 1}</strong> etapas</span></div>
      <button type="button" className="primary-action" onClick={() => onStartCardio(cardio.id)}>Iniciar cardio</button>
      <small>Recuperação até a musculação: {cardioEnd}–{strengthStart}</small>
    </section>}

    <section className="today-workout" aria-labelledby="today-workout-title"><div className="today-workout-topline"><span className="eyebrow">MUSCULAÇÃO · {strengthStart}</span><span className="today-workout-day">{workout?.day ?? 'Hoje'}</span></div><h3 id="today-workout-title">{workout?.title ?? 'Treino disponível'}</h3><p>{workout?.focus ?? 'Siga o projeto e registre cada série.'}</p><div className="today-workout-metrics"><span><strong>{exerciseCount}</strong> exercícios</span><span><strong>{setCount}</strong> séries</span></div><button type="button" className="primary-action" disabled={!workout} onClick={() => workout && onStartWorkout(workout.id)}>Iniciar treino</button></section>

    <section className="dashboard-grid" aria-label="Resumo de treino"><button type="button" className="dashboard-tile" onClick={onOpenPlan}><span className="dashboard-tile-icon">▤</span><span>Projeto completo</span><strong>Ver musculação e 5 km</strong><small>Séries, corrida, horários e progressão</small></button><button type="button" className="dashboard-tile" onClick={onOpenProgress}><span className="dashboard-tile-icon">↗</span><span>Progresso</span><strong>Acompanhar evolução</strong><small>Cargas, volume e histórico</small></button></section>
  </div>;
}
