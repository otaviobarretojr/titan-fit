import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { WorkoutExecutionView } from '../src/features/workout/WorkoutExecutionView';
import type { TitanWorkoutDay } from '../src/features/plan/types';

const workout: TitanWorkoutDay = {
  id: 'push-a', day: 'Segunda', title: 'Push A',
  exercises: [{ id: 'bench', name: 'Supino máquina', muscleGroup: 'Peitoral', exerciseType: 'strength', sets: 2, minReps: 8, maxReps: 10, targetRir: 2, restSeconds: 90 }]
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal('confirm', vi.fn(() => true));
  vi.stubGlobal('scrollTo', vi.fn());
});

describe('WorkoutExecutionView video-free', () => {
  it('libera as séries imediatamente sem demonstração ou player', () => {
    render(<WorkoutExecutionView planId="plan-1" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    expect(screen.getByLabelText('Supino máquina série 1 carga')).toBeInTheDocument();
    expect(screen.getByLabelText('Supino máquina série 1 repetições')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /assistir|demonstração|vídeo/i })).not.toBeInTheDocument();
    expect(document.querySelector('iframe, video')).toBeNull();
  });

  it('inicia o cronômetro da sessão somente no primeiro registro válido', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T20:00:00.000Z'));
    render(<WorkoutExecutionView planId="plan-timer" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    expect(screen.getByText(/Tempo 00:00/i)).toBeInTheDocument();
    act(() => {
      vi.setSystemTime(new Date('2026-08-17T20:05:00.000Z'));
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/Tempo 00:00/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    act(() => {
      vi.setSystemTime(new Date('2026-08-17T20:05:10.000Z'));
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/Tempo 00:10/i)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('registra repetições e peso por série', () => {
    render(<WorkoutExecutionView planId="plan-1" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    expect(screen.getByText(/1 séries feitas · 1\s*\/\s*2 resolvidas · Tempo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Volume 720 kg/i)).not.toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    const saved = localStorage.getItem('titan-fit:execution:plan-1:push-a');
    expect(saved).toContain('"weightKg":80');
    expect(saved).toContain('"repetitions":9');
    expect(saved).toContain('"rir":null');
    expect(saved).toContain('"completed":true');
  });

  it('exige dados executados antes de registrar uma série', () => {
    render(<WorkoutExecutionView planId="plan-required" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    const register = screen.getAllByRole('button', { name: 'Registrar série' })[0];
    expect(screen.queryByLabelText('Supino máquina série 1 RIR')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Supino máquina série 1 repetições')).toBeInTheDocument();
    expect(register).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    expect(register).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '8' } });
    expect(register).toBeEnabled();
  });

  it('inicia o descanso automaticamente após concluir a série', () => {
    render(<WorkoutExecutionView planId="plan-rest" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    expect(screen.getByText('DESCANSO AUTOMÁTICO')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('registra volume total e conclui somente após todas as séries', () => {
    const onCompleted = vi.fn();
    render(<WorkoutExecutionView planId="plan-complete" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={onCompleted} />);
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 2 repetições'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 2 carga'), { target: { value: '82.5' } });
    const buttons = screen.getAllByRole('button', { name: 'Registrar série' });
    fireEvent.click(buttons[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Concluir e salvar treino' }));
    expect(screen.getByText('TREINO CONCLUÍDO')).toBeInTheDocument();
    expect(screen.getByText('1.460 kg')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver progresso' }));
    expect(onCompleted).toHaveBeenCalledTimes(1);
    const history = localStorage.getItem('titan-fit:workout-history');
    expect(history).toContain('"workoutTitle":"Push A"');
    expect(history).toContain('"totalVolumeKg":1460');
  });

  it('permite pular exercício mantendo séries já registradas', () => {
    render(<WorkoutExecutionView planId="plan-skip" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Pular exercício' }));
    expect(screen.getByText('PULADO NESTA SESSÃO')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir e salvar treino' })).toBeEnabled();
  });
});
