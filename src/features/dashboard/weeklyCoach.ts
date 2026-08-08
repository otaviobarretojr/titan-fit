import { getExerciseSessions, getProgressionAdvice } from '../history/intelligence';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanPlan } from '../plan/types';

type WeeklyCoachStatus = 'building' | 'good' | 'attention';

type WeekMetrics = {
  strengthSessions: number;
  cardioSessions: number;
  prEvents: number;
};

export type WeeklyCoachSummary = {
  status: WeeklyCoachStatus;
  headline: string;
  message: string;
  strengthSessions: number;
  cardioSessions: number;
  prEvents: number;
  progressSignals: number;
  stagnantExercises: number;
  previousStrengthSessions: number;
  previousCardioSessions: number;
  previousPrEvents: number;
  comparisonLabel: string;
  priority: string;
};

export function buildWeeklyCoachSummary(plan: TitanPlan, records: WorkoutHistoryRecord[]): WeeklyCoachSummary {
  const now = new Date();
  const currentStart = startOfWeek(now);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 7);

  const currentRecords = records.filter((record) => inRange(record.completedAt, currentStart, now));
  const previousRecords = records.filter((record) => inRange(record.completedAt, previousStart, previousEnd));
  const current = getWeekMetrics(currentRecords);
  const previous = getWeekMetrics(previousRecords);

  const strengthExercises = plan.workouts.flatMap((workout) => workout.exercises).filter((exercise) => (exercise.exerciseType ?? 'strength') === 'strength');
  const unique = [...new Map(strengthExercises.map((exercise) => [exercise.id, exercise])).values()];
  let progressSignals = 0;
  let stagnantExercises = 0;

  for (const exercise of unique) {
    const advice = getProgressionAdvice(records, exercise.id);
    if (advice.status === 'progress') progressSignals += 1;
    const sessions = getExerciseSessions(records, exercise.id).slice(0, 3);
    if (isStagnant(sessions)) stagnantExercises += 1;
  }

  const comparisonLabel = buildComparisonLabel(current, previous, previousRecords.length > 0);
  const priority = buildPriority({ current, previous, progressSignals, stagnantExercises, hasPreviousWeek: previousRecords.length > 0 });

  if (!currentRecords.length) {
    const baseMessage = previousRecords.length
      ? 'Ainda não há registros nesta semana para comparar com a anterior.'
      : 'O Coach precisa dos seus treinos e cardios desta semana para gerar uma leitura útil.';
    return {
      status: 'building',
      headline: 'Semana ainda sem registros',
      message: composeMessage(baseMessage, comparisonLabel, priority),
      strengthSessions: 0,
      cardioSessions: 0,
      prEvents: 0,
      progressSignals,
      stagnantExercises,
      previousStrengthSessions: previous.strengthSessions,
      previousCardioSessions: previous.cardioSessions,
      previousPrEvents: previous.prEvents,
      comparisonLabel,
      priority,
    };
  }

  if (stagnantExercises > 0) {
    const baseMessage = `${stagnantExercises} exercício${stagnantExercises === 1 ? '' : 's'} aparece${stagnantExercises === 1 ? '' : 'm'} estável${stagnantExercises === 1 ? '' : 'is'} nas últimas sessões.`;
    return {
      status: 'attention',
      headline: 'Há pontos para destravar',
      message: composeMessage(baseMessage, comparisonLabel, priority),
      strengthSessions: current.strengthSessions,
      cardioSessions: current.cardioSessions,
      prEvents: current.prEvents,
      progressSignals,
      stagnantExercises,
      previousStrengthSessions: previous.strengthSessions,
      previousCardioSessions: previous.cardioSessions,
      previousPrEvents: previous.prEvents,
      comparisonLabel,
      priority,
    };
  }

  if (progressSignals > 0 || current.prEvents > 0) {
    const baseMessage = progressSignals > 0
      ? `${progressSignals} exercício${progressSignals === 1 ? '' : 's'} já mostra${progressSignals === 1 ? '' : 'm'} sinal positivo de progressão.`
      : `${current.prEvents} PR${current.prEvents === 1 ? '' : 's'} conquistado${current.prEvents === 1 ? '' : 's'} nesta semana.`;
    return {
      status: 'good',
      headline: 'Semana com evolução',
      message: composeMessage(baseMessage, comparisonLabel, priority),
      strengthSessions: current.strengthSessions,
      cardioSessions: current.cardioSessions,
      prEvents: current.prEvents,
      progressSignals,
      stagnantExercises,
      previousStrengthSessions: previous.strengthSessions,
      previousCardioSessions: previous.cardioSessions,
      previousPrEvents: previous.prEvents,
      comparisonLabel,
      priority,
    };
  }

  return {
    status: 'building',
    headline: 'Semana consistente',
    message: composeMessage('Continue acumulando sessões comparáveis. O Coach ainda não encontrou sinal forte de progressão ou estagnação.', comparisonLabel, priority),
    strengthSessions: current.strengthSessions,
    cardioSessions: current.cardioSessions,
    prEvents: current.prEvents,
    progressSignals,
    stagnantExercises,
    previousStrengthSessions: previous.strengthSessions,
    previousCardioSessions: previous.cardioSessions,
    previousPrEvents: previous.prEvents,
    comparisonLabel,
    priority,
  };
}

