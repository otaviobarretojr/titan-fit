import { describe, expect, it } from 'vitest';
import { buildTitanReport } from '../src/features/reports/engine';
import type { WorkoutHistoryRecord } from '../src/features/history/types';

const now = new Date('2026-08-10T20:00:00');

function mixedWorkout(id: string, completedAt: string): WorkoutHistoryRecord {
  return {
    id, planId: 'p1', planName: 'Plano', workoutId: id, workoutTitle: 'Treino misto', workoutDay: 'Domingo',
    startedAt: completedAt, completedAt, durationSeconds: 3600, totalSets: 1, totalVolumeKg: 1000,
    exercises: [
      { exerciseId: `${id}-strength`, name: 'Supino', muscleGroup: 'Peito', exerciseType: 'strength', sets: [], volumeKg: 1000, bestWeightKg: 80, totalDistanceMeters: 0, totalDurationSeconds: 0, bestSpeedKmh: null, bestInclinePercent: null, averageHeartRate: null },
      { exerciseId: `${id}-cardio`, name: 'Corrida', muscleGroup: 'Cardio', exerciseType: 'cardio', sets: [], volumeKg: 0, bestWeightKg: null, totalDistanceMeters: 3000, totalDurationSeconds: 1800, bestSpeedKmh: null, bestInclinePercent: null, averageHeartRate: 145 },
    ],
  };
}

describe('Relatórios TITAN — cardio integrado', () => {
  it('mantém uma sessão de treino e resume o cardio dentro dela', () => {
    const report = buildTitanReport({ workouts: [mixedWorkout('w1', '2026-08-09T20:00:00')] }, 7, now);
    expect(report.training.sessions).toBe(1);
    expect(report.training.totalVolumeKg).toBe(1000);
    expect(report.training.cardioSessions).toBe(1);
    expect(report.training.cardioDurationSeconds).toBe(1800);
    expect(report.training.cardioDistanceMeters).toBe(3000);
    expect(report.training.cardioAverageHeartRate).toBe(145);
  });

  it('não conta cardio isolado antigo como sessão de musculação', () => {
    const record = mixedWorkout('old-cardio', '2026-08-09T20:00:00');
    record.exercises = [record.exercises[1]];
    record.totalVolumeKg = 0;
    const report = buildTitanReport({ workouts: [record] }, 7, now);
    expect(report.training.sessions).toBe(0);
    expect(report.training.cardioSessions).toBe(1);
  });
});
