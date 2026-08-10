import { describe, expect, it } from 'vitest';
import { createCoachReport, createUnifiedCoachReport } from '../src/features/coach/engine';
import type { WorkoutHistoryRecord } from '../src/features/history/types';
import type { TitanNutritionPlan } from '../src/features/nutrition/types';

const now = new Date('2026-08-10T12:00:00');
const plan: TitanNutritionPlan = {
  schema: 'titan-nutrition-plan', schemaVersion: 1, id: 'diet-1', name: 'Dieta teste',
  defaultTarget: { caloriesKcal: 2500, proteinG: 200, carbohydrateG: 280, fatG: 65 }, days: [],
};

function workout(id: string, completedAt: string): WorkoutHistoryRecord {
  return {
    id,
    planId: 'plan-1',
    planName: 'Plano',
    workoutId: id,
    workoutTitle: id,
    workoutDay: 'Segunda',
    startedAt: completedAt,
    completedAt,
    durationSeconds: 3600,
    totalSets: 0,
    totalVolumeKg: 0,
    exercises: [],
  };
}

describe('Coach TITAN 1.0', () => {
  it('preserva compatibilidade com o relatório baseado apenas em treino', () => {
    const report = createCoachReport([], now);
    expect(report.score.training).toBe(0);
    expect(report.score.nutrition).toBeNull();
    expect(report.score.recovery).toBeNull();
    expect(report.availablePillars).toBe(0);
  });

  it('cruza nutrição, recuperação e evolução sem penalizar o treino ausente', () => {
    const report = createUnifiedCoachReport({
      workouts: [],
      nutritionPlan: plan,
      nutritionExecutions: [{
        date: '2026-08-10', mealId: 'day-total', status: 'consumed', completedAt: '2026-08-10T11:00:00', foods: [],
        macros: { caloriesKcal: 2500, proteinG: 200, carbohydrateG: 280, fatG: 65 },
      }],
      healthSamples: [{ id: 'sleep-1', type: 'sleep', startedAt: '2026-08-10T06:00:00', value: 8, unit: 'h' }],
      bodyEntries: [{ id: 'body-1', recordedAt: '2026-08-09T08:00:00', weightKg: 92 }],
    }, now);

    expect(report.score.nutrition).toBe(100);
    expect(report.score.recovery).toBe(100);
    expect(report.score.evolution).toBe(25);
    expect(report.score.total).toBe(75);
    expect(report.availablePillars).toBe(3);
    expect(report.insights.some((item) => item.id === 'nutrition-on-track')).toBe(true);
    expect(report.insights.some((item) => item.id === 'sleep-on-track')).toBe(true);
  });

  it('não inclui recuperação na média quando não existem dados de sono', () => {
    const report = createUnifiedCoachReport({ workouts: [], nutritionPlan: plan, nutritionExecutions: [] }, now);
    expect(report.score.recovery).toBeNull();
    expect(report.insights.some((item) => item.id === 'recovery-data-missing')).toBe(true);
  });

  it('prioriza o alerta do pilar com pior score disponível', () => {
    const report = createUnifiedCoachReport({
      workouts: [
        workout('w1', '2026-08-10T10:00:00'),
        workout('w2', '2026-08-08T10:00:00'),
        workout('w3', '2026-08-06T10:00:00'),
      ],
      nutritionPlan: plan,
      nutritionExecutions: [{
        date: '2026-08-10', mealId: 'partial', status: 'partial', completedAt: '2026-08-10T11:00:00', foods: [],
        macros: { caloriesKcal: 1000, proteinG: 50, carbohydrateG: 100, fatG: 30 },
      }],
      healthSamples: [{ id: 'sleep-1', type: 'sleep', startedAt: '2026-08-10T06:00:00', value: 8, unit: 'h' }],
      bodyEntries: [
        { id: 'b1', recordedAt: '2026-08-10T08:00:00', weightKg: 92 },
        { id: 'b2', recordedAt: '2026-08-03T08:00:00', weightKg: 92.1 },
        { id: 'b3', recordedAt: '2026-07-27T08:00:00', weightKg: 91.9 },
        { id: 'b4', recordedAt: '2026-07-20T08:00:00', weightKg: 91.7 },
      ],
    }, now);

    expect(report.score.training).toBe(75);
    expect(report.score.nutrition).toBeLessThan(report.score.training);
    expect(report.priority.id).toBe('nutrition-review');
    expect(report.priority.pillar).toBe('nutrition');
  });
});
