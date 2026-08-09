import { describe, expect, it } from 'vitest';
import { TITAN_FULL_EXERCISE_CATALOG } from '../src/features/exercise-library/library';
import { SPECIFIC_EXERCISE_VISUALS_BATCH3 } from '../src/features/exercise-library/specificVisualsBatch3';

describe('TITAN visual coverage batch 3', () => {
  it('adiciona um lote amplo de visuais específicos', () => {
    expect(Object.keys(SPECIFIC_EXERCISE_VISUALS_BATCH3).length).toBeGreaterThanOrEqual(30);
  });

  it('não cria visual para exercício inexistente', () => {
    const catalogIds = new Set(TITAN_FULL_EXERCISE_CATALOG.map((exercise) => exercise.id));
    Object.keys(SPECIFIC_EXERCISE_VISUALS_BATCH3).forEach((id) => expect(catalogIds.has(id)).toBe(true));
  });

  it('mantém instrução e direção de movimento em todos os novos visuais', () => {
    Object.values(SPECIFIC_EXERCISE_VISUALS_BATCH3).forEach((visual) => {
      expect(visual.label.length).toBeGreaterThan(2);
      expect(visual.cue.length).toBeGreaterThan(10);
      expect(visual.motionPath.length).toBeGreaterThan(3);
    });
  });
});
