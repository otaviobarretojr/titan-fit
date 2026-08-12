import type { Food } from './types';

export const FOOD_LIBRARY: Food[] = [
  { id: 'egg-whole-large', name: 'Ovo inteiro grande', unit: 'unit', referenceAmount: 1, macrosPerReference: { caloriesKcal: 72, proteinG: 6.3, carbohydrateG: 0.4, fatG: 4.8 } },
  { id: 'egg-white-large', name: 'Clara de ovo', unit: 'unit', referenceAmount: 1, macrosPerReference: { caloriesKcal: 17, proteinG: 3.6, carbohydrateG: 0.2, fatG: 0.1 } },
  { id: 'banana-medium', name: 'Banana média', unit: 'unit', referenceAmount: 1, macrosPerReference: { caloriesKcal: 105, proteinG: 1.3, carbohydrateG: 27, fatG: 0.4 } },
  { id: 'apple-medium', name: 'Maçã média', unit: 'unit', referenceAmount: 1, macrosPerReference: { caloriesKcal: 95, proteinG: 0.5, carbohydrateG: 25, fatG: 0.3 } },
  { id: 'watermelon', name: 'Melancia', unit: 'g', referenceAmount: 100, macrosPerReference: { caloriesKcal: 30, proteinG: 0.6, carbohydrateG: 7.6, fatG: 0.2 } },
  { id: 'oats', name: 'Aveia em flocos', unit: 'g', referenceAmount: 100, macrosPerReference: { caloriesKcal: 389, proteinG: 16.9, carbohydrateG: 66.3, fatG: 6.9 } },
  { id: 'milk-powder', name: 'Leite em pó integral', unit: 'g', referenceAmount: 100, macrosPerReference: { caloriesKcal: 496, proteinG: 25.8, carbohydrateG: 38.4, fatG: 26.7 } },
  { id: 'water', name: 'Água', unit: 'ml', referenceAmount: 100, macrosPerReference: { caloriesKcal: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 }, notes: 'Componente da preparação; não altera os macros.' },
  { id: 'chicken-breast-grilled', name: 'Peito de frango grelhado', unit: 'g', referenceAmount: 100, macrosPerReference: { caloriesKcal: 165, proteinG: 31, carbohydrateG: 0, fatG: 3.6 } },
  { id: 'chicken-shredded', name: 'Peito de frango desfiado', unit: 'g', referenceAmount: 100, macrosPerReference: { caloriesKcal: 165, proteinG: 31, carbohydrateG: 0, fatG: 3.6 } },
  { id: 'patinho-ground-cooked', name: 'Patinho moído preparado', unit: 'g', referenceAmount: 100, macrosPerReference: { caloriesKcal: 219, proteinG: 35.9, carbohydrateG: 0, fatG: 7.3 } },
  { id: 'rice-white-cooked', name: 'Arroz branco cozido', unit: 'g', referenceAmount: 100, macrosPerReference: { caloriesKcal: 130, proteinG: 2.7, carbohydrateG: 28.2, fatG: 0.3 } },
  { id: 'beans-cooked', name: 'Feijão cozido', unit: 'g', referenceAmount: 100, macrosPerReference: { caloriesKcal: 76, proteinG: 4.8, carbohydrateG: 13.6, fatG: 0.5 } },
  { id: 'pasta-cooked', name: 'Macarrão cozido', unit: 'g', referenceAmount: 100, macrosPerReference: { caloriesKcal: 157, proteinG: 5.8, carbohydrateG: 30.9, fatG: 0.9 } },
  { id: 'potato-cooked', name: 'Batata cozida', unit: 'g', referenceAmount: 100, macrosPerReference: { caloriesKcal: 87, proteinG: 1.9, carbohydrateG: 20.1, fatG: 0.1 } },
  { id: 'rap10', name: 'Rap10', unit: 'unit', referenceAmount: 1, macrosPerReference: { caloriesKcal: 118, proteinG: 3.5, carbohydrateG: 20.4, fatG: 2.6 } },
  { id: 'bread-slice', name: 'Pão de forma', unit: 'unit', referenceAmount: 1, macrosPerReference: { caloriesKcal: 67, proteinG: 2.4, carbohydrateG: 12.3, fatG: 1 } },
  { id: 'olive-oil', name: 'Azeite de oliva', unit: 'g', referenceAmount: 10, macrosPerReference: { caloriesKcal: 88, proteinG: 0, carbohydrateG: 0, fatG: 10 } },
  { id: 'cocoa-powder', name: 'Cacau 100%', unit: 'g', referenceAmount: 10, macrosPerReference: { caloriesKcal: 23, proteinG: 2, carbohydrateG: 5.8, fatG: 1.4 } },
  { id: 'instant-coffee', name: 'Café solúvel', unit: 'g', referenceAmount: 5, macrosPerReference: { caloriesKcal: 6, proteinG: 0.6, carbohydrateG: 1, fatG: 0 } },
  { id: 'cinnamon', name: 'Canela em pó', unit: 'g', referenceAmount: 5, macrosPerReference: { caloriesKcal: 12, proteinG: 0.2, carbohydrateG: 4, fatG: 0.1 } },
];

export function getFood(foodId: string) {
  return FOOD_LIBRARY.find((food) => food.id === foodId);
}
