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

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function plannedMealMacros(meal: PlannedMeal): MacroTotals {
  return formatMacros(sumMacros(meal.items.map((item) => ({ ...item, actualAmount: item.plannedAmount }))));
}

function completedMealMacros(meal: PlannedMeal): MacroTotals {
  return formatMacros(sumMacros(meal.items));
}

function safeRemaining(target: MacroTotals, consumed: MacroTotals): MacroTotals {
  return formatMacros({
    caloriesKcal: Math.max(0, target.caloriesKcal - consumed.caloriesKcal),
    proteinG: Math.max(0, target.proteinG - consumed.proteinG),
    carbohydrateG: Math.max(0, target.carbohydrateG - consumed.carbohydrateG),
    fatG: Math.max(0, target.fatG - consumed.fatG),
  });
}

export function readRecentNutritionHistory(days = 7): DayHistory[] {
  const result: DayHistory[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(); date.setDate(date.getDate() - offset);
    const key = localDateKey(date);
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

export type AdaptiveDayStatus = 'on-track' | 'under' | 'over' | 'skipped' | 'finished' | 'no-data';

export type AdaptiveMealTarget = {
  mealId: string;
  mealName: string;
  time: string;
  caloriesKcal: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
};

export type AdaptiveDayPlan = {
  status: AdaptiveDayStatus;
  title: string;
  message: string;
  consumed: MacroTotals;
  target: MacroTotals;
  remaining: MacroTotals;
  remainingMeals: number;
  skippedMeals: number;
  overCalories: number;
  perMeal: MacroTotals;
  mealTargets: AdaptiveMealTarget[];
};

export function buildAdaptiveDayPlan(meals: PlannedMeal[], now = new Date()): AdaptiveDayPlan {
  if (!meals.length) {
    const zero = formatMacros({ caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 });
    return { status: 'no-data', title: 'Dia ainda sem planejamento', message: 'Adicione refeições ao dia para o Coach adaptar sua distribuição.', consumed: zero, target: zero, remaining: zero, remainingMeals: 0, skippedMeals: 0, overCalories: 0, perMeal: zero, mealTargets: [] };
  }

  const target = formatMacros(meals.reduce((acc, meal) => {
    const macros = plannedMealMacros(meal);
    return { caloriesKcal: acc.caloriesKcal + macros.caloriesKcal, proteinG: acc.proteinG + macros.proteinG, carbohydrateG: acc.carbohydrateG + macros.carbohydrateG, fatG: acc.fatG + macros.fatG };
  }, { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 }));
  const completed = meals.filter((meal) => meal.status === 'completed');
  const consumed = formatMacros(completed.reduce((acc, meal) => {
    const macros = completedMealMacros(meal);
    return { caloriesKcal: acc.caloriesKcal + macros.caloriesKcal, proteinG: acc.proteinG + macros.proteinG, carbohydrateG: acc.carbohydrateG + macros.carbohydrateG, fatG: acc.fatG + macros.fatG };
  }, { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 }));
  const skippedMeals = meals.filter((meal) => meal.status === 'skipped').length;
  const remainingCandidates = meals.filter((meal) => meal.status !== 'completed' && meal.status !== 'skipped');
  const remaining = safeRemaining(target, consumed);
  const overCalories = Math.max(0, consumed.caloriesKcal - target.caloriesKcal);
  const remainingMeals = remainingCandidates.length;
  const perMeal = formatMacros({
    caloriesKcal: remainingMeals ? remaining.caloriesKcal / remainingMeals : 0,
    proteinG: remainingMeals ? remaining.proteinG / remainingMeals : 0,
    carbohydrateG: remainingMeals ? remaining.carbohydrateG / remainingMeals : 0,
    fatG: remainingMeals ? remaining.fatG / remainingMeals : 0,
  });

  const plannedRemainingCalories = remainingCandidates.reduce((sum, meal) => sum + plannedMealMacros(meal).caloriesKcal, 0);
  const scale = plannedRemainingCalories > 0 ? remaining.caloriesKcal / plannedRemainingCalories : 0;
  const mealTargets = remainingCandidates.map((meal) => {
    const planned = plannedMealMacros(meal);
    const calorieShare = plannedRemainingCalories > 0 ? planned.caloriesKcal / plannedRemainingCalories : 1 / Math.max(1, remainingMeals);
    const proteinShare = remainingCandidates.reduce((sum, candidate) => sum + plannedMealMacros(candidate).proteinG, 0);
    const carbShare = remainingCandidates.reduce((sum, candidate) => sum + plannedMealMacros(candidate).carbohydrateG, 0);
    const fatShare = remainingCandidates.reduce((sum, candidate) => sum + plannedMealMacros(candidate).fatG, 0);
    return {
      mealId: meal.id,
      mealName: meal.name,
      time: meal.time,
      caloriesKcal: Math.max(0, Math.round(planned.caloriesKcal * scale)),
      proteinG: Math.max(0, Math.round((proteinShare > 0 ? planned.proteinG / proteinShare : calorieShare) * remaining.proteinG)),
      carbohydrateG: Math.max(0, Math.round((carbShare > 0 ? planned.carbohydrateG / carbShare : calorieShare) * remaining.carbohydrateG)),
      fatG: Math.max(0, Math.round((fatShare > 0 ? planned.fatG / fatShare : calorieShare) * remaining.fatG)),
    };
  });

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const lateUnfinished = remainingCandidates.filter((meal) => {
    const [hour, minute] = meal.time.split(':').map(Number);
    return Number.isFinite(hour) && Number.isFinite(minute) && hour * 60 + minute < currentMinutes;
  }).length;

  if (!remainingMeals) {
    const delta = consumed.caloriesKcal - target.caloriesKcal;
    if (delta > 120) return { status: 'over', title: 'Dia encerrado acima da meta', message: `Você fechou o dia ${delta} kcal acima do planejado. Não precisa compensar com cardio ou restrição agressiva amanhã; retome o plano normal e observe a média semanal.`, consumed, target, remaining, remainingMeals, skippedMeals, overCalories: delta, perMeal, mealTargets };
    if (delta < -180) return { status: 'under', title: 'Dia encerrado abaixo da meta', message: `Você fechou o dia ${Math.abs(delta)} kcal abaixo do planejado. Evite transformar isso em padrão; amanhã retome a distribuição normal, priorizando proteína e refeições completas.`, consumed, target, remaining, remainingMeals, skippedMeals, overCalories, perMeal, mealTargets };
    return { status: 'finished', title: 'Dia fechado dentro da faixa', message: 'Consumo do dia ficou próximo do planejado. Mantenha o plano normal amanhã; não há necessidade de compensação.', consumed, target, remaining, remainingMeals, skippedMeals, overCalories, perMeal, mealTargets };
  }

  const calorieRatio = target.caloriesKcal > 0 ? consumed.caloriesKcal / target.caloriesKcal : 0;
  if (overCalories > 0) {
    return { status: 'over', title: 'Meta calórica já ultrapassada', message: `Você já passou ${overCalories} kcal da meta. Nas ${remainingMeals} refeição(ões) restantes, preserve principalmente proteína e vegetais/fibras e reduza extras energéticos. Não use cardio como punição para compensar comida.`, consumed, target, remaining, remainingMeals, skippedMeals, overCalories, perMeal, mealTargets };
  }
  if (skippedMeals > 0 || lateUnfinished > 0) {
    const reason = skippedMeals > 0 ? `${skippedMeals} refeição(ões) pulada(s)` : `${lateUnfinished} refeição(ões) atrasada(s)`;
    return { status: 'skipped', title: 'Adaptive Day recalculado', message: `${reason}. Restam ${remaining.caloriesKcal} kcal e ${remaining.proteinG} g de proteína para ${remainingMeals} refeição(ões). Referência média: ~${perMeal.caloriesKcal} kcal e ${perMeal.proteinG} g de proteína por refeição restante.`, consumed, target, remaining, remainingMeals, skippedMeals, overCalories, perMeal, mealTargets };
  }
  if (calorieRatio < 0.25 && currentMinutes > 12 * 60) {
    return { status: 'under', title: 'Consumo abaixo do ritmo do dia', message: `Até agora foram ${consumed.caloriesKcal} kcal. Para chegar perto da meta sem concentrar tudo no fim do dia, distribua as ${remaining.caloriesKcal} kcal restantes pelas próximas ${remainingMeals} refeições.`, consumed, target, remaining, remainingMeals, skippedMeals, overCalories, perMeal, mealTargets };
  }
  return { status: 'on-track', title: 'Dia sob controle', message: `Restam ${remaining.caloriesKcal} kcal, ${remaining.proteinG} g de proteína, ${remaining.carbohydrateG} g de carbo e ${remaining.fatG} g de gordura em ${remainingMeals} refeição(ões). Continue o plano e ajuste apenas se o consumo real mudar.`, consumed, target, remaining, remainingMeals, skippedMeals, overCalories, perMeal, mealTargets };
}

export function readAdaptiveDayPlan(now = new Date()): AdaptiveDayPlan | null {
  try {
    const raw = localStorage.getItem(`titan-nutrition:meals:v2:${localDateKey(now)}`);
    if (!raw) return null;
    return buildAdaptiveDayPlan(JSON.parse(raw) as PlannedMeal[], now);
  } catch {
    return null;
  }
}

export type CoachContext = {
  projectedBalance?: number;
  balanceMin?: number;
  balanceMax?: number;
  hydrationAverageMl?: number;
  hydrationGoalMl?: number;
};

export function buildCoachMessage(history: DayHistory[], calorieTarget: number, proteinTarget: number, context: CoachContext = {}) {
  const adaptive = readAdaptiveDayPlan();
  if (adaptive && adaptive.status !== 'no-data') return `${adaptive.title}: ${adaptive.message}`;
  if (history.length < 2) return 'Registre pelo menos 2 dias completos para o Coach TITAN avaliar sua aderência.';
  const avgCalories = Math.round(history.reduce((sum, day) => sum + day.calories, 0) / history.length);
  const avgProtein = Math.round(history.reduce((sum, day) => sum + day.protein, 0) / history.length);
  const skipped = history.reduce((sum, day) => sum + day.skippedMeals, 0);
  const calorieDelta = avgCalories - calorieTarget;
  const adherence = calorieTarget > 0 ? avgCalories / calorieTarget : 0;

  if (avgProtein < proteinTarget * 0.9) return `Proteína média em ${avgProtein} g/dia. Prioridade: aproximar de ${proteinTarget} g sem aumentar demais as calorias.`;
  if (adherence < 0.88) return `A ingestão média está em ${Math.round(adherence * 100)}% da meta. Antes de alterar a meta, melhore a aderência ao planejamento atual.`;

  if (typeof context.projectedBalance === 'number' && typeof context.balanceMin === 'number' && typeof context.balanceMax === 'number') {
    if (context.projectedBalance < context.balanceMin - 150) return `A projeção de hoje está em ${context.projectedBalance} kcal, abaixo da faixa alvo de ${context.balanceMin} a ${context.balanceMax} kcal. Déficit excessivo pode comprometer recuperação e desempenho.`;
    if (context.projectedBalance > context.balanceMax + 150) return `A projeção de hoje está em ${context.projectedBalance >= 0 ? '+' : ''}${context.projectedBalance} kcal, acima da faixa alvo. Confira consumo e gasto antes de encerrar o dia.`;
  }

  if (context.hydrationAverageMl && context.hydrationGoalMl && context.hydrationAverageMl < context.hydrationGoalMl * 0.8) {
    return `Hidratação média em ${(context.hydrationAverageMl / 1000).toFixed(1).replace('.', ',')} L/dia, abaixo de 80% da meta. Priorize distribuir água ao longo do dia.`;
  }

  if (Math.abs(calorieDelta) > 180) return `Média de ${avgCalories} kcal/dia (${calorieDelta > 0 ? '+' : ''}${calorieDelta} kcal vs meta). Observe peso, cintura e desempenho antes de ajustar a meta.`;
  if (skipped >= 3) return `${skipped} refeições foram puladas no período. Aderência e distribuição estão mais importantes que alterar calorias agora.`;
  return `Aderência consistente: média de ${avgCalories} kcal e ${avgProtein} g de proteína. Mantenha a faixa energética planejada e acompanhe peso, cintura, treino e recuperação.`;
}

export function foodLabel(foodId: string) {
  return getFoodById(foodId)?.name ?? foodId;
}
