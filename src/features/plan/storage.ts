import type { TitanPlan } from './types';

const ACTIVE_PLAN_KEY = 'titan-fit.active-plan.v1';

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
}

export function removeActivePlan(): void {
  localStorage.removeItem(ACTIVE_PLAN_KEY);
}

export { ACTIVE_PLAN_KEY };
