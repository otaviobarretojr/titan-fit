import { deleteRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { TitanPlan } from './types';

const ACTIVE_PLAN_KEY = 'titan-fit.active-plan.v1';

function reportMirrorFailure(error: unknown) {
  console.warn('Não foi possível espelhar a ficha no IndexedDB.', error);
}

export function loadActivePlan(): TitanPlan | null {
  try {
    const stored = localStorage.getItem(ACTIVE_PLAN_KEY);
    return stored ? JSON.parse(stored) as TitanPlan : null;
  } catch {
    return null;
  }
}

export function saveActivePlan(plan: TitanPlan): void {
  localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(plan));
  void putRecord(STORE_NAMES.plans, 'active', plan).catch(reportMirrorFailure);
}

export function removeActivePlan(): void {
  localStorage.removeItem(ACTIVE_PLAN_KEY);
  void deleteRecord(STORE_NAMES.plans, 'active').catch(reportMirrorFailure);
}

export { ACTIVE_PLAN_KEY };
