import { getFood } from './foodLibrary';
import { WEEKLY_NUTRITION_PLAN, type NutritionDayPlan } from './weeklyPlan';

export type ShoppingListItem = {
  foodId: string;
  name: string;
  amount: number;
  unit: string;
  category?: string;
};

export function buildWeeklyShoppingList(plans: NutritionDayPlan[] = WEEKLY_NUTRITION_PLAN): ShoppingListItem[] {
  const totals = new Map<string, number>();

  for (const day of plans) {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        totals.set(item.foodId, (totals.get(item.foodId) ?? 0) + item.plannedAmount);
      }
    }
  }

  const result: ShoppingListItem[] = [];
  for (const [foodId, amount] of totals.entries()) {
    if (foodId === 'water') continue;
    const food = getFood(foodId);
    if (!food) continue;
    result.push({ foodId, name: food.name, amount: Math.round(amount * 10) / 10, unit: food.unit, category: food.category });
  }

  return result.sort((a, b) => (a.category ?? 'Outros').localeCompare(b.category ?? 'Outros', 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'));
}
