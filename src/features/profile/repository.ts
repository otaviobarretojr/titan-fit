import { getRecord, putRecord } from '../../core/database/indexedDb';
import { STORE_NAMES } from '../../core/database/schema';
import type { TitanProfile, TitanTrainingAssessment } from './types';

const LEGACY_ACTIVE_PROFILE_ID = 'active';
const LEGACY_ACTIVE_ASSESSMENT_ID = 'active';
const ACTIVE_PROFILE_POINTER = 'active-profile-id';
const ACTIVE_ASSESSMENT_POINTER = 'active-assessment-id';

export async function getActiveProfileId(): Promise<string | null> {
  return getRecord<string>(STORE_NAMES.preferences, ACTIVE_PROFILE_POINTER);
}

export async function loadActiveProfile(): Promise<TitanProfile | null> {
  const activeProfileId = await getActiveProfileId();
  if (activeProfileId) {
    const profile = await getRecord<TitanProfile>(STORE_NAMES.profiles, activeProfileId);
    if (profile) return profile;
  }

  const legacy = await getRecord<TitanProfile>(STORE_NAMES.profiles, LEGACY_ACTIVE_PROFILE_ID);
  if (!legacy) return null;
  await saveActiveProfile(legacy);
  return legacy;
}

export async function saveActiveProfile(profile: TitanProfile): Promise<void> {
  await putRecord(STORE_NAMES.profiles, profile.id, profile);
  await putRecord(STORE_NAMES.preferences, ACTIVE_PROFILE_POINTER, profile.id);
  await putRecord(STORE_NAMES.profiles, LEGACY_ACTIVE_PROFILE_ID, profile);
}

export async function loadActiveAssessment(): Promise<TitanTrainingAssessment | null> {
  const activeAssessmentId = await getRecord<string>(STORE_NAMES.preferences, ACTIVE_ASSESSMENT_POINTER);
  if (activeAssessmentId) {
    const assessment = await getRecord<TitanTrainingAssessment>(STORE_NAMES.assessments, activeAssessmentId);
    if (assessment) return assessment;
  }

  const legacy = await getRecord<TitanTrainingAssessment>(STORE_NAMES.assessments, LEGACY_ACTIVE_ASSESSMENT_ID);
  if (!legacy) return null;
  await saveActiveAssessment(legacy);
  return legacy;
}

export async function saveActiveAssessment(assessment: TitanTrainingAssessment): Promise<void> {
  await putRecord(STORE_NAMES.assessments, assessment.id, assessment);
  await putRecord(STORE_NAMES.preferences, ACTIVE_ASSESSMENT_POINTER, assessment.id);
  await putRecord(STORE_NAMES.assessments, LEGACY_ACTIVE_ASSESSMENT_ID, assessment);
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
