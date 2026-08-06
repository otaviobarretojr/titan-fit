import type { TitanPlan, TitanWorkoutDay } from '../plan/types';

type DashboardPageProps = {
  plan: TitanPlan | null;
  onOpenPlan: () => void;
  onOpenCoach: () => void;
  onOpenCardio: () => void;
  onOpenProgress: () => void;
};

const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getTodayWorkout(plan: TitanPlan): TitanWorkoutDay | null {
  const today = WEEKDAYS[new Date().getDay()];
  return plan.workouts.find((workout) => normalize(workout.day).includes(today)) ?? plan.workouts[0] ?? null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatToday() {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  }).format(new Date());
}

export function DashboardPage({ plan, onOpenPlan, onOpenCoach, onOpenCardio, onOpenProgress }: DashboardPageProps) {
  if (!plan) {
    return (
      <div className="dashboard-page">
        <section className="dashboard-welcome">
          <span className="eyebrow">TREINE. REGISTRE. EVOLUA.</span>
          <h2>Nenhuma ficha ativa</h2>
          <p>Importe sua ficha TITAN FIT para liberar o treino do dia, a evolução e as análises do Coach.</p>
          <button type="button" className="primary-action" onClick={onOpenPlan}>Importar ficha</button>
        </section>
        <section className="dashboard-grid dashboard-grid-empty" aria-label="Recursos disponíveis">
          <button type="button" className="dashboard-tile" onClick={onOpenCardio}>
            <span className="dashboard-tile-icon">◌</span><span>Cardio</span><strong>Plano dos 5 km</strong>
          </button>
          <button type="button" className="dashboard-tile" onClick={onOpenCoach}>
            <span className="dashboard-tile-icon">◆</span><span>Coach TITAN</span><strong>Análise honesta</strong>
          </button>
        </section>
      </div>
    );
  }

  const workout = getTodayWorkout(plan);
  const exerciseCount = workout?.exercises.length ?? 0;
  const setCount = workout?.exercises.reduce((total, exercise) => total + exercise.sets, 0) ?? 0;

  return (
    <div className="dashboard-page">
      <section className="dashboard-heading">
        <div>
          <span className="eyebrow">{formatToday()}</span>
          <h2>{getGreeting()}, Otávio</h2>
          <p>{plan.name}</p>
        </div>
        <button type="button" className="dashboard-score" onClick={onOpenCoach} aria-label="Abrir Score TITAN">
          <span>Score</span><strong>—</strong><small>Aguardando dados</small>
        </button>
      </section>

      <section className="today-workout" aria-labelledby="today-workout-title">
        <div className="today-workout-topline">
          <span className="eyebrow">TREINO DE HOJE</span>
          <span className="today-workout-day">{workout?.day ?? 'Hoje'}</span>
        </div>
        <h3 id="today-workout-title">{workout?.title ?? 'Treino disponível'}</h3>
        <p>{workout?.focus ?? 'Siga a ficha programada e registre cada série.'}</p>
        <div className="today-workout-metrics">
          <span><strong>{exerciseCount}</strong> exercícios</span>
          <span><strong>{setCount}</strong> séries</span>
        </div>
        <button type="button" className="primary-action" onClick={onOpenPlan}>Iniciar treino</button>
      </section>

      <section className="dashboard-grid" aria-label="Resumo do dia">
        <button type="button" className="dashboard-tile" onClick={onOpenCardio}>
          <span className="dashboard-tile-icon">◌</span><span>Cardio</span><strong>Ver sessão planejada</strong><small>Plano dos primeiros 5 km</small>
        </button>
        <button type="button" className="dashboard-tile" onClick={onOpenProgress}>
          <span className="dashboard-tile-icon">↗</span><span>Evolução</span><strong>Acompanhar progresso</strong><small>Cargas, volume e histórico</small>
        </button>
      </section>

      <button type="button" className="coach-priority-card" onClick={onOpenCoach}>
        <div><span className="eyebrow">COACH TITAN</span><strong>Veja a prioridade baseada nos seus registros</strong><p>O Coach só recomenda quando existem dados suficientes.</p></div>
        <span className="coach-priority-arrow">→</span>
      </button>

      <section className="future-modules" aria-label="Módulos futuros">
        <div><span>Nutrição</span><strong>Em preparação</strong></div>
        <div><span>Água e sono</span><strong>Sem dados ainda</strong></div>
      </section>
    </div>
  );
}
