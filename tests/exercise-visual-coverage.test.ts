import { describe, expect, it } from 'vitest';
import { TITAN_FULL_EXERCISE_CATALOG } from '../src/features/exercise-library/library';
import { TITAN_EXERCISE_VISUALS, TITAN_VISUAL_COVERAGE_COUNT } from '../src/features/exercise-library/visualRegistry';

describe('TITAN complete visual coverage', () => {
  it('possui visual para 100% dos exercícios cadastrados', () => {
    expect(TITAN_VISUAL_COVERAGE_COUNT).toBe(TITAN_FULL_EXERCISE_CATALOG.length);
    TITAN_FULL_EXERCISE_CATALOG.forEach((exercise) => expect(TITAN_EXERCISE_VISUALS[exercise.id]).toBeDefined());
  });

  it('mantém IDs do registro visual alinhados ao catálogo', () => {
    const ids = new Set(TITAN_FULL_EXERCISE_CATALOG.map((exercise) => exercise.id));
    Object.keys(TITAN_EXERCISE_VISUALS).forEach((id) => expect(ids.has(id)).toBe(true));
  });

  it('cada visual possui conteúdo suficiente para renderização e orientação', () => {
    Object.values(TITAN_EXERCISE_VISUALS).forEach((visual) => {
      expect(visual.label.length).toBeGreaterThan(2);
      expect(visual.cue.length).toBeGreaterThan(10);
      expect(visual.bodyPath.length).toBeGreaterThan(3);
      expect(visual.armPath.length).toBeGreaterThan(3);
      expect(visual.legPath.length).toBeGreaterThan(3);
      expect(visual.motionPath.length).toBeGreaterThan(3);
    });
  });
});
