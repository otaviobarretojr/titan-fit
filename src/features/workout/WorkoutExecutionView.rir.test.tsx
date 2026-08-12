import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkoutExecutionView } from './WorkoutExecutionView';
import type { TitanWorkoutDay } from '../plan/types';

describe('strength set entry', () => {
  it('asks only for the weight in each strength set', () => {
    const workout: TitanWorkoutDay = { id:'weight-only-test', day:'Segunda', title:'Teste', exercises:[{ id:'bench-test', name:'Supino teste', muscleGroup:'Peito', exerciseType:'strength', sets:1, minReps:8, maxReps:12, restSeconds:60 }] };
    render(<WorkoutExecutionView planId="test-plan" planName="Teste" workout={workout} onBack={() => {}} onCompleted={() => {}} />);
    expect(screen.getByText('Peso (kg)')).toBeInTheDocument();
    expect(screen.queryByText(/^RIR$/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Repetições')).not.toBeInTheDocument();
  });
});
