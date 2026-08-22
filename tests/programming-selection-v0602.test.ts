import { beforeEach, describe, expect, it } from 'vitest';
import type { TitanPlan } from '../src/features/plan/types';
import type { WorkoutHistoryRecord } from '../src/features/history/types';
import { getWorkoutsForChoice, loadTrainingChoice, resolveSelectedWorkout, saveTrainingChoice } from '../src/features/programming/activeWorkoutSelection';

const plan: TitanPlan = {
  schemaVersion: 1,
  id: 'ppl-test',
  name: 'PPL Test',
  createdAt: '2026-08-21T00:00:00.000Z',
  workouts: [
    { id: 'pull-a', day: 'Domingo', title: 'PULL A', exercises: [{ id:'row', name:'Remada', muscleGroup:'Costas', exerciseType:'strength', sets:3, minReps:8, maxReps:12 }] },
    { id: 'push-a', day: 'Segunda', title: 'PUSH A', exercises: [{ id:'press', name:'Supino', muscleGroup:'Peito', exerciseType:'strength', sets:3, minReps:8, maxReps:12 }] },
    { id: 'legs-a', day: 'Terça', title: 'LEGS A', exercises: [{ id:'leg', name:'Leg press', muscleGroup:'Quadríceps', exerciseType:'strength', sets:3, minReps:8, maxReps:12 }] },
    { id: 'pull-b', day: 'Quarta', title: 'PULL B', exercises: [{ id:'pulldown', name:'Puxada', muscleGroup:'Costas', exerciseType:'strength', sets:3, minReps:8, maxReps:12 }] },
  ]
};

beforeEach(() => localStorage.clear());

describe('manual programming selection', () => {
  it('persists the selected workout type', () => {
    saveTrainingChoice('legs');
    expect(loadTrainingChoice()).toBe('legs');
  });

  it('groups PULL/PUSH/LEGS independently from weekdays', () => {
    expect(getWorkoutsForChoice(plan, 'pull').map((w) => w.id)).toEqual(['pull-a', 'pull-b']);
    expect(getWorkoutsForChoice(plan, 'push').map((w) => w.id)).toEqual(['push-a']);
    expect(getWorkoutsForChoice(plan, 'legs').map((w) => w.id)).toEqual(['legs-a']);
  });

  it('starts at A and advances to B after the last completed workout of the same type', () => {
    expect(resolveSelectedWorkout(plan, [], 'pull')?.id).toBe('pull-a');
    const history = [{ planId:'ppl-test', workoutId:'pull-a', completedAt:'2026-08-20T20:00:00.000Z' }] as WorkoutHistoryRecord[];
    expect(resolveSelectedWorkout(plan, history, 'pull')?.id).toBe('pull-b');
  });

  it('returns no workout when rest is active', () => {
    expect(resolveSelectedWorkout(plan, [], 'rest')).toBeNull();
  });
});
