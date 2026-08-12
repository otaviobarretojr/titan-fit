const FAVORITES_KEY = 'titan-nutrition:food-favorites:v1';
const RECENTS_KEY = 'titan-nutrition:food-recents:v1';
const USAGE_KEY = 'titan-nutrition:food-usage:v1';

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch { return []; }
}

function writeList(key: string, items: string[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

function readUsage(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(USAGE_KEY) ?? '{}') as Record<string, number>; } catch { return {}; }
}

export function loadFoodFavorites() { return readList(FAVORITES_KEY); }
export function isFoodFavorite(foodId: string) { return loadFoodFavorites().includes(foodId); }
export function toggleFoodFavorite(foodId: string) {
  const current = loadFoodFavorites();
  const next = current.includes(foodId) ? current.filter((id) => id !== foodId) : [foodId, ...current];
  writeList(FAVORITES_KEY, next);
  return next;
}
export function loadRecentFoods() { return readList(RECENTS_KEY); }
export function loadFoodUsage() { return readUsage(); }
export function loadFrequentFoods(limit = 8) {
  return Object.entries(readUsage()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
}
export function markFoodRecent(foodId: string) {
  const next = [foodId, ...loadRecentFoods().filter((id) => id !== foodId)].slice(0, 12);
  writeList(RECENTS_KEY, next);
  const usage = readUsage();
  usage[foodId] = (usage[foodId] ?? 0) + 1;
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  return next;
}
