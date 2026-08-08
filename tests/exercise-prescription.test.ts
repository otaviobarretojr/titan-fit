import { describe, expect, it } from 'vitest';
import { buildSplitTemplate, getEligibleExercises, getPrescriptionRule } from '../src/features/exercise-library/prescription';

describe('TITAN exercise prescription', () => {
  it('reduz complexidade e volume inicial para iniciantes', () => {
    const rule = getPrescriptionRule({ experience:'beginner', trainingDaysPerWeek:3, preferredSessionMinutes:45, equipmentAccess:'full-gym' });
    expect(rule.weeklySetsPerMuscle).toEqual([6, 10]);
    expect(rule.maxExercisesPerSession).toBe(5);
  });

  it('não oferece exercício intermediário a iniciante', () => {
    const exercises = getEligibleExercises({ experience:'beginner', trainingDaysPerWeek:3, preferredSessionMinutes:60, equipmentAccess:'full-gym' });
    expect(exercises.some((exercise) => exercise.id === 'barbell-squat')).toBe(false);
    expect(exercises.some((exercise) => exercise.id === 'leg-press')).toBe(true);
  });

  it('usa upper/lower em quatro dias e push pull legs em seis', () => {
    expect(buildSplitTemplate(4)).toEqual([['upper'], ['lower'], ['upper'], ['lower']]);
    expect(buildSplitTemplate(6)).toHaveLength(6);
  });
});
