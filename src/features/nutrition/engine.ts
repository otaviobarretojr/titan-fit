import { getFoodById } from './foodRepository';
import type { MacroTotals, MealItem, PlannedMeal } from './types';

export const EMPTY_MACROS: MacroTotals = { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 };

export function calculateFoodMacros(foodId: string, amount: number): MacroTotals {
  const food = getFoodById(foodId);
  if (!food || amount <= 0) return EMPTY_MACROS;
  const factor = amount / food.referenceAmount;
  return {
    caloriesKcal: food.macrosPerReference.caloriesKcal * factor,
    proteinG: food.macrosPerReference.proteinG * factor,
    carbohydrateG: food.macrosPerReference.carbohydrateG * factor,
    fatG: food.macrosPerReference.fatG * factor,
  };
}

export function sumMacros(items: MealItem[]): MacroTotals {
  return items.reduce((total, item) => {
    const macros = calculateFoodMacros(item.foodId, item.actualAmount);
    return {
      caloriesKcal: total.caloriesKcal + macros.caloriesKcal,
      proteinG: total.proteinG + macros.proteinG,
      carbohydrateG: total.carbohydrateG + macros.carbohydrateG,
      fatG: total.fatG + macros.fatG,
    };
  }, { ...EMPTY_MACROS });
}

export function mealStatusForTime(meal: PlannedMeal, now = new Date()): PlannedMeal['status'] {
  if (meal.status === 'completed' || meal.status === 'skipped') return meal.status;
  const [hours, minutes] = meal.time.split(':').map(Number);
  const mealDate = new Date(now);
  mealDate.setHours(hours, minutes, 0, 0);
  return now.getTime() > mealDate.getTime() ? 'pending' : 'upcoming';
}

export function formatMacros(macros: MacroTotals) {
  return {
    caloriesKcal: Math.round(macros.caloriesKcal),
    proteinG: Math.round(macros.proteinG * 10) / 10,
    carbohydrateG: Math.round(macros.carbohydrateG * 10) / 10,
    fatG: Math.round(macros.fatG * 10) / 10,
  };
}
