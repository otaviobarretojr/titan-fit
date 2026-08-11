import { describe, expect, it } from 'vitest';
import { buildSmartReminders, currentSmartAlerts } from '../src/features/notifications/engine';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../src/features/notifications/preferences';
import type { TitanNutritionPlan } from '../src/features/nutrition/types';
import type { TitanPlan } from '../src/features/plan/types';

const now = new Date(2026, 7, 10, 10, 0, 0);
const preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, enabled: true };
const nutritionPlan: TitanNutritionPlan = {
  schema: 'titan-nutrition-plan',
  schemaVersion: 1,
  id: 'diet',
  name: 'Dieta',
  defaultTarget: { caloriesKcal: 2500, proteinG: 200, carbohydrateG: 300, fatG: 60 },
  days: [{
    day: 'Segunda-feira',
    meals: [{
      id: 'lunch',
      name: 'Almoço',
      plannedTime: '12:00',
      foods: [],
      macros: { caloriesKcal: 700, proteinG: 50, carbohydrateG: 80, fatG: 20 },
    }],
  }],
};
const plan: TitanPlan = {
  schemaVersion: 1,
  id: 'plan',
  name: 'Plano',
  createdAt: '2026-08-01T00:00:00',
  project: {
    name: 'Projeto',
    objective: 'Teste',
    strengthStartTime: '19:00',
    cardioSchedule: [{ id: 'cardio-mon', day: 'Segunda-feira', startTime: '20:00', title: 'Zona 2', type: 'zone2', durationMinutes: 30 }],
  },
  workouts: [{ id: 'workout-mon', day: 'Segunda-feira', title: 'Upper', exercises: [{ id: 'bench', name: 'Supino', muscleGroup: 'Peito' }] }],
};

describe('Notificações inteligentes', () => {
  it('usa horários reais de dieta, musculação e cardio', () => {
    const reminders = buildSmartReminders({ plan, nutritionPlan, nutritionExecutions: [], workoutHistory: [], preferences }, now, 1);
    const lunch = reminders.find((item) => item.key.includes('meal:2026-08-10:lunch'));
    const overdue = reminders.find((item) => item.key.includes('meal-overdue:2026-08-10:lunch'));
    const workout = reminders.find((item) => item.kind === 'workout');
    const cardio = reminders.find((item) => item.kind === 'cardio');

    expect(lunch?.at.getHours()).toBe(12);
    expect(lunch?.at.getMinutes()).toBe(0);
    expect(overdue?.at.getHours()).toBe(12);
    expect(overdue?.at.getMinutes()).toBe(30);
    expect(workout?.at.getHours()).toBe(18);
    expect(workout?.at.getMinutes()).toBe(30);
    expect(cardio?.at.getHours()).toBe(19);
    expect(cardio?.at.getMinutes()).toBe(30);
  });

  it('remove lembretes futuros da refeição quando ela já foi registrada', () => {
    const reminders = buildSmartReminders({
      plan: null,
      nutritionPlan,
      nutritionExecutions: [{ date: '2026-08-10', mealId: 'lunch', status: 'consumed', completedAt: '2026-08-10T11:30:00', foods: [], macros: nutritionPlan.days[0].meals[0].macros }],
      workoutHistory: [],
      preferences,
    }, now, 1);

    expect(reminders.some((item) => item.key.includes('lunch'))).toBe(false);
  });

  it('gera alerta interno para refeição atrasada ainda sem registro', () => {
    const alerts = currentSmartAlerts({ plan: null, nutritionPlan, nutritionExecutions: [], workoutHistory: [], preferences }, new Date(2026, 7, 10, 13, 0, 0));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].kind).toBe('meal-overdue');
    expect(alerts[0].title).toContain('Almoço');
  });

  it('não agenda nada quando os lembretes estão desativados', () => {
    const reminders = buildSmartReminders({ plan, nutritionPlan, nutritionExecutions: [], workoutHistory: [], preferences: { ...preferences, enabled: false } }, now, 7);
    expect(reminders).toEqual([]);
  });
});
