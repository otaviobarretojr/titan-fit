import { decideTitanProgression, type TitanProgressionDecision, type TitanProgressionPrescription } from '../../core/titan-engine';
import type { HistoryExercise, WorkoutHistoryRecord } from './types';

export type StrengthPr = {
  bestWeightKg: number | null;
  bestSet: { weightKg: number; repetitions: number; estimatedVolumeKg: number } | null;
  bestSessionVolumeKg: number;
};

export type ProgressionAdvice = TitanProgressionDecision;
export type ProgressionPrescription = Partial<TitanProgressionPrescription>;
export type RecoveryEstimate = { muscleGroup: string; percent: number; label: string; lastTrainedAt: string };

export function getExerciseSessions(records: WorkoutHistoryRecord[], exerciseId: string) {
  return records.flatMap((record) => record.exercises
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
      if (!bestSet || estimatedVolumeKg > bestSet.estimatedVolumeKg || (estimatedVolumeKg === bestSet.estimatedVolumeKg && weightKg > bestSet.weightKg)) bestSet = { weightKg, repetitions, estimatedVolumeKg };
    }
  }
  return { bestWeightKg, bestSet, bestSessionVolumeKg };
}

export function getProgressionAdvice(records: WorkoutHistoryRecord[], exerciseId: string, prescription: ProgressionPrescription = {}): ProgressionAdvice {
  const sessions = getExerciseSessions(records, exerciseId)
    .filter(({ exercise }) => (exercise.exerciseType ?? 'strength') === 'strength')
    .slice(0, 3)
    .map(({ exercise }) => ({ sets: exercise.sets.map((set) => ({ weightKg: set.weightKg, repetitions: set.repetitions, rir: set.rir })) }));
  return decideTitanProgression(sessions, {
    minReps: prescription.minReps ?? 6,
    maxReps: prescription.maxReps ?? 12,
    targetRir: prescription.targetRir ?? 2,
    loadIncrementPercent: prescription.loadIncrementPercent,
  });
}

export function calculateRecovery(records: WorkoutHistoryRecord[], now = new Date()): RecoveryEstimate[] {
  const latestByMuscle = new Map<string, string>();
  for (const record of records) for (const exercise of record.exercises) {
    const current = latestByMuscle.get(exercise.muscleGroup);
    if (!current || record.completedAt > current) latestByMuscle.set(exercise.muscleGroup, record.completedAt);
  }
  return [...latestByMuscle.entries()].map(([muscleGroup, lastTrainedAt]) => {
    const hours = Math.max(0, (now.getTime() - new Date(lastTrainedAt).getTime()) / 3_600_000);
    const percent = hours < 24 ? 35 : hours < 48 ? 60 : hours < 72 ? 82 : 100;
    const label = percent >= 95 ? 'Recuperado' : percent >= 75 ? 'Quase recuperado' : percent >= 50 ? 'Recuperação em andamento' : 'Recém-treinado';
    return { muscleGroup, percent, label, lastTrainedAt };
  }).sort((a, b) => a.percent - b.percent || a.muscleGroup.localeCompare(b.muscleGroup));
}

export function formatLastStrengthSession(exercise: HistoryExercise) {
  const sets = exercise.sets.filter((set) => (set.repetitions ?? 0) > 0);
  if (!sets.length) return 'Sem séries válidas';
  const weight = Math.max(...sets.map((set) => set.weightKg ?? 0));
  return `${formatWeight(weight)} · ${sets.map((set) => set.repetitions ?? 0).join(' · ')} reps`;
}

function formatWeight(value: number) { return `${Number.isInteger(value) ? value : value.toFixed(1)} kg`; }
