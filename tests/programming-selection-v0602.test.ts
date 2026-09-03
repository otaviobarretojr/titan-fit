import { describe, expect, it } from 'vitest';
import { fixedTitanRoutine } from '../src/features/plan/fixedTitanRoutine';
import { getScheduledWorkout, isScheduledRestDay } from '../src/features/programming/fixedSchedule';

describe('fixed TITAN weekly routine', () => {
  it('maps Monday through Friday to the programmed sessions', () => {
    expect(getScheduledWorkout(fixedTitanRoutine, new Date('2026-09-07T12:00:00'))?.title).toBe('PUSH');
    expect(getScheduledWorkout(fixedTitanRoutine, new Date('2026-09-08T12:00:00'))?.title).toBe('PULL');
    expect(getScheduledWorkout(fixedTitanRoutine, new Date('2026-09-09T12:00:00'))?.title).toBe('LEGS A');
    expect(getScheduledWorkout(fixedTitanRoutine, new Date('2026-09-10T12:00:00'))?.title).toBe('OMBROS + CORE');
    expect(getScheduledWorkout(fixedTitanRoutine, new Date('2026-09-11T12:00:00'))?.title).toBe('UPPER ESPECIALIZAÇÃO');
  });

  it('locks Saturday as recovery', () => {
    const saturday = new Date('2026-09-12T12:00:00');
    expect(isScheduledRestDay(saturday)).toBe(true);
    expect(getScheduledWorkout(fixedTitanRoutine, saturday)).toBeNull();
  });

  it('returns LEGS B on Sunday', () => {
    expect(getScheduledWorkout(fixedTitanRoutine, new Date('2026-09-13T12:00:00'))?.title).toBe('LEGS B');
  });

  it('contains the requested specialization priorities', () => {
    const text = fixedTitanRoutine.workouts.flatMap((w) => w.exercises).map((e) => `${e.name} ${e.muscleGroup}`).join(' ').toLowerCase();
    expect(text).toContain('deltoide lateral');
    expect(text).toContain('panturrilha');
    expect(text).toContain('antebraço');
    expect(text).toContain('punho');
    expect(text).toContain('core');
  });
});
