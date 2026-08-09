import { getRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { HealthSample, HealthSyncStatus } from './types';

const STATUS_ID = 'health-connect-status-v1';
const SAMPLES_ID = 'health-connect-samples-v1';

export async function loadHealthSyncStatus(): Promise<HealthSyncStatus | null> {
  return getRecord<HealthSyncStatus>(STORE_NAMES.preferences, STATUS_ID);
}

export async function saveHealthSyncStatus(status: HealthSyncStatus): Promise<void> {
  await putRecord(STORE_NAMES.preferences, STATUS_ID, status);
}

export async function loadHealthSamples(): Promise<HealthSample[]> {
  return (await getRecord<HealthSample[]>(STORE_NAMES.preferences, SAMPLES_ID)) ?? [];
}

export async function mergeHealthSamples(samples: HealthSample[]): Promise<HealthSample[]> {
  const current = await loadHealthSamples();
  const byId = new Map(current.map((sample) => [sample.id, sample]));
  samples.forEach((sample) => byId.set(sample.id, sample));
  const merged = [...byId.values()].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  await putRecord(STORE_NAMES.preferences, SAMPLES_ID, merged);
  return merged;
}
