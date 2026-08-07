import { describe, expect, it } from 'vitest';
import { getProgressionAdvice } from '../src/features/history/intelligence';
import type { WorkoutHistoryRecord } from '../src/features/history/types';

function record(id: string, completedAt: string, sets: Array<{ weightKg: number; repetitions: number; rir: number }>): WorkoutHistoryRecord {
  return {
    id,
    planId: 'plan-1',
    planName: 'Plano A',
    workoutId: 'push-a',
    workoutTitle: 'Push A',
    workoutDay: 'Segunda',
    startedAt: completedAt,
    completedAt,
    durationSeconds: 3600,
    totalSets: sets.length,
    totalVolumeKg: 0,
    exercises: [{
      exerciseId: 'bench',
      name: 'Supino',
      muscleGroup: 'Peitoral',
      exerciseType: 'strength',
      volumeKg: 0,
      bestWeightKg: Math.max(...sets.map((set) => set.weightKg)),
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      bestSpeedKmh: null,
      bestInclinePercent: null,
      averageHeartRate: null,
      sets: sets.map((set, index) => ({
        setNumber: index + 1,
        weightKg: set.weightKg,
        repetitions: set.repetitions,
        rir: set.rir,
        durationSeconds: null,
        distanceMeters: null,
        speedKmh: null,
        inclinePercent: null,
        averagePace: null,
        averageHeartRate: null,
        calories: null,
        notes: null,
      })),
    }],
  };
}

describe('progressão inteligente v0.26', () => {
  it('sugere aumento de carga após melhora sustentada com margem de RIR', () => {
    const records = [
      record('r1', '2026-08-01T20:00:00.000Z', [{ weightKg: 80, repetitions: 8, rir: 2 }, { weightKg: 80, repetitions: 8, rir: 2 }]),
      record('r2', '2026-08-04T20:00:00.000Z', [{ weightKg: 80, repetitions: 9, rir: 2 }, { weightKg: 80, repetitions: 9, rir: 2 }]),
      record('r3', '2026-08-07T20:00:00.000Z', [{ weightKg: 82, repetitions: 9, rir: 1 }, { weightKg: 82, repetitions: 9, rir: 1 }]),
    ];
    const advice = getProgressionAdvice(records, 'bench');
    expect(advice.status).toBe('progress');
    expect(advice.trend).toBe('improving');
    expect(advice.confidence).toBe('high');
    expect(advice.suggestedWeightKg).toBeGreaterThan(82);
  });

  it('prioriza repetições antes da carga quando melhora com carga estável', () => {
    const records = [
      record('r1', '2026-08-01T20:00:00.000Z', [{ weightKg: 80, repetitions: 8, rir: 2 }, { weightKg: 80, repetitions: 8, rir: 2 }]),
      record('r2', '2026-08-04T20:00:00.000Z', [{ weightKg: 80, repetitions: 9, rir: 2 }, { weightKg: 80, repetitions: 9, rir: 2 }]),
    ];
    const advice = getProgressionAdvice(records, 'bench');
    expect(advice.status).toBe('maintain');
    expect(advice.title).toBe('Progredir repetições');
    expect(advice.suggestedReps).toBe(10);
  });

  it('bloqueia aumento quando RIR indica esforço excessivo', () => {
    const records = [
      record('r1', '2026-08-01T20:00:00.000Z', [{ weightKg: 80, repetitions: 10, rir: 2 }, { weightKg: 80, repetitions: 10, rir: 2 }]),
      record('r2', '2026-08-04T20:00:00.000Z', [{ weightKg: 82, repetitions: 8, rir: 0 }, { weightKg: 82, repetitions: 8, rir: 0 }]),
    ];
    const advice = getProgressionAdvice(records, 'bench');
    expect(advice.status).toBe('review');
    expect(advice.title).toBe('Não aumentar agora');
    expect(advice.suggestedWeightKg).toBe(82);
  });
});
