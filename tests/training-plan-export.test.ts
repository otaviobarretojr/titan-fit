import { describe, expect, it } from 'vitest';
import { buildTrainingExportFilename, serializeTrainingPlan } from '../src/features/programming/trainingPlanExport';
import type { TitanPlan } from '../src/features/plan/types';

describe('training plan export', () => {
  const plan: TitanPlan = {
    schemaVersion: 1,
    id: 'projeto-titan-atual',
    name: 'Projeto TITAN Atual',
    createdAt: '2026-08-15T12:00:00.000Z',
    workouts: [{ id: 'push-a', day: 'Segunda', title: 'Push A', exercises: [] }]
  };

  it('exporta o próprio TitanPlan sem embrulhar histórico ou dados paralelos', () => {
    const parsed = JSON.parse(serializeTrainingPlan(plan));
    expect(parsed.id).toBe(plan.id);
    expect(parsed.workouts).toEqual(plan.workouts);
    expect(parsed.history).toBeUndefined();
    expect(parsed.health).toBeUndefined();
    expect(parsed.photos).toBeUndefined();
  });

  it('gera nome de arquivo identificável e datado', () => {
    expect(buildTrainingExportFilename(plan, new Date('2026-08-15T12:00:00Z'))).toBe('TITAN-TREINO-projeto-titan-atual-2026-08-15.json');
  });
});
