import { describe, expect, it } from 'vitest';
import { TITAN_FULL_EXERCISE_CATALOG } from './library';
import { getCatalogExerciseVideo, getVideoCoverage } from './videoLibrary';

describe('Biblioteca TITAN em Vídeo — lotes validados', () => {
  it('mantém ao menos 105 exercícios com vídeo', () => {
    expect(getVideoCoverage(TITAN_FULL_EXERCISE_CATALOG).covered).toBeGreaterThanOrEqual(105);
  });

  it.each(['push-up','weighted-push-up','dumbbell-row','barbell-row','goblet-squat','bulgarian-split-squat','walking-lunge','barbell-hip-thrust','dumbbell-curl','hammer-curl','cable-fly','close-grip-bench','step-up','dumbbell-fly','cable-pull-through','inverted-row','hanging-leg-raise','hanging-knee-raise','concentration-curl','standing-leg-curl','dead-bug','bird-dog','side-plank','glute-bridge','good-morning','single-leg-press','bench-dip','tbar-row','nordic-curl','barbell-shrug','dumbbell-shrug','pull-up','assisted-pull-up','dumbbell-bench-press','machine-dip','cable-curl','standing-calf-raise','single-leg-calf-raise','reverse-crunch','pec-deck','wide-cable-row','cable-rear-delt-fly','bayesian-curl','cable-hip-abduction','machine-curl','front-squat','landmine-press','pendulum-squat','machine-crunch','neutral-lat-pulldown','one-arm-cable-row','cable-kickback','barbell-overhead-press','stiff-deadlift','machine-pulldown'])('%s possui vídeo mapeado', (id) => {
    const exercise = TITAN_FULL_EXERCISE_CATALOG.find((item) => item.id === id);
    expect(exercise).toBeTruthy();
    expect(exercise && getCatalogExerciseVideo(exercise)).toBeTruthy();
  });
});
