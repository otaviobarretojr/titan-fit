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

describe('ProgressPage v0.21', () => {
  it('abre o centro de evolução física e preserva inteligência do treino', () => {
    render(<ProgressPage refreshKey={0} />);
    expect(screen.getByText('Seu físico ao longo do tempo')).toBeInTheDocument();
    expect(screen.getByText('Peso atual')).toBeInTheDocument();
    expect(screen.getByText('Novo registro físico', { exact: false })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Treino' }));
    expect(screen.getByText('Inteligência do treino')).toBeInTheDocument();
    expect(screen.getByText('Recuperação estimada')).toBeInTheDocument();
    expect(screen.getByText('Supino máquina')).toBeInTheDocument();
    expect(screen.getByText(/🏆 Carga: 82.5 kg/)).toBeInTheDocument();
    expect(screen.getByText('COACH TITAN')).toBeInTheDocument();
    expect(screen.getByText('1.5 t')).toBeInTheDocument();
    expect(screen.getByText('Push A')).toBeInTheDocument();
  });
});
