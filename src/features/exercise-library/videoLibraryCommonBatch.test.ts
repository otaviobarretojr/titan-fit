import { describe, expect, it } from 'vitest';
import { TITAN_FULL_EXERCISE_CATALOG } from './library';
import { getCatalogExerciseVideo, getVideoCoverage } from './videoLibrary';

describe('Biblioteca TITAN em Vídeo — cobertura total validada', () => {
  it('mantém todos os 116 exercícios com vídeo', () => {
    const coverage = getVideoCoverage(TITAN_FULL_EXERCISE_CATALOG);
    expect(coverage.total).toBe(116);
    expect(coverage.covered).toBe(116);
    expect(coverage.pending).toBe(0);
    expect(coverage.percentage).toBe(100);
  });

  it('não deixa exercício do catálogo sem vídeo', () => {
    const missing = TITAN_FULL_EXERCISE_CATALOG.filter((exercise) => !getCatalogExerciseVideo(exercise));
    expect(missing).toEqual([]);
  });
});
