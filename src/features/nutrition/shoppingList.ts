import { getFood } from './foodLibrary';
import { WEEKLY_NUTRITION_PLAN } from './weeklyPlan';

export type ShoppingListItem = {
  foodId: string;
  name: string;
  amount: number;
  unit: string;
};

export function buildWeeklyShoppingList(): ShoppingListItem[] {
  const totals = new Map<string, number>();

  for (const day of WEEKLY_NUTRITION_PLAN) {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        totals.set(item.foodId, (totals.get(item.foodId) ?? 0) + item.plannedAmount);
      }
    }
  }

  return [...totals.entries()]
    .map(([foodId, amount]) => {
      const food = getFood(foodId);
      if (!food) return null;
      return { foodId, name: food.name, amount: Math.round(amount * 10) / 10, unit: food.unit };
    })
    .filter((item): item is ShoppingListItem => item !== null)
    .filter((item) => item.foodId !== 'water')
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
