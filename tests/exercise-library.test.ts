import { describe, expect, it } from 'vitest';
import { InMemoryExerciseRepository, TITAN_EXERCISES, exerciseLibrary } from '../src/modules/library';

describe('Biblioteca TITAN', () => {
  it('carrega os seis exercícios prioritários iniciais', () => {
    expect(exerciseLibrary.findAll()).toHaveLength(6);
  });

  it('encontra exercício por código e slug', () => {
    expect(exerciseLibrary.findByCode('CHEST_001')?.name).toBe('Supino inclinado com barra');
    expect(exerciseLibrary.findBySlug('elevacao-lateral-polia')?.code).toBe('SHOULDER_001');
  });

  it('pesquisa ignorando acentos e caixa', () => {
    expect(exerciseLibrary.search('elevacao lateral')).toHaveLength(2);
    expect(exerciseLibrary.search('DORSAIS').map((exercise) => exercise.code)).toEqual(
      expect.arrayContaining(['BACK_001', 'BACK_002'])
    );
  });

  it('filtra por grupo muscular e equipamento', () => {
    expect(exerciseLibrary.findByMuscleGroup('chest')).toHaveLength(2);
    expect(exerciseLibrary.findByEquipment('machine').map((exercise) => exercise.code)).toEqual(
      expect.arrayContaining(['BACK_001', 'BACK_002', 'SHOULDER_002'])
    );
  });

  it('resolve alternativas cadastradas', () => {
    expect(exerciseLibrary.findAlternatives('CHEST_001').map((exercise) => exercise.code)).toEqual(['CHEST_002']);
  });

  it('rejeita códigos duplicados', () => {
    expect(() => new InMemoryExerciseRepository([...TITAN_EXERCISES, TITAN_EXERCISES[0]])).toThrow(
      'Código de exercício duplicado: CHEST_001'
    );
  });
});
