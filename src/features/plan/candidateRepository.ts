import { getRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { GeneratedPlanCandidate } from '../profile/types';
import type { TitanPlan } from './types';

const ACTIVE_CANDIDATES = 'active';

export async function saveGeneratedPlanCandidates(candidates: Array<GeneratedPlanCandidate<TitanPlan>>): Promise<void> {
  await putRecord(STORE_NAMES.generatedPlanCandidates, ACTIVE_CANDIDATES, candidates);
}

export async function loadGeneratedPlanCandidates(): Promise<Array<GeneratedPlanCandidate<TitanPlan>> | null> {
  return getRecord<Array<GeneratedPlanCandidate<TitanPlan>>>(STORE_NAMES.generatedPlanCandidates, ACTIVE_CANDIDATES);
}
