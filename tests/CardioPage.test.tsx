import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { CardioPage } from '../src/features/cardio/CardioPage';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('CardioPage v0.29.1', () => {
  it('inicia, pausa e retoma uma sessão de cardio com campos de registro', () => {
    render(<CardioPage plan={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Corrida' }));
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar cardio' }));

    expect(screen.getByText('Corrida')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex.: 3,2')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('bpm')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Como foi a sessão?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeEnabled();
  });
});
