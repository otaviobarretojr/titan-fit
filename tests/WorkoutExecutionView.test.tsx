import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { WorkoutExecutionView } from '../src/features/workout/WorkoutExecutionView';
import type { TitanWorkoutDay } from '../src/features/plan/types';

const workout: TitanWorkoutDay = {
  id: 'push-a', day: 'Segunda', title: 'Push A',
  exercises: [{ id: 'bench', name: 'Supino máquina', muscleGroup: 'Peitoral', exerciseType: 'strength', sets: 2, minReps: 8, maxReps: 10, targetRir: 2, restSeconds: 90 }]
};

function unlockVideoIfPresent() {
  const skip = screen.queryByRole('button', { name: 'Pular demonstração' });
  if (skip) fireEvent.click(skip);
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal('confirm', vi.fn(() => true));
  vi.stubGlobal('scrollTo', vi.fn());
});

describe('WorkoutExecutionView', () => {
  it('exibe a demonstração cadastrada antes de liberar as séries', () => {
    render(<WorkoutExecutionView planId="plan-1" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    expect(screen.getByTitle('Chest press convergente — execução')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Já assisti · começar séries' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Supino máquina série 1 carga')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Já assisti · começar séries' }));
    expect(screen.getByLabelText('Supino máquina série 1 carga')).toBeInTheDocument();
  });

  it('registra carga, repetições e RIR mantendo o cabeçalho compacto', () => {
    render(<WorkoutExecutionView planId="plan-1" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    unlockVideoIfPresent();

    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '9' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 RIR'), { target: { value: '1' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);

    expect(screen.getByText(/1 séries feitas · 1\s*\/\s*2 resolvidas · Tempo/i)).toBeInTheDocument();
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
    unlockVideoIfPresent();
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    expect(screen.getByText('DESCANSO AUTOMÁTICO')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('permite pular exercício sem criar volume ou PR falso', () => {
    render(<WorkoutExecutionView planId="plan-skip" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    unlockVideoIfPresent();
    fireEvent.click(screen.getByRole('button', { name: 'Pular exercício' }));

    expect(screen.getByText('PULADO NESTA SESSÃO')).toBeInTheDocument();
    expect(screen.getByText('Exercício pulado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir e salvar treino' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Concluir e salvar treino' }));
    expect(screen.getByText('TREINO CONCLUÍDO')).toBeInTheDocument();
    const history = localStorage.getItem('titan-fit:history:v1');
    expect(history).toContain('"totalVolumeKg":0');
    expect(history).toContain('"exercises":[]');
  });

  it('trata cardio como etapa do treino e usa a ação Registrar cardio', () => {
    const cardioWorkout: TitanWorkoutDay = {
      id: 'mixed', day: 'Segunda', title: 'Treino + cardio',
      exercises: [{ id: 'zone2', name: 'Zona 2', muscleGroup: 'Cardiovascular', exerciseType: 'cardio', sets: 1, durationSeconds: 1800, cardioZone: 'Zona 2' }]
    };
    render(<WorkoutExecutionView planId="plan-cardio" planName="Plano A" workout={cardioWorkout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Registrar cardio' })).toBeInTheDocument();
    expect(screen.getByLabelText('Zona 2 duração em minutos')).toHaveValue(30);
    expect(screen.getByLabelText('Zona 2 zona realizada')).toHaveValue('Zona 2');
    expect(screen.getByLabelText('Zona 2 RPE')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Zona 2 série 1 distância'), { target: { value: '5000' } });
    expect(screen.getByText(/10.0 km\/h/)).toBeInTheDocument();
    expect(screen.queryByText('Pular exercício · sem tempo')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pular exercício' })).toBeInTheDocument();
  });

  it('troca para uma alternativa oficial e exibe o vídeo próprio dela', () => {
    const workoutWithAlternative: TitanWorkoutDay = {
      ...workout,
      exercises: [{
        ...workout.exercises[0],
        id: 'chest-press-machine',
        technique: 'Técnica principal',
        alternativeExercises: [{ id: 'bench-press', name: 'Supino reto com barra', muscleGroup: 'Peitoral', exerciseType: 'strength', sets: 2, minReps: 5, maxReps: 10, targetRir: 2, restSeconds: 150, technique: 'Técnica da alternativa' }],
      }],
    };
    render(<WorkoutExecutionView planId="plan-alt" planName="Plano A" workout={workoutWithAlternative} onBack={vi.fn()} onCompleted={vi.fn()} />);
    unlockVideoIfPresent();
    fireEvent.click(screen.getByText('Trocar'));
    fireEvent.click(screen.getByRole('button', { name: /Alternativa Supino reto com barra/i }));
    expect(screen.getByText('Alternativa selecionada · histórico próprio')).toBeInTheDocument();
    expect(screen.getByTitle('Supino reto com barra — execução')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Já assisti · começar séries' })).toBeInTheDocument();
    expect(screen.getByText('Técnica da alternativa')).toBeInTheDocument();
    expect(screen.queryByText('Técnica principal')).not.toBeInTheDocument();
  });

  it('salva o histórico e apresenta o resumo final', () => {
    const onCompleted = vi.fn();
    render(<WorkoutExecutionView planId="plan-1" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={onCompleted} />);
    unlockVideoIfPresent();

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
