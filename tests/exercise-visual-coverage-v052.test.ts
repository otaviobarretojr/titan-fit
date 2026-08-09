import { describe, expect, it } from 'vitest';
import { TITAN_FULL_EXERCISE_CATALOG } from '../src/features/exercise-library/library';
import { SPECIFIC_EXERCISE_VISUALS } from '../src/features/exercise-library/specificVisuals';
import { SPECIFIC_EXERCISE_VISUALS_EXTRA } from '../src/features/exercise-library/specificVisualsExtra';

describe('cobertura visual v0.52', () => {
  it('mantém biblioteca completa acima de 110 exercícios', () => {
    expect(TITAN_FULL_EXERCISE_CATALOG.length).toBeGreaterThanOrEqual(110);
  });

  it('leva a cobertura específica para pelo menos 65 exercícios', () => {
    const ids = new Set([...Object.keys(SPECIFIC_EXERCISE_VISUALS), ...Object.keys(SPECIFIC_EXERCISE_VISUALS_EXTRA)]);
    expect(ids.size).toBeGreaterThanOrEqual(65);
  });

  it('não cria visual específico sem exercício correspondente', () => {
    const catalogIds = new Set(TITAN_FULL_EXERCISE_CATALOG.map((exercise) => exercise.id));
    const visualIds = [...Object.keys(SPECIFIC_EXERCISE_VISUALS), ...Object.keys(SPECIFIC_EXERCISE_VISUALS_EXTRA)];
    expect(visualIds.filter((id) => !catalogIds.has(id))).toEqual([]);
  });
});
