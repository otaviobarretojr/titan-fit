import { fireEvent, render, screen } from '@testing-library/react';
import { PlanViewer } from '../src/features/plan/PlanViewer';
import type { TitanPlan } from '../src/features/plan/types';

const plan: TitanPlan = {
  schemaVersion: 1,
  id: 'plan-1',
  name: 'Hipertrofia — Bloco 1',
  description: 'Plano de teste',
  createdAt: '2026-08-06T00:00:00.000Z',
  workouts: [{
    id: 'monday', day: 'Segunda-feira', title: 'Peitoral e dorsais', focus: 'Peitoral superior',
    exercises: [{ id: 'incline-press', name: 'Supino inclinado', muscleGroup: 'Peitoral', sets: 4, minReps: 8, maxReps: 10, targetRir: 2, restSeconds: 120, technique: 'Controle a descida.', commonMistakes: ['Perder a posição das escápulas'], alternatives: ['Supino inclinado com halteres'] }]
  }]
};

describe('PlanViewer video-free', () => {
  it('navega até o exercício exibindo técnica sem player ou ação de vídeo', () => {
    render(<PlanViewer plan={plan} onImportAnother={() => undefined} onRemove={() => undefined} onHistoryChange={() => undefined} />);
    expect(screen.getByText('Hipertrofia — Bloco 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Peitoral e dorsais/i }));
    fireEvent.click(screen.getByRole('button', { name: /Supino inclinado/i }));
    expect(screen.getByText('Controle a descida.')).toBeInTheDocument();
    expect(screen.getByText('Perder a posição das escápulas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ver execução/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Execução correta/i)).not.toBeInTheDocument();
  });
});
