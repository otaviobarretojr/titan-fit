import { getExerciseSessions, getProgressionAdvice } from '../history/intelligence';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanPlan } from '../plan/types';

type WeeklyCoachStatus = 'building' | 'good' | 'attention';
export type FourWeekTrend = 'building' | 'rising' | 'stable' | 'attention';

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
  fourWeekTrend: FourWeekTrend;
  fourWeekLabel: string;
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
  const fourWeek = buildFourWeekTrend(records, now);

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
    return buildSummary({
      status: 'building', headline: 'Semana ainda sem registros', baseMessage, current, previous,
      progressSignals, stagnantExercises, comparisonLabel, priority, fourWeek,
    });
  }

  if (stagnantExercises > 0) {
    return buildSummary({
      status: 'attention',
      headline: 'Há pontos para destravar',
      baseMessage: `${stagnantExercises} exercício${stagnantExercises === 1 ? '' : 's'} aparece${stagnantExercises === 1 ? '' : 'm'} estável${stagnantExercises === 1 ? '' : 'is'} nas últimas sessões.`,
      current, previous, progressSignals, stagnantExercises, comparisonLabel, priority, fourWeek,
    });
  }

  if (progressSignals > 0 || current.prEvents > 0) {
    const baseMessage = progressSignals > 0
      ? `${progressSignals} exercício${progressSignals === 1 ? '' : 's'} já mostra${progressSignals === 1 ? '' : 'm'} sinal positivo de progressão.`
      : `${current.prEvents} PR${current.prEvents === 1 ? '' : 's'} conquistado${current.prEvents === 1 ? '' : 's'} nesta semana.`;
    return buildSummary({
      status: 'good', headline: 'Semana com evolução', baseMessage, current, previous,
      progressSignals, stagnantExercises, comparisonLabel, priority, fourWeek,
    });
  }

  return buildSummary({
    status: 'building',
    headline: 'Semana consistente',
    baseMessage: 'Continue acumulando sessões comparáveis. O Coach ainda não encontrou sinal forte de progressão ou estagnação.',
    current, previous, progressSignals, stagnantExercises, comparisonLabel, priority, fourWeek,
  });
}

function buildSummary(input: {
  status: WeeklyCoachStatus;
  headline: string;
  baseMessage: string;
  current: WeekMetrics;
  previous: WeekMetrics;
  progressSignals: number;
  stagnantExercises: number;
  comparisonLabel: string;
  priority: string;
  fourWeek: { trend: FourWeekTrend; label: string };
}): WeeklyCoachSummary {
  return {
    status: input.status,
    headline: input.headline,
    message: composeMessage(input.baseMessage, input.comparisonLabel, input.fourWeek.label, input.priority),
    strengthSessions: input.current.strengthSessions,
    cardioSessions: input.current.cardioSessions,
    prEvents: input.current.prEvents,
    progressSignals: input.progressSignals,
    stagnantExercises: input.stagnantExercises,
    previousStrengthSessions: input.previous.strengthSessions,
    previousCardioSessions: input.previous.cardioSessions,
    previousPrEvents: input.previous.prEvents,
    comparisonLabel: input.comparisonLabel,
    priority: input.priority,
    fourWeekTrend: input.fourWeek.trend,
    fourWeekLabel: input.fourWeek.label,
  };
}

function getWeekMetrics(records: WorkoutHistoryRecord[]): WeekMetrics {
  const strengthSessions = records.filter((record) => record.exercises.some((exercise) => (exercise.exerciseType ?? 'strength') === 'strength')).length;
  const cardioSessions = records.flatMap((record) => record.exercises).filter((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance').length;
  return { strengthSessions, cardioSessions, prEvents: countPrEvents(records) };
}

function buildFourWeekTrend(records: WorkoutHistoryRecord[], now: Date) {
  const weeks = Array.from({ length: 4 }, (_, index) => {
    const offset = 3 - index;
    const weekStart = startOfWeek(now);
    weekStart.setDate(weekStart.getDate() - offset * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setMilliseconds(-1);
    const effectiveEnd = offset === 0 && now < weekEnd ? now : weekEnd;
    return getWeekMetrics(records.filter((record) => inRange(record.completedAt, weekStart, effectiveEnd)));
  });

  const activeWeeks = weeks.filter((week) => week.strengthSessions + week.cardioSessions > 0);
  if (activeWeeks.length < 2) return { trend: 'building' as FourWeekTrend, label: '4 semanas: construindo base' };

  const firstHalf = averageMetrics(weeks.slice(0, 2));
  const secondHalf = averageMetrics(weeks.slice(2));
  const strengthDelta = secondHalf.strengthSessions - firstHalf.strengthSessions;
  const cardioDelta = secondHalf.cardioSessions - firstHalf.cardioSessions;
  const totalPrs = weeks.reduce((sum, week) => sum + week.prEvents, 0);
  const latestTwoActive = weeks.slice(2).filter((week) => week.strengthSessions + week.cardioSessions > 0).length;

  if (latestTwoActive < 2) return { trend: 'attention' as FourWeekTrend, label: '4 semanas: atenção à consistência recente' };
  if (strengthDelta <= -1 || cardioDelta <= -1.5) return { trend: 'attention' as FourWeekTrend, label: '4 semanas: tendência de queda na frequência' };
  if (strengthDelta >= 0.5 || cardioDelta >= 1 || totalPrs >= 2) return { trend: 'rising' as FourWeekTrend, label: '4 semanas: tendência positiva' };
  return { trend: 'stable' as FourWeekTrend, label: '4 semanas: tendência estável' };
}

function averageMetrics(weeks: WeekMetrics[]): WeekMetrics {
  const divisor = Math.max(1, weeks.length);
  return {
    strengthSessions: weeks.reduce((sum, week) => sum + week.strengthSessions, 0) / divisor,
    cardioSessions: weeks.reduce((sum, week) => sum + week.cardioSessions, 0) / divisor,
    prEvents: weeks.reduce((sum, week) => sum + week.prEvents, 0) / divisor,
  };
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

function composeMessage(base: string, comparison: string, fourWeek: string, priority: string) { return `${base} ${comparison}. ${fourWeek}. ${priority}`; }
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
