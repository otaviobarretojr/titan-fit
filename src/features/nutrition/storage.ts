import { DEFAULT_MEALS } from './defaultPlan';
import type { PlannedMeal } from './types';

const DB_NAME = 'titan-nutrition';
const DB_VERSION = 1;
const STORE_NAME = 'daily-meals';
const TODAY_RECORD_ID = 'today';
const LEGACY_STORAGE_KEY = 'titan-nutrition:meals:v1';

function cloneDefaultMeals(): PlannedMeal[] {
  return DEFAULT_MEALS.map((meal) => ({
    ...meal,
    items: meal.items.map((item) => ({ ...item })),
  }));
}

function readLegacyMeals(): PlannedMeal[] | null {
  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    return stored ? JSON.parse(stored) as PlannedMeal[] : null;
  } catch {
    return null;
  }
}

function writeFallback(meals: PlannedMeal[]) {
  try {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(meals));
  } catch {
    // IndexedDB continua sendo a fonte principal quando disponível.
  }
}

function openNutritionDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB indisponível'));

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir banco nutricional'));
  });
}

export async function loadDailyMeals(): Promise<PlannedMeal[]> {
  const fallback = readLegacyMeals();
  try {
    const database = await openNutritionDatabase();
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(TODAY_RECORD_ID);
    const record = await new Promise<{ id: string; meals: PlannedMeal[] } | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as { id: string; meals: PlannedMeal[] } | undefined);
      request.onerror = () => reject(request.error ?? new Error('Falha ao ler refeições'));
    });
    database.close();
    if (record?.meals?.length) return record.meals;
    if (fallback?.length) {
      await saveDailyMeals(fallback);
      return fallback;
    }
    return cloneDefaultMeals();
  } catch {
    return fallback?.length ? fallback : cloneDefaultMeals();
  }
}

export async function saveDailyMeals(meals: PlannedMeal[]): Promise<void> {
  writeFallback(meals);
  try {
    const database = await openNutritionDatabase();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put({
      id: TODAY_RECORD_ID,
      meals,
      updatedAt: new Date().toISOString(),
    });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Falha ao salvar refeições'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Gravação nutricional cancelada'));
    });
    database.close();
  } catch {
    // O fallback em localStorage já preservou a alteração.
  }
}
