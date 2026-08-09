import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { CardioPage } from '../src/features/cardio/CardioPage';
import type { TitanPlan } from '../src/features/plan/types';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

const plan: TitanPlan = {
  schemaVersion: 1,
  id: 'cardio-flow-test',
  name: 'Projeto Teste',
  createdAt: '2026-08-09T12:00:00.000Z',
  project: {
    name: 'Projeto Teste',
    objective: 'Testar execução de cardio',
    startDate: '2026-08-09',
    cardioSchedule: [{
      id: 'cardio-domingo-w1',
      day: 'Domingo',
      startTime: '17:00',
      title: 'Corrida fácil/Zona 2',
      type: 'zone2',
      durationMinutes: 30,
      week: 1,
      goal: 'Construir base para 5 km',
      instructions: ['Manter esforço confortável.']
    }]
  },
  workouts: []
};

describe('CardioPage — execução planejada', () => {
  it('abre o cardio programado com cronômetro e campos de registro', () => {
    render(<CardioPage plan={plan} initialSessionId="cardio-domingo-w1" />);

    expect(screen.getByRole('heading', { name: 'Corrida fácil/Zona 2' })).toBeInTheDocument();
    expect(screen.getByText(/17:00 · 30 min · Zona 2/i)).toBeInTheDocument();
    expect(screen.getByText('Construir base para 5 km')).toBeInTheDocument();
    expect(screen.getByText('Manter esforço confortável.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex.: 3,2')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('bpm')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Como foi a sessão?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeEnabled();
  });

  it('não oferece mais o seletor manual de modalidade na tela de cardio', () => {
    render(<CardioPage plan={plan} />);
    expect(screen.queryByRole('button', { name: 'Corrida' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Iniciar cardio' })).not.toBeInTheDocument();
    expect(screen.getByText('CARDIO DE HOJE')).toBeInTheDocument();
  });
});
