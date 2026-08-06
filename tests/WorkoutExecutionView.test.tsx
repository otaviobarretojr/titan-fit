import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { WorkoutExecutionView } from '../src/features/workout/WorkoutExecutionView';
import type { TitanWorkoutDay } from '../src/features/plan/types';

const workout: TitanWorkoutDay = {
  id: 'push-a',
  day: 'Segunda',
  title: 'Push A',
  exercises: [{
    id: 'bench',
    name: 'Supino máquina',
    muscleGroup: 'Peitoral',
    sets: 2,
    minReps: 8,
    maxReps: 10,
    targetRir: 2,
    restSeconds: 90
  }]
};

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('confirm', vi.fn(() => true));
});

describe('WorkoutExecutionView', () => {
  it('registra carga, repetições, RIR e conclusão por série', () => {
    render(<WorkoutExecutionView planId="plan-1" workout={workout} onBack={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 RIR'), { target: { value: '1' } });
    fireEvent.click(screen.getByLabelText('Concluir Supino máquina série 1'));

    expect(screen.getByText('1 de 2 séries concluídas')).toBeInTheDocument();
    const saved = localStorage.getItem('titan-fit:execution:plan-1:push-a');
    expect(saved).toContain('"weightKg":80');
    expect(saved).toContain('"repetitions":9');
    expect(saved).toContain('"rir":1');
    expect(saved).toContain('"completed":true');
  });

  it('inicia o descanso recomendado ao concluir a série', () => {
    render(<WorkoutExecutionView planId="plan-1" workout={workout} onBack={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Concluir Supino máquina série 1'));
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });
});
