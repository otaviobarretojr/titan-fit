export type MacroTotals = {
  caloriesKcal: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
};

export type FoodUnit = 'g' | 'ml' | 'unit';
export type FoodCategory = 'Proteínas' | 'Carboidratos' | 'Frutas' | 'Laticínios' | 'Bebidas' | 'Verduras e legumes' | 'Gorduras' | 'Lanches e doces' | 'Temperos' | 'Outros';
export type FoodSource = 'TBCA/TACO' | 'USDA/referência' | 'Rótulo' | 'Genérico';

export type Food = {
  id: string;
  name: string;
  unit: FoodUnit;
  referenceAmount: number;
  macrosPerReference: MacroTotals;
  category?: FoodCategory;
  source?: FoodSource;
  brand?: string;
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
