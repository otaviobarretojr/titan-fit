import { describe, expect, it } from 'vitest';
import { buildAdaptiveDayPlan } from '../src/features/nutrition/advanced';
import type { PlannedMeal } from '../src/features/nutrition/types';

function meal(id: string, time: string, status: PlannedMeal['status'], plannedAmount: number, actualAmount = plannedAmount): PlannedMeal {
  return {
    id,
    name: `Refeição ${id}`,
    time,
    status,
    items: [{ id: `${id}-banana`, foodId: 'banana-medium', plannedAmount, actualAmount }],
  };
}

describe('Coach Nutrition v5 - Adaptive Day', () => {
  it('redistribui o restante quando uma refeição é pulada', () => {
    const meals: PlannedMeal[] = [
      meal('a', '07:00', 'completed', 1),
      meal('b', '10:00', 'skipped', 1),
      meal('c', '13:00', 'upcoming', 1),
      meal('d', '19:00', 'upcoming', 1),
    ];

    const plan = buildAdaptiveDayPlan(meals, new Date('2026-08-12T11:00:00'));

    expect(plan.status).toBe('skipped');
    expect(plan.skippedMeals).toBe(1);
    expect(plan.remainingMeals).toBe(2);
    expect(plan.remaining.caloriesKcal).toBe(315);
    expect(plan.perMeal.caloriesKcal).toBe(158);
    expect(plan.mealTargets).toHaveLength(2);
    expect(plan.message).toContain('315 kcal');
  });

  it('preserva a proteína restante quando o consumo calórico está adiantado', () => {
    const meals: PlannedMeal[] = [
      meal('a', '07:00', 'completed', 1, 3),
      meal('b', '12:00', 'upcoming', 1),
    ];

    const plan = buildAdaptiveDayPlan(meals, new Date('2026-08-12T10:00:00'));

    expect(plan.remainingMeals).toBe(1);
    expect(plan.remaining.caloriesKcal).toBe(0);
    expect(plan.remaining.proteinG).toBe(0);
    expect(plan.status).toBe('over');
    expect(plan.message).toContain('Não use cardio como punição');
  });

  it('encerra próximo da meta sem sugerir compensação', () => {
    const meals: PlannedMeal[] = [
      meal('a', '07:00', 'completed', 1),
      meal('b', '12:00', 'completed', 1),
    ];

    const plan = buildAdaptiveDayPlan(meals, new Date('2026-08-12T22:00:00'));

    expect(plan.status).toBe('finished');
    expect(plan.remainingMeals).toBe(0);
    expect(plan.message).toContain('não há necessidade de compensação');
  });
});
