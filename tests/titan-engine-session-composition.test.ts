import { describe, expect, it } from 'vitest';
import { generateTitanEngineBlueprints, type TitanEngineAssessment, type TitanEngineExercise } from '../src/core/titan-engine';

const assessment: TitanEngineAssessment = {
  experience: 'intermediate',
  trainingDaysPerWeek: 6,
  preferredSessionMinutes: 60,
  equipmentAccess: 'full-gym',
  musclePriorities: ['chest'],
};

const exercise = (
  id: string,
  name: string,
  primaryMuscle: string,
  movementPattern: TitanEngineExercise['movementPattern'],
  restSeconds = 120,
): TitanEngineExercise => ({
  id,
  name,
  primaryMuscle,
  movementPattern,
  repRange: [8, 12],
  defaultRir: 2,
  restSeconds,
  technique: '',
  commonMistakes: [],
  substitutions: [],
});

const pool: TitanEngineExercise[] = [
  exercise('press-1', 'Supino 1', 'Peitoral', 'horizontal-push'),
  exercise('press-2', 'Supino 2', 'Peitoral', 'horizontal-push'),
  exercise('press-3', 'Supino 3', 'Peitoral', 'horizontal-push'),
  exercise('press-4', 'Supino 4', 'Peitoral', 'horizontal-push'),
  exercise('shoulder-press', 'Desenvolvimento', 'Deltoides', 'vertical-push'),
  exercise('triceps', 'Tríceps polia', 'Tríceps', 'elbow-extension', 90),
  exercise('row-1', 'Remada 1', 'Costas', 'horizontal-pull'),
  exercise('row-2', 'Remada 2', 'Costas', 'horizontal-pull'),
  exercise('pulldown', 'Puxada alta', 'Dorsais', 'vertical-pull'),
  exercise('curl', 'Rosca', 'Bíceps', 'elbow-flexion', 90),
  exercise('squat-1', 'Agachamento 1', 'Quadríceps', 'squat', 150),
  exercise('squat-2', 'Agachamento 2', 'Quadríceps', 'squat', 150),
  exercise('hinge', 'RDL', 'Posteriores de coxa', 'hinge', 150),
  exercise('leg-curl', 'Flexora', 'Posteriores de coxa', 'knee-flexion', 90),
  exercise('calf', 'Panturrilha', 'Panturrilhas', 'calf', 90),
];

const rule = { weeklySetsPerMuscle: [8, 14] as [number, number], maxExercisesPerSession: 5 };

describe('TITAN Engine session composition', () => {
  it('combina padrões complementares no Push quando há opções disponíveis', () => {
    const push = generateTitanEngineBlueprints(assessment, pool, rule).candidates[1].workouts.find((workout) => workout.focus === 'push');
    const patterns = new Set(push?.exercises.map((item) => item.movementPattern));
    expect(patterns.size).toBeGreaterThanOrEqual(3);
    expect(patterns.has('vertical-push')).toBe(true);
    expect(patterns.has('elbow-extension')).toBe(true);
  });

  it('combina puxada vertical, horizontal e flexão de cotovelo no Pull', () => {
    const pull = generateTitanEngineBlueprints(assessment, pool, rule).candidates[1].workouts.find((workout) => workout.focus === 'pull');
    const patterns = new Set(pull?.exercises.map((item) => item.movementPattern));
    expect(patterns.has('horizontal-pull')).toBe(true);
    expect(patterns.has('vertical-pull')).toBe(true);
    expect(patterns.has('elbow-flexion')).toBe(true);
  });

  it('combina agachamento, hinge e flexão de joelho em Legs', () => {
    const legs = generateTitanEngineBlueprints(assessment, pool, rule).candidates[1].workouts.find((workout) => workout.focus === 'legs');
    const patterns = new Set(legs?.exercises.map((item) => item.movementPattern));
    expect(patterns.has('squat')).toBe(true);
    expect(patterns.has('hinge')).toBe(true);
    expect(patterns.has('knee-flexion')).toBe(true);
  });
});
