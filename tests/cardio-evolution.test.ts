import { describe, expect, it } from 'vitest';
import { buildCardioEvolution } from '../src/features/cardio/evolution';
import type { WorkoutHistoryRecord } from '../src/features/history/types';

const now = new Date('2026-08-10T20:00:00');

function cardioRecord(id: string, completedAt: string, distanceMeters: number, durationSeconds: number, heartRate: number | null, name = 'Corrida'): WorkoutHistoryRecord {
  return {
    id,
    planId: 'p1',
    planName: 'Plano',
    workoutId: id,
    workoutTitle: name,
    workoutDay: 'Domingo',
    startedAt: completedAt,
    completedAt,
    durationSeconds,
    totalSets: 1,
    totalVolumeKg: 0,
    exercises: [{
      exerciseId: `${id}-cardio`,
      name,
      muscleGroup: 'Cardio',
      exerciseType: distanceMeters > 0 ? 'distance' : 'cardio',
      sets: [],
      volumeKg: 0,
      bestWeightKg: null,
      totalDistanceMeters: distanceMeters,
      totalDurationSeconds: durationSeconds,
      bestSpeedKmh: null,
      bestInclinePercent: null,
      averageHeartRate: heartRate,
    }],
  };
}

describe('Cardio 2.0 — evolução cardiovascular', () => {
  it('resume sessões, distância, tempo, ritmo e FC no período', () => {
    const report = buildCardioEvolution([
      cardioRecord('a', '2026-08-09T20:00:00', 3000, 1800, 145),
      cardioRecord('b', '2026-08-08T20:00:00', 2000, 1200, 135),
    ], 7, now);

    expect(report.sessions).toBe(2);
    expect(report.totalDistanceMeters).toBe(5000);
    expect(report.totalDurationSeconds).toBe(3000);
    expect(report.bestDistanceMeters).toBe(3000);
    expect(report.averagePaceSecondsPerKm).toBe(600);
    expect(report.averageHeartRate).toBe(140);
    expect(report.fiveKmProgressPercent).toBe(60);
    expect(report.fiveKmReached).toBe(false);
  });

  it('compara ritmo com o período anterior e reconhece melhora quando min/km cai', () => {
    const report = buildCardioEvolution([
      cardioRecord('current', '2026-08-09T20:00:00', 5000, 1800, 150),
      cardioRecord('previous', '2026-08-02T20:00:00', 5000, 2100, 148),
    ], 7, now);

    expect(report.averagePaceSecondsPerKm).toBe(360);
    expect(report.paceDeltaSecondsPerKm).toBe(-60);
    expect(report.paceTrend).toBe('improved');
    expect(report.fiveKmReached).toBe(true);
    expect(report.fiveKmProgressPercent).toBe(100);
  });

  it('ignora musculação e não inventa ritmo sem distância registrada', () => {
    const strength = cardioRecord('strength', '2026-08-09T20:00:00', 0, 3600, null);
    strength.exercises[0].exerciseType = 'strength';
    const report = buildCardioEvolution([
      strength,
      cardioRecord('zone2', '2026-08-08T20:00:00', 0, 2400, 130),
    ], 7, now);

    expect(report.sessions).toBe(1);
    expect(report.totalDurationSeconds).toBe(2400);
    expect(report.averagePaceSecondsPerKm).toBeNull();
    expect(report.fiveKmProgressPercent).toBe(0);
  });

  it('conta bike no volume cardiovascular, mas não usa ciclismo para concluir a meta de 5 km', () => {
    const report = buildCardioEvolution([
      cardioRecord('bike', '2026-08-09T20:00:00', 12000, 2400, 142, 'Bike Zona 2'),
      cardioRecord('run', '2026-08-08T20:00:00', 2500, 1500, 148, 'Corrida leve'),
    ], 7, now);

    expect(report.sessions).toBe(2);
    expect(report.totalDistanceMeters).toBe(14500);
    expect(report.bestDistanceMeters).toBe(2500);
    expect(report.fiveKmProgressPercent).toBe(50);
    expect(report.fiveKmReached).toBe(false);
    expect(report.averagePaceSecondsPerKm).toBe(600);
  });
  it('conta um treino com múltiplos blocos de cardio como uma única sessão', () => {
    const record = cardioRecord('mixed', '2026-08-09T20:00:00', 2000, 1200, 140, 'Treino misto');
    record.exercises.push({ ...record.exercises[0], exerciseId: 'mixed-cardio-2', name: 'Bike Zona 2', totalDistanceMeters: 5000, totalDurationSeconds: 1200 });
    const report = buildCardioEvolution([record], 7, now);
    expect(report.sessions).toBe(1);
    expect(report.totalDistanceMeters).toBe(7000);
    expect(report.totalDurationSeconds).toBe(2400);
  });
});
