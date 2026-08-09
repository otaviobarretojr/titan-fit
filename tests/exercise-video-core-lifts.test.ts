import { describe, expect, it } from 'vitest';
import { EXERCISE_VIDEO_REGISTRY } from '../src/features/exercise-library/videoRegistry';

const REQUIRED = [
  'bench-press',
  'cable-chest-press',
  'dumbbell-shoulder-press',
  'barbell-squat',
  'romanian-deadlift',
  'conventional-deadlift',
  'plank',
];

describe('video batch fundamental lifts', () => {
  it('mantém vídeos dos movimentos fundamentais', () => {
    for (const id of REQUIRED) expect(EXERCISE_VIDEO_REGISTRY[id]).toBeTruthy();
  });

  it('leva a biblioteca para pelo menos 50 vídeos curados', () => {
    expect(Object.keys(EXERCISE_VIDEO_REGISTRY).length).toBeGreaterThanOrEqual(50);
  });
});
