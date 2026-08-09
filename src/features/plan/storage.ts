import { deleteRecord, getRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import { linkPlanToProject } from '../project/repository';
import type { TitanPlan } from './types';

const ACTIVE_PLAN_KEY = 'titan-fit.active-plan.v1';
const LEGACY_ACTIVE_PLAN_RECORD_ID = 'active';
const ACTIVE_PLAN_POINTER = 'active-plan-id';

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
    const activePlanId = await getRecord<string>(STORE_NAMES.preferences, ACTIVE_PLAN_POINTER);
    if (activePlanId) {
      const plan = await getRecord<TitanPlan>(STORE_NAMES.plans, activePlanId);
      if (plan) {
        localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(plan));
        return plan;
      }
    }

    const indexedLegacyPlan = await getRecord<TitanPlan>(STORE_NAMES.plans, LEGACY_ACTIVE_PLAN_RECORD_ID);
    if (indexedLegacyPlan) {
      const linkedPlan = indexedLegacyPlan.projectId ? indexedLegacyPlan : await linkPlanToProject(indexedLegacyPlan, indexedLegacyPlan.profileId ?? null);
      await persistActivePlan(linkedPlan);
      localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(linkedPlan));
      return linkedPlan;
    }

    const legacyPlan = loadLegacyActivePlan();
    if (legacyPlan) {
      const linkedPlan = legacyPlan.projectId ? legacyPlan : await linkPlanToProject(legacyPlan, legacyPlan.profileId ?? null);
      await persistActivePlan(linkedPlan);
      localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(linkedPlan));
      return linkedPlan;
    }
    return null;
  } catch (error) {
    reportMirrorFailure(error);
    return loadLegacyActivePlan();
  }
}

async function persistActivePlan(plan: TitanPlan): Promise<void> {
  await putRecord(STORE_NAMES.plans, plan.id, plan);
  await putRecord(STORE_NAMES.preferences, ACTIVE_PLAN_POINTER, plan.id);
  await putRecord(STORE_NAMES.plans, LEGACY_ACTIVE_PLAN_RECORD_ID, plan);
}

export function saveActivePlan(plan: TitanPlan): void {
  localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(plan));
  void (async () => {
    const linkedPlan = plan.projectId ? plan : await linkPlanToProject(plan, plan.profileId ?? null);
    if (linkedPlan !== plan) localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(linkedPlan));
    await persistActivePlan(linkedPlan);
  })().catch(reportMirrorFailure);
}

export function removeActivePlan(): void {
  const legacyPlan = loadLegacyActivePlan();
  localStorage.removeItem(ACTIVE_PLAN_KEY);
  void (async () => {
    if (legacyPlan?.id) await deleteRecord(STORE_NAMES.plans, legacyPlan.id);
    await deleteRecord(STORE_NAMES.plans, LEGACY_ACTIVE_PLAN_RECORD_ID);
    await deleteRecord(STORE_NAMES.preferences, ACTIVE_PLAN_POINTER);
  })().catch(reportMirrorFailure);
}

export { ACTIVE_PLAN_KEY, LEGACY_ACTIVE_PLAN_RECORD_ID as ACTIVE_PLAN_RECORD_ID, ACTIVE_PLAN_POINTER };
