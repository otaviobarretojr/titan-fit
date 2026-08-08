import { getExerciseSessions, getProgressionAdvice } from '../history/intelligence';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanPlan } from '../plan/types';

type WeeklyCoachStatus = 'building' | 'good' | 'attention';

export type WeeklyCoachSummary = {
  status: WeeklyCoachStatus;
  headline: string;
  message: string;
  strengthSessions: number;
  cardioSessions: number;
  prEvents: number;
  progressSignals: number;
  stagnantExercises: number;
};

export function buildWeeklyCoachSummary(plan: TitanPlan, records: WorkoutHistoryRecord[]): WeeklyCoachSummary {
  const now = new Date();
  const start = startOfWeek(now);
  const weekRecords = records.filter((record) => new Date(record.completedAt) >= start && new Date(record.completedAt) <= now);
  const strengthRecords = weekRecords.filter((record) => record.exercises.some((exercise) => (exercise.exerciseType ?? 'strength') === 'strength'));
  const cardioSessions = weekRecords.flatMap((record) => record.exercises).filter((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance').length;
  const prEvents = countPrEvents(weekRecords);

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

  if (!weekRecords.length) {
    return {
      status: 'building',
      headline: 'Semana ainda sem registros',
      message: 'O Coach precisa dos seus treinos e cardios desta semana para gerar uma leitura útil.',
      strengthSessions: 0,
      cardioSessions: 0,
      prEvents: 0,
      progressSignals,
      stagnantExercises,
    };
  }

  if (stagnantExercises > 0) {
    return {
      status: 'attention',
      headline: 'Há pontos para destravar',
      message: `${stagnantExercises} exercício${stagnantExercises === 1 ? '' : 's'} aparece${stagnantExercises === 1 ? '' : 'm'} estável${stagnantExercises === 1 ? '' : 'is'} nas últimas sessões. Priorize execução e repetições antes de subir carga.`,
      strengthSessions: strengthRecords.length,
      cardioSessions,
      prEvents,
      progressSignals,
      stagnantExercises,
    };
  }

  if (progressSignals > 0 || prEvents > 0) {
    return {
      status: 'good',
      headline: 'Semana com evolução',
      message: progressSignals > 0
        ? `${progressSignals} exercício${progressSignals === 1 ? '' : 's'} já mostra${progressSignals === 1 ? '' : 'm'} sinal positivo de progressão.`
        : `${prEvents} PR${prEvents === 1 ? '' : 's'} conquistado${prEvents === 1 ? '' : 's'} nesta semana.`,
      strengthSessions: strengthRecords.length,
      cardioSessions,
      prEvents,
      progressSignals,
      stagnantExercises,
    };
  }

  return {
    status: 'building',
    headline: 'Semana consistente',
    message: 'Continue acumulando sessões comparáveis. O Coach ainda não encontrou sinal forte de progressão ou estagnação.',
    strengthSessions: strengthRecords.length,
    cardioSessions,
    prEvents,
    progressSignals,
    stagnantExercises,
  };
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isStagnant(sessions: ReturnType<typeof getExerciseSessions>) {
  if (sessions.length < 3) return false;
  const performance = sessions.slice(0, 3).map(({ exercise }) => {
    const valid = (exercise.sets ?? []).filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
    return {
      maxWeight: valid.length ? Math.max(...valid.map((set) => set.weightKg ?? 0)) : 0,
      totalReps: valid.reduce((sum, set) => sum + (set.repetitions ?? 0), 0),
    };
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
      if (index === 0) {
        bestWeight = session.weight;
        bestScore = score;
        return;
      }
      if (session.weight > bestWeight || score > bestScore) count += 1;
      bestWeight = Math.max(bestWeight, session.weight);
      bestScore = Math.max(bestScore, score);
    });
  }
  return count;
}
