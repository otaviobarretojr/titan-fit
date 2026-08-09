import { describe, expect, it } from 'vitest';
import { SPECIFIC_EXERCISE_VISUALS, SPECIFIC_VISUAL_COUNT } from '../src/features/exercise-library/specificVisuals';

describe('TITAN specific exercise visuals', () => {
  it('mantém cobertura específica ampla', () => {
    expect(SPECIFIC_VISUAL_COUNT).toBeGreaterThanOrEqual(40);
  });

  it('cobre exercícios relevantes de todos os grandes grupos', () => {
    const required = [
      'bench-press','lat-pulldown','dumbbell-shoulder-press','barbell-squat',
      'romanian-deadlift','barbell-hip-thrust','barbell-curl','rope-pushdown',
      'standing-calf-raise','plank',
    ];
    required.forEach((id) => expect(SPECIFIC_EXERCISE_VISUALS[id]).toBeDefined());
  });

  it('cada visual específico possui direção de movimento e instrução', () => {
    Object.values(SPECIFIC_EXERCISE_VISUALS).forEach((visual) => {
      expect(visual.label.length).toBeGreaterThan(2);
      expect(visual.cue.length).toBeGreaterThan(10);
      expect(visual.motionPath.length).toBeGreaterThan(3);
    });
  });
});
