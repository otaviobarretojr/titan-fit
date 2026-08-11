import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach } from 'vitest';
import { ProgressPage } from '../src/features/history/ProgressPage';

function strengthRecord(id: string, completedAt: string, weightKg: number, repetitions: number) {
  return {
    id,
    planId: 'plan-1',
    planName: 'Plano A',
    workoutId: 'push-a',
    workoutTitle: 'Push A',
    workoutDay: 'Segunda',
    startedAt: completedAt,
    completedAt,
    durationSeconds: 3600,
    totalSets: 1,
    totalVolumeKg: weightKg * repetitions,
    exercises: [{
      exerciseId: 'bench',
      name: 'Supino máquina',
      muscleGroup: 'Peitoral',
      exerciseType: 'strength',
      volumeKg: weightKg * repetitions,
      bestWeightKg: weightKg,
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      bestSpeedKmh: null,
      bestInclinePercent: null,
      averageHeartRate: null,
      sets: [{
        setNumber: 1,
        weightKg,
        repetitions,
        rir: 1,
        durationSeconds: null,
        distanceMeters: null,
        speedKmh: null,
        inclinePercent: null,
        averagePace: null,
        averageHeartRate: null,
        calories: null,
        notes: null,
      }],
    }],
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('ProgressPage v0.58.8', () => {
  it('trata a primeira execução apenas como linha de base', () => {
    localStorage.setItem('titan-fit:history:v1', JSON.stringify([
      strengthRecord('record-1', '2026-08-06T21:00:00.000Z', 80, 10),
    ]));

    render(<ProgressPage refreshKey={0} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Treino' }));

    expect(screen.getByRole('heading', { name: 'PRs conquistados' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Seu primeiro PR ainda está por vir' })).toBeInTheDocument();
    expect(screen.queryByText('Peito')).not.toBeInTheDocument();
    expect(screen.queryByText('1 PR')).not.toBeInTheDocument();
  });

  it('cria o primeiro PR somente quando uma sessão posterior supera a linha de base', () => {
    localStorage.setItem('titan-fit:history:v1', JSON.stringify([
      strengthRecord('record-1', '2026-08-06T21:00:00.000Z', 80, 10),
      strengthRecord('record-2', '2026-08-13T21:00:00.000Z', 82.5, 10),
    ]));

    render(<ProgressPage refreshKey={0} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Treino' }));

    expect(screen.getByText('Peito')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Peito/i }));
    expect(screen.getAllByText('Supino máquina').length).toBeGreaterThan(0);
    expect(screen.getByText('82.5 kg × 10')).toBeInTheDocument();
    expect(screen.getByText('1 conquista')).toBeInTheDocument();
    expect(screen.queryByText('80 kg × 10')).not.toBeInTheDocument();
  });
  it('mantém cardio como visão de evolução integrada, sem criar módulo isolado', () => {
    render(<ProgressPage refreshKey={0} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Cardio' }));
    expect(screen.getByRole('heading', { name: 'Evolução cardiovascular' })).toBeInTheDocument();
    expect(screen.getByText(/cardio registrado dentro dos seus treinos/i)).toBeInTheDocument();
  });
});
