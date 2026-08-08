import type { TitanProfile, TitanTrainingAssessment } from './types';

export type ProfileValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function validateProfileForPlanGeneration(
  profile: TitanProfile,
  assessment: TitanTrainingAssessment,
): ProfileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!profile.displayName.trim()) errors.push('Informe como o usuário quer ser chamado.');
  if (!profile.primaryGoal) errors.push('Informe o objetivo principal.');
  if (!profile.heightCm || profile.heightCm < 100 || profile.heightCm > 250) errors.push('Informe uma altura válida entre 100 e 250 cm.');
  if (!profile.currentWeightKg || profile.currentWeightKg < 30 || profile.currentWeightKg > 350) errors.push('Informe um peso válido entre 30 e 350 kg.');

  if (assessment.trainingDaysPerWeek < 1 || assessment.trainingDaysPerWeek > 7) {
    errors.push('Os dias de musculação devem ficar entre 1 e 7 por semana.');
  }
  if (assessment.preferredSessionMinutes < 20 || assessment.preferredSessionMinutes > 180) {
    errors.push('A duração preferida do treino deve ficar entre 20 e 180 minutos.');
  }
  if (assessment.cardioDaysPerWeek !== undefined && (assessment.cardioDaysPerWeek < 0 || assessment.cardioDaysPerWeek > 7)) {
    errors.push('Os dias de cardio devem ficar entre 0 e 7 por semana.');
  }

  if (assessment.limitations?.length) {
    warnings.push('Há limitações relatadas. O gerador deve priorizar alternativas compatíveis e não substituir avaliação profissional.');
  }
  if (!profile.birthDate) warnings.push('Data de nascimento não informada; recomendações dependentes de idade devem ser evitadas.');
  if (!profile.biologicalSex) warnings.push('Sexo biológico não informado; cálculos que dependem dessa variável devem ser omitidos.');

  return { ok: errors.length === 0, errors, warnings };
}
