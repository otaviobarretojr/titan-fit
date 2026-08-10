import type { TitanNutritionPlan } from './types';

const ACTIVE_NUTRITION_PLAN_KEY = 'titan-fit:active-nutrition-plan:v1';

export function loadActiveNutritionPlan(): TitanNutritionPlan | null {
  try {
    const raw = localStorage.getItem(ACTIVE_NUTRITION_PLAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TitanNutritionPlan;
    return validateNutritionPlan(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveActiveNutritionPlan(plan: TitanNutritionPlan) {
  localStorage.setItem(ACTIVE_NUTRITION_PLAN_KEY, JSON.stringify(plan));
}

export function removeActiveNutritionPlan() {
  localStorage.removeItem(ACTIVE_NUTRITION_PLAN_KEY);
}

export function validateNutritionPlan(value: unknown): value is TitanNutritionPlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as Partial<TitanNutritionPlan>;
  if (plan.schema !== 'titan-nutrition-plan' || plan.schemaVersion !== 1) return false;
  if (!plan.id || !plan.name || !plan.defaultTarget || !Array.isArray(plan.days)) return false;
  const target = plan.defaultTarget;
  if (![target.caloriesKcal, target.proteinG, target.carbohydrateG, target.fatG].every((item) => typeof item === 'number' && item >= 0)) return false;
  return plan.days.every((day) => typeof day?.day === 'string' && Array.isArray(day.meals) && day.meals.every((meal) => {
    if (!meal?.id || !meal?.name || typeof meal.plannedTime !== 'string' || !Array.isArray(meal.foods) || !meal.macros) return false;
    return [meal.macros.caloriesKcal, meal.macros.proteinG, meal.macros.carbohydrateG, meal.macros.fatG].every((item) => typeof item === 'number' && item >= 0);
  }));
}
