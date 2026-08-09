import { describe, expect, it } from 'vitest';
import { analyzeMuscleTrends } from '../src/features/history/trends';
import { createCoachReport } from '../src/features/coach/engine';
import type { WorkoutHistoryRecord } from '../src/features/history/types';

function record(id: string, completedAt: string, volumeKg: number, reps: number, rir: number): WorkoutHistoryRecord {
  return {
    id,
    planId: 'plan-1',
    planName: 'Plano TITAN',
    workoutId: 'push-a',
    workoutTitle: 'Push A',
    workoutDay: 'Segunda',
    startedAt: completedAt,
    completedAt,
    durationSeconds: 3600,
    totalSets: 3,
    totalVolumeKg: volumeKg,
    exercises: [{
      exerciseId: 'bench-press',
      name: 'Supino',
      muscleGroup: 'Peitoral',
      exerciseType: 'strength',
      volumeKg,
      bestWeightKg: 80,
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      bestSpeedKmh: null,
      bestInclinePercent: null,
      averageHeartRate: null,
      sets: [1, 2, 3].map((setNumber) => ({
        setNumber,
        weightKg: volumeKg / Math.max(1, reps * 3),
        repetitions: reps,
        rir,
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

describe('tendências musculares do Coach TITAN', () => {
  it('não conclui tendência forte com menos de três exposições', () => {
    const trends = analyzeMuscleTrends([
      record('a', '2026-08-01T20:00:00.000Z', 2400, 10, 2),
      record('b', '2026-08-04T20:00:00.000Z', 2500, 10, 2),
    ]);
    expect(trends[0].status).toBe('insufficient');
    expect(trends[0].recommendation).toBe('collect-data');
  });

  it('detecta progressão sem sugerir aumento de volume', () => {
    const trends = analyzeMuscleTrends([
      record('a', '2026-08-01T20:00:00.000Z', 2200, 9, 2),
      record('b', '2026-08-04T20:00:00.000Z', 2400, 10, 2),
      record('c', '2026-08-07T20:00:00.000Z', 2600, 11, 2),
    ]);
    expect(trends[0].status).toBe('progressing');
    expect(trends[0].recommendation).toBe('maintain');
  });

  it('detecta fadiga acumulada apenas após queda repetida com RIR muito baixo', () => {
    const records = [
      record('a', '2026-08-01T20:00:00.000Z', 3000, 12, 2),
      record('b', '2026-08-03T20:00:00.000Z', 2800, 11, 0.5),
      record('c', '2026-08-05T20:00:00.000Z', 2500, 10, 0.5),
      record('d', '2026-08-07T20:00:00.000Z', 2200, 9, 0),
    ];
    const trend = analyzeMuscleTrends(records)[0];
    expect(trend.status).toBe('fatigued');
    expect(trend.recommendation).toBe('consider-deload');
    const report = createCoachReport(records, new Date('2026-08-08T20:00:00.000Z'));
    expect(report.priority.id).toBe('muscle-fatigue:Peitoral');
    expect(report.priority.title).toContain('Fadiga acumulada');
  });

  it('considera pequeno aumento de estímulo só quando há estabilidade com margem e quatro exposições', () => {
    const trend = analyzeMuscleTrends([
      record('a', '2026-08-01T20:00:00.000Z', 2500, 10, 3),
      record('b', '2026-08-03T20:00:00.000Z', 2520, 10, 3),
      record('c', '2026-08-05T20:00:00.000Z', 2510, 10, 2.5),
      record('d', '2026-08-07T20:00:00.000Z', 2530, 10, 2.5),
    ])[0];
    expect(trend.status).toBe('stable');
    expect(trend.recommendation).toBe('consider-volume-increase');
  });
});
