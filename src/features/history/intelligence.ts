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
};

export type RecoveryEstimate = {
  muscleGroup: string;
  percent: number;
  label: string;
  lastTrainedAt: string;
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
  const sessions = getExerciseSessions(records, exerciseId).filter(({ exercise }) => (exercise.exerciseType ?? 'strength') === 'strength');
  if (!sessions.length) return { status: 'insufficient', title: 'Primeira referência', message: 'Conclua o exercício para o Coach criar uma referência de progressão.', suggestedWeightKg: null };

  const latest = sessions[0].exercise;
  const latestSets = latest.sets.filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
  if (!latestSets.length) return { status: 'insufficient', title: 'Dados insuficientes', message: 'Registre carga e repetições para receber uma recomendação.', suggestedWeightKg: null };

  const latestWeight = Math.max(...latestSets.map((set) => set.weightKg ?? 0));
  const latestReps = latestSets.reduce((total, set) => total + (set.repetitions ?? 0), 0);
  const rirValues = latestSets.map((set) => set.rir).filter((value): value is number => value !== null && value !== undefined);
  const averageRir = rirValues.length ? rirValues.reduce((a, b) => a + b, 0) / rirValues.length : null;

  if (sessions.length < 2) {
    return { status: 'maintain', title: 'Consolidar referência', message: `Última referência: ${formatWeight(latestWeight)}. Repita a sessão com técnica consistente antes de progredir automaticamente.`, suggestedWeightKg: latestWeight || null };
  }

  const previousSets = sessions[1].exercise.sets.filter((set) => (set.weightKg ?? 0) > 0 && (set.repetitions ?? 0) > 0);
  const previousWeight = previousSets.length ? Math.max(...previousSets.map((set) => set.weightKg ?? 0)) : 0;
  const previousReps = previousSets.reduce((total, set) => total + (set.repetitions ?? 0), 0);
  const performanceImproved = latestWeight > previousWeight || (latestWeight === previousWeight && latestReps > previousReps);

  if (performanceImproved && averageRir !== null && averageRir >= 1) {
    const suggested = roundToIncrement(latestWeight * 1.025, 0.5);
    return { status: 'progress', title: 'Progressão disponível', message: `Desempenho melhorou sem esgotar a margem de esforço. Próxima referência sugerida: ${formatWeight(suggested)} (+2,5%).`, suggestedWeightKg: suggested };
  }

  if (averageRir !== null && averageRir < 1) {
    return { status: 'review', title: 'Não aumentar agora', message: `A sessão terminou muito próxima da falha. Mantenha ${formatWeight(latestWeight)} e tente melhorar repetições e controle antes de subir a carga.`, suggestedWeightKg: latestWeight };
  }

  return { status: 'maintain', title: 'Manter e consolidar', message: `Mantenha ${formatWeight(latestWeight)}. O Coach ainda não detectou melhora suficiente para recomendar aumento de carga.`, suggestedWeightKg: latestWeight };
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

function roundToIncrement(value: number, increment: number) { return Math.round(value / increment) * increment; }
function formatWeight(value: number) { return `${Number.isInteger(value) ? value : value.toFixed(1)} kg`; }
