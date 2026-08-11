import { describe, expect, it } from 'vitest';
import { createCoachReport, createUnifiedCoachReport } from '../src/features/coach/engine';
import type { WorkoutHistoryRecord } from '../src/features/history/types';

const now = new Date('2026-08-10T12:00:00');

function workout(id: string, completedAt: string): WorkoutHistoryRecord {
  return {
    id, planId: 'plan-1', planName: 'Plano', workoutId: id, workoutTitle: id, workoutDay: 'Segunda',
    startedAt: completedAt, completedAt, durationSeconds: 3600, totalSets: 0, totalVolumeKg: 0, exercises: [],
  };
}

describe('Coach TITAN 1.0', () => {
  it('preserva compatibilidade com o relatório baseado apenas em treino', () => {
    const report = createCoachReport([], now);
    expect(report.score.training).toBe(0);
    expect(report.score.recovery).toBeNull();
    expect(report.score.evolution).toBeNull();
    expect(report.availablePillars).toBe(0);
  });

  it('cruza recuperação e evolução sem penalizar o treino ausente', () => {
    const report = createUnifiedCoachReport({
      workouts: [],
      healthSamples: [{ id: 'sleep-1', type: 'sleep', startedAt: '2026-08-10T06:00:00', value: 8, unit: 'h' }],
      bodyEntries: [{ id: 'body-1', recordedAt: '2026-08-09T08:00:00', weightKg: 92 }],
    }, now);
    expect(report.score.recovery).toBe(100);
    expect(report.score.evolution).toBe(25);
    expect(report.score.total).toBe(63);
    expect(report.availablePillars).toBe(2);
    expect(report.insights.some((item) => item.id === 'sleep-on-track')).toBe(true);
  });

  it('não inclui recuperação na média quando não existem dados de sono', () => {
    const report = createUnifiedCoachReport({ workouts: [] }, now);
    expect(report.score.recovery).toBeNull();
    expect(report.insights.some((item) => item.id === 'recovery-data-missing')).toBe(true);
  });

  it('prioriza alerta de recuperação quando é o pior pilar disponível', () => {
    const report = createUnifiedCoachReport({
      workouts: [workout('w1', '2026-08-10T10:00:00'), workout('w2', '2026-08-08T10:00:00'), workout('w3', '2026-08-06T10:00:00')],
      healthSamples: [{ id: 'sleep-1', type: 'sleep', startedAt: '2026-08-10T06:00:00', value: 5, unit: 'h' }],
      bodyEntries: [{ id: 'b1', recordedAt: '2026-08-10T08:00:00', weightKg: 92 }],
    }, now);
    expect(report.score.training).toBe(75);
    expect(report.score.recovery).toBeLessThan(report.score.training!);
    expect(report.priority.id).toBe('sleep-review');
    expect(report.priority.pillar).toBe('recovery');
  });
});
