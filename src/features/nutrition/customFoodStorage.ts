import type { Food } from './types';

const KEY = 'titan-nutrition:custom-foods:v1';

export function loadCustomFoods(): Food[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as Food[] : [];
  } catch {
    return [];
  }
}

export function saveCustomFoods(foods: Food[]) {
  localStorage.setItem(KEY, JSON.stringify(foods));
}

export function createCustomFoodId(name: string) {
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `custom-${slug || 'alimento'}-${Date.now()}`;
}
