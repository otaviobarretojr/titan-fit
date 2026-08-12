import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlanViewer } from '../src/features/plan/PlanViewer';
import type { TitanPlan } from '../src/features/plan/types';

const plan = {
  id: 'plan-exit-test',
  name: 'Plano teste',
  workouts: [{
    id: 'workout-test',
    day: 'Segunda',
    title: 'PUSH A',
    focus: 'Peitoral',
    exercises: [{
      id: 'bench',
      name: 'Supino',
      muscleGroup: 'Peitoral',
      exerciseType: 'strength',
      sets: 1,
      minReps: 8,
      maxReps: 10,
      targetRir: 2,
      restSeconds: 60,
    }],
  }],
} as TitanPlan;

describe('saída do modo treino', () => {
  it('aciona retorno à Home em vez de exibir Projeto completo', () => {
    const onExitWorkout = vi.fn();
    render(<PlanViewer plan={plan} initialWorkoutId="workout-test" onImportAnother={vi.fn()} onRemove={vi.fn()} onHistoryChange={vi.fn()} onExitWorkout={onExitWorkout} />);
    const exit = screen.queryByRole('button', { name: /sair|voltar/i });
    expect(exit).not.toBeNull();
    fireEvent.click(exit!);
    expect(onExitWorkout).toHaveBeenCalledTimes(1);
  });
});
