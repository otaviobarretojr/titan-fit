import { describe, expect, it } from 'vitest';
import { validateProfileForPlanGeneration } from '../src/features/profile/validation';
import type { TitanProfile, TitanTrainingAssessment } from '../src/features/profile/types';

const profile: TitanProfile = {
  id: 'profile-1',
  displayName: 'Pessoa teste',
  heightCm: 176,
  currentWeightKg: 92,
  primaryGoal: 'hypertrophy',
  createdAt: '2026-08-08T00:00:00.000Z',
  updatedAt: '2026-08-08T00:00:00.000Z',
  onboardingCompleted: true,
};

const assessment: TitanTrainingAssessment = {
  id: 'assessment-1',
  profileId: 'profile-1',
  experience: 'intermediate',
  trainingDaysPerWeek: 5,
  preferredSessionMinutes: 70,
  equipmentAccess: 'full-gym',
  cardioGoal: '5k',
  createdAt: '2026-08-08T00:00:00.000Z',
  updatedAt: '2026-08-08T00:00:00.000Z',
};

describe('validação de perfil para geração de plano', () => {
  it('aceita um perfil com os dados essenciais', () => {
    const result = validateProfileForPlanGeneration(profile, assessment);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('bloqueia dados incompatíveis com o gerador', () => {
    const result = validateProfileForPlanGeneration(
      { ...profile, heightCm: 20, currentWeightKg: 500 },
      { ...assessment, trainingDaysPerWeek: 9, preferredSessionMinutes: 10 },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('sinaliza limitações sem impedir automaticamente o perfil', () => {
    const result = validateProfileForPlanGeneration(profile, {
      ...assessment,
      limitations: [{ area: 'joelho', note: 'desconforto' }],
    });
    expect(result.ok).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('limitações'))).toBe(true);
  });
});
