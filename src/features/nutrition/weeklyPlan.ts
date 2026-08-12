import type { PlannedMeal } from './types';

export type NutritionDayPlan = {
  id: string;
  weekday: number;
  label: string;
  target: { caloriesKcal: number; proteinG: number; carbohydrateG: number; fatG: number };
  meals: PlannedMeal[];
};

const item = (id: string, foodId: string, amount: number) => ({ id, foodId, plannedAmount: amount, actualAmount: amount });
const meal = (id: string, name: string, time: string, items: ReturnType<typeof item>[]): PlannedMeal => ({ id, name, time, status: 'upcoming', items });

function planA(prefix: string): PlannedMeal[] {
  return [
    meal(`${prefix}-breakfast`, 'Café da manhã', '06:30', [item(`${prefix}-egg`, 'egg-whole-large', 2), item(`${prefix}-white`, 'egg-white-large', 4), item(`${prefix}-water`, 'water', 300), item(`${prefix}-milk`, 'milk-powder', 30), item(`${prefix}-oats`, 'oats', 50), item(`${prefix}-banana1`, 'banana-medium', 1)]),
    meal(`${prefix}-snack1`, 'Lanche da manhã', '09:30', [item(`${prefix}-rap1`, 'rap10', 1), item(`${prefix}-chicken1`, 'chicken-shredded', 100), item(`${prefix}-apple`, 'apple-medium', 1)]),
    meal(`${prefix}-lunch`, 'Almoço', '12:30', [item(`${prefix}-rice1`, 'rice-white-cooked', 200), item(`${prefix}-beans1`, 'beans-cooked', 100), item(`${prefix}-chicken2`, 'chicken-breast-grilled', 180), item(`${prefix}-oil`, 'olive-oil', 10)]),
    meal(`${prefix}-snack2`, 'Lanche da tarde', '16:30', [item(`${prefix}-rap2`, 'rap10', 1), item(`${prefix}-chicken3`, 'chicken-shredded', 100), item(`${prefix}-banana2`, 'banana-medium', 1)]),
    meal(`${prefix}-pre`, 'Pré-treino', '18:30', [item(`${prefix}-rice2`, 'rice-white-cooked', 180), item(`${prefix}-chicken4`, 'chicken-breast-grilled', 100), item(`${prefix}-banana3`, 'banana-medium', 1)]),
    meal(`${prefix}-dinner`, 'Jantar / pós-treino', '21:15', [item(`${prefix}-rice3`, 'rice-white-cooked', 220), item(`${prefix}-patinho`, 'patinho-ground-cooked', 150), item(`${prefix}-beans2`, 'beans-cooked', 100)]),
  ];
}

function planB(prefix: string): PlannedMeal[] {
  const meals = planA(prefix);
  meals[0] = meal(`${prefix}-breakfast`, 'Café da manhã · cacau', '06:30', [item(`${prefix}-egg`, 'egg-whole-large', 2), item(`${prefix}-white`, 'egg-white-large', 4), item(`${prefix}-water`, 'water', 300), item(`${prefix}-milk`, 'milk-powder', 30), item(`${prefix}-oats`, 'oats', 40), item(`${prefix}-banana1`, 'banana-medium', 1), item(`${prefix}-cocoa`, 'cocoa-powder', 10), item(`${prefix}-bread`, 'bread-slice', 2)]);
  meals[1] = meal(`${prefix}-snack1`, 'Lanche da manhã', '09:30', [item(`${prefix}-rap1`, 'rap10', 1), item(`${prefix}-patinho1`, 'patinho-ground-cooked', 90), item(`${prefix}-apple`, 'apple-medium', 1)]);
  return meals;
}

function planC(prefix: string): PlannedMeal[] {
  const meals = planA(prefix);
  meals[0] = meal(`${prefix}-breakfast`, 'Café da manhã · café e canela', '06:30', [item(`${prefix}-egg`, 'egg-whole-large', 2), item(`${prefix}-white`, 'egg-white-large', 4), item(`${prefix}-water`, 'water', 300), item(`${prefix}-milk`, 'milk-powder', 30), item(`${prefix}-oats`, 'oats', 50), item(`${prefix}-banana1`, 'banana-medium', 1), item(`${prefix}-coffee`, 'instant-coffee', 5), item(`${prefix}-cinnamon`, 'cinnamon', 5)]);
  meals[5] = meal(`${prefix}-dinner`, 'Jantar / pós-treino', '21:15', [item(`${prefix}-pasta`, 'pasta-cooked', 250), item(`${prefix}-patinho`, 'patinho-ground-cooked', 150), item(`${prefix}-beans2`, 'beans-cooked', 100)]);
  return meals;
}

const TARGET = { caloriesKcal: 2900, proteinG: 195, carbohydrateG: 360, fatG: 75 };

export const WEEKLY_NUTRITION_PLAN: NutritionDayPlan[] = [
  { id: 'monday', weekday: 1, label: 'Segunda', target: TARGET, meals: planA('mon') },
  { id: 'tuesday', weekday: 2, label: 'Terça', target: TARGET, meals: planA('tue') },
  { id: 'wednesday', weekday: 3, label: 'Quarta', target: TARGET, meals: planB('wed') },
  { id: 'thursday', weekday: 4, label: 'Quinta', target: TARGET, meals: planB('thu') },
  { id: 'friday', weekday: 5, label: 'Sexta', target: TARGET, meals: planC('fri') },
  { id: 'saturday', weekday: 6, label: 'Sábado', target: TARGET, meals: planC('sat') },
  { id: 'sunday', weekday: 0, label: 'Domingo', target: TARGET, meals: planC('sun') },
];

export function getNutritionPlanForDate(date = new Date()) {
  return WEEKLY_NUTRITION_PLAN.find((day) => day.weekday === date.getDay()) ?? WEEKLY_NUTRITION_PLAN[0];
}
