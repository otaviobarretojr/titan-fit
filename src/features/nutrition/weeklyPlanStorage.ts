import { WEEKLY_NUTRITION_PLAN, type NutritionDayPlan } from './weeklyPlan';

const KEY = 'titan-nutrition:weekly-plan:v1';

function clone(plans: NutritionDayPlan[]): NutritionDayPlan[] {
  return plans.map((day) => ({ ...day, target: { ...day.target }, meals: day.meals.map((meal) => ({ ...meal, items: meal.items.map((item) => ({ ...item })) })) }));
}

export function loadWeeklyPlan(): NutritionDayPlan[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone(WEEKLY_NUTRITION_PLAN);
    const parsed = JSON.parse(raw) as NutritionDayPlan[];
    return Array.isArray(parsed) && parsed.length === 7 ? clone(parsed) : clone(WEEKLY_NUTRITION_PLAN);
  } catch {
    return clone(WEEKLY_NUTRITION_PLAN);
  }
}

export function saveWeeklyPlan(plans: NutritionDayPlan[]) {
  localStorage.setItem(KEY, JSON.stringify(plans));
}

export function resetWeeklyPlan() {
  localStorage.removeItem(KEY);
  return clone(WEEKLY_NUTRITION_PLAN);
}
