import { getRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { TitanProfile, TitanTrainingAssessment } from './types';

const ACTIVE_PROFILE_ID = 'active';
const ACTIVE_ASSESSMENT_ID = 'active';

export async function loadActiveProfile(): Promise<TitanProfile | null> {
  return getRecord<TitanProfile>(STORE_NAMES.profiles, ACTIVE_PROFILE_ID);
}

export async function saveActiveProfile(profile: TitanProfile): Promise<void> {
  await putRecord(STORE_NAMES.profiles, ACTIVE_PROFILE_ID, profile);
}

export async function loadActiveAssessment(): Promise<TitanTrainingAssessment | null> {
  return getRecord<TitanTrainingAssessment>(STORE_NAMES.assessments, ACTIVE_ASSESSMENT_ID);
}

export async function saveActiveAssessment(assessment: TitanTrainingAssessment): Promise<void> {
  await putRecord(STORE_NAMES.assessments, ACTIVE_ASSESSMENT_ID, assessment);
}

export function createProfileDraft(displayName: string): TitanProfile {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    displayName: displayName.trim(),
    createdAt: now,
    updatedAt: now,
    onboardingCompleted: false,
  };
}

export function updateProfile(profile: TitanProfile, patch: Partial<Omit<TitanProfile, 'id' | 'createdAt'>>): TitanProfile {
  return {
    ...profile,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}
