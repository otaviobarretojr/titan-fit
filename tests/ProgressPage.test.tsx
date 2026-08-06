import { render, screen } from '@testing-library/react';
import { beforeEach } from 'vitest';
import { ProgressPage } from '../src/features/history/ProgressPage';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('titan-fit:history:v1', JSON.stringify([{
    id: 'record-1',
    planId: 'plan-1',
    planName: 'Plano A',
    workoutId: 'push-a',
    workoutTitle: 'Push A',
    workoutDay: 'Segunda',
    startedAt: '2026-08-06T20:00:00.000Z',
    completedAt: '2026-08-06T21:00:00.000Z',
    durationSeconds: 3600,
    totalSets: 2,
    totalVolumeKg: 1460,
    exercises: [{
      exerciseId: 'bench',
      name: 'Supino máquina',
      muscleGroup: 'Peitoral',
      volumeKg: 1460,
      bestWeightKg: 82.5,
      sets: [
        { setNumber: 1, weightKg: 80, repetitions: 10, rir: 1 },
        { setNumber: 2, weightKg: 82.5, repetitions: 8, rir: 1 }
      ]
    }]
  }]));
});

describe('ProgressPage', () => {
  it('mostra resumo, melhor carga e treino concluído', () => {
    render(<ProgressPage refreshKey={0} />);
    expect(screen.getByText('Seu histórico')).toBeInTheDocument();
    expect(screen.getByText('Supino máquina')).toBeInTheDocument();
    expect(screen.getByText('82.5 kg')).toBeInTheDocument();
    expect(screen.getByText('1.5 t')).toBeInTheDocument();
    expect(screen.getByText('Push A')).toBeInTheDocument();
  });
});
