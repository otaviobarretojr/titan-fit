import { describe, expect, it } from 'vitest';
import { TITAN_FULL_EXERCISE_CATALOG } from './library';
import { getCatalogExerciseVideo, getVideoCoverage } from './videoLibrary';

describe('Biblioteca TITAN em Vídeo — lote comum', () => {
  it('mantém ao menos 61 exercícios com vídeo', () => {
    expect(getVideoCoverage(TITAN_FULL_EXERCISE_CATALOG).covered).toBeGreaterThanOrEqual(61);
  });

  it.each(['push-up','weighted-push-up','dumbbell-row','barbell-row','goblet-squat','bulgarian-split-squat','walking-lunge','barbell-hip-thrust','dumbbell-curl','hammer-curl','cable-fly'])('%s possui vídeo mapeado', (id) => {
    const exercise = TITAN_FULL_EXERCISE_CATALOG.find((item) => item.id === id);
    expect(exercise).toBeTruthy();
    expect(exercise && getCatalogExerciseVideo(exercise)).toBeTruthy();
  });
});
