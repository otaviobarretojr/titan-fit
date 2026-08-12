import { describe, expect, it } from 'vitest';
import { calculateFoodMacros, formatMacros, sumMacros } from '../src/features/nutrition/engine';
import type { MealItem } from '../src/features/nutrition/types';

describe('nutrition macro engine', () => {
  it('calcula alimentos por unidade e por gramas de forma proporcional', () => {
    expect(formatMacros(calculateFoodMacros('banana-medium', 1))).toEqual({
      caloriesKcal: 105,
      proteinG: 1.3,
      carbohydrateG: 27,
      fatG: 0.4,
    });

    expect(formatMacros(calculateFoodMacros('oats', 50))).toEqual({
      caloriesKcal: 195,
      proteinG: 8.5,
      carbohydrateG: 33.2,
      fatG: 3.5,
    });
  });

  it('reproduz o total exibido quando são registradas 10 bananas', () => {
    const items: MealItem[] = [
      { id: 'egg', foodId: 'egg-whole-large', plannedAmount: 2, actualAmount: 1 },
      { id: 'white', foodId: 'egg-white-large', plannedAmount: 5, actualAmount: 4 },
      { id: 'water', foodId: 'water', plannedAmount: 300, actualAmount: 300 },
      { id: 'milk', foodId: 'milk-powder', plannedAmount: 30, actualAmount: 30 },
      { id: 'oats', foodId: 'oats', plannedAmount: 40, actualAmount: 50 },
      { id: 'banana', foodId: 'banana-medium', plannedAmount: 1, actualAmount: 10 },
    ];

    expect(formatMacros(sumMacros(items))).toEqual({
      caloriesKcal: 1533,
      proteinG: 49.9,
      carbohydrateG: 315.9,
      fatG: 20.7,
    });
  });

  it('fica em 588 kcal quando o mesmo registro usa uma banana', () => {
    const items: MealItem[] = [
      { id: 'egg', foodId: 'egg-whole-large', plannedAmount: 2, actualAmount: 1 },
      { id: 'white', foodId: 'egg-white-large', plannedAmount: 5, actualAmount: 4 },
      { id: 'water', foodId: 'water', plannedAmount: 300, actualAmount: 300 },
      { id: 'milk', foodId: 'milk-powder', plannedAmount: 30, actualAmount: 30 },
      { id: 'oats', foodId: 'oats', plannedAmount: 40, actualAmount: 50 },
      { id: 'banana', foodId: 'banana-medium', plannedAmount: 1, actualAmount: 1 },
    ];

    expect(formatMacros(sumMacros(items))).toEqual({
      caloriesKcal: 588,
      proteinG: 38.2,
      carbohydrateG: 72.9,
      fatG: 17.1,
    });
  });
});