function getWeekMetrics(records: WorkoutHistoryRecord[]): WeekMetrics {
  const strengthSessions = records.filter((record) => record.exercises.some((exercise) => (exercise.exerciseType ?? 'strength') === 'strength')).length;
  const cardioSessions = records.flatMap((record) => record.exercises).filter((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance').length;
  return { strengthSessions, cardioSessions, prEvents: countPrEvents(records) };
}

function buildComparisonLabel(current: WeekMetrics, previous: WeekMetrics, hasPreviousWeek: boolean) {
  if (!hasPreviousWeek) return 'Comparação semanal em construção';
  const strengthDelta = current.strengthSessions - previous.strengthSessions;
  const cardioDelta = current.cardioSessions - previous.cardioSessions;
  const prDelta = current.prEvents - previous.prEvents;
  return `Vs. semana anterior: musculação ${signed(strengthDelta)} · cardio ${signed(cardioDelta)} · PRs ${signed(prDelta)}`;
}

function buildPriority(input: { current: WeekMetrics; previous: WeekMetrics; progressSignals: number; stagnantExercises: number; hasPreviousWeek: boolean }) {
  const { current, previous, progressSignals, stagnantExercises, hasPreviousWeek } = input;
  if (stagnantExercises > 0) return `Prioridade: destravar ${stagnantExercises} exercício${stagnantExercises === 1 ? '' : 's'} antes de forçar aumento de carga.`;
  if (current.cardioSessions === 0) return 'Prioridade: manter o cardio diário registrado para o Coach acompanhar consistência e evolução.';
  if (progressSignals > 0) return `Prioridade: aproveitar ${progressSignals} sinal${progressSignals === 1 ? '' : 'is'} de progressão com técnica e esforço controlados.`;
  if (hasPreviousWeek && current.strengthSessions < previous.strengthSessions) return 'Prioridade: recuperar a consistência da musculação em relação à semana anterior.';
  if (hasPreviousWeek && current.cardioSessions < previous.cardioSessions) return 'Prioridade: recuperar a frequência de cardio em relação à semana anterior.';
  return 'Prioridade: manter consistência e continuar criando sessões comparáveis.';
}

function composeMessage(base: string, comparison: string, priority: string) { return `${base} ${comparison}. ${priority}`; }
function signed(value: number) { return value > 0 ? `+${value}` : String(value); }
function inRange(value: string, start: Date, end: Date) { const date = new Date(value); return date >= start && date <= end; }
function startOfWeek(date: Date) { const result = new Date(date); const day = result.getDay(); const diff = day === 0 ? -6 : 1 - day; result.setDate(result.getDate() + diff); result.setHours(0, 0, 0, 0); return result; }

function isStagnant(sessions: ReturnType<typeof getExerciseSessions>) {
  if (sessions.length < 3) return false;
  const performance = sessions.slice(0, 3).map(({ exercise }) => {
    const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
    return { maxWeight: valid.length ? Math.max(...valid.map((set) => set.weightKg ?? 0)) : 0, totalReps: valid.reduce((sum, set) => sum + (set.repetitions ?? 0), 0) };
  });
  if (performance.some((item) => item.maxWeight <= 0 || item.totalReps <= 0)) return false;
  const sameLoad = performance.every((item) => item.maxWeight === performance[0].maxWeight);
  const repSpread = Math.max(...performance.map((item) => item.totalReps)) - Math.min(...performance.map((item) => item.totalReps));
  return sameLoad && repSpread <= 1;
}

function countPrEvents(records: WorkoutHistoryRecord[]) {
  const byExercise = new Map<string, Array<{ weight: number; reps: number }>>();
  for (const record of [...records].sort((a, b) => a.completedAt.localeCompare(b.completedAt))) {
    for (const exercise of record.exercises) {
      if ((exercise.exerciseType ?? 'strength') !== 'strength') continue;
      const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
      if (!valid.length) continue;
      const best = [...valid].sort((a, b) => ((b.weightKg ?? 0) * (b.repetitions ?? 0)) - ((a.weightKg ?? 0) * (a.repetitions ?? 0)))[0];
      const list = byExercise.get(exercise.exerciseId) ?? [];
      list.push({ weight: best.weightKg ?? 0, reps: best.repetitions ?? 0 });
      byExercise.set(exercise.exerciseId, list);
    }
  }

  let count = 0;
  for (const sessions of byExercise.values()) {
    let bestWeight = -1;
    let bestScore = -1;
    sessions.forEach((session, index) => {
      const score = session.weight * session.reps;
      if (index === 0) { bestWeight = session.weight; bestScore = score; return; }
      if (session.weight > bestWeight || score > bestScore) count += 1;
      bestWeight = Math.max(bestWeight, session.weight);
      bestScore = Math.max(bestScore, score);
    });
  }
  return count;
}
