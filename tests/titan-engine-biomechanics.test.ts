import { describe, expect, it } from 'vitest';
import { generateTitanEngineBlueprints, type TitanEngineAssessment, type TitanEngineExercise } from '../src/core/titan-engine';

const assessment: TitanEngineAssessment = {
  experience: 'intermediate', trainingDaysPerWeek: 3, preferredSessionMinutes: 60, equipmentAccess: 'full-gym', musclePriorities: [],
};
const rule = { weeklySetsPerMuscle: [8, 14] as [number, number], maxExercisesPerSession: 6 };

const make = (id: string, muscle: string, pattern: TitanEngineExercise['movementPattern'], role: TitanEngineExercise['exerciseRole'], fatigue: TitanEngineExercise['fatigueCost'], tension: TitanEngineExercise['tensionBias'] = 'unknown'): TitanEngineExercise => ({
  id, name: id, primaryMuscle: muscle, movementPattern: pattern, exerciseRole: role, stabilityDemand: fatigue === 'high' ? 'high' : 'low', fatigueCost: fatigue, tensionBias: tension,
  repRange: [8, 12], defaultRir: 2, restSeconds: fatigue === 'high' ? 180 : 90, technique: '', commonMistakes: [], substitutions: [],
});

const pool: TitanEngineExercise[] = [
  make('press-heavy-a','Peitoral','horizontal-push','compound','high'),
  make('press-heavy-b','Peitoral','horizontal-push','compound','high'),
  make('fly-lengthened','Peitoral','horizontal-push','isolation','low','lengthened'),
  make('shoulder-press','Deltoides','vertical-push','compound','medium'),
  make('lateral-raise','Deltoides','vertical-push','isolation','low','mid-range'),
  make('triceps-long','Tríceps','elbow-extension','isolation','low','lengthened'),
  make('row-heavy','Costas','horizontal-pull','compound','high'),
  make('pulldown','Dorsais','vertical-pull','compound','medium'),
  make('curl','Bíceps','elbow-flexion','isolation','low'),
  make('squat-heavy','Quadríceps','squat','compound','high'),
  make('leg-extension','Quadríceps','squat','isolation','low'),
  make('rdl-heavy','Posteriores de coxa','hinge','compound','high','lengthened'),
  make('leg-curl','Posteriores de coxa','knee-flexion','isolation','low','lengthened'),
];

describe('TITAN Engine biomechanical profile', () => {
  it('combina composto e isolador quando o pool oferece papéis complementares', () => {
    const candidate = generateTitanEngineBlueprints(assessment, pool, rule).candidates[1];
    for (const focus of ['push','pull','legs']) {
      const workout = candidate.workouts.find((item) => item.focus === focus);
      const roles = new Set(workout?.exercises.map((exercise) => exercise.exerciseRole));
      expect(roles.has('compound')).toBe(true);
      expect(roles.has('isolation')).toBe(true);
    }
  });

  it('penaliza uma sessão composta apenas por exercícios de alto custo de fadiga', () => {
    const high = pool.map((exercise) => ({ ...exercise, fatigueCost: 'high' as const, stabilityDemand: 'high' as const, restSeconds: 180 }));
    const low = pool.map((exercise) => ({ ...exercise, fatigueCost: 'low' as const, stabilityDemand: 'low' as const, restSeconds: 90 }));
    const highScore = generateTitanEngineBlueprints(assessment, high, rule).candidates[1].metrics.fatigueScore;
    const lowScore = generateTitanEngineBlueprints(assessment, low, rule).candidates[1].metrics.fatigueScore;
    expect(highScore).toBeLessThan(lowScore);
  });

  it('preserva perfis de tensão desconhecidos sem inventar classificação', () => {
    const candidate = generateTitanEngineBlueprints(assessment, pool, rule).candidates[1];
    const selected = candidate.workouts.flatMap((workout) => workout.exercises);
    expect(selected.some((exercise) => exercise.tensionBias === 'unknown')).toBe(true);
    expect(selected.some((exercise) => exercise.tensionBias === 'lengthened')).toBe(true);
  });
});
