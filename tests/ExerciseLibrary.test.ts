import { describe, expect, it } from 'vitest';
import { ExerciseLibrary, TITAN_EXERCISES } from '../src/features/library';

describe('ExerciseLibrary', () => {
  it('carrega o catálogo inicial sem ids duplicados', () => {
    const library = new ExerciseLibrary();
    expect(library.findAll()).toHaveLength(6);
    expect(new Set(library.findAll().map((exercise) => exercise.id)).size).toBe(6);
  });

  it('encontra exercícios por id, slug e grupo muscular', () => {
    const library = new ExerciseLibrary();
    expect(library.findById('CHEST_001')?.name).toBe('Supino Inclinado com Barra');
    expect(library.findBySlug('elevacao-lateral-polia')?.id).toBe('SHOULDER_001');
    expect(library.findByMuscleGroup('back')).toHaveLength(2);
  });

  it('pesquisa sem diferenciar acentos ou maiúsculas', () => {
    const library = new ExerciseLibrary();
    expect(library.search('elevacao lateral').map((exercise) => exercise.id)).toEqual([
      'SHOULDER_001',
      'SHOULDER_002'
    ]);
    expect(library.search('DORSAIS')).toHaveLength(2);
  });

  it('resolve alternativas por id', () => {
    const library = new ExerciseLibrary();
    expect(library.findAlternatives('CHEST_001').map((exercise) => exercise.id)).toEqual([
      'CHEST_002'
    ]);
  });

  it('bloqueia catálogos com ids duplicados', () => {
    const duplicated = [...TITAN_EXERCISES, TITAN_EXERCISES[0]];
    expect(() => new ExerciseLibrary(duplicated)).toThrow('Exercise id duplicado: CHEST_001');
  });
});
