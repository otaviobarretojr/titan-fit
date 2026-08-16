import type { TitanPlan } from '../plan/types';

function stripLegacyVideoData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripLegacyVideoData);
  if (!value || typeof value !== 'object') return value;
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'video' || key === 'videoPolicy' || key === 'videoLibrary') continue;
    output[key] = stripLegacyVideoData(child);
  }
  return output;
}
export function serializeTrainingPlan(plan: TitanPlan) { return JSON.stringify(stripLegacyVideoData(plan), null, 2); }
export function buildTrainingExportFilename(plan: TitanPlan, date = new Date()) {
  const safeId = String(plan.id || 'treino-atual').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'treino-atual';
  return 'TITAN-TREINO-' + safeId + '-' + date.toISOString().slice(0, 10) + '.json';
}
