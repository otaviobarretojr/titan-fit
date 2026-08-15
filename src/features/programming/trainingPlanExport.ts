import type { TitanPlan } from '../plan/types';

export function serializeTrainingPlan(plan: TitanPlan) {
  return JSON.stringify(plan, null, 2);
}

export function buildTrainingExportFilename(plan: TitanPlan, date = new Date()) {
  const safeId = String(plan.id || 'treino-atual').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'treino-atual';
  const stamp = date.toISOString().slice(0, 10);
  return `TITAN-TREINO-${safeId}-${stamp}.json`;
}
