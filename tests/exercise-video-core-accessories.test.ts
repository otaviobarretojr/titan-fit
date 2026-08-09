import { describe, expect, it } from 'vitest';
import { EXERCISE_VIDEO_REGISTRY } from '../src/features/exercise-library/videoRegistry';

const REQUIRED = [
  'leg-press-calf-raise','smith-calf-raise','seated-calf-raise',
  'pallof-press','ab-wheel',
  'reverse-wrist-curl','reverse-curl','farmers-walk','machine-shrug',
];

describe('video batch core and accessories', () => {
  it('mantém cobertura dos principais exercícios acessórios', () => {
    for (const id of REQUIRED) expect(EXERCISE_VIDEO_REGISTRY[id]).toBeTruthy();
  });

  it('leva a biblioteca para pelo menos 43 vídeos curados', () => {
    expect(Object.keys(EXERCISE_VIDEO_REGISTRY).length).toBeGreaterThanOrEqual(43);
  });
});
