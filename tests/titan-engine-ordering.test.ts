import { describe, expect, it } from 'vitest';
import { orderTitanSessionExercises, type TitanEngineExercisePrescription } from '../src/core/titan-engine';

function exercise(overrides: Partial<TitanEngineExercisePrescription> & Pick<TitanEngineExercisePrescription, 'id' | 'name' | 'primaryMuscle'>): TitanEngineExercisePrescription {
  return {
    id: overrides.id,
    name: overrides.name,
    primaryMuscle: overrides.primaryMuscle,
    movementPattern: overrides.movementPattern ?? 'horizontal-push',
    exerciseRole: overrides.exerciseRole ?? 'compound',
    stabilityDemand: overrides.stabilityDemand ?? 'medium',
    fatigueCost: overrides.fatigueCost ?? 'medium',
    tensionBias: overrides.tensionBias ?? 'unknown',
    repRange: overrides.repRange ?? [8, 12],
    defaultRir: overrides.defaultRir ?? 2,
    restSeconds: overrides.restSeconds ?? 120,
    technique: '',
    commonMistakes: [],
    substitutions: [],
    sets: overrides.sets ?? 3,
    priority: overrides.priority ?? false,
  };
}

describe('TITAN Engine — ordem da sessão', () => {
  it('coloca exercício do músculo prioritário antes dos demais', () => {
    const ordered = orderTitanSessionExercises([
      exercise({ id: 'row', name: 'Remada', primaryMuscle: 'Costas' }),
      exercise({ id: 'press', name: 'Supino', primaryMuscle: 'Peitoral', priority: true }),
    ]);
    expect(ordered[0].id).toBe('press');
  });

  it('mantém composto antes de isolador quando a prioridade é equivalente', () => {
    const ordered = orderTitanSessionExercises([
      exercise({ id: 'fly', name: 'Crucifixo', primaryMuscle: 'Peitoral', exerciseRole: 'isolation', fatigueCost: 'low', restSeconds: 90 }),
      exercise({ id: 'press', name: 'Supino', primaryMuscle: 'Peitoral', exerciseRole: 'compound', fatigueCost: 'medium', restSeconds: 120 }),
    ]);
    expect(ordered.map((item) => item.id)).toEqual(['press', 'fly']);
  });

  it('evita iniciar com dois exercícios de alto custo quando há composto equivalente menos fatigante', () => {
    const ordered = orderTitanSessionExercises([
      exercise({ id: 'squat', name: 'Agachamento', primaryMuscle: 'Quadríceps', fatigueCost: 'high', stabilityDemand: 'high', restSeconds: 180 }),
      exercise({ id: 'deadlift', name: 'Terra', primaryMuscle: 'Posteriores de coxa', movementPattern: 'hinge', fatigueCost: 'high', stabilityDemand: 'high', restSeconds: 180 }),
      exercise({ id: 'leg-press', name: 'Leg press', primaryMuscle: 'Quadríceps', fatigueCost: 'medium', stabilityDemand: 'low', restSeconds: 150 }),
    ]);
    expect(ordered[0].id).toBe('squat');
    expect(ordered[1].fatigueCost).not.toBe('high');
  });

  it('manda isoladores de baixo custo para o fim da sessão', () => {
    const ordered = orderTitanSessionExercises([
      exercise({ id: 'curl', name: 'Rosca', primaryMuscle: 'Bíceps', exerciseRole: 'isolation', fatigueCost: 'low', restSeconds: 90 }),
      exercise({ id: 'row', name: 'Remada', primaryMuscle: 'Costas', movementPattern: 'horizontal-pull', exerciseRole: 'compound', fatigueCost: 'medium', restSeconds: 120 }),
      exercise({ id: 'pulldown', name: 'Puxada', primaryMuscle: 'Dorsais', movementPattern: 'vertical-pull', exerciseRole: 'compound', fatigueCost: 'medium', restSeconds: 120 }),
    ]);
    expect(ordered.at(-1)?.id).toBe('curl');
  });
});
