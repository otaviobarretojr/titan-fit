import { describe, expect, it } from 'vitest';
import { buildTitanReport } from '../src/features/reports/engine';
import type { WorkoutHistoryRecord } from '../src/features/history/types';
import type { TitanNutritionPlan } from '../src/features/nutrition/types';

const now = new Date('2026-08-10T12:00:00');
const nutritionPlan: TitanNutritionPlan = {
  schema: 'titan-nutrition-plan', schemaVersion: 1, id: 'diet-1', name: 'Dieta', days: [],
  defaultTarget: { caloriesKcal: 2500, proteinG: 200, carbohydrateG: 280, fatG: 65 },
};

function workout(id: string, completedAt: string, volume: number, exerciseType: 'strength' | 'cardio' | 'distance' = 'strength'): WorkoutHistoryRecord {
  return {
    id, planId: 'p1', planName: 'Plano', workoutId: id, workoutTitle: id, workoutDay: 'Segunda',
    startedAt: completedAt, completedAt, durationSeconds: 3600, totalSets: 1, totalVolumeKg: volume,
    exercises: [{
      exerciseId: `${id}-exercise`, name: id, muscleGroup: exerciseType === 'strength' ? 'Peitoral' : 'Cardio', exerciseType,
      sets: [], volumeKg: volume, bestWeightKg: null, totalDistanceMeters: exerciseType === 'distance' ? 5000 : 0,
      totalDurationSeconds: exerciseType === 'strength' ? 0 : 1800, bestSpeedKmh: null, bestInclinePercent: null, averageHeartRate: null,
    }],
  };
}

describe('Relatórios TITAN', () => {
  it('resume os quatro pilares usando somente dados dentro do período', () => {
    const report = buildTitanReport({
      workouts: [
        workout('recent', '2026-08-09T20:00:00', 5000),
        workout('old', '2026-07-20T20:00:00', 9000),
      ],
      nutritionPlan,
      nutritionExecutions: [{
        date: '2026-08-09', mealId: 'total', status: 'consumed', completedAt: '2026-08-09T20:00:00', foods: [],
        macros: { caloriesKcal: 2500, proteinG: 200, carbohydrateG: 280, fatG: 65 },
      }],
      healthSamples: [{ id: 'sleep', type: 'sleep', startedAt: '2026-08-09T06:00:00', value: 450, unit: 'min' }],
      bodyEntries: [
        { id: 'b1', recordedAt: '2026-08-05T08:00:00', weightKg: 91.5 },
        { id: 'b2', recordedAt: '2026-08-10T08:00:00', weightKg: 92 },
      ],
    }, 7, now);

    expect(report.training.sessions).toBe(1);
    expect(report.training.totalVolumeKg).toBe(5000);
    expect(report.nutrition.registeredDays).toBe(1);
    expect(report.nutrition.calorieAdherencePercent).toBe(100);
    expect(report.nutrition.proteinAdherencePercent).toBe(100);
    expect(report.recovery.averageSleepHours).toBe(7.5);
    expect(report.evolution.latestWeightKg).toBe(92);
    expect(report.evolution.weightChangeKg).toBe(0.5);
    expect(report.availableSections).toBe(4);
  });

  it('mantém seções sem dados como indisponíveis, sem inventar valores', () => {
    const report = buildTitanReport({ workouts: [] }, 30, now);
    expect(report.training.sessions).toBe(0);
    expect(report.nutrition.averageCaloriesKcal).toBeNull();
    expect(report.recovery.averageSleepHours).toBeNull();
    expect(report.evolution.latestWeightKg).toBeNull();
    expect(report.availableSections).toBe(0);
    expect(report.previousAvailableSections).toBe(0);
    expect(report.recovery.sleepComparison.trend).toBe('unavailable');
  });

  it('compara o período atual com o período imediatamente anterior', () => {
    const report = buildTitanReport({
      workouts: [
        workout('current-1', '2026-08-09T20:00:00', 5000),
        workout('current-2', '2026-08-08T20:00:00', 4500),
        workout('previous-1', '2026-08-02T20:00:00', 4000),
      ],
      nutritionPlan,
      nutritionExecutions: [
        { date: '2026-08-09', mealId: 'current', status: 'consumed', completedAt: '2026-08-09T20:00:00', foods: [], macros: { caloriesKcal: 2500, proteinG: 200, carbohydrateG: 280, fatG: 65 } },
        { date: '2026-08-02', mealId: 'previous', status: 'consumed', completedAt: '2026-08-02T20:00:00', foods: [], macros: { caloriesKcal: 2000, proteinG: 160, carbohydrateG: 220, fatG: 55 } },
      ],
      healthSamples: [
        { id: 'sleep-current', type: 'sleep', startedAt: '2026-08-09T06:00:00', value: 8, unit: 'h' },
        { id: 'sleep-previous', type: 'sleep', startedAt: '2026-08-02T06:00:00', value: 6, unit: 'h' },
      ],
      bodyEntries: [],
    }, 7, now);

    expect(report.training.sessionsComparison.current).toBe(2);
    expect(report.training.sessionsComparison.previous).toBe(1);
    expect(report.training.sessionsComparison.trend).toBe('up');
    expect(report.nutrition.calorieAdherenceComparison.current).toBe(100);
    expect(report.nutrition.calorieAdherenceComparison.previous).toBe(80);
    expect(report.nutrition.calorieAdherenceComparison.delta).toBe(20);
    expect(report.recovery.sleepComparison.current).toBe(8);
    expect(report.recovery.sleepComparison.previous).toBe(6);
    expect(report.recovery.sleepComparison.trend).toBe('up');
    expect(report.previousAvailableSections).toBe(3);
  });

  it('não conta sessões exclusivamente de cardio como treino de musculação', () => {
    const report = buildTitanReport({
      workouts: [
        workout('strength', '2026-08-09T20:00:00', 5000, 'strength'),
        workout('run', '2026-08-08T20:00:00', 0, 'distance'),
        workout('zone2', '2026-08-07T20:00:00', 0, 'cardio'),
      ],
    }, 7, now);

    expect(report.training.sessions).toBe(1);
    expect(report.training.totalVolumeKg).toBe(5000);
  });
});
