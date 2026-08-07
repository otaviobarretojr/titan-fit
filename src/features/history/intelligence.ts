import type { HistoryExercise, WorkoutHistoryRecord } from './types';

export type StrengthPr = {
  bestWeightKg: number | null;
  bestSet: { weightKg: number; repetitions: number; estimatedVolumeKg: number } | null;
  bestSessionVolumeKg: number;
};

export type ProgressionAdvice = {
  status: 'insufficient' | 'maintain' | 'progress' | 'review';
  title: string;
  message: string;
  suggestedWeightKg: number | null;
  suggestedReps: number | null;
  confidence: 'low' | 'medium' | 'high';
  trend: 'first' | 'stable' | 'improving' | 'declining';
};

export type RecoveryEstimate = {
  muscleGroup: string;
  percent: number;
  label: string;
  lastTrainedAt: string;
};

type SessionPerformance = {
  maxWeightKg: number;
  totalReps: number;
  averageRir: number | null;
  validSets: number;
};

export function getExerciseSessions(records: WorkoutHistoryRecord[], exerciseId: string) {
  return records
    .flatMap((record) => record.exercises
      .filter((exercise) => exercise.exerciseId === exerciseId)
      .map((exercise) => ({ exercise, completedAt: record.completedAt })))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export function calculateStrengthPr(records: WorkoutHistoryRecord[], exerciseId: string): StrengthPr {
  const sessions = getExerciseSessions(records, exerciseId);
  let bestWeightKg: number | null = null;
  let bestSet: StrengthPr['bestSet'] = null;
  let bestSessionVolumeKg = 0;

  for (const { exercise } of sessions) {
    bestSessionVolumeKg = Math.max(bestSessionVolumeKg, exercise.volumeKg ?? 0);
    for (const set of exercise.sets ?? []) {
      const weightKg = set.weightKg ?? 0;
      const repetitions = set.repetitions ?? 0;
      if (weightKg > 0) bestWeightKg = Math.max(bestWeightKg ?? 0, weightKg);
      if (weightKg <= 0 || repetitions <= 0) continue;
      const estimatedVolumeKg = weightKg * repetitions;
      if (!bestSet || estimatedVolumeKg > bestSet.estimatedVolumeKg || (estimatedVolumeKg === bestSet.estimatedVolumeKg && weightKg > bestSet.weightKg)) {
        bestSet = { weightKg, repetitions, estimatedVolumeKg };
      }
    }
  }

  return { bestWeightKg, bestSet, bestSessionVolumeKg };
}

export function getProgressionAdvice(records: WorkoutHistoryRecord[], exerciseId: string): ProgressionAdvice {
  const sessions = getExerciseSessions(records, exerciseId)
    .filter(({ exercise }) => (exercise.exerciseType ?? 'strength') === 'strength')
    .slice(0, 3);

  if (!sessions.length) return advice('insufficient', 'Primeira referência', 'Conclua o exercício para o Coach criar uma referência de progressão.', null, null, 'low', 'first');

  const performances = sessions.map(({ exercise }) => summarizeStrengthSession(exercise));
  const latest = performances[0];
  if (!latest.validSets) return advice('insufficient', 'Dados insuficientes', 'Registre carga e repetições para receber uma recomendação.', null, null, 'low', 'first');

  if (sessions.length < 2) {
    return advice('maintain', 'Consolidar referência', `Última referência: ${formatWeight(latest.maxWeightKg)}. Repita a sessão com técnica consistente antes de progredir automaticamente.`, latest.maxWeightKg || null, null, 'low', 'first');
  }

  const previous = performances[1];
  const third = performances[2] ?? null;
  const recentTrend = comparePerformance(latest, previous);
  const threeSessionTrend = third ? comparePerformance(previous, third) : 'stable';
  const fatigueFlag = latest.averageRir !== null && latest.averageRir < 1;
  const repDrop = previous.totalReps > 0 && latest.totalReps < previous.totalReps * 0.9 && latest.maxWeightKg <= previous.maxWeightKg;

  if (fatigueFlag || repDrop) {
    const reason = fatigueFlag
      ? 'A última sessão terminou muito próxima da falha.'
      : 'As repetições caíram de forma relevante sem aumento de carga.';
    return advice('review', 'Não aumentar agora', `${reason} Mantenha ${formatWeight(latest.maxWeightKg)} e recupere desempenho antes de subir a carga.`, latest.maxWeightKg, Math.max(1, Math.round(latest.totalReps / latest.validSets)), sessions.length >= 3 ? 'high' : 'medium', repDrop ? 'declining' : 'stable');
  }

  if (recentTrend === 'improving' && latest.maxWeightKg === previous.maxWeightKg) {
    const perSet = Math.max(1, Math.ceil(latest.totalReps / latest.validSets));
    return advice('maintain', 'Progredir repetições', `A carga está estável e as repetições melhoraram. Mantenha ${formatWeight(latest.maxWeightKg)} e tente acrescentar 1 repetição por série antes de aumentar a carga.`, latest.maxWeightKg, perSet + 1, sessions.length >= 3 ? 'high' : 'medium', 'improving');
  }

  const sustainedImprovement = recentTrend === 'improving' && latest.maxWeightKg > previous.maxWeightKg && (threeSessionTrend === 'improving' || threeSessionTrend === 'stable');
  const hasEffortMargin = latest.averageRir !== null && latest.averageRir >= 1;

  if (sustainedImprovement && hasEffortMargin) {
    const suggested = roundToIncrement(latest.maxWeightKg * 1.025, 0.5);
    return advice('progress', 'Progressão disponível', `A evolução foi sustentada e ainda houve margem de esforço. Próxima referência sugerida: ${formatWeight(suggested)} (+2,5%).`, suggested, null, sessions.length >= 3 ? 'high' : 'medium', 'improving');
  }

  if (recentTrend === 'declining') {
    return advice('review', 'Revisar desempenho', `O desempenho caiu em relação à sessão anterior. Mantenha ${formatWeight(latest.maxWeightKg)} e priorize técnica, recuperação e execução antes de progredir.`, latest.maxWeightKg, null, sessions.length >= 3 ? 'high' : 'medium', 'declining');
  }

  return advice('maintain', 'Manter e consolidar', `Mantenha ${formatWeight(latest.maxWeightKg)}. O Coach ainda não detectou melhora suficiente para recomendar aumento de carga.`, latest.maxWeightKg, null, sessions.length >= 3 ? 'high' : 'medium', 'stable');
}

export function calculateRecovery(records: WorkoutHistoryRecord[], now = new Date()): RecoveryEstimate[] {
  const latestByMuscle = new Map<string, string>();
  for (const record of records) {
    for (const exercise of record.exercises) {
      const current = latestByMuscle.get(exercise.muscleGroup);
      if (!current || record.completedAt > current) latestByMuscle.set(exercise.muscleGroup, record.completedAt);
    }
  }

  return [...latestByMuscle.entries()].map(([muscleGroup, lastTrainedAt]) => {
    const hours = Math.max(0, (now.getTime() - new Date(lastTrainedAt).getTime()) / 3_600_000);
    let percent = 100;
    if (hours < 24) percent = 35;
    else if (hours < 48) percent = 60;
    else if (hours < 72) percent = 82;
    const label = percent >= 95 ? 'Recuperado' : percent >= 75 ? 'Quase recuperado' : percent >= 50 ? 'Recuperação em andamento' : 'Recém-treinado';
    return { muscleGroup, percent, label, lastTrainedAt };
  }).sort((a, b) => a.percent - b.percent || a.muscleGroup.localeCompare(b.muscleGroup));
}

export function formatLastStrengthSession(exercise: HistoryExercise) {
  const sets = exercise.sets.filter((set) => (set.repetitions ?? 0) > 0);
  if (!sets.length) return 'Sem séries válidas';
  const weight = Math.max(...sets.map((set) => set.weightKg ?? 0));
  const reps = sets.map((set) => set.repetitions ?? 0).join(' · ');
  return `${formatWeight(weight)} · ${reps} reps`;
}

function summarizeStrengthSession(exercise: HistoryExercise): SessionPerformance {
  const sets = exercise.sets.filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
  if (!sets.length) return { maxWeightKg: 0, totalReps: 0, averageRir: null, validSets: 0 };
  const rirValues = sets.map((set) => set.rir).filter((value): value is number => value !== null && value !== undefined);
  return {
    maxWeightKg: Math.max(...sets.map((set) => set.weightKg ?? 0)),
    totalReps: sets.reduce((total, set) => total + (set.repetitions ?? 0), 0),
    averageRir: rirValues.length ? rirValues.reduce((a, b) => a + b, 0) / rirValues.length : null,
    validSets: sets.length,
  };
}

function comparePerformance(current: SessionPerformance, previous: SessionPerformance): 'stable' | 'improving' | 'declining' {
  if (current.maxWeightKg > previous.maxWeightKg) return 'improving';
  if (current.maxWeightKg < previous.maxWeightKg) return 'declining';
  if (current.totalReps > previous.totalReps) return 'improving';
  if (current.totalReps < previous.totalReps) return 'declining';
  return 'stable';
}

function advice(status: ProgressionAdvice['status'], title: string, message: string, suggestedWeightKg: number | null, suggestedReps: number | null, confidence: ProgressionAdvice['confidence'], trend: ProgressionAdvice['trend']): ProgressionAdvice {
  return { status, title, message, suggestedWeightKg, suggestedReps, confidence, trend };
}

function roundToIncrement(value: number, increment: number) { return Math.round(value / increment) * increment; }
function formatWeight(value: number) { return `${Number.isInteger(value) ? value : value.toFixed(1)} kg`; }
