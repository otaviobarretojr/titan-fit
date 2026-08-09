import { describe, expect, it } from 'vitest';
import { EXERCISE_VIDEO_REGISTRY } from '../src/features/exercise-library/videoRegistry';

const REQUIRED = [
  'dumbbell-lateral-raise','cable-lateral-raise','arnold-press',
  'barbell-curl','ez-bar-curl','preacher-curl','incline-dumbbell-curl','rope-hammer-curl',
  'skull-crusher','dumbbell-overhead-extension','single-arm-pushdown','rope-pushdown','overhead-cable-extension',
];

describe('video batch shoulders and arms', () => {
  it('mantém cobertura dos principais exercícios do lote', () => {
    for (const id of REQUIRED) expect(EXERCISE_VIDEO_REGISTRY[id]).toBeTruthy();
  });

  it('leva a biblioteca para pelo menos 37 vídeos curados', () => {
    expect(Object.keys(EXERCISE_VIDEO_REGISTRY).length).toBeGreaterThanOrEqual(37);
  });
});
