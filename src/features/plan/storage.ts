import { deleteRecord, getRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { TitanPlan } from './types';

const ACTIVE_PLAN_KEY = 'titan-fit.active-plan.v1';
const ACTIVE_PLAN_RECORD_ID = 'active';

function reportMirrorFailure(error: unknown) {
  console.warn('Não foi possível sincronizar a ficha com o IndexedDB.', error);
}

export function loadLegacyActivePlan(): TitanPlan | null {
  try {
    const stored = localStorage.getItem(ACTIVE_PLAN_KEY);
    return stored ? JSON.parse(stored) as TitanPlan : null;
  } catch {
    return null;
  }
}

export function loadActivePlan(): TitanPlan | null {
  return loadLegacyActivePlan();
}

export async function loadActivePlanFromDatabase(): Promise<TitanPlan | null> {
  try {
    const indexedPlan = await getRecord<TitanPlan>(STORE_NAMES.plans, ACTIVE_PLAN_RECORD_ID);
    if (indexedPlan) return indexedPlan;

    const legacyPlan = loadLegacyActivePlan();
    if (legacyPlan) {
      await putRecord(STORE_NAMES.plans, ACTIVE_PLAN_RECORD_ID, legacyPlan);
    }
    return legacyPlan;
  } catch (error) {
    reportMirrorFailure(error);
    return loadLegacyActivePlan();
  }
}

export function saveActivePlan(plan: TitanPlan): void {
  localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(plan));
  void putRecord(STORE_NAMES.plans, ACTIVE_PLAN_RECORD_ID, plan).catch(reportMirrorFailure);
}

export function removeActivePlan(): void {
  localStorage.removeItem(ACTIVE_PLAN_KEY);
  void deleteRecord(STORE_NAMES.plans, ACTIVE_PLAN_RECORD_ID).catch(reportMirrorFailure);
}

export { ACTIVE_PLAN_KEY, ACTIVE_PLAN_RECORD_ID };
