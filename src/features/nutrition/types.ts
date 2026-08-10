export type NutritionMacroTotals = {
  caloriesKcal: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
};

export type NutritionFood = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  macros: NutritionMacroTotals;
  alternatives?: Array<{
    name: string;
    quantity: number;
    unit: string;
    macros?: Partial<NutritionMacroTotals>;
  }>;
};

export type NutritionMeal = {
  id: string;
  name: string;
  plannedTime: string;
  foods: NutritionFood[];
  macros: NutritionMacroTotals;
  notes?: string;
};

export type NutritionDay = {
  day: string;
  meals: NutritionMeal[];
  target?: NutritionMacroTotals;
};

export type TitanNutritionPlan = {
  schema: 'titan-nutrition-plan';
  schemaVersion: 1;
  id: string;
  name: string;
  objective?: string;
  createdAt?: string;
  defaultTarget: NutritionMacroTotals;
  days: NutritionDay[];
};
