import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { CardioPage } from '../src/features/cardio/CardioPage';
import type { CardioPlan } from '../src/features/cardio/types';

const plan: CardioPlan = {
  schemaVersion: 1,
  id: 'first-5k-1',
  name: 'Primeiros 5 km',
  goal: 'first-5k',
  description: 'Plano progressivo de corrida.',
  weeks: [{
    week: 1,
    title: 'Adaptação',
    sessions: [{
      id: 'week-1-session-1',
      title: 'Caminhada e trote',
      type: 'run',
      durationMinutes: 30,
      description: 'Alternar caminhada e trote leve.',
      target: 'Esforço 5/10.'
    }]
  }]
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('titan-fit:cardio-plan', JSON.stringify(plan));
  vi.stubGlobal('confirm', vi.fn(() => true));
  vi.stubGlobal('crypto', { randomUUID: () => 'cardio-record-1' });
});

describe('CardioPage', () => {
  it('exibe o plano progressivo para os primeiros 5 km', () => {
    render(<CardioPage />);
    expect(screen.getByText('Primeiros 5 km')).toBeInTheDocument();
    expect(screen.getByText('SEMANA 1')).toBeInTheDocument();
    expect(screen.getByText('Caminhada e trote')).toBeInTheDocument();
  });

  it('conclui uma sessão e preserva o registro no histórico', () => {
    render(<CardioPage />);
    fireEvent.click(screen.getByRole('button', { name: /Caminhada e trote/i }));
    fireEvent.change(screen.getByLabelText('Distância (km)'), { target: { value: '3.2' } });
    fireEvent.change(screen.getByLabelText('Esforço (1–10)'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Concluir sessão' }));

    expect(screen.getByText('1/1')).toBeInTheDocument();
    expect(screen.getByText(/3.20 km/)).toBeInTheDocument();
    const saved = localStorage.getItem('titan-fit:cardio-records');
    expect(saved).toContain('"planSessionId":"week-1-session-1"');
    expect(saved).toContain('"distanceKm":3.2');
  });
});
