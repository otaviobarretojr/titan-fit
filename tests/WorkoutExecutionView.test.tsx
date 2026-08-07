import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { WorkoutExecutionView } from '../src/features/workout/WorkoutExecutionView';
import type { TitanWorkoutDay } from '../src/features/plan/types';

const workout: TitanWorkoutDay = {
  id: 'push-a', day: 'Segunda', title: 'Push A',
  exercises: [{ id: 'bench', name: 'Supino máquina', muscleGroup: 'Peitoral', exerciseType: 'strength', sets: 2, minReps: 8, maxReps: 10, targetRir: 2, restSeconds: 90 }]
};

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('confirm', vi.fn(() => true));
  vi.stubGlobal('scrollTo', vi.fn());
});

describe('WorkoutExecutionView v0.19', () => {
  it('registra carga, repetições e RIR mantendo o cabeçalho compacto', () => {
    render(<WorkoutExecutionView planId="plan-1" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 RIR'), { target: { value: '1' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);

    expect(screen.getByText(/1\s*\/\s*2 concluídos · Tempo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Volume 720 kg/i)).not.toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    const saved = localStorage.getItem('titan-fit:execution:plan-1:push-a');
    expect(saved).toContain('"weightKg":80');
    expect(saved).toContain('"repetitions":9');
    expect(saved).toContain('"rir":1');
    expect(saved).toContain('"completed":true');
  });

  it('inicia o descanso automático ao registrar a série', () => {
    render(<WorkoutExecutionView planId="plan-1" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    expect(screen.getByText('DESCANSO AUTOMÁTICO')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('salva o histórico e apresenta o resumo final', () => {
    const onCompleted = vi.fn();
    render(<WorkoutExecutionView planId="plan-1" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={onCompleted} />);

    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 2 carga'), { target: { value: '82.5' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 2 repetições'), { target: { value: '8' } });

    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Concluir e salvar treino' }));

    expect(screen.getByText('TREINO CONCLUÍDO')).toBeInTheDocument();
    expect(screen.getByText('1.460 kg')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    const history = localStorage.getItem('titan-fit:history:v1');
    expect(history).toContain('"workoutTitle":"Push A"');
    expect(history).toContain('"totalVolumeKg":1460');
    expect(history).toContain('"bestWeightKg":82.5');
    expect(localStorage.getItem('titan-fit:execution:plan-1:push-a')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Ver progresso' }));
    expect(onCompleted).toHaveBeenCalledOnce();
  });
});
