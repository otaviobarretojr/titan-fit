import { calculateFoodMacros, formatMacros, sumMacros } from './engine';
import { getFoodById } from './foodRepository';
import { loadCustomRecipes } from './recipeStorage';
import type { Food, MacroTotals, PlannedMeal } from './types';

export const TITAN_BMR_KCAL = 1988;

export type RecipeDefinition = {
  id: string;
  name: string;
  description: string;
  ingredients: Array<{ foodId: string; amount: number }>;
};

export const BASE_TITAN_RECIPES: RecipeDefinition[] = [
  { id: 'vit-banana', name: 'Vitaminada Banana', description: 'Base tradicional', ingredients: [{ foodId: 'water', amount: 300 }, { foodId: 'milk-powder', amount: 30 }, { foodId: 'oats', amount: 50 }, { foodId: 'banana-medium', amount: 1 }] },
  { id: 'vit-cocoa', name: 'Vitaminada Banana & Cacau', description: 'Variação com cacau 100%', ingredients: [{ foodId: 'water', amount: 300 }, { foodId: 'milk-powder', amount: 30 }, { foodId: 'oats', amount: 40 }, { foodId: 'banana-medium', amount: 1 }, { foodId: 'cocoa-powder', amount: 10 }] },
  { id: 'vit-coffee', name: 'Vitaminada Café & Canela', description: 'Variação para dias de treino', ingredients: [{ foodId: 'water', amount: 300 }, { foodId: 'milk-powder', amount: 30 }, { foodId: 'oats', amount: 50 }, { foodId: 'banana-medium', amount: 1 }, { foodId: 'instant-coffee', amount: 5 }, { foodId: 'cinnamon', amount: 5 }] },
  { id: 'rap10-chicken', name: 'Rap10 com frango', description: 'Lanche econômico rico em proteína', ingredients: [{ foodId: 'rap10', amount: 1 }, { foodId: 'chicken-shredded', amount: 80 }] },
];

export const TITAN_RECIPES: RecipeDefinition[] = [...BASE_TITAN_RECIPES, ...loadCustomRecipes()];

export function reloadTitanRecipes() {
  TITAN_RECIPES.splice(0, TITAN_RECIPES.length, ...BASE_TITAN_RECIPES, ...loadCustomRecipes());
  return TITAN_RECIPES;
}

export function recipeMacros(recipe: RecipeDefinition): MacroTotals {
  const totals = recipe.ingredients.map((ingredient) => calculateFoodMacros(ingredient.foodId, ingredient.amount));
  return formatMacros(totals.reduce((acc, value) => ({ caloriesKcal: acc.caloriesKcal + value.caloriesKcal, proteinG: acc.proteinG + value.proteinG, carbohydrateG: acc.carbohydrateG + value.carbohydrateG, fatG: acc.fatG + value.fatG }), { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 }));
}

export function estimateEnergyExpenditure(activeCalories: number, now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const dayFraction = Math.max(0, Math.min(1, minutes / 1440));
  const basalElapsed = TITAN_BMR_KCAL * dayFraction;
  const safeActive = Math.max(0, activeCalories);
  return {
    basalElapsed: Math.round(basalElapsed),
    activeCalories: Math.round(safeActive),
    totalElapsed: Math.round(basalElapsed + safeActive),
    projectedBasalDay: TITAN_BMR_KCAL,
    projectedTotalDay: Math.round(TITAN_BMR_KCAL + safeActive),
    dayFraction,
  };
}

export function suggestEquivalentAmount(sourceFoodId: string, sourceAmount: number, target: Food): number {
  const source = calculateFoodMacros(sourceFoodId, sourceAmount);
  const targetRef = target.macrosPerReference;
  const byProtein = source.proteinG > 0 && targetRef.proteinG > 0 ? (source.proteinG / targetRef.proteinG) * target.referenceAmount : 0;
  const byCalories = source.caloriesKcal > 0 && targetRef.caloriesKcal > 0 ? (source.caloriesKcal / targetRef.caloriesKcal) * target.referenceAmount : target.referenceAmount;
  const raw = byProtein > 0 ? byProtein * 0.7 + byCalories * 0.3 : byCalories;
  if (target.unit === 'unit') return Math.max(1, Math.round(raw));
  return Math.max(5, Math.round(raw / 5) * 5);
}

export type DayHistory = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  completedMeals: number;
  skippedMeals: number;
};

export function readRecentNutritionHistory(days = 7): DayHistory[] {
  const result: DayHistory[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(); date.setDate(date.getDate() - offset);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    try {
      const raw = localStorage.getItem(`titan-nutrition:meals:v2:${key}`);
      if (!raw) continue;
      const meals = JSON.parse(raw) as PlannedMeal[];
      const completed = meals.filter((meal) => meal.status === 'completed');
      const macros = formatMacros(sumMacros(completed.flatMap((meal) => meal.items)));
      result.push({ date: key, calories: macros.caloriesKcal, protein: macros.proteinG, carbs: macros.carbohydrateG, fat: macros.fatG, completedMeals: completed.length, skippedMeals: meals.filter((meal) => meal.status === 'skipped').length });
    } catch { /* histórico local inválido é ignorado */ }
  }
  return result;
}

export function buildCoachMessage(history: DayHistory[], calorieTarget: number, proteinTarget: number) {
  if (history.length < 2) return 'Registre pelo menos 2 dias completos para o Coach TITAN avaliar sua aderência.';
  const avgCalories = Math.round(history.reduce((sum, day) => sum + day.calories, 0) / history.length);
  const avgProtein = Math.round(history.reduce((sum, day) => sum + day.protein, 0) / history.length);
  const skipped = history.reduce((sum, day) => sum + day.skippedMeals, 0);
  const calorieDelta = avgCalories - calorieTarget;
  const adherence = calorieTarget > 0 ? avgCalories / calorieTarget : 0;
  if (avgProtein < proteinTarget * 0.9) return `Proteína média em ${avgProtein} g/dia. Prioridade: aproximar de ${proteinTarget} g sem aumentar demais as calorias.`;
  if (adherence < 0.88) return `A ingestão média está em ${Math.round(adherence * 100)}% da meta. Antes de subir a meta, melhore a aderência ao planejamento atual.`;
  if (Math.abs(calorieDelta) > 180) return `Média de ${avgCalories} kcal/dia (${calorieDelta > 0 ? '+' : ''}${calorieDelta} kcal vs meta). Observe peso, cintura e desempenho antes de ajustar a meta.`;
  if (skipped >= 3) return `${skipped} refeições foram puladas no período. Aderência e distribuição estão mais importantes que subir calorias agora.`;
  return `Aderência consistente: média de ${avgCalories} kcal e ${avgProtein} g de proteína. Mantenha o plano e use peso, cintura e desempenho para decidir qualquer ajuste.`;
}

export function foodLabel(foodId: string) {
  return getFoodById(foodId)?.name ?? foodId;
}
