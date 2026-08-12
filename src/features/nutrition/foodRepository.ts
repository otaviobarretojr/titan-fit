import { FOOD_LIBRARY } from './foodLibrary';
import { FOOD_LIBRARY_ADDITIONS } from './foodLibraryAdditions';
import { loadCustomFoods } from './customFoodStorage';
import type { Food } from './types';

export function getAllFoods(): Food[] {
  const custom = typeof localStorage === 'undefined' ? [] : loadCustomFoods();
  return [...custom, ...FOOD_LIBRARY_ADDITIONS, ...FOOD_LIBRARY];
}

export function getFoodById(foodId: string): Food | undefined {
  return getAllFoods().find((food) => food.id === foodId);
}
