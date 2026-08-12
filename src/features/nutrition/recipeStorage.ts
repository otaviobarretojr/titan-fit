import type { RecipeDefinition } from './advanced';

const KEY = 'titan-nutrition:custom-recipes:v1';

export function loadCustomRecipes(): RecipeDefinition[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as RecipeDefinition[] : [];
  } catch { return []; }
}

export function saveCustomRecipes(recipes: RecipeDefinition[]) {
  localStorage.setItem(KEY, JSON.stringify(recipes));
}

export function createRecipeId(name: string) {
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `custom-recipe-${slug || 'preparacao'}-${Date.now()}`;
}
