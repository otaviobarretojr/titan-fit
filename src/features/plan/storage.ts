import { deleteRecord, getRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import { linkPlanToProject } from '../project/repository';
import { fixedTitanRoutine } from './fixedTitanRoutine';
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
  // A rotina atual do TITAN é fixa. O histórico permanece separado e preservado.
  localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(fixedTitanRoutine));
  return fixedTitanRoutine;
}

export async function loadPlanById(planId: string): Promise<TitanPlan | null> {
  return getRecord<TitanPlan>(STORE_NAMES.plans, planId);
}

export async function loadActivePlanFromDatabase(): Promise<TitanPlan | null> {
  try {
    await persistActivePlan(fixedTitanRoutine);
    localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(fixedTitanRoutine));
    return fixedTitanRoutine;
  } catch (error) {
    reportMirrorFailure(error);
    return fixedTitanRoutine;
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
