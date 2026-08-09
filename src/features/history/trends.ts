import type { WorkoutHistoryRecord } from './types';

export type MuscleTrendStatus = 'insufficient' | 'progressing' | 'stable' | 'stalled' | 'fatigued';

export type MuscleTrend = {
  muscleGroup: string;
  status: MuscleTrendStatus;
  confidence: 'low' | 'medium' | 'high';
  exposures: number;
  recentVolumeChangePercent: number | null;
  recentAverageRir: number | null;
  recommendation: 'collect-data' | 'maintain' | 'consider-volume-increase' | 'reduce-fatigue' | 'consider-deload';
  message: string;
};

type Exposure = {
  completedAt: string;
  volumeKg: number;
  totalReps: number;
  averageRir: number | null;
};

export function analyzeMuscleTrends(records: WorkoutHistoryRecord[]): MuscleTrend[] {
  const grouped = new Map<string, Exposure[]>();

  for (const record of records) {
    for (const exercise of record.exercises) {
      if ((exercise.exerciseType ?? 'strength') !== 'strength') continue;
      const validSets = (exercise.sets ?? []).filter((set) => (set.repetitions ?? 0) > 0);
      if (!validSets.length) continue;
      const rirValues = validSets.map((set) => set.rir).filter((value): value is number => typeof value === 'number');
      const exposure: Exposure = {
        completedAt: record.completedAt,
        volumeKg: exercise.volumeKg ?? validSets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.repetitions ?? 0), 0),
        totalReps: validSets.reduce((sum, set) => sum + (set.repetitions ?? 0), 0),
        averageRir: rirValues.length ? rirValues.reduce((sum, value) => sum + value, 0) / rirValues.length : null,
      };
      const current = grouped.get(exercise.muscleGroup) ?? [];
      current.push(exposure);
      grouped.set(exercise.muscleGroup, current);
    }
  }

  return [...grouped.entries()]
    .map(([muscleGroup, exposures]) => buildTrend(muscleGroup, exposures.sort((a, b) => b.completedAt.localeCompare(a.completedAt))))
    .sort((a, b) => trendPriority(a.status) - trendPriority(b.status) || a.muscleGroup.localeCompare(b.muscleGroup));
}

function buildTrend(muscleGroup: string, exposures: Exposure[]): MuscleTrend {
  const recent = exposures.slice(0, 4);
  const confidence = recent.length >= 4 ? 'high' : recent.length >= 3 ? 'medium' : 'low';
  if (recent.length < 3) {
    return {
      muscleGroup,
      status: 'insufficient',
      confidence,
      exposures: recent.length,
      recentVolumeChangePercent: null,
      recentAverageRir: averageRir(recent),
      recommendation: 'collect-data',
      message: 'Ainda não há exposições suficientes para concluir tendência desse grupo muscular.',
    };
  }

  const newest = recent[0];
  const oldest = recent.at(-1)!;
  const volumeChange = oldest.volumeKg > 0 ? ((newest.volumeKg - oldest.volumeKg) / oldest.volumeKg) * 100 : null;
  const rir = averageRir(recent.slice(0, 3));
  const volumeDeclines = countSequentialDeclines(recent.map((item) => item.volumeKg));
  const repDeclines = countSequentialDeclines(recent.map((item) => item.totalReps));
  const veryHard = rir !== null && rir < 0.75;
  const persistentDecline = volumeDeclines >= 2 || repDeclines >= 2 || (volumeChange !== null && volumeChange <= -12);
  const clearProgress = volumeChange !== null && volumeChange >= 8 && !veryHard;
  const flat = volumeChange !== null && Math.abs(volumeChange) < 5;

  if (persistentDecline && veryHard) {
    return {
      muscleGroup,
      status: 'fatigued',
      confidence,
      exposures: recent.length,
      recentVolumeChangePercent: round(volumeChange),
      recentAverageRir: round(rir),
      recommendation: recent.length >= 4 ? 'consider-deload' : 'reduce-fatigue',
      message: 'Há queda repetida de desempenho junto de esforço muito alto. Vale reduzir fadiga antes de tentar progredir novamente.',
    };
  }

  if (persistentDecline) {
    return {
      muscleGroup,
      status: 'stalled',
      confidence,
      exposures: recent.length,
      recentVolumeChangePercent: round(volumeChange),
      recentAverageRir: round(rir),
      recommendation: 'maintain',
      message: 'O desempenho caiu em exposições consecutivas. Mantenha a programação e revise recuperação, técnica e distribuição de esforço antes de adicionar volume.',
    };
  }

  if (clearProgress) {
    return {
      muscleGroup,
      status: 'progressing',
      confidence,
      exposures: recent.length,
      recentVolumeChangePercent: round(volumeChange),
      recentAverageRir: round(rir),
      recommendation: 'maintain',
      message: 'O grupo muscular mostra progressão recente. Preserve a estrutura atual enquanto o desempenho continuar subindo.',
    };
  }

  if (flat && rir !== null && rir >= 2 && recent.length >= 4) {
    return {
      muscleGroup,
      status: 'stable',
      confidence,
      exposures: recent.length,
      recentVolumeChangePercent: round(volumeChange),
      recentAverageRir: round(rir),
      recommendation: 'consider-volume-increase',
      message: 'O desempenho está estável com margem de esforço. Se a recuperação estiver boa, o Coach pode considerar pequeno aumento de estímulo.',
    };
  }

  return {
    muscleGroup,
    status: 'stable',
    confidence,
    exposures: recent.length,
    recentVolumeChangePercent: round(volumeChange),
    recentAverageRir: round(rir),
    recommendation: 'maintain',
    message: 'O grupo muscular está estável. Ainda não há evidência suficiente para alterar volume ou recuperação.',
  };
}

function countSequentialDeclines(values: number[]) {
  let declines = 0;
  for (let index = 0; index < values.length - 1; index += 1) {
    if (values[index] < values[index + 1] * 0.96) declines += 1;
  }
  return declines;
}

function averageRir(exposures: Exposure[]) {
  const values = exposures.map((item) => item.averageRir).filter((value): value is number => value !== null);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function trendPriority(status: MuscleTrendStatus) {
  if (status === 'fatigued') return 0;
  if (status === 'stalled') return 1;
  if (status === 'progressing') return 2;
  if (status === 'stable') return 3;
  return 4;
}

function round(value: number | null) {
  return value === null ? null : Math.round(value * 10) / 10;
}
