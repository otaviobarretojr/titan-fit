import { describe, expect, it } from 'vitest';
import { buildTitanReport } from '../src/features/reports/engine';
import type { WorkoutHistoryRecord } from '../src/features/history/types';
import type { TitanNutritionPlan } from '../src/features/nutrition/types';

const now = new Date('2026-08-10T12:00:00');
const nutritionPlan: TitanNutritionPlan = {
  schema: 'titan-nutrition-plan', schemaVersion: 1, id: 'diet-1', name: 'Dieta', days: [],
  defaultTarget: { caloriesKcal: 2500, proteinG: 200, carbohydrateG: 280, fatG: 65 },
};

function workout(id: string, completedAt: string, volume: number): WorkoutHistoryRecord {
  return {
    id, planId: 'p1', planName: 'Plano', workoutId: id, workoutTitle: id, workoutDay: 'Segunda',
    startedAt: completedAt, completedAt, durationSeconds: 3600, totalSets: 0, totalVolumeKg: volume, exercises: [],
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
  });
});
