export type MacroTotals = {
  caloriesKcal: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
};

export type FoodUnit = 'g' | 'ml' | 'unit';

export type Food = {
  id: string;
  name: string;
  unit: FoodUnit;
  referenceAmount: number;
  macrosPerReference: MacroTotals;
  notes?: string;
};

export type MealItem = {
  id: string;
  foodId: string;
  plannedAmount: number;
  actualAmount: number;
};

export type MealStatus = 'upcoming' | 'pending' | 'completed' | 'skipped';

export type PlannedMeal = {
  id: string;
  name: string;
  time: string;
  items: MealItem[];
  status: MealStatus;
};
