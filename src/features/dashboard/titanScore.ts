import { getProgressionAdvice } from '../history/intelligence';
import type { WorkoutHistoryRecord } from '../history/types';
import type { TitanPlan } from '../plan/types';

export type TitanScoreResult = {
  score: number | null;
  status: 'building' | 'excellent' | 'good' | 'attention';
  label: string;
  message: string;
  strengthScore: number;
  cardioScore: number;
  performanceScore: number;
  consistencyScore: number;
};

const DAY_INDEX: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

export function buildTitanScore(plan: TitanPlan, records: WorkoutHistoryRecord[]): TitanScoreResult {
  if (!records.length) {
    return {
      score: null,
      status: 'building',
      label: 'Criando base',
      message: 'Registre musculação e cardio para liberar um Score TITAN confiável.',
      strengthScore: 0,
      cardioScore: 0,
      performanceScore: 0,
      consistencyScore: 0,
    };
  }

  const now = new Date();
  const weekStart = startOfWeek(now);
  const elapsedDays = Math.max(0, mondayIndex(now.getDay()));
  const cutoff = new Date(weekStart);
  cutoff.setDate(cutoff.getDate() + elapsedDays);
  cutoff.setMilliseconds(-1);

  const completedBeforeToday = records.filter((record) => {
    const date = new Date(record.completedAt);
    return date >= weekStart && date <= cutoff;
  });

  const scheduledStrengthDays = getScheduledStrengthDays(plan).filter((day) => day >= 1 && day <= elapsedDays);
  const completedStrengthDays = uniqueDates(
    completedBeforeToday.filter(hasStrength).map((record) => record.completedAt),
  ).size;
  const strengthAdherence = scheduledStrengthDays.length
    ? clamp01(completedStrengthDays / scheduledStrengthDays.length)
    : 1;

  const completedCardioDays = uniqueDates(
    completedBeforeToday.filter(hasCardio).map((record) => record.completedAt),
  ).size;
  const cardioAdherence = elapsedDays > 0 ? clamp01(completedCardioDays / elapsedDays) : 1;

  const recent28 = records.filter((record) => {
    const age = now.getTime() - new Date(record.completedAt).getTime();
    return age >= 0 && age <= 28 * 24 * 60 * 60 * 1000;
  });
  const activeDays = uniqueDates(recent28.map((record) => record.completedAt)).size;
  const historySpanDays = getHistorySpanDays(records, now);
  const consistencyDenominator = Math.max(1, Math.min(28, historySpanDays));
  const consistency = clamp01(activeDays / consistencyDenominator);

  const strengthExercises = plan.workouts
    .flatMap((workout) => workout.exercises)
    .filter((exercise) => (exercise.exerciseType ?? 'strength') === 'strength');
  const uniqueStrength = [...new Map(strengthExercises.map((exercise) => [exercise.id, exercise])).values()];
  const progressSignals = uniqueStrength.filter((exercise) => getProgressionAdvice(records, exercise.id).status === 'progress').length;
  const prEvents = countPrEvents(recent28);
  const performance = uniqueStrength.length
    ? clamp01((progressSignals + Math.min(prEvents, uniqueStrength.length)) / Math.max(1, uniqueStrength.length))
    : 0;

  const strengthScore = Math.round(strengthAdherence * 35);
  const cardioScore = Math.round(cardioAdherence * 30);
  const performanceScore = Math.round(performance * 20);
  const consistencyScore = Math.round(consistency * 15);
  const score = Math.min(100, strengthScore + cardioScore + performanceScore + consistencyScore);

  const status = score >= 85 ? 'excellent' : score >= 70 ? 'good' : 'attention';
  const label = score >= 85 ? 'Excelente' : score >= 70 ? 'Bom ritmo' : 'Atenção';
  const weakest = [
    { key: 'musculação', value: strengthAdherence },
    { key: 'cardio', value: cardioAdherence },
    { key: 'progressão', value: performance },
    { key: 'consistência', value: consistency },
  ].sort((a, b) => a.value - b.value)[0];
  const strongest = [
    { key: 'musculação', value: strengthAdherence },
    { key: 'cardio', value: cardioAdherence },
    { key: 'progressão', value: performance },
    { key: 'consistência', value: consistency },
  ].sort((a, b) => b.value - a.value)[0];

  return {
    score,
    status,
    label,
    message: score >= 85
      ? `Seu melhor pilar agora é ${strongest.key}. Mantenha a regularidade para sustentar o nível.`
      : `O principal ponto para subir o score agora é ${weakest.key}.`,
    strengthScore,
    cardioScore,
    performanceScore,
    consistencyScore,
  };
}

function getScheduledStrengthDays(plan: TitanPlan) {
  const days = plan.workouts
    .filter((workout) => workout.exercises.some((exercise) => (exercise.exerciseType ?? 'strength') === 'strength'))
    .map((workout) => parseDay(workout.day))
    .filter((value): value is number => value !== null);
  return [...new Set(days)];
}

function parseDay(value: string) {
  const normalized = normalize(value);
  for (const [name, index] of Object.entries(DAY_INDEX)) if (normalized.includes(name)) return index;
  return null;
}

function hasStrength(record: WorkoutHistoryRecord) {
  return record.exercises.some((exercise) => (exercise.exerciseType ?? 'strength') === 'strength');
}
function hasCardio(record: WorkoutHistoryRecord) {
  return record.exercises.some((exercise) => exercise.exerciseType === 'cardio' || exercise.exerciseType === 'distance');
}
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function clamp01(value: number) { return Math.max(0, Math.min(1, value)); }
function mondayIndex(jsDay: number) { return jsDay === 0 ? 6 : jsDay - 1; }
function startOfWeek(date: Date) { const result = new Date(date); result.setDate(result.getDate() - mondayIndex(result.getDay())); result.setHours(0, 0, 0, 0); return result; }
function localDateKey(value: string) { const date = new Date(value); return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; }
function uniqueDates(values: string[]) { return new Set(values.map(localDateKey)); }
function getHistorySpanDays(records: WorkoutHistoryRecord[], now: Date) { const oldest = [...records].sort((a, b) => a.completedAt.localeCompare(b.completedAt))[0]; if (!oldest) return 1; return Math.max(1, Math.ceil((now.getTime() - new Date(oldest.completedAt).getTime()) / (24 * 60 * 60 * 1000)) + 1); }

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
