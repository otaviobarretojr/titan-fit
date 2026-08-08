import { beforeEach, describe, expect, it } from 'vitest';
import { loadWorkoutExecution } from '../src/features/workout/storage';
import type { WorkoutExecution } from '../src/features/workout/types';

const execution: WorkoutExecution = {
  planId: 'plan-1',
  workoutId: 'push-a',
  startedAt: '2026-08-08T20:00:00.000Z',
  updatedAt: '2026-08-08T20:05:00.000Z',
  exercises: {},
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('persistência da sessão ativa', () => {
  it('recupera a sessão pelo fallback da aba quando o localStorage não tem a sessão', () => {
    sessionStorage.setItem('titan-fit:execution-fallback:plan-1:push-a', JSON.stringify(execution));

    expect(loadWorkoutExecution('plan-1', 'push-a')).toEqual(execution);
    expect(localStorage.getItem('titan-fit:execution:plan-1:push-a')).toBe(JSON.stringify(execution));
  });

  it('prioriza a cópia persistente quando ela existe', () => {
    const persistent = { ...execution, updatedAt: '2026-08-08T20:10:00.000Z' };
    localStorage.setItem('titan-fit:execution:plan-1:push-a', JSON.stringify(persistent));
    sessionStorage.setItem('titan-fit:execution-fallback:plan-1:push-a', JSON.stringify(execution));

    expect(loadWorkoutExecution('plan-1', 'push-a')).toEqual(persistent);
  });
});
