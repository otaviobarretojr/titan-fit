import type { TitanPlan, TitanWorkoutDay } from '../plan/types';

type DashboardPageProps = {
  plan: TitanPlan | null;
  onOpenPlan: () => void;
  onOpenProgress: () => void;
};

type CardioSchedule = {
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  target: string;
};

const WEEKDAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

const CARDIO_SCHEDULE: Partial<Record<number, CardioSchedule>> = {
  2: {
    title: 'Zona 2',
    type: 'Condicionamento aeróbico',
    startTime: '20:10',
    endTime: '20:35',
    durationMinutes: 25,
    target: 'Ritmo contínuo e confortável'
  },
  4: {
    title: 'Intervalado para 5 km',
    type: 'Corrida e condicionamento',
    startTime: '20:10',
    endTime: '20:30',
    durationMinutes: 20,
    target: 'Tiros controlados, sem comprometer a recuperação'
  },
  6: {
    title: 'Caminhada e trote leve',
    type: 'Base para os primeiros 5 km',
    startTime: '20:10',
    endTime: '20:40',
    durationMinutes: 30,
    target: 'Acumular tempo com esforço moderado'
  }
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date());
}

export function DashboardPage({ plan, onOpenPlan, onOpenProgress }: DashboardPageProps) {
  if (!plan) {
    return (
      <div className="dashboard-page">
        <section className="dashboard-welcome">
          <span className="eyebrow">SEU TREINO COMEÇA AQUI</span>
          <h2>Nenhuma ficha ativa</h2>
          <p>Importe sua ficha para liberar o treino do dia, registrar séries e acompanhar sua progressão.</p>
          <button type="button" className="primary-action" onClick={onOpenPlan}>Importar ficha</button>
        </section>
        <section className="dashboard-grid dashboard-grid-empty" aria-label="Recursos de treino">
          <button type="button" className="dashboard-tile" onClick={onOpenPlan}>
            <span className="dashboard-tile-icon">▤</span><span>Ficha</span><strong>Organize seus treinos</strong>
          </button>
          <button type="button" className="dashboard-tile" onClick={onOpenProgress}>
            <span className="dashboard-tile-icon">↗</span><span>Progresso</span><strong>Cargas e histórico</strong>
          </button>
        </section>
      </div>
    );
  }

  const workout = getTodayWorkout(plan);
  const cardio = CARDIO_SCHEDULE[new Date().getDay()];
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
      </section>

      <section className="today-workout" aria-labelledby="today-workout-title">
        <div className="today-workout-topline">
          <span className="eyebrow">TREINO DE HOJE · 19:00–20:00</span>
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

      {cardio && (
        <section className="coach-priority-card" aria-label="Cardio programado para hoje">
          <div>
            <span className="eyebrow">CARDIO DE HOJE · {cardio.startTime}–{cardio.endTime}</span>
            <strong>{cardio.title}</strong>
            <p>{cardio.type} · {cardio.durationMinutes} min</p>
            <p>{cardio.target}</p>
            <small>Intervalo após a musculação: 10 minutos</small>
          </div>
          <span className="coach-priority-arrow" aria-hidden="true">◌</span>
        </section>
      )}

      <section className="dashboard-grid" aria-label="Resumo de treino">
        <button type="button" className="dashboard-tile" onClick={onOpenPlan}>
          <span className="dashboard-tile-icon">▤</span><span>Ficha completa</span><strong>Ver exercícios</strong><small>Séries, repetições, carga e RIR</small>
        </button>
        <button type="button" className="dashboard-tile" onClick={onOpenProgress}>
          <span className="dashboard-tile-icon">↗</span><span>Progresso</span><strong>Acompanhar evolução</strong><small>Cargas, volume e histórico</small>
        </button>
      </section>

      <button type="button" className="coach-priority-card" onClick={onOpenProgress}>
        <div><span className="eyebrow">PRÓXIMA PROGRESSÃO</span><strong>Consulte seus últimos registros</strong><p>Compare carga, repetições e volume antes de avançar.</p></div>
        <span className="coach-priority-arrow">→</span>
      </button>
    </div>
  );
}
