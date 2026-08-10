import type { NutritionMacroTotals } from './types';

export type NutritionFoodExecution = {
  foodId: string;
  quantity: number;
};

export type NutritionMealExecutionStatus = 'consumed' | 'partial' | 'skipped';

export type NutritionMealExecution = {
  date: string;
  mealId: string;
  status: NutritionMealExecutionStatus;
  completedAt: string;
  foods: NutritionFoodExecution[];
  macros: NutritionMacroTotals;
};

const STORAGE_KEY = 'titan-fit:nutrition-execution:v1';

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadNutritionExecutions(): NutritionMealExecution[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function loadNutritionExecutionsForDate(date = todayKey()) {
  return loadNutritionExecutions().filter((item) => item.date === date);
}

export function saveNutritionMealExecution(execution: NutritionMealExecution) {
  const records = loadNutritionExecutions();
  const next = records.filter((item) => !(item.date === execution.date && item.mealId === execution.mealId));
  next.push(execution);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('titan:nutrition-changed', { detail: { date: execution.date } }));
}

export function nutritionTotalsForDate(date = todayKey()): NutritionMacroTotals {
  return loadNutritionExecutionsForDate(date).reduce<NutritionMacroTotals>((totals, item) => ({
    caloriesKcal: totals.caloriesKcal + item.macros.caloriesKcal,
    proteinG: totals.proteinG + item.macros.proteinG,
    carbohydrateG: totals.carbohydrateG + item.macros.carbohydrateG,
    fatG: totals.fatG + item.macros.fatG,
  }), { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 });
}
