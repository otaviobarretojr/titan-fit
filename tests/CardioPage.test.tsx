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
      durationMinutes: 35,
      week: 1,
      goal: 'RPE 3–4/10: leve a confortável.',
      instructions: ['Aquecimento: 8 min caminhada progressiva. Bloco principal: 22 min em Zona 2. Desaquecimento: 5 min caminhada fácil.','RPE 3–4/10: leve a confortável.']
    }]
  },
  workouts: []
};

describe('CardioPage — execução planejada', () => {
  it('abre o cardio como sessão orientada e recebe os dados do smartwatch', () => {
    render(<CardioPage plan={plan} initialSessionId="cardio-domingo-w1" />);

    expect(screen.getByRole('heading', { name: 'Corrida fácil/Zona 2' })).toBeInTheDocument();
    expect(screen.getByText(/17:00 · previsto 35 min · Zona 2/i)).toBeInTheDocument();
    expect(screen.getByText('Aquecimento')).toBeInTheDocument();
    expect(screen.getByText('Bloco principal')).toBeInTheDocument();
    expect(screen.getByText('Desaquecimento')).toBeInTheDocument();
    expect(screen.getByText('Registre pelo smartwatch')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex.: 35:42')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex.: 3,2')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('bpm')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Como foi a sessão?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument();
  });

  it('exige o tempo realizado antes de concluir', () => {
    render(<CardioPage plan={plan} initialSessionId="cardio-domingo-w1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar cardio' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o tempo realizado pelo smartwatch');
  });

  it('não oferece mais o seletor manual de modalidade na tela de cardio', () => {
    render(<CardioPage plan={plan} />);
    expect(screen.queryByRole('button', { name: 'Corrida' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Iniciar cardio' })).not.toBeInTheDocument();
    expect(screen.getByText('CARDIO DE HOJE')).toBeInTheDocument();
  });

  it('exibe a evolução cardiovascular e a meta de 5 km sem exigir novo cadastro', () => {
    render(<CardioPage plan={plan} />);
    expect(screen.getByRole('heading', { name: 'Evolução cardiovascular' })).toBeInTheDocument();
    expect(screen.getByText('META 5 KM')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '7 dias' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '30 dias' })).toBeInTheDocument();
  });
});
