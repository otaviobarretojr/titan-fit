import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach } from 'vitest';
import { ProgressPage } from '../src/features/history/ProgressPage';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('titan-fit:history:v1', JSON.stringify([{
    id: 'record-1', planId: 'plan-1', planName: 'Plano A', workoutId: 'push-a', workoutTitle: 'Push A', workoutDay: 'Segunda', startedAt: '2026-08-06T20:00:00.000Z', completedAt: '2026-08-06T21:00:00.000Z', durationSeconds: 3600, totalSets: 2, totalVolumeKg: 1460,
    exercises: [{ exerciseId: 'bench', name: 'Supino máquina', muscleGroup: 'Peitoral', exerciseType: 'strength', volumeKg: 1460, bestWeightKg: 82.5, totalDistanceMeters: 0, totalDurationSeconds: 0, bestSpeedKmh: null, bestInclinePercent: null, averageHeartRate: null,
      sets: [{ setNumber: 1, weightKg: 80, repetitions: 10, rir: 1, durationSeconds: null, distanceMeters: null, speedKmh: null, inclinePercent: null, averagePace: null, averageHeartRate: null, calories: null, notes: null }, { setNumber: 2, weightKg: 82.5, repetitions: 8, rir: 1, durationSeconds: null, distanceMeters: null, speedKmh: null, inclinePercent: null, averagePace: null, averageHeartRate: null, calories: null, notes: null }]
    }]
  }]));
});

describe('ProgressPage v0.26.1', () => {
  it('mantém evolução corporal e transforma treino em Hall dos PRs', () => {
    render(<ProgressPage refreshKey={0} />);
    expect(screen.getByText('Seu corpo hoje')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Treino' }));

    expect(screen.getByRole('heading', { name: 'PRs conquistados' })).toBeInTheDocument();
    expect(screen.getByText('Peito')).toBeInTheDocument();
    expect(screen.queryByText('Recuperação estimada')).not.toBeInTheDocument();
    expect(screen.queryByText('Treinos concluídos')).not.toBeInTheDocument();
    expect(screen.queryByText('Inteligência do treino')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Peito/i }));
    expect(screen.getByText('Supino máquina')).toBeInTheDocument();
    expect(screen.getByText('80 kg × 10')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Supino máquina/i }));
    expect(screen.getByText('Últimas referências')).toBeInTheDocument();
    expect(screen.getByText(/06 de ago|06 ago|06 de ago\./i)).toBeInTheDocument();
  });
});
