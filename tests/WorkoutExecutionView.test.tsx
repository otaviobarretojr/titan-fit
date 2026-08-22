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

  it('inicia o descanso automático ao registrar uma série válida', () => {
    render(<WorkoutExecutionView planId="plan-rest" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    expect(screen.getByText('DESCANSO AUTOMÁTICO')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('permite pular exercício sem criar volume ou PR falso', () => {
    render(<WorkoutExecutionView planId="plan-skip" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
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

  it('troca para uma alternativa oficial preservando técnica e prescrição sem player', () => {
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
    fireEvent.click(screen.getByText('Trocar'));
    fireEvent.click(screen.getByRole('button', { name: /Alternativa Supino reto com barra/i }));
    expect(screen.getByText('Alternativa selecionada · histórico próprio')).toBeInTheDocument();
    expect(screen.getByText('Técnica da alternativa')).toBeInTheDocument();
    expect(screen.queryByText('Técnica principal')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Supino reto com barra série 1 repetições')).toBeInTheDocument();
    expect(screen.getByLabelText('Supino reto com barra série 1 carga')).toBeInTheDocument();
    expect(document.querySelector('iframe, video')).toBeNull();
  });

  it('mostra a primeira sessão válida como PR inicial', () => {
    localStorage.setItem('titan-fit:history:v1', JSON.stringify([{ id:'h1', planId:'old', planName:'Anterior', workoutId:'push', workoutTitle:'Push', workoutDay:'Segunda', startedAt:'2026-08-10T20:00:00.000Z', completedAt:'2026-08-10T21:00:00.000Z', durationSeconds:3600, totalSets:2, totalVolumeKg:1520, exercises:[{ exerciseId:'bench', name:'Supino máquina', muscleGroup:'Peitoral', exerciseType:'strength', volumeKg:1520, bestWeightKg:80, totalDistanceMeters:0, totalDurationSeconds:0, bestSpeedKmh:null, bestInclinePercent:null, averageHeartRate:null, sets:[{ setNumber:1, weightKg:80, repetitions:10, rir:null, durationSeconds:null, distanceMeters:null, speedKmh:null, inclinePercent:null, averagePace:null, averageHeartRate:null, calories:null, notes:null },{ setNumber:2, weightKg:80, repetitions:9, rir:null, durationSeconds:null, distanceMeters:null, speedKmh:null, inclinePercent:null, averagePace:null, averageHeartRate:null, calories:null, notes:null }] }] }]));
    render(<WorkoutExecutionView planId="plan-new" planName="Plano novo" workout={workout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    expect(screen.getAllByText('80 kg × 10').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('Ainda sem PR')).not.toBeInTheDocument();
  });

  it('preserva PR quando o mesmo exercício recebe sufixo de projeto', () => {
    localStorage.setItem('titan-fit:history:v1', JSON.stringify([{ id:'h2', planId:'old', planName:'Anterior', workoutId:'upper', workoutTitle:'Upper', workoutDay:'Quarta', startedAt:'2026-08-11T20:00:00.000Z', completedAt:'2026-08-11T21:00:00.000Z', durationSeconds:3600, totalSets:1, totalVolumeKg:900, exercises:[{ exerciseId:'bench', name:'Supino máquina', muscleGroup:'Peitoral', exerciseType:'strength', volumeKg:900, bestWeightKg:90, totalDistanceMeters:0, totalDurationSeconds:0, bestSpeedKmh:null, bestInclinePercent:null, averageHeartRate:null, sets:[{ setNumber:1, weightKg:90, repetitions:10, rir:null, durationSeconds:null, distanceMeters:null, speedKmh:null, inclinePercent:null, averagePace:null, averageHeartRate:null, calories:null, notes:null }] }] }]));
    const revisedWorkout: TitanWorkoutDay = { ...workout, exercises:[{ ...workout.exercises[0], id:'bench--workout-upper-b--p1' }] };
    render(<WorkoutExecutionView planId="plan-revised" planName="Plano revisado" workout={revisedWorkout} onBack={vi.fn()} onCompleted={vi.fn()} />);
    expect(screen.getAllByText('90 kg × 10').length).toBeGreaterThanOrEqual(2);
  });

  it('salva o histórico, apresenta o resumo final e só então abre progresso', () => {
    const onCompleted = vi.fn();
    render(<WorkoutExecutionView planId="plan-1" planName="Plano A" workout={workout} onBack={vi.fn()} onCompleted={onCompleted} />);
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 repetições'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 1 carga'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 2 repetições'), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText('Supino máquina série 2 carga'), { target: { value: '82.5' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Registrar série' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Concluir e salvar treino' }));
    expect(screen.getByText('TREINO CONCLUÍDO')).toBeInTheDocument();
    expect(screen.getByText('1.460 kg')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(onCompleted).not.toHaveBeenCalled();
    const history = localStorage.getItem('titan-fit:history:v1');
    expect(history).toContain('"workoutTitle":"Push A"');
    expect(history).toContain('"totalVolumeKg":1460');
    fireEvent.click(screen.getByRole('button', { name: 'Ver progresso' }));
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });
});