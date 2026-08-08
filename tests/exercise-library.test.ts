import { describe, expect, it } from 'vitest';
import { EXERCISE_LIBRARY_MUSCLES, TITAN_FULL_EXERCISE_CATALOG, filterExerciseLibrary } from '../src/features/exercise-library/library';

describe('Biblioteca TITAN', () => {
  it('expõe a base completa de exercícios', () => {
    expect(TITAN_FULL_EXERCISE_CATALOG.length).toBeGreaterThanOrEqual(110);
    expect(EXERCISE_LIBRARY_MUSCLES).toContain('Peitoral');
    expect(EXERCISE_LIBRARY_MUSCLES).toContain('Quadríceps');
  });

  it('busca por nome ignorando acentos', () => {
    const result = filterExerciseLibrary({ query: 'triceps', muscle: 'all', equipment: 'all', experience: 'all' });
    expect(result.some((exercise) => exercise.name.toLowerCase().includes('tríceps'))).toBe(true);
  });

  it('filtra por grupo muscular e equipamento', () => {
    const result = filterExerciseLibrary({ query: '', muscle: 'Peitoral', equipment: 'dumbbell', experience: 'all' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((exercise) => exercise.primaryMuscle === 'Peitoral' && exercise.equipment.includes('dumbbell'))).toBe(true);
  });
});
