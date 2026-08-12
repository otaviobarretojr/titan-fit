import { getDefaultMealsForDate } from './defaultPlan';
import type { PlannedMeal } from './types';

const DB_NAME = 'titan-nutrition';
const DB_VERSION = 1;
const STORE_NAME = 'daily-meals';

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function storageKey(date = new Date()) {
  return `titan-nutrition:meals:v2:${dateKey(date)}`;
}

function cloneDefaultMeals(date = new Date()): PlannedMeal[] {
  return getDefaultMealsForDate(date);
}

function readFallback(date = new Date()): PlannedMeal[] | null {
  try {
    const stored = localStorage.getItem(storageKey(date));
    return stored ? JSON.parse(stored) as PlannedMeal[] : null;
  } catch {
    return null;
  }
}

function writeFallback(meals: PlannedMeal[], date = new Date()) {
  try {
    localStorage.setItem(storageKey(date), JSON.stringify(meals));
  } catch {
    // IndexedDB continua sendo a fonte principal quando disponível.
  }
}

function openNutritionDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB indisponível'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir banco nutricional'));
  });
}

export async function loadDailyMeals(date = new Date()): Promise<PlannedMeal[]> {
  const fallback = readFallback(date);
  const id = dateKey(date);
  try {
    const database = await openNutritionDatabase();
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(id);
    const record = await new Promise<{ id: string; meals: PlannedMeal[] } | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as { id: string; meals: PlannedMeal[] } | undefined);
      request.onerror = () => reject(request.error ?? new Error('Falha ao ler refeições'));
    });
    database.close();
    if (record?.meals?.length) return record.meals;
    if (fallback?.length) return fallback;
    return cloneDefaultMeals(date);
  } catch {
    return fallback?.length ? fallback : cloneDefaultMeals(date);
  }
}

export async function saveDailyMeals(meals: PlannedMeal[], date = new Date()): Promise<void> {
  writeFallback(meals, date);
  try {
    const database = await openNutritionDatabase();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put({ id: dateKey(date), meals, updatedAt: new Date().toISOString() });
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
