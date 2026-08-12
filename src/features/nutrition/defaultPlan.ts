import type { PlannedMeal } from './types';
import { getNutritionPlanForDate } from './weeklyPlan';

function cloneMeals(meals: PlannedMeal[]): PlannedMeal[] {
  return meals.map((meal) => ({
    ...meal,
    items: meal.items.map((item) => ({ ...item })),
  }));
}

export const DEFAULT_MEALS: PlannedMeal[] = cloneMeals(getNutritionPlanForDate().meals);

export function getDefaultMealsForDate(date = new Date()): PlannedMeal[] {
  return cloneMeals(getNutritionPlanForDate(date).meals);
}
