import { describe, expect, it } from 'vitest';
import { EXERCISE_VIDEO_REGISTRY } from '../src/features/exercise-library/videoRegistry';

const REQUIRED = [
  'hack-squat','leg-press','leg-extension','seated-leg-curl',
  'lying-leg-curl','single-leg-curl','machine-hip-thrust',
];

describe('video batch legs and glutes', () => {
  it('mantém cobertura dos principais exercícios de pernas e glúteos', () => {
    for (const id of REQUIRED) expect(EXERCISE_VIDEO_REGISTRY[id]).toBeTruthy();
  });

  it('leva a biblioteca para pelo menos 42 vídeos curados', () => {
    expect(Object.keys(EXERCISE_VIDEO_REGISTRY).length).toBeGreaterThanOrEqual(42);
  });
});
